import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

(async () => {
  const hashedPassword = await bcrypt.hash('readyforkedcomp2025', 10);

  async function main() {
    // Clear all existing data
    console.log('Clearing existing data...');
    await prisma.score.deleteMany();
    await prisma.matchResult.deleteMany();
    await prisma.teamAssignment.deleteMany();
    await prisma.roundAssignment.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.team.deleteMany();
    await prisma.judge.deleteMany();
    await prisma.room.deleteMany();
    await prisma.round.deleteMany();
    await prisma.user.deleteMany();

    console.log('Creating new data...');

    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@kedcomp.com',
        role: 'ADMIN',
        password: hashedPassword,
      },
    });

    // Create rooms
    // const roomsPerRound = 4;
    // for (let round = 1; round <= 3; round++) {
    //   for (let roomNum = 1; roomNum <= roomsPerRound; roomNum++) {
    //     await prisma.room.create({
    //       data: {
    //         name: `Ruang Akuntansi ${roomNum} (R${round})`,
    //       },
    //     });
    //   }
    // }

    // Seed participants
    const participantData = [
      { name: 'Alya', email: 'alya@sma1.sch.id' },
      { name: 'Bagas', email: 'bagas@sma3.sch.id' },
      { name: 'Citra', email: 'citra@smk2.sch.id' },
      { name: 'Dion', email: 'dion@sma5.sch.id' },
      { name: 'Eka', email: 'eka@man1.sch.id' },
      { name: 'Farhan', email: 'farhan@sma7.sch.id' },
      { name: 'Gita', email: 'gita@sman4.sch.id' },
      { name: 'Hafiz', email: 'hafiz@tunas.sch.id' },
      { name: 'Indah', email: 'indah@sma6.sch.id' },
      { name: 'Johan', email: 'johan@smk1.sch.id' },
      { name: 'Kirana', email: 'kirana@ma2.sch.id' },
      { name: 'Leo', email: 'leo@sma2.sch.id' },
      { name: 'Mira', email: 'mira@sma4.sch.id' },
      { name: 'Niko', email: 'niko@smk3.sch.id' },
      { name: 'Ovi', email: 'ovi@man2.sch.id' },
      { name: 'Putra', email: 'putra@sma8.sch.id' },
      { name: 'Qory', email: 'qory@sma9.sch.id' },
      { name: 'Rafi', email: 'rafi@smk4.sch.id' },
      { name: 'Sinta', email: 'sinta@ma3.sch.id' },
      { name: 'Toni', email: 'toni@sman10.sch.id' },
      { name: 'Ulya', email: 'ulya@man3.sch.id' },
      { name: 'Vino', email: 'vino@smk5.sch.id' },
      { name: 'Wulan', email: 'wulan@sma10.sch.id' },
      { name: 'Xander', email: 'xander@sma11.sch.id' },
      { name: 'Yuni', email: 'yuni@ma4.sch.id' },
      { name: 'Zaki', email: 'zaki@sman12.sch.id' },
      { name: 'Bella', email: 'bella@sma13.sch.id' },
      { name: 'Dafa', email: 'dafa@smk6.sch.id' },
      { name: 'Elin', email: 'elin@ma5.sch.id' },
      { name: 'Fahri', email: 'fahri@sma14.sch.id' },
      { name: 'Ghani', email: 'ghani@man4.sch.id' },
      { name: 'Hilmi', email: 'hilmi@smk7.sch.id' },
    ];

    for (let i = 0; i < participantData.length; i += 2) {
      const p1 = participantData[i];
      const p2 = participantData[i + 1];
      if (!p2) break;

      const team = await prisma.team.create({
        data: {
          name: `SMA ${Math.floor(i / 2) + 1}`,
        },
      });

      await prisma.participant.createMany({
        data: [
          { name: p1.name, email: p1.email, teamId: team.id },
          { name: p2.name, email: p2.email, teamId: team.id },
        ],
      });
    }

    console.log('✅ Selesai seed data.');
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
