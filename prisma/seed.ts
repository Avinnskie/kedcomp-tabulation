import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

(async () => {
  const hashedPassword = await bcrypt.hash('readyforkedcomp2025', 10);

  async function main() {
    // Cek apakah admin sudah ada
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@kedcomp.com' },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@kedcomp.com',
          role: 'ADMIN',
          password: hashedPassword,
        },
      });
      console.log('✅ Admin created successfully.');
    } else {
      console.log('⚠️ Admin already exists. Skipping creation.');
    }
  }

  main()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
})();
