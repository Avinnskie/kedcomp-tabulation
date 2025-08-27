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

    // Preliminary rounds (1, 2, 3) untuk Best Speaker
    const preliminaryRounds = rounds.filter(r => r.number >= 1 && r.number <= 3);
    const preliminaryRoundIds = preliminaryRounds.map(r => r.id);
    const grandFinalRound = rounds.find(r => r.number === 6);
    
    const individualScores = allScores.filter(s => s.scoreType === 'INDIVIDUAL');
    const preliminaryScores = individualScores.filter(s => preliminaryRoundIds.includes(s.roundId));
    const grandFinalScores = individualScores.filter(s => s.roundId === grandFinalRound?.id);

    // Untuk dashboard, kita ambil ranking dari Grand Final jika ada
    let topTeams = [];
    
    if (grandFinalRound && grandFinalScores.length > 0) {
      // Jika Grand Final sudah ada, gunakan hasil Grand Final
      const grandFinalTeamMap: Record<number, { name: string; institution: string; grandFinalScore: number; totalScore: number }> = {};
      
      // Hitung skor Grand Final untuk tiap tim
      for (const score of grandFinalScores) {
        if (!score.teamId) continue;
        const key = score.teamId;
        if (!grandFinalTeamMap[key]) {
          grandFinalTeamMap[key] = {
            name: score.team.name,
            institution: score.team.institution || score.team.name || 'Unknown',
            grandFinalScore: 0,
            totalScore: 0,
          };
        }
        grandFinalTeamMap[key].grandFinalScore += score.value;
      }
      
      // Hitung total score dari semua rounds untuk tim yang masuk Grand Final
      for (const score of individualScores) {
        if (!score.teamId) continue;
        const key = score.teamId;
        if (grandFinalTeamMap[key]) {
          grandFinalTeamMap[key].totalScore += score.value;
        }
      }
      
      // Ranking berdasarkan Grand Final score
      topTeams = Object.entries(grandFinalTeamMap)
        .map(([id, data]) => ({
          teamId: Number(id),
          ...data,
          preliminaryScore: Math.round(data.grandFinalScore), // Use Grand Final as preliminary for display
          grandFinalScore: Math.round(data.grandFinalScore),
          totalScore: Math.round(data.totalScore),
        }))
        .sort((a, b) => b.grandFinalScore - a.grandFinalScore)
        .slice(0, 3);
    } else {
      // Fallback ke preliminary ranking jika Grand Final belum ada
      const teamMap: Record<number, { name: string; institution: string; preliminaryScore: number; totalScore: number }> = {};
      
      for (const score of preliminaryScores) {
        if (!score.teamId) continue;
        const key = score.teamId;
        if (!teamMap[key]) {
          teamMap[key] = {
            name: score.team.name,
            institution: score.team.institution || score.team.name || 'Unknown',
            preliminaryScore: 0,
            totalScore: 0,
          };
        }
        teamMap[key].preliminaryScore += score.value;
      }
      
      // Hitung total score
      for (const score of individualScores) {
        if (!score.teamId) continue;
        const key = score.teamId;
        if (teamMap[key]) {
          teamMap[key].totalScore += score.value;
        }
      }
      
      topTeams = Object.entries(teamMap)
        .map(([id, data]) => ({
          teamId: Number(id),
          ...data,
          preliminaryScore: Math.round(data.preliminaryScore),
          grandFinalScore: 0,
          totalScore: Math.round(data.totalScore),
        }))
        .sort((a, b) => b.preliminaryScore - a.preliminaryScore)
        .slice(0, 3);
    }

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
