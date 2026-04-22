import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './utils/prisma.js';
import { authenticateAdmin } from './utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminId = await authenticateAdmin(req, res);
  if (!adminId) return;

  const action = req.query.action;
  const targetUserId = req.query.id as string;

  try {
    if (action === 'get_users' && req.method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, username: true, name: true, role: true, createdAt: true, membership: true }
      });
      return res.status(200).json({ users });
    }

    if (action === 'delete_user' && req.method === 'DELETE') {
      if (adminId === targetUserId) return res.status(400).json({ error: 'Cannot delete yourself' });
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      if (targetUser.role === 'admin') return res.status(403).json({ error: 'Cannot delete another administrator' });
      
      await prisma.user.delete({ where: { id: targetUserId } });
      return res.status(200).json({ success: true });
    }

    if (action === 'update_user' && req.method === 'PATCH') {
      const { name, email, username } = req.body;
      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== targetUserId) return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { 
          ...(name !== undefined && { name }), 
          ...(email !== undefined && { email: email.trim().toLowerCase() }), 
          ...(username !== undefined && { username: username.trim() || null }) 
        },
        select: { id: true, email: true, name: true, username: true, role: true }
      });
      return res.status(200).json({ user: updatedUser });
    }

    if (action === 'update_membership' && req.method === 'PATCH') {
      const { plan, status, trialRemaining, expireAt } = req.body;
      const updatedMembership = await prisma.membership.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId, plan: plan || 'free', status: status || 'trial',
          trialRemaining: trialRemaining !== undefined ? Number(trialRemaining) : 10,
          expireAt: expireAt ? new Date(expireAt) : null
        },
        update: {
          ...(plan !== undefined && { plan }), ...(status !== undefined && { status }),
          ...(trialRemaining !== undefined && { trialRemaining: Number(trialRemaining) }),
          ...(expireAt !== undefined && { expireAt: expireAt ? new Date(expireAt) : null })
        }
      });
      return res.status(200).json({ membership: updatedMembership });
    }

    return res.status(404).json({ error: 'Admin action not found or method not allowed' });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return res.status(500).json({ error: err.message || 'System error' });
  }
}
