import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rounds = await prisma.round.findMany({
      orderBy: { number: 'asc' },
      include: {
        assignments: {
          include: {
            room: true,
            judge: true,
            matchResults: {
              include: {
                team: true,
              },
            },
            teamAssignments: {
              include: {
                team: true,
              },
            },
          },
        },
        Score: {
          include: {
            team: true,
            judge: true,
            participant: true,
          },
        },
      },
    });

    const data = rounds.map(round => {
      const teamScores: {
        [teamId: number]: {
          teamName: string;
          total: number;
          average: number;
          rp: number;
          count: number;
        };
      } = {};

      round.matches.forEach(match => {
        match.roundAssignments.forEach(assignment => {
          const teamId = assignment.team.id;
          const rp = assignment.rankingPoint ?? 0;
          const totalScore = assignment.scores.reduce((sum, score) => sum + (score.total ?? 0), 0);
          const count = assignment.scores.length;

          if (!teamScores[teamId]) {
            teamScores[teamId] = {
              teamName: assignment.team.name,
              total: 0,
              rp: 0,
              average: 0,
              count: 0,
            };
          }

          teamScores[teamId].total += totalScore;
          teamScores[teamId].rp += rp;
          teamScores[teamId].count += count;
        });
      });

      Object.values(teamScores).forEach(team => {
        team.average = team.count > 0 ? team.total / team.count : 0;
      });

      return {
        roundId: round.id,
        roundName: round.name,
        scores: Object.entries(teamScores).map(([id, score]) => ({
          id: Number(id),
          ...score,
        })),
      };
    });

    return NextResponse.json({ rounds: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to calculate scores' }, { status: 500 });
  }
}
