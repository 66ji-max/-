import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './utils/prisma.js';
import { authenticate } from './utils/auth.js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req, res);
  if (!userId) return;

  const action = req.query.action || req.body?.action;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'create' && req.method === 'POST') {
      const { plan, amount, currency, paymentMethod } = req.body;
      
      const referenceCode = 'UPG-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const order = await prisma.upgradeOrder.create({
        data: {
          userId,
          plan,
          amount,
          currency,
          referenceCode,
          paymentMethod: paymentMethod || null,
          status: 'pending_payment'
        }
      });

      return res.status(200).json({ order });
    }

    if (action === 'mark-paid' && req.method === 'POST') {
      const { referenceCode, paymentMethod } = req.body;
      
      const order = await prisma.upgradeOrder.findUnique({
        where: { referenceCode }
      });

      if (!order || order.userId !== userId) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updatedOrder = await prisma.upgradeOrder.update({
        where: { id: order.id },
        data: { 
          status: 'pending_review',
          paymentMethod: paymentMethod || order.paymentMethod
        }
      });

      return res.status(200).json({ order: updatedOrder });
    }

    if (action === 'list' && req.method === 'GET') {
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const status = req.query.status as string;
      
      const orders = await prisma.upgradeOrder.findMany({
        where: status ? { status } : undefined,
        include: {
          user: {
            select: { name: true, email: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ orders });
    }

    if (action === 'approve' && req.method === 'POST') {
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { referenceCode } = req.body;
      
      const order = await prisma.upgradeOrder.findUnique({
        where: { referenceCode }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'pending_review' && order.status !== 'pending_payment') {
          return res.status(400).json({ error: 'Order is already processed' });
      }

      const updatedOrder = await prisma.upgradeOrder.update({
        where: { id: order.id },
        data: { 
          status: 'approved',
          reviewedAt: new Date()
        }
      });

      // Update membership
      await prisma.membership.upsert({
          where: { userId: order.userId },
          create: {
              userId: order.userId,
              plan: order.plan,
              status: 'active'
          },
          update: {
              plan: order.plan,
              status: 'active' // Ensure status logic doesn't mess with expiration if not needed, but here simple is better
          }
      });

      return res.status(200).json({ order: updatedOrder, success: true });
    }

    if (action === 'reject' && req.method === 'POST') {
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { referenceCode } = req.body;

      const order = await prisma.upgradeOrder.findUnique({
        where: { referenceCode }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updatedOrder = await prisma.upgradeOrder.update({
        where: { id: order.id },
        data: { 
          status: 'rejected',
          reviewedAt: new Date()
        }
      });

      return res.status(200).json({ order: updatedOrder, success: true });
    }

    return res.status(404).json({ error: 'Action not found' });

  } catch (err: any) {
    console.error("Order API Error", err);
    return res.status(500).json({ error: err.message });
  }
}
