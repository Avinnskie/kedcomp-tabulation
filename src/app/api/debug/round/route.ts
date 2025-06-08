import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user and judge info
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      Judge: true
    }
  });

  if (!user?.Judge) {
    return NextResponse.json({ error: 'Not a judge' }, { status: 403 });
  }

  // Get all round assignments for this judge
  const assignments = await prisma.roundAssignment.findMany({
    where: {
      judgeId: user.Judge.id
    },
    include: {
      round: true,
      room: true,
      teamAssignments: {
        include: {
          team: true
        }
      }
    }
  });

  // Get all rounds
  const rounds = await prisma.round.findMany({
    orderBy: {
      number: 'asc'
    }
  });

  const data = {
    judge: {
      id: user.Judge.id,
      name: user.Judge.name
    },
    assignments: assignments.map(a => ({
      id: a.id,
      roundId: a.roundId,
      round: a.round,
      room: a.room,
      teams: a.teamAssignments.map(ta => ta.team)
    })),
    allRounds: rounds
  };

  console.log('Debug round data:', JSON.stringify(data, null, 2));
  return NextResponse.json(data);
}

