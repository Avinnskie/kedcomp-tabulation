import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const roomId = Number(resolvedParams.id);
    const url = new URL(req.url);
    const roundId = Number(url.searchParams.get('roundId'));

    if (!roundId) {
      return NextResponse.json({ message: 'Missing roundId param' }, { status: 400 });
    }

    const assignment = await prisma.roundAssignment.findFirst({
      where: {
        roomId: roomId,
        roundId: roundId,
      },
      include: {
        round: {
          include: { Score: true },
        },
        judge: true,
        judges: true,
        teamAssignments: {
          include: {
            team: {
              include: {
                participants: true,
              },
            },
          },
        },
      },
    });

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ message: 'Room not found' }, { status: 404 });
    }

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found for this round' }, { status: 404 });
    }

    const response = {
      id: room.id,
      name: room.name,
      round: {
        id: assignment.round.id,
        name: assignment.round.name,
        motion: assignment.round.motion,
        description: assignment.round.description,
      },
      judge: assignment.judge ?? null,
      teamAssignments: assignment.teamAssignments.map(ta => ({
        team: {
          id: ta.team.id,
          name: ta.team.name,
          participants: ta.team.participants.map(p => ({
            id: p.id,
            name: p.name,
          })),
        },
        position: ta.position,
        teamScore: assignment.round.Score.filter(
          s => s.teamId === ta.team.id && s.scoreType === 'TEAM'
        ).reduce((sum, s) => sum + s.value, 0),
        individualScores: assignment.round.Score.filter(
          s => s.teamId === ta.team.id && s.scoreType === 'INDIVIDUAL'
        ).map(s => ({
          participantId: s.participantId,
          value: s.value,
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error fetching room detail:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
