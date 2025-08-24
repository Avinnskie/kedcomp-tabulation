import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

// Get quarter final details for editing
export async function GET() {
  try {
    const quarter = await prisma.round.findFirst({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: { team: true },
            },
            room: true,
          },
        },
      },
    });

    if (!quarter) {
      return NextResponse.json({ message: 'Quarterfinal not yet generated' }, { status: 404 });
    }

    // Get all available teams (not just those in quarter)
    const allTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    const roomData = quarter.assignments.map(assignment => ({
      assignmentId: assignment.id,
      roomId: assignment.room.id,
      roomName: assignment.room.name,
      teams: assignment.teamAssignments.map(ta => ({
        teamAssignmentId: ta.id,
        teamId: ta.teamId,
        teamName: ta.team.name,
        position: ta.position,
      })),
    }));

    return NextResponse.json({ 
      roundId: quarter.id,
      rooms: roomData,
      availableTeams: allTeams,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching quarterfinal data' }, { status: 500 });
  }
}

// Update team assignments
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ message: 'Invalid assignments data' }, { status: 400 });
    }

    // Validate assignments structure
    for (const assignment of assignments) {
      if (!assignment.assignmentId || !assignment.teams || !Array.isArray(assignment.teams)) {
        return NextResponse.json({ message: 'Invalid assignment structure' }, { status: 400 });
      }
      if (assignment.teams.length !== 4) {
        return NextResponse.json({ message: 'Each room must have exactly 4 teams' }, { status: 400 });
      }
    }

    // Update assignments in transaction
    await prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        // Delete existing team assignments for this room assignment
        await tx.teamAssignment.deleteMany({
          where: { roundAssignmentId: assignment.assignmentId },
        });

        // Create new team assignments
        await Promise.all(
          assignment.teams.map((team: any, idx: number) =>
            tx.teamAssignment.create({
              data: {
                roundAssignmentId: assignment.assignmentId,
                teamId: team.teamId,
                position: ['OG', 'OO', 'CG', 'CO'][idx] as DebatePosition,
              },
            })
          )
        );
      }
    });

    return NextResponse.json({
      message: 'Quarter final assignments updated successfully',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error updating assignments' }, { status: 500 });
  }
}

// Get team rankings for manual selection
export async function POST() {
  try {
    // Calculate rankings from preliminary rounds
    const preliminaryRounds = await prisma.round.findMany({
      where: { number: { lt: 4 } },
      include: {
        assignments: {
          include: {
            teamAssignments: { include: { team: true } },
          },
        },
        Score: {
          where: { scoreType: 'INDIVIDUAL' },
          include: { team: true, participant: true },
        },
      },
    });

    const teamMap: Record<
      number,
      { teamId: number; teamName: string; totalPoints: number; totalScore: number }
    > = {};

    for (const round of preliminaryRounds) {
      const roomScores = round.assignments.map(assignment => {
        const teams = assignment.teamAssignments.map(ta => {
          const scores = round.Score.filter(s => s.participant?.teamId === ta.teamId);
          const total = scores.reduce((sum, s) => sum + s.value, 0);
          return { teamId: ta.teamId, teamName: ta.team.name, score: total };
        });

        const ranked = [...teams].sort((a, b) => b.score - a.score);
        return ranked.map((t, idx) => {
          const points = idx === 0 ? 3 : idx === 1 ? 2 : idx === 2 ? 1 : 0;
          return { ...t, points };
        });
      });

      for (const room of roomScores) {
        for (const t of room) {
          if (!teamMap[t.teamId]) {
            teamMap[t.teamId] = {
              teamId: t.teamId,
              teamName: t.teamName,
              totalPoints: 0,
              totalScore: 0,
            };
          }
          teamMap[t.teamId].totalPoints += t.points;
          teamMap[t.teamId].totalScore += t.score;
        }
      }
    }

    // Get all teams sorted by ranking
    const rankedTeams = Object.values(teamMap)
      .sort((a, b) =>
        b.totalPoints === a.totalPoints
          ? b.totalScore - a.totalScore
          : b.totalPoints - a.totalPoints
      )
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    return NextResponse.json({
      teams: rankedTeams,
      message: 'Team rankings calculated successfully',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error calculating team rankings' }, { status: 500 });
  }
}
