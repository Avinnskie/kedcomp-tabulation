import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
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
    include: {
      assignments: {
        include: {
          round: true,
          room: true,
          teamAssignments: {
            include: {
              team: true,
            },
          },
        },
        orderBy: { round: { number: 'asc' } },
      },
    },
  });

  if (!judge) {
    return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
  }

  return NextResponse.json({ rounds: judge.assignments });
}
