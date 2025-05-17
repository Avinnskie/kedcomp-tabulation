import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const participants = await prisma.participant.findMany({
    include: {
      team: true,
    },
  });
  return NextResponse.json(participants);
}
