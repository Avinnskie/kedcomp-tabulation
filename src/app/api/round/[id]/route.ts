import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/authOptions';
import { prisma, withRetry } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const roundAssignmentId = Number((await params).id);

    if (isNaN(roundAssignmentId)) {
      return NextResponse.json({ error: 'Invalid round assignment ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user;
    try {
      user = await withRetry(() =>
        prisma.user.findUnique({
          where: { email: session.user.email },
        })
      );
    } catch (err) {
      console.error('[ERROR prisma.user.findUnique]', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let judge;
    try {
      judge = await withRetry(() =>
        prisma.judge.findUnique({
          where: { userId: user.id },
        })
      );
    } catch (err) {
      console.error('[ERROR prisma.judge.findUnique]', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    let assignment;
    try {
      assignment = await withRetry(() =>
        prisma.roundAssignment.findUnique({
          where: { id: roundAssignmentId },
          include: {
            round: true,
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
        })
      );
    } catch (err) {
      console.error('[ERROR prisma.roundAssignment.findUnique]', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.judgeId !== judge.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let scores;
    try {
      scores = await withRetry(() =>
        prisma.score.findMany({
          where: {
            judgeId: judge.id,
            roundId: assignment.roundId,
          },
        })
      );
    } catch (err) {
      console.error('[ERROR prisma.score.findMany]', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

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
  } catch (error) {
    console.error('[UNEXPECTED ERROR]', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
