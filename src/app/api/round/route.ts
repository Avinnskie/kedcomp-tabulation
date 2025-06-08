import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rounds = await prisma.round.findMany({
      orderBy: { number: 'asc' },
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
            matchResults: {
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(rounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 });
  }
}
