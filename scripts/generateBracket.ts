// scripts/generateBracket.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateRound1Bracket() {
  // Cek atau buat round Preliminary 1
  let round = await prisma.round.findFirst({
    where: { number: 1 }
  })

  if (!round) {
    round = await prisma.round.create({
      data: {
        name: "Preliminary 1",
        number: 1,
      }
    })
  }

  const teams = await prisma.team.findMany()
  const rooms = await prisma.room.findMany()
  const judges = await prisma.judge.findMany()

  if (teams.length < 32 || rooms.length < 8 || judges.length < 8) {
    throw new Error("Data tidak mencukupi (min 32 tim, 8 ruangan, 8 juri)")
  }

  // Shuffle tim dan assign ke ruangan
  const shuffledTeams = teams.sort(() => Math.random() - 0.5)

  const assignments = []
  for (let i = 0; i < 8; i++) {
    const teamChunk = shuffledTeams.slice(i * 4, i * 4 + 4)
    const assignment = await prisma.roundAssignment.create({
      data: {
        roundId: round.id,
        roomId: rooms[i].id,
        judgeId: judges[i].id,
        teams: {
          connect: teamChunk.map(team => ({ id: team.id }))
        }
      },
      include: { teams: true, room: true, judge: true }
    })

    assignments.push(assignment)
  }

  console.log("✅ Bracket for Round 1 generated successfully!")
}

generateRound1Bracket()
  .catch(e => {
    console.error("❌ Error generating bracket:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
