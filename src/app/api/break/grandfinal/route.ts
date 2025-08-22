import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Ambil semua round semifinal (number === 5)
    const semifinalRounds = await prisma.round.findMany({
      where: { number: 5 },
      include: {
        assignments: {
          include: {
            teamAssignments: { include: { team: true } },
          },
        },
        Score: {
          where: { scoreType: 'INDIVIDUAL' },
          include: { team: true },
        },
      },
    });

    if (semifinalRounds.length === 0) {
      return NextResponse.json({ message: 'Semifinal not found' }, { status: 400 });
    }

    const teamMap: Record<
      number,
      { teamId: number; teamName: string; totalPoints: number; totalScore: number }
    > = {};

    for (const round of semifinalRounds) {
      for (const assignment of round.assignments) {
        const teamsInRoom = assignment.teamAssignments.map(ta => {
          const teamId = ta.teamId;
          const scores = round.Score.filter(s => s.teamId === teamId);
          const total = scores.reduce((sum, s) => sum + s.value, 0);
          return { teamId, teamName: ta.team.name, score: total };
        });

        const ranked = [...teamsInRoom].sort((a, b) => b.score - a.score);
        ranked.forEach((team, idx) => {
          const points = idx === 0 ? 3 : idx === 1 ? 2 : idx === 2 ? 1 : 0;
          if (!teamMap[team.teamId]) {
            teamMap[team.teamId] = { teamId: team.teamId, teamName: team.teamName, totalPoints: 0, totalScore: 0 };
          }
          teamMap[team.teamId].totalPoints += points;
          teamMap[team.teamId].totalScore += team.score;
        });
      }
    }

    const top4 = Object.values(teamMap)
      .sort((a, b) =>
        b.totalPoints === a.totalPoints
          ? b.totalScore - a.totalScore
          : b.totalPoints - a.totalPoints
      )
      .slice(0, 4);

    const existingFinal = await prisma.round.findFirst({ where: { number: 6 } });
    if (existingFinal) {
      return NextResponse.json({ message: 'Grand final round already exists' }, { status: 400 });
    }

    const grandFinal = await prisma.round.create({
      data: { name: 'Grand Final', number: 6 },
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
