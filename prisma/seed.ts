import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const teamNames = [
  "SMA Harapan Bangsa", "SMK Negeri 1 Pontianak", "SMA Pertiwi Mandiri", "SMA Citra Nusantara",
  "MAN 2 Pontianak", "SMA Negeri 4 Pontianak", "SMK Karya Bangsa", "SMA Cahaya Ilmu",
  "SMAN 1 Mempawah", "SMA Negeri 5 Singkawang", "SMK Taruna Bakti", "SMA Bina Prestasi",
  "SMA Global Mandiri", "SMA Negeri 3 Sintang", "SMK Informatika Sejahtera", "SMA Widya Dharma",
  "SMA Satu Visi", "SMK Bhakti Persada", "SMA Negeri 2 Sambas", "SMA Al-Falah",
  "SMK Trisakti", "SMA Negeri 1 Ketapang", "SMA Dharma Bakti", "SMK Negeri 2 Bengkayang",
  "SMA Tunas Harapan", "SMA Pelita Nusantara", "SMK Cendekia", "SMA Bina Bangsa",
  "SMK Negeri 3 Kubu Raya", "SMA Karya Mulia", "SMA Sinar Harapan", "SMK Bintang Timur"
]

const firstNames = [
  "Alya", "Fahmi", "Dimas", "Tiara", "Bayu", "Indah", "Rizky", "Lestari",
  "Zahra", "Maulana", "Herlambang", "Putri", "Putra", "Pratama", "Saputra", "Kurniawan"
]

const lastNames = [
  "Saputra", "Maulana", "Pratama", "Zahra", "Lestari", "Herlambang", "Kusuma", "Wijaya",
  "Santoso", "Wahyuni", "Susanto", "Rahayu", "Fadillah", "Mulyani", "Syahputra", "Ramadhan"
]

function getRandomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${first} ${last}`
}

async function main() {
  console.log("🔄 Clearing existing data...")
  await prisma.score.deleteMany()
  await prisma.participant.deleteMany()
  await prisma.team.deleteMany()
  await prisma.judge.deleteMany()
  await prisma.room.deleteMany()

  console.log("🏠 Creating Rooms...")
  await prisma.room.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      name: `Room ${i + 1}`
    }))
  })

  console.log("👨‍⚖️ Creating Judges...")
  const judgePassword = await bcrypt.hash("password123", 10)
  await prisma.judge.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      name: `Judge ${i + 1}`,
      email: `judge${i + 1}@kedcomp.com`,
      password: judgePassword
    }))
  })

  console.log("🏫 Creating Teams and Participants...")
  for (let i = 0; i < teamNames.length; i++) {
    const team = await prisma.team.create({
      data: {
        name: teamNames[i]
      }
    })

    await prisma.participant.createMany({
      data: [
        {
          name: getRandomName(),
          email: `participant${i + 1}a@kedcomp.com`,
          teamId: team.id
        },
        {
          name: getRandomName(),
          email: `participant${i + 1}b@kedcomp.com`,
          teamId: team.id
        }
      ]
    })
  }

  console.log("✅ Seeding complete!")
}

main()
  .catch(e => {
    console.error("❌ Error seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
