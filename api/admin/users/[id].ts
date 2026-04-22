import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../utils/prisma.js';
import { authenticateAdmin } from '../../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminId = await authenticateAdmin(req, res);
  if (!adminId) return;

  const targetUserId = req.query.id as string;

  if (req.method === 'DELETE') {
      if (adminId === targetUserId) {
          return res.status(400).json({ error: 'Cannot delete yourself' });
      }
      
      try {
          const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
          if (!targetUser) return res.status(404).json({ error: 'User not found' });
          if (targetUser.role === 'admin') {
              // Optionally protect other admins. Here we prevent deleting other admins.
              return res.status(403).json({ error: 'Cannot delete another administrator' });
          }

          await prisma.user.delete({ where: { id: targetUserId } });
          return res.status(200).json({ success: true });
      } catch (err: any) {
          return res.status(500).json({ error: err.message || 'Failed to delete user' });
      }
  }

  if (req.method === 'PATCH') {
      const { name, email, username } = req.body;
      
      try {
          // Check email uniqueness if email is being updated
          if (email) {
              const normalizedEmail = email.trim().toLowerCase();
              const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
              if (existing && existing.id !== targetUserId) {
                  return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
              }
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
      } catch (err: any) {
          return res.status(500).json({ error: err.message || 'Failed to update user' });
      }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
