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
        judges: true, // ini array untuk grand final
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
      return NextResponse.json(
        { error: 'Format body tidak valid. Harus berupa array.' },
        { status: 400 }
      );
    }

    for (const entry of body) {
      const { assignmentId, judgeIds, roomId } = entry;

      const assignment = await prisma.roundAssignment.findUnique({
        where: { id: assignmentId },
        include: { round: true },
      });

      if (!assignment) continue;

      // Update ruangan
      await prisma.roundAssignment.update({
        where: { id: assignmentId },
        data: { roomId },
      });

      // Semifinal (1 juri biasa)
      if (assignment.round.number === 4) {
        await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            judgeId: judgeIds?.[0] ?? null,
          },
        });
      }

      // Grand Final (3 juri)
      if (assignment.round.number === 5) {
        // Hapus juri lama
        await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            judges: { set: [] }, // clear existing
          },
        });

        // Tambahkan juri baru
        await prisma.roundAssignment.update({
          where: { id: assignmentId },
          data: {
            judges: {
              connect: (judgeIds || []).map((id: number) => ({ id })),
            },
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Penugasan juri dan ruangan berhasil diperbarui',
    });
  } catch (err) {
    console.error('[POST /api/admin/assign-judges]', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui data' }, { status: 500 });
  }
}
