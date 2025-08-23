import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const teams = [
  {
    name: 'MAN 1 A',
    participants: [
      { name: 'Eli Yunisa Putri', email: 'eliyunisa09@gmail.com' },
      { name: 'Rubayyi Chaira', email: 'rubayyi.chaira@gmail.com' },
    ],
  },
  {
    name: 'MAN 1 B',
    participants: [
      { name: 'Muhamad Ali Akbar', email: 'muhamadaliakbarrama@gmail.com' },
      { name: 'Puan Zahra Alifah', email: 'zrazaratra@gmail.com' },
    ],
  },
  {
    name: 'MAN 1 C',
    participants: [
      { name: 'Muhammad Hafidz Rayyan', email: 'mhafidzrayyan@gmail.com' },
      { name: 'Aulia Nurfadilah', email: 'aulianurfadilah229@gmail.com' },
    ],
  },
  {
    name: 'SMAN 4 PONTIANAK',
    participants: [
      { name: 'Christine Kabang Pabiring', email: 'christinekabang@gmail.com' },
      { name: 'Andrea Thalita Putri', email: 'andreathalitaputri@gmail.com' },
    ],
  },
  {
    name: 'SMA PELITA CEMERLANG',
    participants: [
      { name: 'Nadya Belza Hokianto', email: 'n4dy4bh2015.sdpc@gmail.com' },
      { name: 'Elaine Herry', email: 'elaineherry@gmail.com' },
    ],
  },
  {
    name: 'SMAN 1 PONTIANAK',
    participants: [
      { name: 'Callysta Annur Ramadhani', email: 'lystaar21@gmail.com' },
      { name: 'Carla Martha Harahap', email: 'carlamrth@gmail.com' },
    ],
  },
  {
    name: 'SMA KRISTEN MARANATHA A',
    participants: [
      { name: 'Diego Nathan', email: 'diegonathan620@gmail.com' },
      { name: 'Aulia Anggrea', email: 'lialialiaa222@gmail.com' },
    ],
  },
  {
    name: 'SMA KRISTEN MARANATHA B',
    participants: [
      { name: 'Richard Lucius Hendri', email: 'richhendri479@gmail.com' },
      { name: 'Jo Felicia Hendri', email: 'Hendri.johni75@gmail.com' },
    ],
  },
  {
    name: 'SMA GEMBALA BAIK',
    participants: [
      { name: 'Queency Evelyn', email: 'queencyevelyn.glx2018@gmail.com' },
      { name: 'Quinsha Gaylen Yang', email: 'cahenile@gmail.com' },
    ],
  },
  {
    name: 'SMAN 10 PONTIANAK',
    participants: [
      { name: 'Alicia Shofi Destiani', email: 'aliciashofi04@gmail.com' },
      { name: 'Raisya Adinda Putri', email: 'rsdndptr@gmail.com' },
    ],
  },
  {
    name: 'SMA KRISTEN IMMANUEL A',
    participants: [
      { name: 'Hana Winola', email: 'hanawinola15@gmail.com' },
      { name: 'Cheryl MIchella', email: 'cherylmichella0@gmail.com' },
    ],
  },
  {
    name: 'SMA KRISTEN IMMANUEL B',
    participants: [
      { name: 'Emmeline Elva Salim', email: 'emmeline.elva@gmail.com' },
      { name: 'Aileen Tricia', email: 'aileentricia23@gmail.com' },
    ],
  },
  {
    name: 'SMA KRISTEN IMMANUEL C',
    participants: [
      { name: 'Cheryll Girry Narenswari', email: 'cheryllnaren@gmail.com' },
      { name: 'Callysta Florencia', email: 'callystaflo999@gmail.com' },
    ],
  },
  {
    name: 'SMAK IMMANUEL BILINGUAL CLASS A',
    participants: [
      { name: 'Quincy Wynelle Zeng', email: 'zengquincy@gmail.com' },
      { name: 'Monday Kenza Chung', email: 'mondaykenza@gmail.com' },
    ],
  },
  {
    name: 'SMAK IMMANUEL BILINGUAL CLASS B',
    participants: [
      { name: 'Erica Varrell', email: 'Ericavarrell2@gmail.com' },
      { name: 'Jonathan Simangunsong', email: 'jonathan.044@ski.sch.id' },
    ],
  },
  {
    name: 'SMK KRISTEN IMMANUEL PONTIANAK A',
    participants: [
      { name: 'Verity', email: 'Veritylim08@gmail.com' },
      { name: 'Nathan Andrew', email: 'nthandrw2659@gmail.com' },
    ],
  },
  {
    name: 'SMK KRISTEN IMMANUEL PONTIANAK B',
    participants: [
      { name: 'Cherry Gita', email: 'cheeryy2ndbrain@gmail.com' },
      { name: 'Callista Elisabeth', email: 'callis.5183@gmail.com' },
    ],
  },
  {
    name: 'SMK KRISTEN IMMANUEL PONTIANAK C',
    participants: [
      { name: 'Elvida Adeo Gratia', email: 'elvida.002@ski.sch.id' },
      { name: 'Fidelyn Adeo Gratia', email: 'fidelyn.001@ski.sch.id' },
    ],
  },
  {
    name: 'SMK KRISTEN IMMANUEL PONTIANAK D',
    participants: [
      { name: 'Ayumi Fiorine Hendro', email: 'ayumifioh@gmail.com' },
      { name: 'Clayni Crhislie', email: 'sanwiceisniceee@gmail.com' },
    ],
  },
  {
    name: 'SMA TUNAS BANGSA',
    participants: [
      { name: 'Li Yung Chih', email: 'theothermichaelbryan@gmail.com' },
      { name: 'Ridha Isabella', email: 'isabellaridha311@gmail.com' },
    ],
  },
  {
    name: 'SMAN 1 RASAU JAYA',
    participants: [
      { name: 'Destia Isyana Floweriska', email: 'riskasyanafloewieezeaaa@gmail.com' },
      { name: 'Rindi Septiani Putri', email: 'rindiseptianiputri@gmail.com' },
    ],
  },
  {
    name: 'SMAN 2 PONTIANAK',
    participants: [
      { name: 'Nur Winda', email: 'nurwinda158@gmail.com' },
      { name: 'Muhammad Nabil Baldassare', email: 'nabilbaldassare@gmail.com' },
    ],
  },
  {
    name: 'SMK KRISTEN IMMANUEL II',
    participants: [
      { name: 'Jonathan Pratama', email: 'Jonathan.031@ski.sch.id' },
      { name: 'Steven Andrean', email: 'steven.019@ski.sch.id' },
    ],
  },
  {
    name: 'MAS DARUSSALAM A',
    participants: [
      { name: 'Nabila Fahriyah Kurniawan', email: 'nabila.fahriyah@gmail.com' },
      { name: 'Qhyren Wahyu Ramadhan', email: 'qhyren.wahyu@gmail.com' },
    ],
  },
  {
    name: 'MAS DARUSSALAM B',
    participants: [
      { name: 'Benri Siraaj Aliyya Firaas', email: 'benri.siraaj@gmail.com' },
      { name: 'Raffi Ahmad', email: 'raffi.ahmad@gmail.com' },
    ],
  },
  {
    name: 'MAN 2 PONTIANAK A',
    participants: [
      { name: 'Nailah Farah Diva', email: 'nailahfarah2018@gmail.com' },
      { name: 'Aisya Zahratussyita', email: 'shazhr.09@gmail.com' },
    ],
  },
  {
    name: 'MAN 2 PONTIANAK B',
    participants: [
      { name: 'Diaz Rafadika', email: 'diazrafadika986@gmail.com' },
      { name: 'Chayara Alimah Asraruddin', email: 'yara.catcrunch@gmail.com' },
    ],
  },
  {
    name: 'SMAN 5 PONTIANAK',
    participants: [
      { name: 'Pricilla Kiara Abelista', email: 'pricilkiara39@gmail.com' },
      { name: 'Rebecca Timothy Purwanto', email: 'beccabecca886@gmail.com' },
    ],
  },
  {
    name: 'SMAN 9 PONTIANAK',
    participants: [
      { name: 'Marvel Dinata', email: 'marvel.dinata.0@gmail.com' },
      { name: 'Rafael Phiniel Sianturi', email: 'rafaelphinielsianturi7@gmail.com' },
    ],
  },
  {
    name: 'SMK SANTA MARIA PONTIANAK A',
    participants: [
      { name: 'Kirei Sung', email: 'kireisung.2425@sanmar.sch.id' },
      { name: 'Jason Tariandi', email: 'jasontariandi.2425@sanmar.sch.id' },
    ],
  },
  {
    name: 'SMK SANTA MARIA PONTIANAK B',
    participants: [
      { name: 'Velizia Avanza', email: 'veliziavanza.2425@sanmar.sch.id' },
      { name: 'Laura Josephine Aurelia Yasintus', email: 'laura.2425@sanmar.sch.id' },
    ],
  },
  {
    name: 'SMKN 4 PONTIANAK',
    participants: [
      { name: 'Aliftha Adly Pradana', email: 'alifthaadlypradana0@gmail.com' },
      { name: 'Muhammad Alif Alghifari', email: 'zoomalghifari@gmail.com' },
    ],
  },
];

async function createTeams() {
  for (const team of teams) {
    const createdTeam = await prisma.team.create({
      data: {
        name: team.name,
        participants: {
          create: team.participants.map(p => ({
            name: p.name,
            email: p.email,
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