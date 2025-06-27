import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: Ambil semua penugasan juri untuk round >= 4 (Semifinal & Final)
export async function GET() {
  try {
    const assignments = await prisma.roundAssignment.findMany({
      where: {
        round: {
          number: {
            gte: 4,
          },
        },
      },
      include: {
        round: true,
        room: true,
        judge: true,
        judges: true,
      },
    });

    const judges = await prisma.judge.findMany({
      include: { user: true },
    });

    const rooms = await prisma.room.findMany();

    const assignmentData = assignments.map(a => ({
      id: a.id,
      roundName: a.round.name,
      roundNumber: a.round.number,
      roomId: a.roomId,
      judgeIds: a.round.number === 5 ? a.judges.map(j => j.id) : a.judge ? [a.judge.id] : [],
    }));

    return NextResponse.json({
      assignments: assignmentData,
      judges: judges.map(j => ({ id: j.id, name: j.name, email: j.email })),
      rooms,
    });
  } catch (err) {
    console.error('[GET /api/admin/assign-judges]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Update penugasan juri dan ruangan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be an array.' }, { status: 400 });
    }

    for (const entry of body) {
      const { assignmentId, judgeIds, roomId } = entry;

      const assignment = await prisma.roundAssignment.findUnique({
        where: { id: assignmentId },
        include: { round: true },
      });

      if (!assignment) continue;

      // Update room
      await prisma.roundAssignment.update({
        where: { id: assignmentId },
        data: { roomId },
      });

      if (assignment.round.number === 4) {
        // Semifinal: 1 judge
        await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            judgeId: judgeIds?.[0] ?? null,
          },
        });
      }

      if (assignment.round.number === 5) {
        // Grand Final: 1 judge
        await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            judges: { set: [] }, // clear
          },
        });

        if (judgeIds?.[0]) {
          await prisma.roundAssignment.update({
            where: { id: assignmentId },
            data: {
              judges: {
                connect: [{ id: judgeIds[0] }],
              },
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Judges & rooms updated successfully',
    });
  } catch (err) {
    console.error('[POST /api/admin/assign-judges]', err);
    return NextResponse.json({ error: 'An error occurred while updating data' }, { status: 500 });
  }
}
