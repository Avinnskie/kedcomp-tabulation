import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { roundId } = await req.json();

  if (!roundId) {
    return NextResponse.json({ error: 'roundId is required' }, { status: 400 });
  }

  // Get all individual scores for the round
  const individualScores = await prisma.score.findMany({
    where: {
      roundId,
      scoreType: 'INDIVIDUAL',
    },
    include: {
      participant: {
        include: { team: true },
      },
    },
  });

  // Get all team scores for the round
  const teamScores = await prisma.score.findMany({
    where: {
      roundId,
      scoreType: 'TEAM',
    },
    include: {
      team: true,
    },
  });

  // Get match results for the round
  const matchResults = await prisma.matchResult.findMany({
    where: {
      roundAssignment: {
        roundId,
      },
    },
    include: {
      team: true,
    },
  });

  // Group participant scores
  const participantTotals: Record<
    number,
    { name: string; teamId: number; teamName: string; total: number }
  > = {};

  for (const score of individualScores) {
    const p = score.participant;
    if (!p) continue;
    if (!participantTotals[p.id]) {
      participantTotals[p.id] = {
        name: p.name,
        teamId: p.team.id,
        teamName: p.team.name,
        total: 0,
      };
    }
    participantTotals[p.id].total += score.value;
  }

  // Group team scores
  const teamStats: Record<number, { name: string; total: number; average: number; rp: number }> =
    {};

  for (const score of teamScores) {
    const t = score.team;
    if (!teamStats[t.id]) {
      teamStats[t.id] = {
        name: t.name,
        total: 0,
        average: 0,
        rp: 0,
      };
    }
    teamStats[t.id].total += score.value;
  }

  // Add average score (assuming 3 speakers per team, or change dynamically if needed)
  for (const teamId in teamStats) {
    const team = teamStats[teamId];
    team.average = team.total / 3; // or count actual participants if available
  }

  // Add RP from MatchResult
  for (const result of matchResults) {
    if (teamStats[result.team.id]) {
      teamStats[result.team.id].rp = result.points;
    } else {
      teamStats[result.team.id] = {
        name: result.team.name,
        total: 0,
        average: 0,
        rp: result.points,
      };
    }
  }

  return NextResponse.json({
    participants: Object.entries(participantTotals).map(([id, info]) => ({
      id: Number(id),
      name: info.name,
      teamName: info.teamName,
      total: info.total,
    })),
    teams: Object.entries(teamStats).map(([id, stat]) => ({
      id: Number(id),
      name: stat.name,
      total: stat.total,
      average: stat.average,
      rp: stat.rp,
    })),
  });
}
