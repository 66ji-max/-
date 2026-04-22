import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../api/utils/prisma';
import { authenticate } from '../../api/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
    const files = await prisma.uploadedFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ files });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
}
