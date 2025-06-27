// src/app/api/bracket/[id]/route.ts

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
        Score: true, // include scores if you want to show team/individual scores
        assignments: {
          include: {
            room: true,
            judge: true,
            teamAssignments: {
              include: {
                team: {
                  include: { participants: true },
                },
              },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ message: 'Round not found' }, { status: 404 });
    }

    const response = {
      id: round.id,
      name: round.name,
      motion: round.motion,
      description: round.description,
      assignments: round.assignments.map(a => ({
        room: {
          id: a.room?.id,
          name: a.room?.name,
        },
        judge: a.judge ? { id: a.judge.id, name: a.judge.name } : null,
        teams: a.teamAssignments.map(ta => ({
          position: ta.position,
          team: {
            id: ta.team.id,
            name: ta.team.name,
            participants: ta.team.participants.map(p => ({
              id: p.id,
              name: p.name,
            })),
          },
        })),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error fetching bracket detail:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
