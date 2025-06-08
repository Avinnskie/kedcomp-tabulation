import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
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

  const judgeId = judge.id;

  // Ambil semua round assignment untuk semifinal & grand final
  const assignments = await prisma.roundAssignment.findMany({
    where: {
      OR: [
        { judgeId }, // semifinal
        { judges: { some: { id: judgeId } } }, // grand final
      ],
    },
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
      round: { number: 'asc' },
    },
  });

  // Cek status nilai (isScored)
  const rounds = await Promise.all(
    assignments.map(async assignment => {
      const scoreCount = await prisma.score.count({
        where: {
          roundId: assignment.roundId,
          judgeId: judgeId,
        },
      });

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
}
