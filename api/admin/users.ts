import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../utils/prisma.js';
import { authenticateAdmin } from '../../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const adminId = await authenticateAdmin(req, res);
  if (!adminId) return;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          createdAt: true,
          membership: true
      }
    });
    res.status(200).json({ users });
  } catch (error: any) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
