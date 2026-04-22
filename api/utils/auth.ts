import jwt from 'jsonwebtoken';
import { VercelRequest, VercelResponse } from '@vercel/node';

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
