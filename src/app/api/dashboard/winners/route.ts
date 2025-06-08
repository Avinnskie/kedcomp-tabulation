import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    // Ambil semua round dan scores
    const rounds = await prisma.round.findMany({ orderBy: { number: 'asc' } });
    const allScores = await prisma.score.findMany({
      include: {
        participant: { include: { team: true } },
        team: true,
        round: true,
      },
    });

    const grandFinalRound = rounds.find(r => r.number === 5);
    const individualScores = allScores.filter(s => s.scoreType === 'INDIVIDUAL');
    const grandFinalScores = individualScores.filter(s => s.roundId === grandFinalRound?.id);

    // Hitung skor Grand Final untuk tiap tim (INDIVIDUAL only)
    const teamMap: Record<
      number,
      {
        name: string;
        institution: string;
        grandFinalScore: number;
        totalScore: number;
      }
    > = {};

    for (const score of individualScores) {
      if (!score.teamId) continue;
      const key = score.teamId;
      if (!teamMap[key]) {
        teamMap[key] = {
          name: score.team.name,
          institution: score.team.name || 'Unknown',
          grandFinalScore: 0,
          totalScore: 0,
        };
      }

      teamMap[key].totalScore += score.value;

      if (score.roundId === grandFinalRound?.id) {
        teamMap[key].grandFinalScore += score.value;
      }
    }

    const topTeams = Object.entries(teamMap)
      .map(([id, data]) => ({
        teamId: Number(id),
        ...data,
        grandFinalScore: Math.round(data.grandFinalScore),
        totalScore: Math.round(data.totalScore),
      }))
      .sort((a, b) => b.grandFinalScore - a.grandFinalScore)
      .slice(0, 3);

    // Best speaker
    const speakerMap: Record<
      number,
      { name: string; team: string; institution: string; total: number; count: number }
    > = {};

    for (const s of individualScores) {
      if (!s.participantId) continue;
      if (!speakerMap[s.participantId]) {
        speakerMap[s.participantId] = {
          name: s.participant.name,
          team: s.participant.team?.name || '',
          institution: s.participant.team?.name || '',
          total: 0,
          count: 0,
        };
      }
      speakerMap[s.participantId].total += s.value;
      speakerMap[s.participantId].count += 1;
    }

    const bestSpeaker = Object.entries(speakerMap)
      .map(([id, d]) => ({
        id: 'Best Speaker',
        name: d.name,
        institution: d.institution,
        average: parseFloat((d.total / d.count).toFixed(2)),
      }))
      .sort((a, b) => b.average - a.average)[0];

    return NextResponse.json({
      topTeams,
      bestSpeaker,
    });
  } catch (err) {
    console.error('[GET /api/dashboard/winners]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
