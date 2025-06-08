import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  // Get all rounds
  const rounds = await prisma.round.findMany({
    orderBy: { number: 'asc' },
  });

  // Get all rooms
  const rooms = await prisma.room.findMany({
    orderBy: { id: 'asc' },
  });

  // Get all round assignments
  const roundAssignments = await prisma.roundAssignment.findMany({
    include: {
      round: true,
      room: true,
      judge: true,
      teamAssignments: {
        include: {
          team: true,
        },
      },
    },
  });

  const data = {
    rounds,
    rooms,
    roundAssignments,
  };

  // Log the data for debugging
  console.log('Database state:', JSON.stringify(data, null, 2));

  return NextResponse.json(data);
}

