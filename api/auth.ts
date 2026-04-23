import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma.js';
import { authenticate } from './utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || req.body?.action;

  try {
    if (action === 'register' && req.method === 'POST') {
      const { email, password, username, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!pwdRegex.test(password)) {
        return res.status(400).json({ error: 'Password does not meet complexity requirements', code: 'WEAK_PASSWORD' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
      
      const finalUsername = username || name || '';
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { 
          email: normalizedEmail, 
          username: finalUsername,
          name: finalUsername, // Compatible with old requirement or db schema
          passwordHash, 
          membership: { create: { plan: 'free', trialRemaining: 10 } } 
        },
        include: { membership: true }
      });
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership } });
    }

    if (action === 'login' && req.method === 'POST') {
      const { identifier, email, password } = req.body;
      const ident = (identifier || email || '').trim();
      if (!ident || !password) return res.status(400).json({ error: 'Identifier and password required' });

      const user = await prisma.user.findFirst({ 
        where: { 
          OR: [
            { email: ident.toLowerCase() },
            { username: ident }
          ]
        }, 
        include: { membership: true } 
      });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership } });
    }

    if (action === 'me' && req.method === 'GET') {
      const userId = authenticate(req, res);
      if (!userId) return; // auth helper sends 401
      
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { membership: true } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership }});
    }

    if (action === 'logout' && req.method === 'POST') {
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Auth action not found or method not allowed' });
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message || 'System error' });
  }
}
