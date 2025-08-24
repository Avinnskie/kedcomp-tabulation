import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: Ambil semua rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          include: {
            round: true
          }
        }
      }
    });

    return NextResponse.json({
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        usageCount: room.assignments.length,
        recentUsage: room.assignments.map(assignment => ({
          roundId: assignment.roundId,
          roundName: assignment.round.name,
          roundNumber: assignment.round.number
        }))
      }))
    });
  } catch (err) {
    console.error('[GET /api/admin/rooms]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Tambah room baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Check if room with this name already exists
    const existingRoom = await prisma.room.findFirst({
      where: { name: name.trim() }
    });

    if (existingRoom) {
      return NextResponse.json({ error: 'Room with this name already exists' }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name
      }
    });

  } catch (err) {
    console.error('[POST /api/admin/rooms]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update room name
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Room ID and name are required' }, { status: 400 });
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if another room with this name already exists
    const duplicateRoom = await prisma.room.findFirst({
      where: { 
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    });

    if (duplicateRoom) {
      return NextResponse.json({ error: 'Room with this name already exists' }, { status: 400 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: parseInt(id) },
      data: { name: name.trim() }
    });

    return NextResponse.json({
      success: true,
      message: 'Room updated successfully',
      room: {
        id: updatedRoom.id,
        name: updatedRoom.name
      }
    });

  } catch (err) {
    console.error('[PUT /api/admin/rooms]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete room (only if not used in any assignments)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignments: true
      }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if room is being used in any assignments
    if (existingRoom.assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete room that is being used in assignments' 
      }, { status: 400 });
    }

    await prisma.room.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (err) {
    console.error('[DELETE /api/admin/rooms]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
