import { prisma } from './prisma';

export async function getTeamRankings() {
  const results = await prisma.matchResult.findMany({
    include: {
      team: true,
      roundAssignment: {
        include: {
          round: true,
        },
      },
    },
  });

  const teamScores: Record<
    number,
    {
      name: string;
      points: number;
      roundDetails: { round: string; rank: number; points: number }[];
    }
  > = {};

  for (const result of results) {
    const { teamId, rank, points, team, roundAssignment } = result;
    const roundName = roundAssignment.round.name;

    if (!teamScores[teamId]) {
      teamScores[teamId] = {
        name: team.name,
        points: 0,
        roundDetails: [],
      };
    }

    teamScores[teamId].points += points;
    teamScores[teamId].roundDetails.push({ round: roundName, rank, points });
  }

  return Object.entries(teamScores)
    .map(([teamId, data]) => ({
      teamId: parseInt(teamId),
      ...data,
    }))
    .sort((a, b) => b.points - a.points); // descending
}
