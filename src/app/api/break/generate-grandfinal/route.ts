import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Ambil semifinal round
    const semifinalRound = await prisma.round.findFirst({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (!semifinalRound) {
      return NextResponse.json({ message: 'Semifinal belum dibuat' }, { status: 400 });
    }

    const teamStats: Record<
      number,
      { teamId: number; teamName: string; vp: number; score: number }
    > = {};

    for (const assignment of semifinalRound.assignments) {
      for (const team of assignment.teamAssignments) {
        const teamId = team.teamId;
        if (!teamStats[teamId]) {
          teamStats[teamId] = { teamId, teamName: team.team.name, vp: 0, score: 0 };
        }

        const match = await prisma.matchResult.findFirst({
          where: { roundAssignmentId: assignment.id, teamId },
        });

        if (match) {
          teamStats[teamId].vp += match.points;
          teamStats[teamId].score += match.totalScore;
        }
      }
    }

    const top4 = Object.values(teamStats)
      .sort((a, b) => (b.vp !== a.vp ? b.vp - a.vp : b.score - a.score))
      .slice(0, 4);

    if (top4.length < 4) {
      return NextResponse.json(
        { message: 'Kurang dari 4 tim lolos ke grand final' },
        { status: 400 }
      );
    }

    const existingFinal = await prisma.round.findFirst({ where: { number: 5 } });
    if (existingFinal) {
      return NextResponse.json({ message: 'Grand final sudah ada' }, { status: 400 });
    }

    const grandfinal = await prisma.round.create({
      data: { name: 'Grand Final', number: 5 },
    });

    const room = await prisma.room.findFirst({ orderBy: { id: 'asc' } });
    if (!room) {
      return NextResponse.json({ message: 'Tidak ada ruangan tersedia' }, { status: 400 });
    }

    const assignment = await prisma.roundAssignment.create({
      data: { roundId: grandfinal.id, roomId: room.id },
    });

    const positions: DebatePosition[] = ['OG', 'OO', 'CG', 'CO'];

    await Promise.all(
      top4.map((team, i) =>
        prisma.teamAssignment.create({
          data: {
            roundAssignmentId: assignment.id,
            teamId: team.teamId,
            position: positions[i],
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Grand final berhasil dibuat',
      teamIds: top4.map(t => t.teamId),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Terjadi error' }, { status: 500 });
  }
}
