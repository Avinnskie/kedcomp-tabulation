import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roundId = parseInt(params.id);
    if (isNaN(roundId)) {
      return NextResponse.json({ message: 'Invalid round ID' }, { status: 400 });
    }

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        assignments: {
          include: {
            room: true,
            judge: true,
            teamAssignments: {
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ message: 'Round not found' }, { status: 404 });
    }

    const data = {
      roundId: round.id,
      roundName: round.name,
      motion: round.motion || null,
      rooms: round.assignments.map(a => ({
        roomName: a.room?.name || 'TBA',
        judgeName: a.judge?.name || 'TBA',
        teamAssignments: a.teamAssignments.map(ta => ({
          teamName: ta.team.name,
          position: ta.position,
        })),
      })),
    };

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Error fetching round detail:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
