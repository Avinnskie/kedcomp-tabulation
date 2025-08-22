import { prisma, withRetry } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { DebatePosition } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roundIdParam = searchParams.get('roundId');

    if (!roundIdParam) {
      return NextResponse.json(
        { 
          complete: false, 
          message: 'roundId parameter is required'
        }, 
        { status: 400 }
      );
    }

    const roundId = parseInt(roundIdParam, 10);

    if (isNaN(roundId) || roundId <= 0) {
      return NextResponse.json(
        { 
          complete: false, 
          message: 'Invalid roundId - must be a positive integer'
        }, 
        { status: 400 }
      );
    }

    // Check if round exists
    const round = await withRetry(() =>
      prisma.round.findUnique({
        where: { id: roundId },
        select: { 
          id: true, 
          name: true, 
          number: true 
        }
      })
    );

    if (!round) {
      return NextResponse.json(
        { 
          complete: false, 
          message: `Round with ID ${roundId} not found` 
        }, 
        { status: 404 }
      );
    }

    // Get assignments and their completion status
    const assignments = await withRetry(() =>
      prisma.roundAssignment.findMany({
        where: { roundId },
        include: { 
          teamAssignments: true, 
          matchResults: true 
        },
      })
    );

    if (assignments.length === 0) {
      return NextResponse.json({ 
        complete: false, 
        message: 'No assignments found for this round',
        roundId,
        roundInfo: round
      });
    }

    // Calculate completion status
    let totalTeams = 0;
    let totalResults = 0;
    
    for (const assignment of assignments) {
      totalTeams += assignment.teamAssignments.length;
      totalResults += assignment.matchResults.length;
    }

    // For quarter final (round number 4), we can also check if there are individual scores
    // If there are no match results but there are individual scores, we consider it "ready to generate"
    let canGenerate = false;
    const complete = totalTeams > 0 && totalTeams === totalResults;

    if (!complete && round.number === 4) {
      // Check if there are individual scores that can be used to generate results
      const individualScores = await withRetry(() =>
        prisma.score.findMany({
          where: {
            roundId: roundId,
            scoreType: 'INDIVIDUAL'
          },
          take: 1 // Just check if any exist
        })
      );

      canGenerate = individualScores.length > 0;
    }

    return NextResponse.json({ 
      complete: complete,
      canGenerate: canGenerate,
      roundId: roundId,
      roundInfo: round,
      statistics: {
        assignmentsCount: assignments.length,
        totalTeams: totalTeams,
        totalResults: totalResults,
        completionPercentage: totalTeams > 0 ? Math.round((totalResults / totalTeams) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error in bracket status route:', error);
    
    return NextResponse.json(
      { 
        complete: false, 
        message: 'Internal server error occurred while checking bracket status',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roundType = searchParams.get('round');

    if (!roundType) {
      return NextResponse.json(
        { message: 'Round type parameter is required' },
        { status: 400 }
      );
    }

    if (roundType === 'semifinal') {
      return await generateSemifinal();
    } else if (roundType === 'grandfinal') {
      return await generateGrandFinal();
    } else {
      return NextResponse.json(
        { message: 'Invalid round type. Must be "semifinal" or "grandfinal"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in bracket generate route:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error occurred while generating bracket',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

async function generateSemifinal() {
  try {
    // Check if semifinal already exists
    const existingSemifinal = await prisma.round.findFirst({
      where: { number: 5 }
    });

    if (existingSemifinal) {
      return NextResponse.json({
        success: false,
        message: 'Semifinal round already exists'
      }, { status: 400 });
    }

    // Get Quarter Final results (round number = 4)
    const quarter = await prisma.round.findFirst({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            matchResults: { include: { team: true } },
          },
        },
      },
    });

    if (!quarter) {
      return NextResponse.json({
        success: false,
        message: 'Quarter Final not found'
      }, { status: 400 });
    }

    // Check if there are match results, if not, try to generate them from individual scores
    let hasResults = quarter.assignments.some(a => a.matchResults.length > 0);
    
    if (!hasResults) {
      // Try to generate results from individual scores
      await generateMatchResultsFromScores(quarter.id);
      
      // Refetch quarter data after generating results
      const updatedQuarter = await prisma.round.findFirst({
        where: { number: 4 },
        include: {
          assignments: {
            include: {
              matchResults: { include: { team: true } },
            },
          },
        },
      });
      
      if (!updatedQuarter || !updatedQuarter.assignments.some(a => a.matchResults.length > 0)) {
        return NextResponse.json({
          success: false,
          message: 'No quarter final results available. Please complete all matches or ensure individual scores are entered.'
        }, { status: 400 });
      }
      
      quarter.assignments = updatedQuarter.assignments;
    }

    // Get ALL teams from quarter final and rank them globally
    const allQuarterResults: Array<{
      teamId: number;
      teamName: string;
      points: number;
      totalScore: number;
    }> = [];

    for (const assignment of quarter.assignments) {
      for (const result of assignment.matchResults) {
        allQuarterResults.push({
          teamId: result.teamId,
          teamName: result.team.name,
          points: result.points,
          totalScore: result.totalScore || 0
        });
      }
    }

    // Sort by points first, then by total score (highest to lowest)
    allQuarterResults.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points; // Higher points first
      }
      return b.totalScore - a.totalScore; // Higher score first if points are equal
    });

    // Take top 8 teams globally
    const advancingTeams = allQuarterResults.slice(0, 8).map(r => ({
      teamId: r.teamId,
      teamName: r.teamName
    }));

    if (advancingTeams.length < 8) {
      return NextResponse.json({
        success: false,
        message: `Only ${advancingTeams.length} teams qualified. Need at least 8 teams for semifinal.`
      }, { status: 400 });
    }

    // Create semifinal round
    const semifinal = await prisma.round.create({
      data: { name: 'Semifinal', number: 5 },
    });

    // Get available rooms for semifinal
    const rooms = await prisma.room.findMany({
      take: 2,
      orderBy: { id: 'asc' },
    });

    if (rooms.length < 2) {
      await prisma.round.delete({ where: { id: semifinal.id } });
      return NextResponse.json({
        success: false,
        message: 'Not enough rooms for semifinal'
      }, { status: 400 });
    }

    // Assign teams to 2 rooms (4 teams per room)
    await Promise.all(
      [0, 1].map(async (roomIdx) => {
        const assignedTeams = advancingTeams.slice(roomIdx * 4, roomIdx * 4 + 4);

        const assignment = await prisma.roundAssignment.create({
          data: { roundId: semifinal.id, roomId: rooms[roomIdx].id },
        });

        await Promise.all(
          assignedTeams.map((team, i) =>
            prisma.teamAssignment.create({
              data: {
                roundAssignmentId: assignment.id,
                teamId: team.teamId,
                position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
              },
            })
          )
        );
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Semifinal bracket created successfully',
      data: {
        roundId: semifinal.id,
        qualifiedTeams: advancingTeams
      }
    });

  } catch (error) {
    console.error('Error generating semifinal:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate semifinal bracket',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateGrandFinal() {
  try {
    // Check if grand final already exists
    const existingGrandFinal = await prisma.round.findFirst({
      where: { number: 6 }
    });

    if (existingGrandFinal) {
      return NextResponse.json({
        success: false,
        message: 'Grand Final round already exists'
      }, { status: 400 });
    }

    // Get Semifinal results (round number = 5)
    const semifinal = await prisma.round.findFirst({
      where: { number: 5 },
      include: {
        assignments: {
          include: {
            matchResults: { include: { team: true } },
          },
        },
      },
    });

    if (!semifinal) {
      return NextResponse.json({
        success: false,
        message: 'Semifinal not found. Please generate semifinal first.'
      }, { status: 400 });
    }

    // Check if there are match results
    const hasResults = semifinal.assignments.some(a => a.matchResults.length > 0);
    
    if (!hasResults) {
      return NextResponse.json({
        success: false,
        message: 'No semifinal results available. Please complete all semifinal matches.'
      }, { status: 400 });
    }

    // Get ALL teams from semifinal and rank them globally
    const allSemifinalResults: Array<{
      teamId: number;
      teamName: string;
      points: number;
      totalScore: number;
    }> = [];

    for (const assignment of semifinal.assignments) {
      for (const result of assignment.matchResults) {
        allSemifinalResults.push({
          teamId: result.teamId,
          teamName: result.team.name,
          points: result.points,
          totalScore: result.totalScore || 0
        });
      }
    }

    // Sort by points first, then by total score (highest to lowest)
    allSemifinalResults.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points; // Higher points first
      }
      return b.totalScore - a.totalScore; // Higher score first if points are equal
    });

    // Take top 4 teams globally
    const finalistTeams = allSemifinalResults.slice(0, 4).map(r => ({
      teamId: r.teamId,
      teamName: r.teamName
    }));

    if (finalistTeams.length < 4) {
      return NextResponse.json({
        success: false,
        message: `Only ${finalistTeams.length} teams qualified for grand final. Need 4 teams.`
      }, { status: 400 });
    }

    // Create grand final round
    const grandFinal = await prisma.round.create({
      data: { name: 'Grand Final', number: 6 },
    });

    // Get one room for grand final
    const room = await prisma.room.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!room) {
      await prisma.round.delete({ where: { id: grandFinal.id } });
      return NextResponse.json({
        success: false,
        message: 'No room available for grand final'
      }, { status: 400 });
    }

    // Create assignment for grand final (all 4 teams in one room)
    const assignment = await prisma.roundAssignment.create({
      data: { roundId: grandFinal.id, roomId: room.id },
    });

    await Promise.all(
      finalistTeams.map((team, i) =>
        prisma.teamAssignment.create({
          data: {
            roundAssignmentId: assignment.id,
            teamId: team.teamId,
            position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Grand Final bracket created successfully',
      data: {
        roundId: grandFinal.id,
        finalistTeams: finalistTeams
      }
    });

  } catch (error) {
    console.error('Error generating grand final:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate grand final bracket',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateMatchResultsFromScores(roundId: number) {
  try {
    // Get all individual scores for this round
    const scores = await prisma.score.findMany({
      where: {
        roundId: roundId,
        scoreType: 'INDIVIDUAL'
      },
      include: {
        participant: {
          include: {
            team: true
          }
        },
        team: true
      }
    });

    if (scores.length === 0) {
      return;
    }

    // Group scores by team
    const teamScores = new Map<number, { teamId: number; teamName: string; totalScore: number }>();
    
    for (const score of scores) {
      // Try to get team info from participant first, then fallback to direct team relation
      let teamId: number;
      let teamName: string;
      
      if (score.participant && score.participant.team) {
        teamId = score.participant.teamId;
        teamName = score.participant.team.name;
      } else if (score.team) {
        teamId = score.teamId!;
        teamName = score.team.name;
      } else {
        console.warn('Score has no team information:', score);
        continue;
      }
      
      if (!teamScores.has(teamId)) {
        teamScores.set(teamId, {
          teamId,
          teamName,
          totalScore: 0
        });
      }
      
      teamScores.get(teamId)!.totalScore += score.value;
    }

    // Get all assignments for this round
    const assignments = await prisma.roundAssignment.findMany({
      where: { roundId },
      include: {
        teamAssignments: true
      }
    });

    // Generate match results for each assignment
    for (const assignment of assignments) {
      const teamsInRoom = assignment.teamAssignments.map(ta => ta.teamId);
      const roomTeamScores = teamsInRoom
        .map(teamId => teamScores.get(teamId))
        .filter(Boolean)
        .sort((a, b) => b!.totalScore - a!.totalScore);

      // Create match results based on scores
      for (let i = 0; i < roomTeamScores.length; i++) {
        const teamData = roomTeamScores[i]!;
        const rank = i + 1;
        // Calculate points based on rank (1st = 3 points, 2nd = 2 points, 3rd = 1 point, 4th = 0 points)
        const points = rank === 1 ? 3 : rank === 2 ? 2 : rank === 3 ? 1 : 0;
        
        await prisma.matchResult.create({
          data: {
            roundAssignmentId: assignment.id,
            teamId: teamData.teamId,
            rank: rank,
            points: points,
            totalScore: teamData.totalScore
          }
        });
      }
    }

  } catch (error) {
    console.error('Error generating match results from scores:', error);
    throw error;
  }
}
