import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { DebatePosition } from '@prisma/client';

export async function POST() {
  try {
    // Get the semifinal round
    const semifinal = await prisma.round.findFirst({
      where: { number: 5 },
      include: {
        assignments: {
          include: {
            teamAssignments: {
              include: {
                team: true
              }
            }
          }
        }
      }
    });

    if (!semifinal) {
      return NextResponse.json({
        success: false,
        message: 'No semifinal round found'
      }, { status: 400 });
    }

    // Check current assignments
    const currentTeams = semifinal.assignments.flatMap(a => 
      a.teamAssignments.map(ta => ({
        teamId: ta.team.id,
        teamName: ta.team.name
      }))
    );

    console.log('Current semifinal teams:', currentTeams);

    if (currentTeams.length >= 8) {
      return NextResponse.json({
        success: false,
        message: 'Semifinal already has 8 or more teams',
        currentTeams: currentTeams.length
      });
    }

    // Get quarter final results to determine who should qualify
    const quarter = await prisma.round.findFirst({
      where: { number: 4 },
      include: {
        assignments: {
          include: {
            matchResults: { 
              include: { team: true },
              orderBy: { rank: 'asc' }
            }
          }
        }
      }
    });

    if (!quarter) {
      return NextResponse.json({
        success: false,
        message: 'Quarter final not found'
      }, { status: 400 });
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
    const qualifyingTeams = allQuarterResults.slice(0, 8).map(r => ({
      teamId: r.teamId,
      teamName: r.teamName
    }));

    console.log('Qualifying teams from quarter final:', qualifyingTeams);

    if (qualifyingTeams.length < 8) {
      return NextResponse.json({
        success: false,
        message: `Only ${qualifyingTeams.length} teams qualified from quarter final. Need 8 teams.`
      }, { status: 400 });
    }

    // Determine which teams are missing
    const currentTeamIds = new Set(currentTeams.map(t => t.teamId));
    const missingTeams = qualifyingTeams.filter(t => !currentTeamIds.has(t.teamId));

    console.log('Missing teams:', missingTeams);

    if (missingTeams.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'All qualifying teams are already assigned'
      });
    }

    // Get available rooms
    const rooms = await prisma.room.findMany({
      take: 2,
      orderBy: { id: 'asc' }
    });

    if (rooms.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Not enough rooms available'
      }, { status: 400 });
    }

    // Check existing assignments
    const existingAssignments = semifinal.assignments.length;
    
    if (existingAssignments === 0) {
      // No assignments exist, create both rooms
      await Promise.all([0, 1].map(async (roomIdx) => {
        const teamsForRoom = qualifyingTeams.slice(roomIdx * 4, roomIdx * 4 + 4);
        
        const assignment = await prisma.roundAssignment.create({
          data: { roundId: semifinal.id, roomId: rooms[roomIdx].id }
        });

        await Promise.all(
          teamsForRoom.map((team, i) =>
            prisma.teamAssignment.create({
              data: {
                roundAssignmentId: assignment.id,
                teamId: team.teamId,
                position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
              },
            })
          )
        );
      }));
    } else if (existingAssignments === 1) {
      // One assignment exists, create the second one
      const usedRoomIds = semifinal.assignments.map(a => a.roomId);
      const availableRoom = rooms.find(r => !usedRoomIds.includes(r.id));
      
      if (!availableRoom) {
        return NextResponse.json({
          success: false,
          message: 'No available room for second assignment'
        }, { status: 400 });
      }

      // Create second room assignment with remaining 4 teams
      const secondRoomTeams = qualifyingTeams.slice(4, 8);
      
      const assignment = await prisma.roundAssignment.create({
        data: { roundId: semifinal.id, roomId: availableRoom.id }
      });

      await Promise.all(
        secondRoomTeams.map((team, i) =>
          prisma.teamAssignment.create({
            data: {
              roundAssignmentId: assignment.id,
              teamId: team.teamId,
              position: ['OG', 'OO', 'CG', 'CO'][i] as DebatePosition,
            },
          })
        )
      );
    } else {
      // Fix existing assignments if they have wrong teams
      return NextResponse.json({
        success: false,
        message: 'Semifinal has unexpected number of assignments. Manual intervention required.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Semifinal bracket fixed successfully',
      data: {
        roundId: semifinal.id,
        qualifyingTeams: qualifyingTeams,
        missingTeamsAdded: missingTeams.length
      }
    });

  } catch (error) {
    console.error('Error fixing semifinal:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fix semifinal bracket',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
