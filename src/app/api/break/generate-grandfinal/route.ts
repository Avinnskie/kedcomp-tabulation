import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Ambil ronde semifinal (number === 4)
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
      return NextResponse.json(
        { message: 'The semifinal round has not yet been made' },
        { status: 400 }
      );
    }

    // Hitung ranking semifinal berdasarkan VP dan skor
    const teamScores: Record<
      number,
      { teamId: number; teamName: string; vp: number; score: number }
    > = {};

    for (const assignment of semifinalRound.assignments) {
      const teams = assignment.teamAssignments;

      for (const team of teams) {
        const teamId = team.teamId;
        if (!teamScores[teamId]) {
          teamScores[teamId] = {
            teamId,
            teamName: team.team.name,
            vp: 0,
            score: 0,
          };
        }

        // Ambil nilai dari MatchResult (VP dan Rank) di babak semifinal
        const match = await prisma.matchResult.findFirst({
          where: {
            roundAssignmentId: assignment.id,
            teamId,
          },
        });

        if (match) {
          teamScores[teamId].vp += match.points;
          teamScores[teamId].score += match.rank ? 4 - match.rank : 0;
        }
      }
    }

    const sorted = Object.values(teamScores)
      .sort((a, b) => {
        if (b.vp === a.vp) {
          if (b.score === a.score) {
            return a.teamName.localeCompare(b.teamName); // fallback deterministik
          }
          return b.score - a.score;
        }
        return b.vp - a.vp;
      })
      .slice(0, 4);

    // Cek apakah ronde grand final sudah dibuat
    const existingFinal = await prisma.round.findFirst({ where: { number: 5 } });
    if (existingFinal) {
      return NextResponse.json({ message: 'The grand final round is here' }, { status: 400 });
    }

    // Buat ronde grand final
    const grandfinal = await prisma.round.create({
      data: {
        name: 'Grand Final',
        number: 5,
      },
    });

    // Ambil satu ruangan
    const room = await prisma.room.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!room) {
      return NextResponse.json({ message: 'No room available' }, { status: 400 });
    }

    const assignment = await prisma.roundAssignment.create({
      data: {
        roundId: grandfinal.id,
        roomId: room.id,
      },
    });

    await Promise.all(
      sorted.map((team, i) =>
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
      message: 'Grand final successfully made',
      roundId: grandfinal.id,
      teamIds: sorted.map(t => t.teamId),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'An error occurred while making the grand final' },
      { status: 500 }
    );
  }
}
