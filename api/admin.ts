import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

async function loadPrisma() {
  const globalAny = globalThis as any;
  if (globalAny.__sailguardAdminPrisma) return globalAny.__sailguardAdminPrisma;
  
  try {
    const prismaClientModule = await import('@prisma/client');
    const PrismaClient = prismaClientModule.PrismaClient;
    globalAny.__sailguardAdminPrisma = new PrismaClient();
    return globalAny.__sailguardAdminPrisma;
  } catch (err) {
    throw new Error('PRISMA_CLIENT_LOAD_FAILED');
  }
}

async function authenticateAdminFromRequest(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    const prisma = await loadPrisma();
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'admin') return null;
    return user.id;
  } catch {
    return null;
  }
}

function classifyAdminError(error: any): { code: string, status: number, message: string } {
  if (error instanceof Error) {
    if (error.message === 'PRISMA_CLIENT_LOAD_FAILED') return { code: 'PRISMA_CLIENT_LOAD_FAILED', status: 500, message: 'Prisma client failed to load' };
    if (error.message === 'DATABASE_CONNECTION_FAILED') return { code: 'DATABASE_CONNECTION_FAILED', status: 500, message: 'Database connection failed' };
  }
  return { code: 'INTERNAL_SERVER_ERROR', status: 500, message: error?.message || String(error) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let adminId;
  try {
     adminId = await authenticateAdminFromRequest(req);
  } catch (error) {
     return res.status(500).json(classifyAdminError(error));
  }
  if (!adminId) {
    return res.status(403).json({ code: 'ADMIN_REQUIRED', error: 'Admin access required' });
  }

  const action = req.query.action;
  const targetUserId = req.query.id as string;

  try {
    const prisma = await loadPrisma();

    if (action === 'health' && req.method === 'GET') {
      let dbConnected = false;
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbConnected = true;
      } catch (err) {
        return res.status(500).json({ ok: false, code: 'DATABASE_CONNECTION_FAILED' });
      }

      const tablesResult: any[] = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      const tableNames = tablesResult.map(t => t.table_name);
      
      const expectedTables = [
        'User', 'Membership', 'UploadedFile', 'UsageRecord', 'UpgradeOrder', 
        'AiChatSession', 'AiChatMessage', 'ComplianceSource', 'ComplianceArticle', 'ComplianceCrawlRun'
      ];
      
      const tables: Record<string, boolean> = {};
      const missingTables: string[] = [];
      expectedTables.forEach(t => {
        const exists = tableNames.includes(t);
        tables[t] = exists;
        if (!exists) missingTables.push(t);
      });

      return res.status(200).json({
        ok: true,
        adminAuthenticated: true,
        env: {
          hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
          hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
          hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
          hasJwtSecret: !!process.env.JWT_SECRET
        },
        database: {
          clientLoaded: true,
          connected: dbConnected
        },
        tables,
        missingTables
      });
    }

    if (action === 'get_users' && req.method === 'GET') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, username: true, name: true, role: true, createdAt: true, membership: true }
      });
      return res.status(200).json({ users });
    }

    if (action === 'delete_user' && req.method === 'DELETE') {
      if (adminId === targetUserId) return res.status(400).json({ error: 'Cannot delete yourself' });
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      if (targetUser.role === 'admin') return res.status(403).json({ error: 'Cannot delete another administrator' });
      
      await prisma.user.delete({ where: { id: targetUserId } });
      return res.status(200).json({ success: true });
    }

    if (action === 'update_user' && req.method === 'PATCH') {
      const { name, email, username } = req.body;
      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== targetUserId) return res.status(409).json({ error: 'Email already exists', code: 'EMAIL_EXISTS' });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { 
          ...(name !== undefined && { name }), 
          ...(email !== undefined && { email: email.trim().toLowerCase() }), 
          ...(username !== undefined && { username: username.trim() || null }) 
        },
        select: { id: true, email: true, name: true, username: true, role: true }
      });
      return res.status(200).json({ user: updatedUser });
    }

    if (action === 'update_membership' && req.method === 'PATCH') {
      const { plan, status, trialRemaining, expireAt } = req.body;
      
      const validPlans = ['free', 'startup', 'pro'];
      const validStatuses = ['trial', 'active', 'expired', 'cancelled'];
      
      if (plan && !validPlans.includes(plan)) {
        return res.status(400).json({ error: 'Invalid membership value', code: 'INVALID_MEMBERSHIP_VALUE' });
      }
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid membership value', code: 'INVALID_MEMBERSHIP_VALUE' });
      }

      const updatedMembership = await prisma.membership.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId, plan: plan || 'free', status: status || 'trial',
          trialRemaining: trialRemaining !== undefined ? Number(trialRemaining) : 10,
          expireAt: expireAt ? new Date(expireAt) : null
        },
        update: {
          ...(plan !== undefined && { plan }), ...(status !== undefined && { status }),
          ...(trialRemaining !== undefined && { trialRemaining: Number(trialRemaining) }),
          ...(expireAt !== undefined && { expireAt: expireAt ? new Date(expireAt) : null })
        }
      });
      return res.status(200).json({ membership: updatedMembership });
    }

    if (action === 'compliance_articles' && req.method === 'GET') {
      const articles = await prisma.complianceArticle.findMany({
        orderBy: { crawledAt: 'desc' }
      });
      return res.status(200).json({ articles });
    }

    if (action === 'update_compliance_article' && req.method === 'POST') {
      const { id, status } = req.body;
      const article = await prisma.complianceArticle.update({
        where: { id },
        data: { status }
      });
      return res.status(200).json({ success: true, article });
    }

    if (action === 'create_compliance_article' && req.method === 'POST') {
      const { title, url, summary, content, category, language } = req.body;
      const urlHash = Buffer.from(url).toString('base64');
      const article = await prisma.complianceArticle.create({
        data: {
          title, url, urlHash, summary, content, category, language,
          status: 'published',
          publishedAt: new Date()
        }
      });
      return res.status(200).json({ success: true, article });
    }

    return res.status(404).json({ error: 'Admin action not found or method not allowed' });
  } catch (err: any) {
    console.error('Admin API error:', err);
    return res.status(500).json(classifyAdminError(err));
  }
}
