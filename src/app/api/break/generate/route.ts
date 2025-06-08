import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  // Ambil semua ronde preliminary (number < 4)
  const preliminaryRounds = await prisma.round.findMany({
    where: { number: { lt: 4 } },
    include: {
      assignments: {
        include: {
          teamAssignments: {
            include: {
              team: true,
            },
          },
        },
      },
      Score: {
        where: { scoreType: 'INDIVIDUAL' },
        include: {
          team: true,
          participant: true,
        },
      },
    },
  });

  const teamMap: Record<
    number,
    {
      teamId: number;
      teamName: string;
      totalScore: number;
      totalPoints: number;
    }
  > = {};

  for (const round of preliminaryRounds) {
    // Hitung skor tim berdasarkan akumulasi nilai pembicara
    const roomScores = round.assignments.map(assignment => {
      const teamsInRoom = assignment.teamAssignments.map(ta => {
        const teamId = ta.teamId;
        const scores = round.Score.filter(s => s.participant?.teamId === teamId);
        const total = scores.reduce((sum, s) => sum + s.value, 0);

        return {
          teamId,
          teamName: ta.team.name,
          score: total,
        };
      });

      // Ranking berdasarkan skor tertinggi
      const ranked = [...teamsInRoom].sort((a, b) => b.score - a.score);
      return ranked.map((team, idx) => {
        const rank = idx + 1;
        const points = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
        return { ...team, points };
      });
    });

    // Masukkan ke dalam teamMap
    for (const room of roomScores) {
      for (const team of room) {
        if (!teamMap[team.teamId]) {
          teamMap[team.teamId] = {
            teamId: team.teamId,
            teamName: team.teamName,
            totalScore: 0,
            totalPoints: 0,
          };
        }
        teamMap[team.teamId].totalScore += team.score;
        teamMap[team.teamId].totalPoints += team.points;
      }
    }
  }

  // Urutkan dan ambil 8 tim terbaik
  const top8 = Object.values(teamMap)
    .sort((a, b) => {
      if (b.totalPoints === a.totalPoints) {
        return b.totalScore - a.totalScore;
      }
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, 8);

  // Cek apakah semifinal sudah dibuat
  const existing = await prisma.round.findFirst({ where: { number: 4 } });
  if (existing) {
    return NextResponse.json({ message: 'Semifinal round already exists' }, { status: 400 });
  }

  // Buat semifinal round
  const semifinal = await prisma.round.create({
    data: {
      name: 'Semifinal',
      number: 4,
    },
  });

  // Ambil 2 ruangan
  const rooms = await prisma.room.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });

  if (rooms.length < 2) {
    return NextResponse.json({ message: 'Not enough rooms' }, { status: 400 });
  }

  const roomAssignments = await Promise.all(
    [0, 1].map(async roomIdx => {
      const assignedTeams = top8.slice(roomIdx * 4, roomIdx * 4 + 4);

      const assignment = await prisma.roundAssignment.create({
        data: {
          roundId: semifinal.id,
          roomId: rooms[roomIdx].id,
        },
      });

      await Promise.all(
        assignedTeams.map((team, i) =>
          prisma.teamAssignment.create({
            data: {
              roundAssignmentId: assignment.id,
              teamId: team.teamId,
              position: ['OG', 'OO', 'CG', 'CO'][i],
            },
          })
        )
      );

      return assignment;
    })
  );

  return NextResponse.json({
    message: 'Semifinal bracket created successfully',
    roundId: semifinal.id,
    assignments: roomAssignments.map(r => r.id),
  });
}
