import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(_: Request, { params }: { params: { roundId: string } }) {
  const roundId = parseInt(params.roundId);
  if (isNaN(roundId)) {
    return NextResponse.json({ message: 'Invalid round ID' }, { status: 400 });
  }

  try {
    const assignments = await prisma.roundAssignment.findMany({
      where: { roundId },
      include: {
        room: {
          include: {
            teams: true, // mendapatkan semua tim di ruangan
          },
        },
      },
    });

    const scores = await prisma.score.findMany({
      where: {
        roundId,
        scoreType: 'TEAM',
      },
    });

    // Pemetaan: judgeId -> tim yang harus dinilai
    const judgeToTeamsMap = new Map<number, number[]>();

    for (const assignment of assignments) {
      const teamIds = assignment.room.teams.map(team => team.id);
      if (!judgeToTeamsMap.has(assignment.judgeId)) {
        judgeToTeamsMap.set(assignment.judgeId, [...teamIds]);
      } else {
        const existing = judgeToTeamsMap.get(assignment.judgeId)!;
        judgeToTeamsMap.set(assignment.judgeId, [...existing, ...teamIds]);
      }
    }

    // Validasi: setiap judge sudah menilai semua tim yang jadi tugasnya
    for (const [judgeId, teamIds] of judgeToTeamsMap.entries()) {
      for (const teamId of teamIds) {
        const hasScore = scores.some(score => score.judgeId === judgeId && score.teamId === teamId);
        if (!hasScore) {
          return NextResponse.json(
            { message: `Judge ${judgeId} belum menilai tim ${teamId}` },
            { status: 400 }
          );
        }
      }
    }

    await prisma.round.update({
      where: { id: roundId },
      data: { completed: true },
    });

    return NextResponse.json({ message: 'Round marked as completed' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to complete round' }, { status: 500 });
  }
}
