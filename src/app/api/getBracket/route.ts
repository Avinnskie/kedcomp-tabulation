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
            teamAssignments: {
              include: {
                team: true,
              },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    // Pastikan selalu mengembalikan array kosong jika null/undefined
    return NextResponse.json({ rounds: rounds ?? [] });
  } catch (err: any) {
    console.error('[ERROR]', err);
    return NextResponse.json({ rounds: [], error: err.message }, { status: 500 });
  }
}
