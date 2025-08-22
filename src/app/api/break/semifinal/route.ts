// pages/api/bracket/generate-semifinal.ts
import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST() {
  // Ambil hasil Quarter Final (round number = 4)
  const quarter = await prisma.round.findFirst({
    where: { number: 4 },
    include: {
      assignments: {
        include: {
          matchResults: { include: { team: true } },
        },
      },
    },
  });

  if (!quarter) {
    return NextResponse.json({ message: 'Quarter Final not found' }, { status: 400 });
  }

  const advancingTeams: { teamId: number; teamName: string }[] = [];

  // Ambil 2 tim terbaik per room (rank 1 & 2)
  for (const assignment of quarter.assignments) {
    const ranked = assignment.matchResults.sort((a, b) => a.rank - b.rank);
    advancingTeams.push(
      ...ranked.slice(0, 2).map(r => ({
        teamId: r.teamId,
        teamName: r.team.name,
      }))
    );
  }

  // Buat semifinal round
  const semifinal = await prisma.round.create({
    data: { name: 'Semifinal', number: 5 },
  });

  // Pastikan sudah ada minimal 2 room untuk semifinal
  const rooms = await prisma.room.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });

  if (rooms.length < 2) {
    return NextResponse.json({ message: 'Not enough rooms for semifinal' }, { status: 400 });
  }

  // Assign ke 2 room (4 tim per room)
  await Promise.all(
    [0, 1].map(async (roomIdx) => {
      const assignedTeams = advancingTeams.slice(roomIdx * 4, roomIdx * 4 + 4);

      const assignment = await prisma.roundAssignment.create({
        data: { roundId: semifinal.id, roomId: rooms[roomIdx].id },
      });

      await Promise.all(
        assignedTeams.map((team, i) =>
          prisma.teamAssignment.create({
            data: {
              roundAssignmentId: assignment.id,
              teamId: team.teamId,
              position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
            },
          })
        )
      );
    })
  );

  return NextResponse.json({
    message: 'Semifinal bracket created successfully',
    roundId: semifinal.id,
  });
}
