import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import prisma from '../../api/utils/prisma';
import { authenticate } from '../../api/utils/auth';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const userId = authenticate(req, res);
  if (!userId) return;

  const { filename, contentType, base64Buffer, size } = req.body;
  if (!base64Buffer || !filename) return res.status(400).json({ error: 'File data empty' });

  try {
    const fileBuffer = Buffer.from(base64Buffer, 'base64');
    
    // Upload to Vercel Blob
    const blob = await put(`user_${userId}/${Date.now()}_${filename}`, fileBuffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
    });

    const fileRecord = await prisma.uploadedFile.create({
      data: {
        userId,
        originalName: filename,
        mimeType: contentType || 'application/octet-stream',
        size: size || fileBuffer.byteLength,
        blobUrl: blob.url,
        blobPathname: blob.pathname
      }
    });

    res.status(200).json({ message: "Success", file: fileRecord });
  } catch (error: any) { 
    res.status(500).json({ error: error.message }); 
  }
}
