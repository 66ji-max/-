import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment.');
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { OR: [{ email: adminEmail }, { role: 'admin' }] }
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
    return;
  }

  console.log('Creating initial admin user...');
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      username: adminUsername,
      name: 'System Admin',
      passwordHash,
      role: 'admin',
      membership: {
        create: { plan: 'pro', status: 'active', trialRemaining: 9999 }
      }
    }
  });

  console.log(`Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
