import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    const room = await prisma.room.create({
      data: { name },
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
