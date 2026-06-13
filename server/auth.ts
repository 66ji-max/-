import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

export const authenticate = (req: VercelRequest, res: VercelResponse): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: string };

    return decoded.userId;
  } catch {
    res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return null;
  }
};

export const authenticateAdmin = async (
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> => {
  const userId = authenticate(req, res);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
      });
      return null;
    }

    return userId;
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      error: 'System error',
      code: 'SYSTEM_ERROR',
    });
    return null;
  }
};
