import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    const judge = await prisma.judge.create({
      data: {
        name,
        email,
        password,
      },
    });

    return NextResponse.json({ success: true, judge });
  } catch (error) {
    console.error('Error creating judge:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
