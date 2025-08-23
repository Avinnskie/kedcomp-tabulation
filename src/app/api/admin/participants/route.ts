import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET: Ambil semua participant dengan team info
export async function GET() {
  try {
    const participants = await prisma.participant.findMany({
      include: {
        team: true,
      },
      orderBy: [
        {
          team: {
            name: 'asc'
          }
        },
        {
          name: 'asc'
        }
      ]
    });

    // Ambil semua teams untuk dropdown
    const teams = await prisma.team.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        teamId: p.teamId,
        teamName: p.team.name
      })),
      teams: teams.map(t => ({
        id: t.id,
        name: t.name
      }))
    });
  } catch (err) {
    console.error('[GET /api/admin/participants]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create new participant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, teamId } = body;

    if (!name || !email || !teamId) {
      return NextResponse.json({ error: 'Name, email, and team ID are required' }, { status: 400 });
    }

    // Check if email is already taken
    const existingParticipant = await prisma.participant.findUnique({
      where: { email }
    });

    if (existingParticipant) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        teamId: parseInt(teamId)
      },
      include: {
        team: true
      }
    });

    return NextResponse.json({
      message: 'Participant created successfully',
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        teamId: participant.teamId,
        teamName: participant.team.name
      }
    });
  } catch (err) {
    console.error('[POST /api/admin/participants]', err);
    return NextResponse.json({ error: 'An error occurred while creating participant' }, { status: 500 });
  }
}

// PUT: Update participant
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantId, name, email, teamId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Check if participant exists
    const existingParticipant = await prisma.participant.findUnique({
      where: { id: parseInt(participantId) }
    });

    if (!existingParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Check if email is taken by another participant
    if (email && email !== existingParticipant.email) {
      const emailTaken = await prisma.participant.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Check if team exists if teamId is provided
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: parseInt(teamId) }
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }
    }

    // Update participant
    const updatedParticipant = await prisma.participant.update({
      where: { id: parseInt(participantId) },
      data: {
        name: name || existingParticipant.name,
        email: email || existingParticipant.email,
        teamId: teamId ? parseInt(teamId) : existingParticipant.teamId
      },
      include: {
        team: true
      }
    });

    return NextResponse.json({
      message: 'Participant updated successfully',
      participant: {
        id: updatedParticipant.id,
        name: updatedParticipant.name,
        email: updatedParticipant.email,
        teamId: updatedParticipant.teamId,
        teamName: updatedParticipant.team.name
      }
    });
  } catch (err) {
    console.error('[PUT /api/admin/participants]', err);
    return NextResponse.json({ error: 'An error occurred while updating participant' }, { status: 500 });
  }
}

// DELETE: Delete participant
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id: parseInt(participantId) },
      include: { team: true }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Check if participant has scores (should not delete if has scores)
    const hasScores = await prisma.score.findFirst({
      where: { participantId: parseInt(participantId) }
    });

    if (hasScores) {
      return NextResponse.json({ 
        error: 'Cannot delete participant with existing scores. Please remove scores first.' 
      }, { status: 400 });
    }

    // Delete participant
    await prisma.participant.delete({
      where: { id: parseInt(participantId) }
    });

    return NextResponse.json({
      message: 'Participant deleted successfully',
      deletedParticipant: {
        name: participant.name,
        email: participant.email,
        teamName: participant.team.name
      }
    });
  } catch (err) {
    console.error('[DELETE /api/admin/participants]', err);
    return NextResponse.json({ error: 'An error occurred while deleting participant' }, { status: 500 });
  }
}
