import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: Ambil team assignments berdasarkan round dengan detail participant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('roundId');

    let whereCondition = {};
    if (roundId) {
      whereCondition = {
        roundAssignment: {
          roundId: parseInt(roundId)
        }
      };
    }

    const teamAssignments = await prisma.teamAssignment.findMany({
      where: whereCondition,
      include: {
        team: {
          include: {
            participants: true
          }
        },
        roundAssignment: {
          include: {
            round: true,
            room: true,
            judge: true
          }
        }
      },
      orderBy: [
        {
          roundAssignment: {
            round: {
              number: 'asc'
            }
          }
        },
        {
          roundAssignment: {
            room: {
              name: 'asc'
            }
          }
        },
        {
          position: 'asc'
        }
      ]
    });

    // Ambil semua rounds, teams dan participants untuk dropdown
    const rounds = await prisma.round.findMany({
      orderBy: { number: 'asc' }
    });

    const teams = await prisma.team.findMany({
      include: {
        participants: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      teamAssignments: teamAssignments.map(ta => ({
        id: ta.id,
        teamId: ta.teamId,
        teamName: ta.team.name,
        position: ta.position,
        roundAssignmentId: ta.roundAssignmentId,
        roundId: ta.roundAssignment.roundId,
        roundName: ta.roundAssignment.round.name,
        roundNumber: ta.roundAssignment.round.number,
        roomId: ta.roundAssignment.roomId,
        roomName: ta.roundAssignment.room.name,
        judgeId: ta.roundAssignment.judgeId,
        judgeName: ta.roundAssignment.judge?.name || null,
        participants: ta.team.participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
      })),
      rounds: rounds.map(r => ({
        id: r.id,
        name: r.name,
        number: r.number
      })),
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        participants: t.participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
      }))
    });
  } catch (err) {
    console.error('[GET /api/admin/team-assignment]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update team assignment (switch team untuk position tertentu)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamAssignmentId, newTeamId } = body;

    if (!teamAssignmentId || !newTeamId) {
      return NextResponse.json({ error: 'Team assignment ID and new team ID are required' }, { status: 400 });
    }

    // Check if team assignment exists
    const existingAssignment = await prisma.teamAssignment.findUnique({
      where: { id: parseInt(teamAssignmentId) },
      include: {
        team: true,
        roundAssignment: {
          include: {
            round: true,
            room: true
          }
        }
      }
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Team assignment not found' }, { status: 404 });
    }

    // Check if new team exists
    const newTeam = await prisma.team.findUnique({
      where: { id: parseInt(newTeamId) },
      include: { participants: true }
    });

    if (!newTeam) {
      return NextResponse.json({ error: 'New team not found' }, { status: 404 });
    }

    // Check if new team is already assigned to this round
    const existingTeamInRound = await prisma.teamAssignment.findFirst({
      where: {
        teamId: parseInt(newTeamId),
        roundAssignment: {
          roundId: existingAssignment.roundAssignment.roundId
        }
      }
    });

    if (existingTeamInRound && existingTeamInRound.id !== parseInt(teamAssignmentId)) {
      return NextResponse.json({ 
        error: 'Team is already assigned to this round. Please choose a different team or swap with existing assignment.' 
      }, { status: 400 });
    }

    // Update team assignment
    const updatedAssignment = await prisma.teamAssignment.update({
      where: { id: parseInt(teamAssignmentId) },
      data: {
        teamId: parseInt(newTeamId)
      },
      include: {
        team: {
          include: {
            participants: true
          }
        },
        roundAssignment: {
          include: {
            round: true,
            room: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Team assignment updated successfully',
      assignment: {
        id: updatedAssignment.id,
        teamName: updatedAssignment.team.name,
        position: updatedAssignment.position,
        roundName: updatedAssignment.roundAssignment.round.name,
        roomName: updatedAssignment.roundAssignment.room.name,
        participants: updatedAssignment.team.participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
      }
    });
  } catch (err) {
    console.error('[PUT /api/admin/team-assignment]', err);
    return NextResponse.json({ error: 'An error occurred while updating team assignment' }, { status: 500 });
  }
}

// POST: Swap teams between two positions (untuk swap antar room atau position)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignment1Id, assignment2Id } = body;

    if (!assignment1Id || !assignment2Id) {
      return NextResponse.json({ error: 'Both assignment IDs are required for swapping' }, { status: 400 });
    }

    // Get both assignments
    const [assignment1, assignment2] = await Promise.all([
      prisma.teamAssignment.findUnique({
        where: { id: parseInt(assignment1Id) },
        include: {
          team: true,
          roundAssignment: {
            include: { round: true, room: true }
          }
        }
      }),
      prisma.teamAssignment.findUnique({
        where: { id: parseInt(assignment2Id) },
        include: {
          team: true,
          roundAssignment: {
            include: { round: true, room: true }
          }
        }
      })
    ]);

    if (!assignment1 || !assignment2) {
      return NextResponse.json({ error: 'One or both assignments not found' }, { status: 404 });
    }

    // Perform swap in transaction using a different approach
    const result = await prisma.$transaction(async (tx) => {
      // Create temporary team assignments with swapped teamIds
      const tempAssignment1 = await tx.teamAssignment.create({
        data: {
          teamId: assignment2.teamId,
          roundAssignmentId: assignment1.roundAssignmentId,
          position: assignment1.position
        }
      });

      const tempAssignment2 = await tx.teamAssignment.create({
        data: {
          teamId: assignment1.teamId,
          roundAssignmentId: assignment2.roundAssignmentId,
          position: assignment2.position
        }
      });

      // Delete original assignments
      await tx.teamAssignment.delete({
        where: { id: assignment1.id }
      });

      await tx.teamAssignment.delete({
        where: { id: assignment2.id }
      });

      // Return the new assignments with full details
      return Promise.all([
        tx.teamAssignment.findUnique({
          where: { id: tempAssignment1.id },
          include: {
            team: { include: { participants: true } },
            roundAssignment: {
              include: { round: true, room: true }
            }
          }
        }),
        tx.teamAssignment.findUnique({
          where: { id: tempAssignment2.id },
          include: {
            team: { include: { participants: true } },
            roundAssignment: {
              include: { round: true, room: true }
            }
          }
        })
      ]);
    });

    return NextResponse.json({
      message: 'Teams swapped successfully',
      swappedAssignments: result.map(assignment => ({
        id: assignment!.id,
        teamName: assignment!.team.name,
        position: assignment!.position,
        roundName: assignment!.roundAssignment.round.name,
        roomName: assignment!.roundAssignment.room.name,
        participants: assignment!.team.participants.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email
        }))
      }))
    });
  } catch (err) {
    console.error('[POST /api/admin/team-assignment]', err);
    return NextResponse.json({ error: 'An error occurred while swapping teams' }, { status: 500 });
  }
}
