import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../server/prisma.js';
import { authenticate } from '../server/auth.js';
import { planLimits } from '../server/planLimits.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
    const membership = await prisma.membership.findUnique({ where: { userId } });
    const plan = membership?.plan || 'free';
    const limits = planLimits[plan] || planLimits['free'];
    
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'System error' });
  }
}
