import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
    const membership = await prisma.membership.findUnique({
      where: { userId }
    });
    if (!membership) {
        return res.status(404).json({ error: 'Membership not found' });
    }
    
    res.status(200).json({ membership });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
