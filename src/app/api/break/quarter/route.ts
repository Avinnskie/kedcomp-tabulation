// app/api/break/quarterfinal/route.ts
import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const quarter = await prisma.round.findFirst({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: { team: true },
            },
            room: true,
          },
        },
      },
    });

    if (!quarter) {
      return NextResponse.json({ message: 'Quarterfinal not yet generated' }, { status: 404 });
    }

    const teams = quarter.assignments.flatMap(assignment =>
      assignment.teamAssignments.map(ta => ({
        teamId: ta.teamId,
        teamName: ta.team.name,
        position: ta.position,
        room: assignment.room.name,
      }))
    );

    return NextResponse.json({ roundId: quarter.id, teams });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching quarterfinal teams' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // 1. Ambil ranking tim dari Preliminary (round.number < 4)
    const preliminaryRounds = await prisma.round.findMany({
      where: { number: { lt: 4 } },
      include: {
        assignments: {
          include: {
            teamAssignments: { include: { team: true } },
          },
        },
        Score: {
          where: { scoreType: 'INDIVIDUAL' },
          include: { team: true, participant: true },
        },
      },
    });

    // Hitung skor kumulatif tim
    const teamMap: Record<
      number,
      { teamId: number; teamName: string; totalPoints: number; totalScore: number }
    > = {};

    for (const round of preliminaryRounds) {
      const roomScores = round.assignments.map(assignment => {
        const teams = assignment.teamAssignments.map(ta => {
          const scores = round.Score.filter(s => s.participant?.teamId === ta.teamId);
          const total = scores.reduce((sum, s) => sum + s.value, 0);
          return { teamId: ta.teamId, teamName: ta.team.name, score: total };
        });

        const ranked = [...teams].sort((a, b) => b.score - a.score);
        return ranked.map((t, idx) => {
          const points = idx === 0 ? 3 : idx === 1 ? 2 : idx === 2 ? 1 : 0;
          return { ...t, points };
        });
      });

      for (const room of roomScores) {
        for (const t of room) {
          if (!teamMap[t.teamId]) {
            teamMap[t.teamId] = {
              teamId: t.teamId,
              teamName: t.teamName,
              totalPoints: 0,
              totalScore: 0,
            };
          }
          teamMap[t.teamId].totalPoints += t.points;
          teamMap[t.teamId].totalScore += t.score;
        }
      }
    }

    // 2. Ambil top 16
    const top16 = Object.values(teamMap)
      .sort((a, b) =>
        b.totalPoints === a.totalPoints
          ? b.totalScore - a.totalScore
          : b.totalPoints - a.totalPoints
      )
      .slice(0, 16);

    // 3. Pairing Quarterfinal
    const pairings = [
      [0, 7, 8, 15],
      [1, 6, 9, 14],
      [2, 5, 10, 13],
      [3, 4, 11, 12],
    ];

    // 4. Buat round quarterfinal
    const existingQuarter = await prisma.round.findFirst({ where: { number: 4 } });
    if (existingQuarter) {
      return NextResponse.json({ message: 'Quarterfinal already exists' }, { status: 400 });
    }

    const quarterfinal = await prisma.round.create({
      data: { name: 'Quarterfinal', number: 4 },
    });

    // 5. Buat rooms + roundAssignments
    const rooms = await Promise.all(
      pairings.map((_, idx) =>
        prisma.room.create({ data: { name: `Quarterfinal Room ${idx + 1}` } })
      )
    );

    for (let i = 0; i < pairings.length; i++) {
      const assignment = await prisma.roundAssignment.create({
        data: { roundId: quarterfinal.id, roomId: rooms[i].id },
      });

      const teamsInRoom = pairings[i].map(j => top16[j]);
      await Promise.all(
        teamsInRoom.map((team, posIdx) =>
          prisma.teamAssignment.create({
            data: {
              roundAssignmentId: assignment.id,
              teamId: team.teamId,
              position: ['OG', 'OO', 'CG', 'CO'][posIdx] as DebatePosition,
            },
          })
        )
      );
    }

    return NextResponse.json({
      message: 'Quarterfinal bracket created successfully',
      roundId: quarterfinal.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error generating quarterfinal' }, { status: 500 });
  }
}
