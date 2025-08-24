import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { DebatePosition } from '@prisma/client';

// GET: Ambil semua rooms dan teams untuk dropdown, serta assignment yang sudah ada
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('roundId');

    if (!roundId) {
      return NextResponse.json({ error: 'Round ID is required' }, { status: 400 });
    }

    // Ambil semua rooms
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' }
    });

    // Ambil semua teams
    const teams = await prisma.team.findMany({
      include: {
        participants: true
      },
      orderBy: { name: 'asc' }
    });

    // Ambil round info
    const round = await prisma.round.findUnique({
      where: { id: parseInt(roundId) }
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Ambil assignments yang sudah ada untuk round ini
    const existingAssignments = await prisma.roundAssignment.findMany({
      where: { roundId: parseInt(roundId) },
      include: {
        room: true,
        judge: true,
        teamAssignments: {
          include: {
            team: {
              include: {
                participants: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: {
        room: {
          name: 'asc'
        }
      }
    });

    // Ambil teams yang sudah ter-assign di round ini
    const assignedTeamIds = new Set();
    existingAssignments.forEach(assignment => {
      assignment.teamAssignments.forEach(teamAssignment => {
        assignedTeamIds.add(teamAssignment.teamId);
      });
    });

    // Filter teams yang belum ter-assign
    const availableTeams = teams.filter(team => !assignedTeamIds.has(team.id));

    return NextResponse.json({
      round: {
        id: round.id,
        name: round.name,
        number: round.number
      },
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name
      })),
      availableTeams: availableTeams.map(team => ({
        id: team.id,
        name: team.name,
        institution: team.institution,
        participants: team.participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
      })),
      existingAssignments: existingAssignments.map(assignment => ({
        id: assignment.id,
        roomId: assignment.roomId,
        roomName: assignment.room.name,
        judgeId: assignment.judgeId,
        judgeName: assignment.judge?.name || null,
        teams: assignment.teamAssignments.map(ta => ({
          id: ta.id,
          teamId: ta.teamId,
          teamName: ta.team.name,
          position: ta.position,
          participants: ta.team.participants.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email
          }))
        }))
      }))
    });
  } catch (err) {
    console.error('[GET /api/admin/manual-assignment]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Assign teams to a room manually
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roundId, roomId, teams } = body;

    if (!roundId || !roomId || !teams || !Array.isArray(teams)) {
      return NextResponse.json({ 
        error: 'Round ID, Room ID, and teams array are required' 
      }, { status: 400 });
    }

    if (teams.length !== 4) {
      return NextResponse.json({ 
        error: 'Exactly 4 teams are required for a debate room' 
      }, { status: 400 });
    }

    // Validate that all teams exist
    const teamIds = teams.map(team => team.teamId);
    const existingTeams = await prisma.team.findMany({
      where: { id: { in: teamIds } }
    });

    if (existingTeams.length !== teams.length) {
      return NextResponse.json({ 
        error: 'One or more teams not found' 
      }, { status: 404 });
    }

    // Check if teams are already assigned to this round
    const existingTeamAssignments = await prisma.teamAssignment.findMany({
      where: {
        teamId: { in: teamIds },
        roundAssignment: {
          roundId: roundId
        }
      }
    });

    if (existingTeamAssignments.length > 0) {
      return NextResponse.json({ 
        error: 'One or more teams are already assigned to this round' 
      }, { status: 400 });
    }

    // Check if room is already used in this round
    const existingRoomAssignment = await prisma.roundAssignment.findFirst({
      where: {
        roundId: roundId,
        roomId: roomId
      }
    });

    if (existingRoomAssignment) {
      return NextResponse.json({ 
        error: 'Room is already assigned to this round' 
      }, { status: 400 });
    }

    // Create the assignment
    const result = await prisma.$transaction(async (tx) => {
      // Create round assignment
      const roundAssignment = await tx.roundAssignment.create({
        data: {
          roundId: roundId,
          roomId: roomId,
        }
      });

      // Create team assignments with positions
      const positions: DebatePosition[] = ['OG', 'OO', 'CG', 'CO'];
      const teamAssignments = [];

      for (let i = 0; i < teams.length; i++) {
        const teamAssignment = await tx.teamAssignment.create({
          data: {
            roundAssignmentId: roundAssignment.id,
            teamId: teams[i].teamId,
            position: positions[i]
          },
          include: {
            team: {
              include: {
                participants: true
              }
            }
          }
        });
        teamAssignments.push(teamAssignment);
      }

      return { roundAssignment, teamAssignments };
    });

    return NextResponse.json({
      success: true,
      message: 'Teams assigned successfully',
      assignment: {
        id: result.roundAssignment.id,
        roomId: roomId,
        teams: result.teamAssignments.map(ta => ({
          id: ta.id,
          teamId: ta.teamId,
          teamName: ta.team.name,
          position: ta.position,
          participants: ta.team.participants.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email
          }))
        }))
      }
    });

  } catch (err) {
    console.error('[POST /api/admin/manual-assignment]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove assignment from room
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Check if assignment exists
    const assignment = await prisma.roundAssignment.findUnique({
      where: { id: parseInt(assignmentId) },
      include: {
        teamAssignments: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete assignment and all related team assignments
    await prisma.$transaction(async (tx) => {
      // Delete team assignments first
      await tx.teamAssignment.deleteMany({
        where: { roundAssignmentId: assignment.id }
      });

      // Delete round assignment
      await tx.roundAssignment.delete({
        where: { id: assignment.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully'
    });

  } catch (err) {
    console.error('[DELETE /api/admin/manual-assignment]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
