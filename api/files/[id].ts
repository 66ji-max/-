import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del } from '@vercel/blob';
import prisma from '../../api/utils/prisma';
import { authenticate } from '../../api/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const userId = authenticate(req, res);
  if (!userId) return;

  const fileId = req.query.id as string;
  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId) {
        return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    await del(file.blobUrl);
    await prisma.uploadedFile.delete({ where: { id: fileId } });

    res.status(200).json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
}
