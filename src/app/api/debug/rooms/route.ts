import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const rooms = await prisma.room.findMany();
  return NextResponse.json({
    totalRooms: rooms.length,
    rooms: rooms.map(r => ({ id: r.id, name: r.name }))
  });
}

