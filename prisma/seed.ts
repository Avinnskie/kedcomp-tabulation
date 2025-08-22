import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const teams = [
  {
    name: 'MAN 1 A',
    participants: ['Eli Yunisa Putri', 'Rubayyi Chaira'],
  },
  {
    name: 'MAN 1 B',
    participants: ['Muhamad Ali Akbar', 'Puan Zahra Alifah'],
  },
  {
    name: 'MAN 1 C',
    participants: ['Muhammad Hafidz Rayyan', 'Aulia Nurfadilah'],
  },
  {
    name: 'SMAN 4 PONTIANAK',
    participants: ['Christine Kabang Pabiring', 'Andrea Thalita Putri'],
  },
  {
    name: 'SMA PELITA CEMERLANG',
    participants: ['Nadya Belza Hokianto', 'Callista Adelia Gracia'],
  },
  {
    name: 'SMAN 1 PONTIANAK',
    participants: ['Callysta Annur Ramadhani', 'Carla Martha Harahap'],
  },
  {
    name: 'SMA SANTO PETRUS PONTIANAK',
    participants: ['Nadine Angelina Sihombing', 'Raisha Alifah Rachmadani'],
  },
  {
    name: 'SMAN 3 PONTIANAK',
    participants: ['Zahra Arsyila Putri', 'Zulfa Rahmadani'],
  },
  {
    name: 'SMAN 6 PONTIANAK',
    participants: ['Aisha Khalisa Putri', 'Siti Maisaroh'],
  },
  {
    name: 'SMA IT AL-AZHAR',
    participants: ['Dewi Ayu Lestari', 'Rizky Fadhilah'],
  },
  {
    name: 'SMAN 2 PONTIANAK',
    participants: ['Nurhaliza Putri', 'Syifa Ananda'],
  },
  {
    name: 'SMAN 5 PONTIANAK',
    participants: ['Anisa Rahmawati', 'Mira Safitri'],
  },
  {
    name: 'SMAN 7 PONTIANAK',
    participants: ['Rani Puspita', 'Dini Kusuma'],
  },
  {
    name: 'SMAN 8 PONTIANAK',
    participants: ['Tasya Nur Aini', 'Laila Amalia'],
  },
  {
    name: 'SMK NEGERI 1 PONTIANAK',
    participants: ['Rahmat Hidayat', 'Farhan Nur'],
  },
  {
    name: 'SMK NEGERI 2 PONTIANAK',
    participants: ['Indah Putri', 'Nadia Salsabila'],
  },
  {
    name: 'SMK NEGERI 3 PONTIANAK',
    participants: ['Fitriani', 'Melati Anggraini'],
  },
  {
    name: 'SMAN 9 PONTIANAK',
    participants: ['Cindy Marlina', 'Putri Ayu'],
  },
  {
    name: 'SMAN 10 PONTIANAK',
    participants: ['Aulia Ramadhani', 'Febriani'],
  },
  {
    name: 'SMAN 11 PONTIANAK',
    participants: ['Della Rachma', 'Nisrina'],
  },
  {
    name: 'SMAN 12 PONTIANAK',
    participants: ['Salsabila', 'Nadia Putri'],
  },
  {
    name: 'SMA MUHAMMADIYAH 1',
    participants: ['Iqbal Pratama', 'Arif Kurniawan'],
  },
  {
    name: 'SMA MUHAMMADIYAH 2',
    participants: ['Putra Adi', 'Hafidz Ramadhan'],
  },
  {
    name: 'SMA KATOLIK SANTO PAULUS',
    participants: ['Clara Natalia', 'Maria Gabriela'],
  },
  {
    name: 'SMA KRISTEN IMMANUEL',
    participants: ['Daniel Fernando', 'Jonathan Samuel'],
  },
  {
    name: 'SMA HARAPAN BANGSA',
    participants: ['Natasya', 'Felicia'],
  },
  {
    name: 'SMA TERPADU NURUL FIKRI',
    participants: ['Fauzan Hakim', 'Hilman'],
  },
  {
    name: 'SMAN 13 PONTIANAK',
    participants: ['Yuliana', 'Devi Putri'],
  },
  {
    name: 'SMAN 14 PONTIANAK',
    participants: ['Novi Rahma', 'Tiara Aulia'],
  },
  {
    name: 'SMAN 15 PONTIANAK',
    participants: ['Mega Putri', 'Kartika'],
  },
  {
    name: 'SMAN 16 PONTIANAK',
    participants: ['Rizky Ananda', 'Dicky Saputra'],
  },
  {
    name: 'SMAN 17 PONTIANAK',
    participants: ['Ananda', 'Saputra'],
  },
];

async function createTeams() {
  for (const team of teams) {
    const createdTeam = await prisma.team.create({
      data: {
        name: team.name,
        participants: {
          create: team.participants.map(p => ({
            name: p,
            email: `${p.toLowerCase().replace(/\s+/g, '')}@kedcomp.com`,
          })),
        },
      },
    });
    console.log(`✅ Team created: ${createdTeam.name}`);
  }
  console.log('✅ All teams created successfully.');
}

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('readyforkedcomp2025', 10);

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

    await createTeams();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
