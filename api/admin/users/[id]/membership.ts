import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../../utils/prisma.js';
import { authenticateAdmin } from '../../../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  
  const adminId = await authenticateAdmin(req, res);
  if (!adminId) return;

  const targetUserId = req.query.id as string;
  const { plan, status, trialRemaining, expireAt } = req.body;

  try {
      // Upsert membership in case the user somehow doesn't have one
      const updatedMembership = await prisma.membership.upsert({
          where: { userId: targetUserId },
          create: {
              userId: targetUserId,
              plan: plan || 'free',
              status: status || 'trial',
              trialRemaining: trialRemaining !== undefined ? Number(trialRemaining) : 10,
              expireAt: expireAt ? new Date(expireAt) : null
          },
          update: {
              ...(plan !== undefined && { plan }),
              ...(status !== undefined && { status }),
              ...(trialRemaining !== undefined && { trialRemaining: Number(trialRemaining) }),
              ...(expireAt !== undefined && { expireAt: expireAt ? new Date(expireAt) : null })
          }
      });

      return res.status(200).json({ membership: updatedMembership });
  } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to update membership' });
  }
}
