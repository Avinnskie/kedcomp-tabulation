import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamName, participants } = body;

    const team = await prisma.team.create({
      data: {
        name: teamName,
        participants: {
          create: participants.map((p: any) => ({
            name: p.name,
            email: p.email,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
