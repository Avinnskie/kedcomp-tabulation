import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Ambil semua round semifinal (number === 4)
    const semifinalRounds = await prisma.round.findMany({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: { team: true },
            },
          },
        },
        Score: {
          where: { scoreType: 'INDIVIDUAL' },
          include: { team: true },
        },
      },
    });

    const teamMap: Record<
      number,
      { teamId: number; teamName: string; totalPoints: number; totalScore: number }
    > = {};

    for (const round of semifinalRounds) {
      const roomScores = round.assignments.map(assignment => {
        const teamsInRoom = assignment.teamAssignments.map(ta => {
          const teamId = ta.teamId;
          const scores = round.Score.filter(s => s.teamId === teamId);
          const total = scores.reduce((sum, s) => sum + s.value, 0);

          return { teamId, teamName: ta.team.name, score: total };
        });

        const ranked = [...teamsInRoom].sort((a, b) => b.score - a.score);
        return ranked.map((team, idx) => {
          const rank = idx + 1;
          const points = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
          return { ...team, points };
        });
      });

      for (const room of roomScores) {
        for (const team of room) {
          if (!teamMap[team.teamId]) {
            teamMap[team.teamId] = {
              teamId: team.teamId,
              teamName: team.teamName,
              totalPoints: 0,
              totalScore: 0,
            };
          }
          teamMap[team.teamId].totalPoints += team.points;
          teamMap[team.teamId].totalScore += team.score;
        }
      }
    }

    const top4 = Object.values(teamMap)
      .sort((a, b) =>
        b.totalPoints === a.totalPoints
          ? b.totalScore - a.totalScore
          : b.totalPoints - a.totalPoints
      )
      .slice(0, 4);

    const existingFinal = await prisma.round.findFirst({ where: { number: 5 } });
    if (existingFinal) {
      return NextResponse.json({ message: 'Grand final round already exists' }, { status: 400 });
    }

    const grandFinal = await prisma.round.create({
      data: { name: 'Grand Final', number: 5 },
    });

    const room = await prisma.room.findFirst({ orderBy: { id: 'asc' } });
    if (!room) {
      return NextResponse.json({ message: 'No room available' }, { status: 400 });
    }

    const assignment = await prisma.roundAssignment.create({
      data: { roundId: grandFinal.id, roomId: room.id },
    });

    await Promise.all(
      top4.map((team, i) =>
        prisma.teamAssignment.create({
          data: {
            roundAssignmentId: assignment.id,
            teamId: team.teamId,
            position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Grand final bracket created successfully',
      roundId: grandFinal.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error generating grand final bracket' }, { status: 500 });
  }
}
