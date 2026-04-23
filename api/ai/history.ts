import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || req.body?.action;
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
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
    return res.status(500).json({ error: err.message });
  }
}
