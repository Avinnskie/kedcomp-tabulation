import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kedcomp.com' },
    update: {},
    create: {
      email: 'admin@kedcomp.com',
      name: 'Admin User',
      password: await hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const juri = await prisma.user.upsert({
    where: { email: 'juri@kedcomp.com' },
    update: {},
    create: {
      email: 'juri@kedcomp.com',
      name: 'Juri User',
      password: await hash('juri123', 10),
      role: 'JUDGE',
    },
  });

  console.log({ admin, juri });
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma client connection
    await prisma.$disconnect();
  });
