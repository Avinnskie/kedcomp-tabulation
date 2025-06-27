import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/authOptions';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const roundAssignmentId = Number((await params).id);

  if (isNaN(roundAssignmentId)) {
    return NextResponse.json({ error: 'Invalid round assignment ID' }, { status: 400 });
  }

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

  if (!judge) {
    return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
  }

  const assignment = await prisma.roundAssignment.findUnique({
    where: { id: roundAssignmentId },
    include: {
      round: true,
      room: true,
      judge: true,
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

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const isAuthorized = assignment.judgeId === judge.id;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const scores = await prisma.score.findMany({
    where: {
      judgeId: judge.id,
      roundId: assignment.roundId,
    },
  });

  const isScored = scores.length > 0;

  return NextResponse.json({
    roundAssignment: {
      id: assignment.id,
      round: assignment.round,
      room: assignment.room,
      teamAssignments: assignment.teamAssignments,
    },
    isScored,
  });
}
