import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const authenticateFromRequest = (req: VercelRequest): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    return null;
  }
};

type PrismaLike = any;

declare global {
  // eslint-disable-next-line no-var
  var __sailguardAiPrisma: PrismaLike | undefined;
}

async function loadPrisma() {
  try {
    const prismaClientModule = await import('@prisma/client');
    const PrismaClient = prismaClientModule.PrismaClient;

    if (!globalThis.__sailguardAiPrisma) {
      globalThis.__sailguardAiPrisma = new PrismaClient();
    }

    return {
      prisma: globalThis.__sailguardAiPrisma,
      error: null as any,
    };
  } catch (error: any) {
    console.error('AI history failed to load @prisma/client:', error);
    return {
      prisma: null,
      error,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || req.body?.action;
  const userId = authenticateFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { prisma } = await loadPrisma();
    if (!prisma) {
        return res.status(500).json({ error: 'Database connection failed', code: 'DATABASE_CONNECTION_FAILED' });
    }

    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        return res.status(500).json({ error: 'Database connection failed', code: 'DATABASE_CONNECTION_FAILED' });
    }

    if (action === 'list' && req.method === 'GET') {
      const sessions = await prisma.aiChatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, topic: true, updatedAt: true }
      });
      return res.status(200).json({ sessions });
    }

    if (action === 'get' && req.method === 'GET') {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
      
      const session = await prisma.aiChatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
      
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.status(200).json({ session });
    }

    if (action === 'create' && req.method === 'POST') {
      const { title, topic } = req.body;
      const session = await prisma.aiChatSession.create({
        data: { userId, title: title || 'New Chat', topic }
      });
      return res.status(200).json({ session });
    }

    if (action === 'rename' && req.method === 'PATCH') {
      const { sessionId, title } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Session ID required', code: 'SESSION_ID_REQUIRED' });
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title required', code: 'TITLE_REQUIRED' });
      
      const trimmedTitle = title.trim().substring(0, 60);
      
      const existing = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' });
      }
      
      const session = await prisma.aiChatSession.update({
        where: { id: sessionId },
        data: { title: trimmedTitle }
      });
      return res.status(200).json({ session });
    }

    if (action === 'delete' && req.method === 'DELETE') {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) return res.status(400).json({ error: 'Session ID required' });
      
      const session = await prisma.aiChatSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      await prisma.aiChatSession.delete({ where: { id: sessionId } });
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Action not found' });
  } catch (err: any) {
    console.error("History API Error", err);
    return res.status(500).json({ error: err.message, code: 'INTERNAL_ERROR' });
  }
}
