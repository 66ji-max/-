import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import prisma from '../server/prisma';
import { authenticate } from '../server/auth';
import crypto from 'crypto';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

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

      // Check for discount coupon logic based on plan and original amount
      let finalAmount = amount;
      let couponApplied = false;
      let originalAmount = amount;
      let discountAmount = null;

      if (user.discountCouponClaimed) {
          if (currency === 'RMB') {
              if (plan === 'startup' && amount === 39) {
                  finalAmount = 30;
                  discountAmount = 30;
                  couponApplied = true;
              } else if (plan === 'pro' && amount === 99) {
                  finalAmount = 90;
                  discountAmount = 90;
                  couponApplied = true;
              }
          } else if (currency === 'RM') {
              if (plan === 'startup' && amount === 25) {
                  finalAmount = 20;
                  discountAmount = 20;
                  couponApplied = true;
              } else if (plan === 'pro' && amount === 65) {
                  finalAmount = 60;
                  discountAmount = 60;
                  couponApplied = true;
              }
          }
      }

      const order = await prisma.upgradeOrder.create({
        data: {
          userId,
          plan,
          amount: finalAmount,
          originalAmount,
          discountAmount,
          couponApplied,
          currency,
          referenceCode,
          paymentMethod: paymentMethod || null,
          status: 'pending_payment'
        }
      });

      return res.status(200).json({ order });
    }

    if (action === 'claim-abandon-coupon' && req.method === 'POST') {
      const { referenceCode } = req.body;
      
      if (referenceCode) {
         await prisma.upgradeOrder.updateMany({
           where: { referenceCode, userId, status: 'pending_payment' },
           data: { status: 'abandoned', abandonedAt: new Date() }
         });
      }

      const updatedUser = await prisma.user.update({
         where: { id: userId },
         data: { discountCouponClaimed: true, discountCouponClaimedAt: new Date() }
      });

      return res.status(200).json({ success: true, user: updatedUser });
    }

    if (action === 'mark-paid' && req.method === 'POST') {
      const { referenceCode, paymentMethod, payerOrderNo, proofImageBase64, proofImageFilename, proofImageContentType } = req.body;
      
      if (!payerOrderNo && !proofImageBase64) {
          return res.status(400).json({ error: 'Must provide either order number or proof screenshot' });
      }

      const order = await prisma.upgradeOrder.findUnique({
        where: { referenceCode }
      });

      if (!order || order.userId !== userId) {
        return res.status(404).json({ error: 'Order not found' });
      }

      let proofUrl = null;
      let proofPathname = null;

      if (proofImageBase64) {
          const fileBuffer = Buffer.from(proofImageBase64, 'base64');
          const blob = await put(`proofs/${order.id}_${Date.now()}_${proofImageFilename}`, fileBuffer, { access: 'public', contentType: proofImageContentType || 'image/jpeg' });
          proofUrl = blob.url;
          proofPathname = blob.pathname;
      }

      const updatedOrder = await prisma.upgradeOrder.update({
        where: { id: order.id },
        data: { 
          status: 'pending_review',
          paymentMethod: paymentMethod || order.paymentMethod,
          payerOrderNo: payerOrderNo || null,
          proofImageUrl: proofUrl,
          proofImagePathname: proofPathname
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
