import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
  try {
    const rounds = await prisma.round.findMany({
      include: {
        assignments: {
          include: {
            room: true,
            judge: true,
            teams: true,
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({ rounds });
  } catch (err: any) {
    console.error('[ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
