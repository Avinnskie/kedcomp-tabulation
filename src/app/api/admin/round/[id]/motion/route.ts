import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const { motion, description } = await req.json();

    if (isNaN(id) || !motion) {
      return NextResponse.json({ message: 'Invalid round ID or motion' }, { status: 400 });
    }

    const updated = await prisma.round.update({
      where: { id },
      data: { motion, description },
    });

    return NextResponse.json({ message: 'Motion updated successfully', round: updated });
  } catch (error) {
    console.error('Error updating motion:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
