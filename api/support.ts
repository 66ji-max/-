import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './utils/prisma.js';
import { authenticate } from './utils/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req, res);
  if (!userId) return;

  const action = req.query.action || req.body?.action;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // CREATE CONVERSATION
    if (action === 'create' && req.method === 'POST') {
      const { subject, content } = req.body;
      if (!content) return res.status(400).json({ error: 'Content is required' });

      const conv = await prisma.supportConversation.create({
        data: {
          userId,
          subject: subject || 'Support Request',
          messages: {
            create: {
              senderRole: 'user',
              senderUserId: userId,
              content
            }
          }
        },
        include: {
          messages: true
        }
      });
      return res.status(200).json({ conversation: conv });
    }

    // LIST CONVERSATIONS
    if (action === 'list' && req.method === 'GET') {
      const statusFilter = req.query.status as string;
      
      let whereClause: any = { userId };
      
      if (user.role === 'admin') {
        const fetchAll = req.query.all === 'true';
        if (fetchAll) {
          whereClause = {}; // Admin sees all
        }
      }
      
      if (statusFilter) {
        whereClause.status = statusFilter;
      }

      const conversations = await prisma.supportConversation.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, email: true, username: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return res.status(200).json({ conversations });
    }

    // GET SINGLE CONVERSATION
    if (action === 'get' && req.method === 'GET') {
      const conversationId = req.query.id as string;
      if (!conversationId) return res.status(400).json({ error: 'Conversation ID required' });

      const conv = await prisma.supportConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          user: {
            select: { name: true, email: true, username: true }
          }
        }
      });

      if (!conv) return res.status(404).json({ error: 'Conversation not found' });
      if (conv.userId !== userId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Mark messages as read based on who is checking
      const myRole = user.role === 'admin' ? 'admin' : 'user';
      const unreadIds = conv.messages
        .filter(m => m.senderRole !== myRole && !m.isRead)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await prisma.supportMessage.updateMany({
          where: { id: { in: unreadIds } },
          data: { isRead: true }
        });
        
        // Update in-memory so the response is accurate
        conv.messages.forEach(m => {
          if (unreadIds.includes(m.id)) m.isRead = true;
        });
      }

      return res.status(200).json({ conversation: conv });
    }

    // REPLY
    if (action === 'reply' && req.method === 'POST') {
      const { conversationId, content } = req.body;
      if (!conversationId || !content) return res.status(400).json({ error: 'Missing logic fields' });

      const conv = await prisma.supportConversation.findUnique({
        where: { id: conversationId }
      });

      if (!conv) return res.status(404).json({ error: 'Conversation not found' });
      if (conv.userId !== userId && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const senderRole = user.role === 'admin' ? 'admin' : 'user';

      const newMessage = await prisma.supportMessage.create({
        data: {
          conversationId,
          content,
          senderRole,
          senderUserId: userId
        }
      });

      await prisma.supportConversation.update({
        where: { id: conversationId },
        data: { 
          lastMessageAt: new Date(),
          status: senderRole === 'admin' ? 'pending' : 'open' // optional basic status flow
        }
      });

      return res.status(200).json({ message: newMessage });
    }

    // UPDATE STATUS (Admin only)
    if (action === 'update_status' && req.method === 'POST') {
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const { conversationId, status } = req.body;
        
        const updated = await prisma.supportConversation.update({
            where: { id: conversationId },
            data: { status }
        });
        
        return res.status(200).json({ conversation: updated });
    }

    return res.status(404).json({ error: 'Action not found' });

  } catch (err: any) {
    console.error("Support API Error", err);
    return res.status(500).json({ error: err.message });
  }
}
