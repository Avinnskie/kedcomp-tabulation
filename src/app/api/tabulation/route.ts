import { prisma, withRetry } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const rounds = await withRetry(() =>
    prisma.round.findMany({
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: { team: true },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    })
  );

  const allScores = await withRetry(() =>
    prisma.score.findMany({
      include: {
        team: true,
        round: true,
        participant: { include: { team: true } },
      },
    })
  );

  const individualScores = allScores.filter(s => s.scoreType === 'INDIVIDUAL');

  // === MAPS ===
  const prelimTeamMap: Record<number, any> = {};
  const quarterTeamMap: Record<number, any> = {};
  const semifinalTeamMap: Record<number, any> = {};
  const grandFinalTeamMap: Record<number, any> = {};

  for (const round of rounds) {
    const isPrelim = round.number < 4;
    const isQuarter = round.number === 4;
    const isSemifinal = round.number === 5;
    const isGrandFinal = round.number === 6;

    for (const assignment of round.assignments) {
      const teamScores = assignment.teamAssignments
        .map(ta => {
          const scores = individualScores.filter(
            s => s.roundId === round.id && s.participant?.teamId === ta.teamId
          );
          if (scores.length === 0) return null;
          const total = scores.reduce((sum, s) => sum + s.value, 0);
          return {
            teamId: ta.teamId,
            teamName: ta.team.name,
            value: total,
          };
        })
        .filter(Boolean) as { teamId: number; teamName: string; value: number }[];

      const ranked = [...teamScores].sort((a, b) => b.value - a.value);

      ranked.forEach((team, i) => {
        const rank = i + 1;
        const points = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;

        const map = isPrelim
          ? prelimTeamMap
          : isQuarter
            ? quarterTeamMap
            : isSemifinal
              ? semifinalTeamMap
              : isGrandFinal
                ? grandFinalTeamMap
                : undefined;

        if (!map) return;

        if (!map[team.teamId]) {
          map[team.teamId] = {
            teamName: team.teamName,
            totalTeamScore: 0,
            totalPoints: 0,
            rounds: [],
          };
        }

        map[team.teamId].totalTeamScore += team.value;
        map[team.teamId].totalPoints += points;
        map[team.teamId].rounds.push({
          roundId: round.id,
          teamScore: team.value,
          rank,
          points,
        });
      });
    }
  }

  // === Helper Sort ===
  const toSortedArray = (map: Record<number, any>) =>
    Object.entries(map)
      .map(([teamId, data]) => ({ teamId: Number(teamId), ...data }))
      .sort((a, b) =>
        b.totalPoints === a.totalPoints
          ? b.totalTeamScore - a.totalTeamScore
          : b.totalPoints - a.totalPoints
      );

  const teamTabulationPrelim = toSortedArray(prelimTeamMap);
  const teamTabulationQuarter = toSortedArray(quarterTeamMap);
  const teamTabulationSemifinal = toSortedArray(semifinalTeamMap);
  const teamTabulationGrandFinal = toSortedArray(grandFinalTeamMap);

  // === INDIVIDUAL TABULATION ===
  const individualMap: Record<number, any> = {};

  for (const score of individualScores) {
    const pid = score.participantId;
    if (!pid) continue;
    if (!individualMap[pid]) {
      individualMap[pid] = {
        speakerName: score.participant.name,
        teamName: score.participant.team?.name ?? 'Unknown',
        totalScore: 0,
        scores: [],
      };
    }

    individualMap[pid].totalScore += score.value;
    individualMap[pid].scores.push({
      roundId: score.roundId,
      roundName: score.round.name,
      value: score.value,
    });
  }

  const individualTabulation = Object.entries(individualMap).map(([pid, data]) => ({
    speakerId: Number(pid),
    ...data,
    averageScore:
      data.scores.length > 0 ? parseFloat((data.totalScore / data.scores.length).toFixed(2)) : 0,
  }));

  return NextResponse.json({
    teamTabulationPrelim,
    teamTabulationQuarter,
    teamTabulationSemifinal,
    teamTabulationGrandFinal,
    individualTabulation,
  });
}
