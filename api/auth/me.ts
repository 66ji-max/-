import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req, res);
  if (!userId) return;

  const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { membership: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, membership: user.membership }});
}
