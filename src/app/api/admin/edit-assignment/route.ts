import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: Ambil semua round assignments dengan room dan judge
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('roundId');

    let whereCondition = {};
    if (roundId) {
      whereCondition = {
        roundId: parseInt(roundId),
      };
    }

    const assignments = await prisma.roundAssignment.findMany({
      where: whereCondition,
      include: {
        round: true,
        room: true,
        judge: {
          include: {
            user: true
          }
        },
        teamAssignments: {
          include: {
            team: true
          }
        }
      },
      orderBy: [
        {
          round: {
            number: 'asc'
          }
        },
        {
          room: {
            name: 'asc'
          }
        }
      ]
    });

    // Ambil semua rounds, judges, dan rooms untuk dropdown
    const rounds = await prisma.round.findMany({
      orderBy: {
        number: 'asc'
      }
    });

    const judges = await prisma.judge.findMany({
      include: {
        user: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const rooms = await prisma.room.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      assignments: assignments.map(a => ({
        id: a.id,
        roundId: a.roundId,
        roundName: a.round.name,
        roundNumber: a.round.number,
        roomId: a.roomId,
        roomName: a.room.name,
        judgeId: a.judgeId,
        judgeName: a.judge ? a.judge.name : null,
        judgeEmail: a.judge ? a.judge.email : null,
        teams: a.teamAssignments.map(ta => ({
          teamId: ta.teamId,
          teamName: ta.team.name,
          position: ta.position
        }))
      })),
      rounds: rounds.map(r => ({
        id: r.id,
        name: r.name,
        number: r.number
      })),
      judges: judges.map(j => ({
        id: j.id,
        name: j.name,
        email: j.email
      })),
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name
      }))
    });
  } catch (err) {
    console.error('[GET /api/admin/edit-assignment]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Update assignment (room dan judge)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignmentId, roomId, judgeId } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const assignment = await prisma.roundAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Update assignment
    const updatedAssignment = await prisma.roundAssignment.update({
      where: { id: assignmentId },
      data: {
        roomId: roomId ? parseInt(roomId) : assignment.roomId,
        judgeId: judgeId ? parseInt(judgeId) : null,
      },
      include: {
        round: true,
        room: true,
        judge: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Assignment updated successfully',
      assignment: {
        id: updatedAssignment.id,
        roundName: updatedAssignment.round.name,
        roomName: updatedAssignment.room.name,
        judgeName: updatedAssignment.judge ? updatedAssignment.judge.name : null,
      }
    });
  } catch (err) {
    console.error('[POST /api/admin/edit-assignment]', err);
    return NextResponse.json({ error: 'An error occurred while updating assignment' }, { status: 500 });
  }
}

// PUT: Bulk update assignments
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be an array of assignments' }, { status: 400 });
    }

    const results = [];

    for (const entry of body) {
      const { assignmentId, roomId, judgeId } = entry;

      if (!assignmentId) {
        continue;
      }

      try {
        const updatedAssignment = await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            roomId: roomId ? parseInt(roomId) : undefined,
            judgeId: judgeId ? parseInt(judgeId) : null,
          },
          include: {
            round: true,
            room: true,
            judge: true
          }
        });

        results.push({
          assignmentId,
          success: true,
          roundName: updatedAssignment.round.name,
          roomName: updatedAssignment.room.name,
          judgeName: updatedAssignment.judge?.name || 'No judge assigned'
        });
      } catch (err) {
        results.push({
          assignmentId,
          success: false,
          error: 'Failed to update assignment'
        });
      }
    }

    return NextResponse.json({
      message: 'Bulk update completed',
      results
    });
  } catch (err) {
    console.error('[PUT /api/admin/edit-assignment]', err);
    return NextResponse.json({ error: 'An error occurred during bulk update' }, { status: 500 });
  }
}
