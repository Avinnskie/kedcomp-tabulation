import { prisma, withRetry } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roundId = parseInt(url.searchParams.get('roundId') || '4');

    console.log('=== DETAILED DATA INSPECTION ===');
    console.log('Inspecting roundId:', roundId);

    // 1. Get round info
    const round = await withRetry(() =>
      prisma.round.findUnique({
        where: { id: roundId },
        include: {
          assignments: {
            include: {
              teamAssignments: {
                include: {
                  team: true
                }
              },
              matchResults: {
                include: {
                  team: true
                }
              },
              room: true,
              judge: true
            }
          }
        }
      })
    );

    if (!round) {
      return NextResponse.json({
        error: 'Round not found',
        roundId: roundId
      }, { status: 404 });
    }

    // 2. Get all scores for this round
    const scores = await withRetry(() =>
      prisma.score.findMany({
        where: { roundId: roundId },
        include: {
          team: true,
          participant: {
            include: { team: true }
          },
          judge: true
        }
      })
    );

    // 3. Get all match results for this round
    const allMatchResults = await withRetry(() =>
      prisma.matchResult.findMany({
        where: {
          roundAssignment: {
            roundId: roundId
          }
        },
        include: {
          team: true,
          roundAssignment: {
            include: {
              room: true
            }
          }
        }
      })
    );

    console.log('=== ROUND DETAILS ===');
    console.log('Round:', round.name, '(ID:', round.id, ', Number:', round.number, ')');
    console.log('Total assignments:', round.assignments.length);
    console.log('Total scores:', scores.length);
    console.log('Total match results:', allMatchResults.length);

    // Analyze each assignment
    const assignmentAnalysis = round.assignments.map((assignment, index) => {
      const teams = assignment.teamAssignments.map(ta => ({
        id: ta.team.id,
        name: ta.team.name,
        position: ta.position
      }));

      const results = assignment.matchResults.map(mr => ({
        teamId: mr.team.id,
        teamName: mr.team.name,
        rank: mr.rank,
        points: mr.points
      }));

      const assignmentScores = scores.filter(s => 
        teams.some(t => t.id === s.teamId) || 
        teams.some(t => t.id === s.participant?.teamId)
      );

      console.log(`--- Assignment ${index + 1} (ID: ${assignment.id}) ---`);
      console.log('Room:', assignment.room?.name || 'No room');
      console.log('Judge:', assignment.judge?.name || 'No judge');
      console.log('Teams:', teams.length);
      console.log('Results:', results.length);
      console.log('Scores:', assignmentScores.length);

      return {
        assignmentId: assignment.id,
        room: assignment.room?.name || null,
        judge: assignment.judge?.name || null,
        teams: teams,
        results: results,
        scores: assignmentScores.length,
        isComplete: results.length === teams.length && teams.length > 0,
        completionStatus: `${results.length}/${teams.length} teams have results`
      };
    });

    // Check what's needed to complete the round
    const totalTeams = round.assignments.reduce((sum, a) => sum + a.teamAssignments.length, 0);
    const totalResults = allMatchResults.length;
    const missingResults = totalTeams - totalResults;

    console.log('=== COMPLETION ANALYSIS ===');
    console.log('Total teams in round:', totalTeams);
    console.log('Total results recorded:', totalResults);
    console.log('Missing results:', missingResults);
    console.log('Round complete:', totalResults === totalTeams && totalTeams > 0);

    // Suggest what needs to be done
    const suggestions = [];
    
    if (totalResults === 0) {
      suggestions.push('No match results have been recorded yet. You need to add rankings for each match.');
    } else if (missingResults > 0) {
      suggestions.push(`${missingResults} teams still need results. Check which matches are incomplete.`);
    }

    if (scores.length === 0) {
      suggestions.push('No individual scores have been recorded. Consider adding speaker scores.');
    }

    const incompleteAssignments = assignmentAnalysis.filter(a => !a.isComplete);
    if (incompleteAssignments.length > 0) {
      suggestions.push(`${incompleteAssignments.length} assignments are incomplete and need results.`);
    }

    return NextResponse.json({
      success: true,
      round: {
        id: round.id,
        name: round.name,
        number: round.number
      },
      statistics: {
        totalAssignments: round.assignments.length,
        totalTeams: totalTeams,
        totalResults: totalResults,
        totalScores: scores.length,
        missingResults: missingResults,
        isComplete: totalResults === totalTeams && totalTeams > 0,
        completionPercentage: totalTeams > 0 ? Math.round((totalResults / totalTeams) * 100) : 0
      },
      assignments: assignmentAnalysis,
      suggestions: suggestions,
      nextSteps: totalResults === totalTeams ? 
        ['Quarter final is complete! You can now generate semifinal bracket.'] :
        ['Add match results for incomplete assignments', 'Ensure all teams have rankings (1st, 2nd, 3rd, 4th)']
    });

  } catch (error) {
    console.error('Error inspecting data:', error);
    return NextResponse.json({
      error: 'Failed to inspect data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}