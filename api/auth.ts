import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const AUTH_PLAN_LIMITS = {
  free: {
    dailyAiLimit: 10,
    allowAttachment: false,
    allowMultimodal: false,
    allowEci: false,
    allowAdvancedTools: false,
    supportLevel: 'basic',
  },
  startup: {
    dailyAiLimit: 50,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: false,
    allowAdvancedTools: true,
    supportLevel: 'email',
  },
  pro: {
    dailyAiLimit: null,
    allowAttachment: true,
    allowMultimodal: true,
    allowEci: true,
    allowAdvancedTools: true,
    supportLevel: 'priority',
  },
} as const;

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
  membership: any;
  discountCouponClaimed: boolean;
  discountCouponClaimedAt: Date | null;
};

function toSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    membership: user.membership,
    discountCouponClaimed: user.discountCouponClaimed,
    discountCouponClaimedAt: user.discountCouponClaimedAt,
  };
}

function getEnvStatus() {
  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
    hasPostgresUrlNonPooling: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasSailguardLlmKey: Boolean(process.env.SAILGUARD_LLM_API_KEY),
    hasLlmKey: Boolean(process.env.LLM_API_KEY),
    hasGeminiKey: Boolean(
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.API_KEY
    ),
  };
}

function getAiStatus() {
  const hasOpenAiCompatibleKey = Boolean(
    process.env.SAILGUARD_LLM_API_KEY ||
    process.env.LLM_API_KEY ||
    process.env.AUDITEYE_LLM_API_KEY
  );

  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.API_KEY
  );

  const provider = hasOpenAiCompatibleKey
    ? 'openai-compatible'
    : hasGeminiKey
      ? 'gemini'
      : 'mock';

  return {
    provider,
    configured: hasOpenAiCompatibleKey || hasGeminiKey,
    baseUrlConfigured: Boolean(
      process.env.SAILGUARD_LLM_BASE_URL ||
      process.env.LLM_BASE_URL ||
      process.env.AUDITEYE_LLM_BASE_URL
    ),
    model:
      process.env.SAILGUARD_LLM_MODEL ||
      process.env.LLM_MODEL ||
      process.env.AUDITEYE_PRIMARY_MODEL ||
      'not_set',
  };
}

type PrismaLike = any;

declare global {
  // eslint-disable-next-line no-var
  var __sailguardPrisma: PrismaLike | undefined;
}

async function loadPrisma() {
  try {
    const prismaClientModule = await import('@prisma/client');
    const PrismaClient = prismaClientModule.PrismaClient;

    if (!globalThis.__sailguardPrisma) {
      globalThis.__sailguardPrisma = new PrismaClient();
    }

    return {
      prisma: globalThis.__sailguardPrisma,
      error: null as any,
    };
  } catch (error: any) {
    console.error('Failed to load @prisma/client directly in auth route:', error);
    return {
      prisma: null,
      error,
    };
  }
}

async function loadBcrypt() {
  try {
    const mod = await import('bcryptjs');
    return {
      bcrypt: mod.default || mod,
      error: null as any,
    };
  } catch (error: any) {
    console.error('Failed to load bcryptjs:', error);
    return {
      bcrypt: null,
      error,
    };
  }
}

function getErrorMessage(error: any) {
  return String(error?.message || error || '');
}

function classifyServerError(error: any) {
  const message = getErrorMessage(error);

  if (
    error?.code === 'P1001' ||
    error?.code === 'P1017' ||
    message.includes("Can't reach database") ||
    message.includes('Environment variable not found') ||
    message.includes('POSTGRES_PRISMA_URL') ||
    message.includes('POSTGRES_URL_NON_POOLING') ||
    message.includes('DATABASE_URL') ||
    message.includes('DIRECT_URL')
  ) {
    return {
      status: 500,
      code: 'DATABASE_CONNECTION_FAILED',
      error: 'Database connection failed',
    };
  }

  if (
    message.includes('PrismaClientInitializationError') ||
    message.includes('Prisma initialization') ||
    message.includes('@prisma/client did not initialize') ||
    message.includes('PrismaClientKnownRequestError')
  ) {
    return {
      status: 500,
      code: 'PRISMA_INIT_FAILED',
      error: 'Prisma initialization failed',
    };
  }

  if (
    message.toLowerCase().includes('bcrypt') ||
    message.includes('data and hash must be strings')
  ) {
    return {
      status: 500,
      code: 'PASSWORD_VERIFIER_FAILED',
      error: 'Password verifier failed',
    };
  }

  return {
    status: 500,
    code: 'SYSTEM_ERROR',
    error: 'System error',
  };
}

function authenticateFromRequest(req: VercelRequest): string | null {
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
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || req.body?.action;

  res.setHeader('Content-Type', 'application/json');

  if (action === 'health' && req.method === 'GET') {
    const { prisma, error: prismaLoadError } = await loadPrisma();

    let databaseConnected = false;
    let databaseError: any = null;

    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        databaseConnected = true;
      } catch (error: any) {
        databaseConnected = false;
        databaseError = {
          code: error?.code || null,
          message: getErrorMessage(error).slice(0, 300),
        };
      }
    } else {
      databaseError = {
        code: 'PRISMA_CLIENT_LOAD_FAILED',
        message: getErrorMessage(prismaLoadError).slice(0, 300),
      };
    }

    return res.status(200).json({
      status: 'ok',
      serverless: 'alive',
      env: getEnvStatus(),
      database: {
        clientLoaded: Boolean(prisma),
        connected: databaseConnected,
        error: databaseError,
      },
      ai: getAiStatus(),
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });
  }

  if (action === 'debug' && req.method === 'GET') {
    if (process.env.AUTH_DEBUG !== '1') {
      return res.status(404).json({
        error: 'Not found',
        code: 'NOT_FOUND',
      });
    }

    const { prisma, error: prismaLoadError } = await loadPrisma();

    let databaseConnected = false;
    let databaseError: any = null;

    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        databaseConnected = true;
      } catch (error: any) {
        databaseConnected = false;
        databaseError = {
          code: error?.code || null,
          message: getErrorMessage(error).slice(0, 500),
        };
      }
    } else {
      databaseError = {
        code: 'PRISMA_CLIENT_LOAD_FAILED',
        message: getErrorMessage(prismaLoadError).slice(0, 500),
      };
    }

    return res.status(200).json({
      ok: true,
      env: getEnvStatus(),
      database: {
        clientLoaded: Boolean(prisma),
        connected: databaseConnected,
        error: databaseError,
      },
    });
  }

  if (action === 'login' && req.method === 'POST') {
    try {
      const { identifier, email, password } = req.body;
      const ident = (identifier || email || '').trim();

      if (!ident || !password) {
        return res.status(400).json({
          error: 'Identifier and password required',
          code: 'MISSING_CREDENTIALS',
        });
      }

      const { prisma, error: prismaLoadError } = await loadPrisma();

      if (!prisma) {
        console.error('Login failed: Prisma client failed to load:', prismaLoadError);
        return res.status(500).json({
          error: 'Prisma client failed to load',
          code: 'PRISMA_CLIENT_LOAD_FAILED',
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: ident.toLowerCase() },
            { username: ident },
          ],
        },
        include: { membership: true },
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      if (!user.passwordHash || typeof user.passwordHash !== 'string') {
        return res.status(500).json({
          error: 'Password hash missing',
          code: 'PASSWORD_HASH_MISSING',
        });
      }

      const { bcrypt, error: bcryptLoadError } = await loadBcrypt();

      if (!bcrypt) {
        console.error('Login failed: bcryptjs failed to load:', bcryptLoadError);
        return res.status(500).json({
          error: 'Password verifier module failed to load',
          code: 'PASSWORD_VERIFIER_FAILED',
        });
      }

      let passwordOk = false;

      try {
        passwordOk = await bcrypt.compare(password, user.passwordHash);
      } catch (error) {
        console.error('bcrypt compare error:', error);
        return res.status(500).json({
          error: 'Password verifier failed',
          code: 'PASSWORD_VERIFIER_FAILED',
        });
      }

      if (!passwordOk) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: toSafeUser(user),
      });
    } catch (error: any) {
      console.error('Login action error:', error);
      const classified = classifyServerError(error);

      return res.status(classified.status).json({
        error: classified.error,
        code: classified.code,
      });
    }
  }

  if (action === 'register' && req.method === 'POST') {
    try {
      const { email, password, username, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password required',
          code: 'MISSING_CREDENTIALS',
        });
      }

      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!pwdRegex.test(password)) {
        return res.status(400).json({
          error: 'Password does not meet complexity requirements',
          code: 'WEAK_PASSWORD',
        });
      }

      const finalUsername = (username || name || '').trim();

      if (!finalUsername) {
        return res.status(400).json({
          error: 'Username required',
          code: 'USERNAME_REQUIRED',
        });
      }

      const { prisma, error: prismaLoadError } = await loadPrisma();

      if (!prisma) {
        console.error('Register failed: Prisma client failed to load:', prismaLoadError);
        return res.status(500).json({
          error: 'Prisma client failed to load',
          code: 'PRISMA_CLIENT_LOAD_FAILED',
        });
      }

      const { bcrypt, error: bcryptLoadError } = await loadBcrypt();

      if (!bcrypt) {
        console.error('Register failed: bcryptjs failed to load:', bcryptLoadError);
        return res.status(500).json({
          error: 'Password verifier module failed to load',
          code: 'PASSWORD_VERIFIER_FAILED',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingEmail) {
        return res.status(409).json({
          error: 'Email already exists',
          code: 'EMAIL_EXISTS',
        });
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
      });

      if (existingUsername) {
        return res.status(409).json({
          error: 'Username already exists',
          code: 'USERNAME_EXISTS',
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username: finalUsername,
          name: finalUsername,
          passwordHash,
          membership: {
            create: {
              plan: 'free',
              trialRemaining: 10,
            },
          },
        },
        include: { membership: true },
      });

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        token,
        user: toSafeUser(user),
      });
    } catch (error: any) {
      console.error('Register action error:', error);

      if (error?.code === 'P2002') {
        const target = error.meta?.target || [];

        if (target.includes('username')) {
          return res.status(409).json({
            error: 'Username already exists',
            code: 'USERNAME_EXISTS',
          });
        }

        if (target.includes('email')) {
          return res.status(409).json({
            error: 'Email already exists',
            code: 'EMAIL_EXISTS',
          });
        }

        return res.status(409).json({
          error: 'Unique constraint failed',
          code: 'DUPLICATE_VALUE',
        });
      }

      const classified = classifyServerError(error);

      return res.status(classified.status).json({
        error: classified.error,
        code: classified.code,
      });
    }
  }

  if (action === 'me' && req.method === 'GET') {
    try {
      const userId = authenticateFromRequest(req);

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
      }

      const { prisma, error: prismaLoadError } = await loadPrisma();

      if (!prisma) {
        console.error('Me failed: Prisma client failed to load:', prismaLoadError);
        return res.status(500).json({
          error: 'Prisma client failed to load',
          code: 'PRISMA_CLIENT_LOAD_FAILED',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { membership: true },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
      }

      return res.status(200).json({
        user: toSafeUser(user),
      });
    } catch (error: any) {
      console.error('Me action error:', error);
      const classified = classifyServerError(error);

      return res.status(classified.status).json({
        error: classified.error,
        code: classified.code,
      });
    }
  }

  if (action === 'membership' && req.method === 'GET') {
    try {
      const userId = authenticateFromRequest(req);

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
      }

      const { prisma, error: prismaLoadError } = await loadPrisma();

      if (!prisma) {
        console.error('Membership failed: Prisma client failed to load:', prismaLoadError);
        return res.status(500).json({
          error: 'Prisma client failed to load',
          code: 'PRISMA_CLIENT_LOAD_FAILED',
        });
      }

      const membership = await prisma.membership.findUnique({
        where: { userId },
      });

      const plan = membership?.plan || 'free';

      const limits =
        AUTH_PLAN_LIMITS[plan as keyof typeof AUTH_PLAN_LIMITS] ||
        AUTH_PLAN_LIMITS.free;

      let todayUsage = 0;

      if (limits.dailyAiLimit !== null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        todayUsage = await prisma.usageRecord.count({
          where: {
            userId,
            featureType: 'ai_chat',
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });
      }

      return res.status(200).json({
        membership,
        todayUsage,
        limits,
      });
    } catch (error: any) {
      console.error('Membership action error:', error);
      const classified = classifyServerError(error);

      return res.status(classified.status).json({
        error: classified.error,
        code: classified.code,
      });
    }
  }

  if (action === 'logout' && req.method === 'POST') {
    return res.status(200).json({
      success: true,
    });
  }

  return res.status(404).json({
    error: 'Auth action not found or method not allowed',
    code: 'AUTH_ACTION_NOT_FOUND',
  });
}
