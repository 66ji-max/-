import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { membership: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, membership: user.membership } });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'System error' });
  }
}
