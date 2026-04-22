import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put, del } from '@vercel/blob';
import prisma from './utils/prisma.js';
import { authenticate } from './utils/auth.js';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticate(req, res);
  if (!userId) return;

  const action = req.query.action || req.body?.action;
  
  try {
    if (action === 'list' && req.method === 'GET') {
      const files = await prisma.uploadedFile.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
      return res.status(200).json({ files });
    }

    if (action === 'upload' && req.method === 'POST') {
      const { filename, contentType, base64Buffer, size } = req.body;
      if (!base64Buffer || !filename) return res.status(400).json({ error: 'File data empty' });
      
      const fileBuffer = Buffer.from(base64Buffer, 'base64');
      const blob = await put(`user_${userId}/${Date.now()}_${filename}`, fileBuffer, { access: 'public', contentType: contentType || 'application/octet-stream' });
      
      const fileRecord = await prisma.uploadedFile.create({
        data: { userId, originalName: filename, mimeType: contentType || 'application/octet-stream', size: size || fileBuffer.byteLength, blobUrl: blob.url, blobPathname: blob.pathname }
      });
      return res.status(200).json({ message: "Success", file: fileRecord });
    }

    if (action === 'delete' && req.method === 'DELETE') {
      const fileId = req.query.id as string;
      const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
      if (!file || file.userId !== userId) return res.status(404).json({ error: 'File not found or unauthorized' });
      
      await del(file.blobUrl);
      await prisma.uploadedFile.delete({ where: { id: fileId } });
      return res.status(200).json({ success: true });
    }
    
    return res.status(404).json({ error: 'Files action not found' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
