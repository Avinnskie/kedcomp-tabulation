import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kedcomp.com' },
    update: {},
    create: {
      email: 'admin@kedcomp.com',
      password: await hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  const juri = await prisma.user.upsert({
    where: { email: 'juri@kedcomp.com' },
    update: {},
    create: {
      email: 'juri@kedcomp.com',
      password: await hash('juri123', 10),
      role: 'JURI',
    },
  });

  console.log({ admin, juri });
}

main();
