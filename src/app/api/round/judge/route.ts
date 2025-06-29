import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/src/lib/prisma';
import { authOptions } from '@/src/lib/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email: session.user.email },
      })
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const judge = await withRetry(() =>
      prisma.judge.findUnique({
        where: { userId: user.id },
      })
    );

    if (!judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    const assignments = await withRetry(() =>
      prisma.roundAssignment.findMany({
        where: { judgeId: judge.id },
        include: {
          round: true,
          room: true,
          teamAssignments: {
            include: { team: true },
          },
        },
        orderBy: {
          round: { number: 'asc' },
        },
      })
    );

    const rounds = await Promise.all(
      assignments.map(async assignment => {
        let scoreCount = 0;
        try {
          scoreCount = await withRetry(() => 
            prisma.score.count({
              where: {
                roundId: assignment.roundId,
                judgeId: judge.id,
              },
            })
          );
        } catch (err) {
          console.error('Error querying score count:', err);
          scoreCount = 0;
        }

        return {
          id: assignment.id,
          round: {
            name: assignment.round.name,
            number: assignment.round.number,
          },
          room: {
            name: assignment.room.name,
          },
          teamAssignments: assignment.teamAssignments.map(ta => ({
            team: {
              id: ta.team.id,
              name: ta.team.name,
            },
            position: ta.position,
          })),
          isScored: scoreCount > 0,
        };
      })
    );

    return NextResponse.json({ rounds });
  } catch (error) {
    console.error('[GET /api/round/judge]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
