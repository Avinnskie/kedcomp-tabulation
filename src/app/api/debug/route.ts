import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const judge = await prisma.judge.findUnique({
    where: { userId: user.id },
  });

  // Get all rounds
  const allRounds = await prisma.round.findMany({
    orderBy: { number: 'asc' },
  });

  // Get all assignments for current judge
  const judgeAssignments = judge ? await prisma.roundAssignment.findMany({
    where: { judgeId: judge.id },
    include: {
      round: true,
      room: true,
      teamAssignments: {
        include: {
          team: true,
        },
      },
    },
    orderBy: {
      round: {
        number: 'asc',
      },
    },
  }) : [];

  const data = {
    currentUser: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    judge: judge,
    allRounds: allRounds,
    judgeAssignments: judgeAssignments,
  };

  console.log('Debug data:', JSON.stringify(data, null, 2));

  return NextResponse.json(data);
}

