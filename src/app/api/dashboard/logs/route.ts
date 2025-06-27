import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.logActivity.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // batasi jika perlu
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ message: 'Failed to fetch logs' }, { status: 500 });
  }
}
