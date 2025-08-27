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

    // Preliminary rounds (1, 2, 3) untuk menentukan ranking utama
    const preliminaryRounds = rounds.filter(r => r.number >= 1 && r.number <= 3);
    const preliminaryRoundIds = preliminaryRounds.map(r => r.id);
    const grandFinalRound = rounds.find(r => r.number === 6);
    
    const individualScores = allScores.filter(s => s.scoreType === 'INDIVIDUAL');
    const preliminaryScores = individualScores.filter(s => preliminaryRoundIds.includes(s.roundId));
    const grandFinalScores = individualScores.filter(s => s.roundId === grandFinalRound?.id);

    // Hitung skor preliminary dan Grand Final untuk tiap tim (INDIVIDUAL only)
    const teamMap: Record<
      number,
      {
        name: string;
        institution: string;
        preliminaryScore: number;
        grandFinalScore: number;
        totalScore: number;
      }
    > = {};

    // Hitung skor preliminary (untuk ranking utama)
    for (const score of preliminaryScores) {
      if (!score.teamId) continue;
      const key = score.teamId;
      if (!teamMap[key]) {
        teamMap[key] = {
          name: score.team.name,
          institution: score.team.institution || score.team.name || 'Unknown',
          preliminaryScore: 0,
          grandFinalScore: 0,
          totalScore: 0,
        };
      }
      teamMap[key].preliminaryScore += score.value;
      teamMap[key].totalScore += score.value;
    }

    // Tambahkan skor Grand Final jika ada
    for (const score of grandFinalScores) {
      if (!score.teamId) continue;
      const key = score.teamId;
      if (teamMap[key]) {
        teamMap[key].grandFinalScore += score.value;
        teamMap[key].totalScore += score.value;
      }
    }

    // Ranking berdasarkan skor preliminary (bukan Grand Final)
    const topTeams = Object.entries(teamMap)
      .map(([id, data]) => ({
        teamId: Number(id),
        ...data,
        preliminaryScore: Math.round(data.preliminaryScore),
        grandFinalScore: Math.round(data.grandFinalScore),
        totalScore: Math.round(data.totalScore),
      }))
      .sort((a, b) => b.preliminaryScore - a.preliminaryScore) // Sort berdasarkan preliminary score
      .slice(0, 3);

    // Best speaker - menggunakan skor preliminary yang sudah ada
    
    const speakerMap: Record<
      number,
      { name: string; team: string; institution: string; total: number; count: number }
    > = {};

    for (const s of preliminaryScores) {
      if (!s.participantId) continue;
      if (!speakerMap[s.participantId]) {
        speakerMap[s.participantId] = {
          name: s.participant.name,
          team: s.participant.team?.name || '',
          institution: s.participant.team?.institution || s.participant.team?.name || '',
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
