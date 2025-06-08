import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { roundNumber } = await req.json();

  if (typeof roundNumber !== 'number' || roundNumber < 1) {
    return NextResponse.json({ success: false, message: 'Invalid round number' }, { status: 400 });
  }

  const round = await prisma.round.findFirst({
    where: { number: roundNumber },
    include: {
      assignments: {
        include: {
          matchResult: true,
        },
      },
    },
  });

  if (!round) {
    return NextResponse.json({ success: false, message: 'Round not found' }, { status: 404 });
  }

  const allScored = round.assignments.every(a => a.matchResult !== null);

  return NextResponse.json({ success: true, isCompleted: allScored });
}
