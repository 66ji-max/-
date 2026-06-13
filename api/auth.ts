import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server/prisma';
import { authenticate } from '../server/auth';
import { getLLMConfig, checkStatus } from '../server/llmProvider';
import { planLimits } from '../server/planLimits';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || req.body?.action;

  try {
    if (action === 'health' && req.method === 'GET') {
        const config = getLLMConfig();
        const aiStatus = await checkStatus();

        let databaseConfigured = false;
        try {
            await prisma.$queryRaw`SELECT 1`;
            databaseConfigured = true;
        } catch {
            databaseConfigured = false;
        }

        const blobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

        return res.status(200).json({
            status: "ok",
            ai: {
                provider: config.provider,
                configured: config.configured,
                baseUrlConfigured: config.baseUrlConfigured,
                model: config.model,
                fallbackModels: config.fallbackModels,
                status: aiStatus.status
            },
            databaseConfigured,
            blobConfigured
        });
    }

    if (action === 'register' && req.method === 'POST') {
      const { email, password, username, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!pwdRegex.test(password)) {
        return res.status(400).json({ error: 'Password does not meet complexity requirements', code: 'WEAK_PASSWORD' });
      }

      const finalUsername = (username || name || '').trim();
      if (!finalUsername) {
        return res.status(400).json({ error: 'Username required', code: 'USERNAME_REQUIRED' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
      
      const existingUsername = await prisma.user.findUnique({ where: { username: finalUsername } });
      if (existingUsername) return res.status(409).json({ error: 'Username already exists', code: 'USERNAME_EXISTS' });
      
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
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership, discountCouponClaimed: user.discountCouponClaimed, discountCouponClaimedAt: user.discountCouponClaimedAt } });
    }

    if (action === 'login' && req.method === 'POST') {
      const { identifier, email, password } = req.body;
      const ident = (identifier || email || '').trim();
      if (!ident || !password) return res.status(400).json({ error: 'Identifier and password required', code: 'MISSING_CREDENTIALS' });

      const user = await prisma.user.findFirst({ 
        where: { 
          OR: [
            { email: ident.toLowerCase() },
            { username: ident }
          ]
        }, 
        include: { membership: true } 
      });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership, discountCouponClaimed: user.discountCouponClaimed, discountCouponClaimedAt: user.discountCouponClaimedAt } });
    }

    if (action === 'membership' && req.method === 'GET') {
      const userId = authenticate(req, res);
      if (!userId) return; // auth helper sends 401

      const membership = await prisma.membership.findUnique({ where: { userId } });
      const plan = membership?.plan || 'free';
      const limits = planLimits[plan as keyof typeof planLimits] || planLimits['free'];
      
      let todayUsage = 0;
      if (limits.dailyAiLimit !== null) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          todayUsage = await prisma.usageRecord.count({
              where: {
                  userId,
                  featureType: 'ai_chat',
                  createdAt: {
                      gte: today,
                      lt: tomorrow
                  }
              }
          });
      }

      return res.status(200).json({ membership, todayUsage, limits });
    }

    if (action === 'me' && req.method === 'GET') {
      const userId = authenticate(req, res);
      if (!userId) return; // auth helper sends 401
      
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { membership: true } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      return res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, username: user.username, role: user.role, membership: user.membership, discountCouponClaimed: user.discountCouponClaimed, discountCouponClaimedAt: user.discountCouponClaimedAt }});
    }

    if (action === 'logout' && req.method === 'POST') {
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Auth action not found or method not allowed' });
  } catch (error: any) {
    console.error('Auth error:', error);
    if (error?.code === 'P2002') {
      const target = error.meta?.target || [];
      if (target.includes('username')) {
        return res.status(409).json({ error: 'Username already exists', code: 'USERNAME_EXISTS' });
      }
      if (target.includes('email')) {
        return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
      }
      return res.status(409).json({ error: 'Unique constraint failed', code: 'DUPLICATE_VALUE' });
    }
    res.status(500).json({ error: error.message || 'System error' });
  }
}
