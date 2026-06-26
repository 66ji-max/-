import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

function authenticateFromRequest(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function loadPrisma() {
  const globalAny = globalThis as any;
  if (globalAny.__sailguardFilesPrisma) return globalAny.__sailguardFilesPrisma;
  
  try {
    const prismaClientModule = await import('@prisma/client');
    const PrismaClient = prismaClientModule.PrismaClient;
    globalAny.__sailguardFilesPrisma = new PrismaClient();
    return globalAny.__sailguardFilesPrisma;
  } catch (err) {
    throw new Error('PRISMA_CLIENT_LOAD_FAILED');
  }
}

async function loadBlob() {
  try {
    const blobModule = await import('@vercel/blob');
    return blobModule;
  } catch (err) {
    throw new Error('BLOB_LOAD_FAILED');
  }
}

function classifyFileApiError(error: any): { code: string, status: number, message: string } {
  if (error instanceof Error) {
    if (error.message === 'PRISMA_CLIENT_LOAD_FAILED') return { code: 'PRISMA_CLIENT_LOAD_FAILED', status: 500, message: 'Prisma client failed to load' };
    if (error.message === 'DATABASE_CONNECTION_FAILED') return { code: 'DATABASE_CONNECTION_FAILED', status: 500, message: 'Database connection failed' };
  }
  const errStr = String(error?.message || error);
  if (errStr.includes('P2021') || errStr.includes('P2022') || errStr.includes('UploadedFile') || errStr.includes('relation') || errStr.includes('does not exist')) {
    return { code: 'UPLOADED_FILE_TABLE_MISSING', status: 500, message: 'UploadedFile table is missing. Please run npx prisma db push.' };
  }
  return { code: 'INTERNAL_SERVER_ERROR', status: 500, message: errStr };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = authenticateFromRequest(req);
  if (!userId) {
    return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Unauthorized' });
  }

  const action = req.query.action || req.body?.action;
  
  try {
    const prisma = await loadPrisma();
    
    // Check DB connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      throw new Error('DATABASE_CONNECTION_FAILED');
    }

    if (action === 'list' && req.method === 'GET') {
      const files = await prisma.uploadedFile.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
      return res.status(200).json({ files });
    }

    if (action === 'upload' && req.method === 'POST') {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ code: 'BLOB_TOKEN_MISSING', error: 'Blob token is not configured' });
      }

      const membership = await prisma.membership.findUnique({ where: { userId } });
      const plan = membership?.plan || 'free';
      if (plan === 'free') {
        return res.status(403).json({ code: 'FILE_UPLOAD_REQUIRES_STARTUP', error: 'File upload requires Startup or Pro plan' });
      }

      const { filename, contentType, base64Buffer, size } = req.body;
      if (!base64Buffer || !filename) return res.status(400).json({ code: 'FILE_DATA_EMPTY', error: 'File data empty' });
      
      const fileBuffer = Buffer.from(base64Buffer, 'base64');
      if (fileBuffer.byteLength > 8 * 1024 * 1024 || (size && size > 8 * 1024 * 1024)) {
        return res.status(400).json({ code: 'FILE_TOO_LARGE', error: 'File too large' });
      }

      const blobModule = await loadBlob();
      const safeFilename = filename.replace(/[^\w.\-()\u4e00-\u9fa5]/g, '_');
      const pathname = `user_${userId}/${Date.now()}_${safeFilename}`;
      
      const blob = await blobModule.put(pathname, fileBuffer, { access: 'public', contentType: contentType || 'application/octet-stream' });
      
      const fileRecord = await prisma.uploadedFile.create({
        data: { userId, originalName: filename, mimeType: contentType || 'application/octet-stream', size: size || fileBuffer.byteLength, blobUrl: blob.url, blobPathname: blob.pathname || pathname }
      });
      return res.status(200).json({ message: "Success", file: fileRecord });
    }

    if (action === 'delete' && req.method === 'DELETE') {
      const fileId = req.query.id as string;
      const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
      if (!file || file.userId !== userId) return res.status(404).json({ error: 'File not found or unauthorized' });
      
      try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
           const blobModule = await loadBlob();
           await blobModule.del(file.blobUrl);
        }
      } catch (err) {
        console.error('Failed to delete blob from vercel storage:', err);
      }

      await prisma.uploadedFile.delete({ where: { id: fileId } });
      return res.status(200).json({ success: true });
    }
    
    return res.status(404).json({ error: 'Files action not found' });
  } catch (error: any) {
    const errObj = classifyFileApiError(error);
    return res.status(errObj.status).json({ code: errObj.code, error: errObj.message });
  }
}
