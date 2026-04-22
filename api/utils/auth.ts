import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './prisma.js';

export const authenticate = (req: VercelRequest, res: VercelResponse): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
};

export const authenticateAdmin = async (req: VercelRequest, res: VercelResponse): Promise<string | null> => {
  const userId = authenticate(req, res);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return null;
    }
    return userId;
  } catch (e) {
    res.status(500).json({ error: 'Internal server error during authorization' });
    return null;
  }
};
