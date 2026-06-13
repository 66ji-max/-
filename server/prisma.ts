import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEBUG === '1') {
  console.log('[Prisma Env]', {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
    hasPostgresUrlNonPooling: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
  });
}

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
