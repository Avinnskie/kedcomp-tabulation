import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/authOptions';

// GET: Ambil semua scores dengan filter dan search untuk admin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get('roundId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereCondition: any = {};

    if (roundId) {
      whereCondition.roundId = parseInt(roundId);
    }

    if (search) {
      whereCondition.OR = [
        {
          team: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          participant: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          judge: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [scores, totalCount] = await Promise.all([
      prisma.score.findMany({
        where: whereCondition,
        include: {
          team: true,
          participant: true,
          judge: true,
          round: true,
        },
        orderBy: [
          { round: { number: 'desc' } },
          { team: { name: 'asc' } },
          { scoreType: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.score.count({ where: whereCondition }),
    ]);

    // Get all rounds for filter dropdown
    const rounds = await prisma.round.findMany({
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({
      scores: scores.map(score => ({
        id: score.id,
        roundId: score.roundId,
        roundName: score.round.name,
        roundNumber: score.round.number,
        teamId: score.teamId,
        teamName: score.team.name,
        participantId: score.participantId,
        participantName: score.participant?.name || null,
        judgeId: score.judgeId,
        judgeName: score.judge.name,
        scoreType: score.scoreType,
        value: score.value,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      rounds: rounds.map(round => ({
        id: round.id,
        name: round.name,
        number: round.number,
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/scores]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update score by admin
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { scoreId, newValue, reason } = body;

    if (!scoreId || newValue === undefined) {
      return NextResponse.json({ error: 'Score ID and new value are required' }, { status: 400 });
    }

    // Validate new value
    if (typeof newValue !== 'number' || newValue < 0) {
      return NextResponse.json({ error: 'New value must be a non-negative number' }, { status: 400 });
    }

    // Get existing score
    const existingScore = await prisma.score.findUnique({
      where: { id: parseInt(scoreId) },
      include: {
        team: true,
        participant: true,
        judge: true,
        round: true,
      },
    });

    if (!existingScore) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    // Additional validation based on score type
    if (existingScore.scoreType === 'TEAM' && (newValue < 0 || newValue > 100)) {
      return NextResponse.json({ error: 'Team score must be between 0 and 100' }, { status: 400 });
    }

    if (existingScore.scoreType === 'INDIVIDUAL' && (newValue < 0 || newValue > 50)) {
      return NextResponse.json({ error: 'Individual score must be between 0 and 50' }, { status: 400 });
    }

    const oldValue = existingScore.value;

    // Update the score
    const updatedScore = await prisma.score.update({
      where: { id: parseInt(scoreId) },
      data: { value: newValue },
      include: {
        team: true,
        participant: true,
        judge: true,
        round: true,
      },
    });

    // Log the activity
    await prisma.logActivity.create({
      data: {
        message: `Admin ${user.name} updated ${existingScore.scoreType.toLowerCase()} score for ${
          existingScore.scoreType === 'TEAM' ? existingScore.team.name : existingScore.participant?.name
        } in ${existingScore.round.name} from ${oldValue} to ${newValue}${reason ? ` (Reason: ${reason})` : ''}`,
      },
    });

    return NextResponse.json({
      message: 'Score updated successfully',
      score: {
        id: updatedScore.id,
        roundName: updatedScore.round.name,
        teamName: updatedScore.team.name,
        participantName: updatedScore.participant?.name || null,
        judgeName: updatedScore.judge.name,
        scoreType: updatedScore.scoreType,
        oldValue,
        newValue: updatedScore.value,
      },
    });
  } catch (err) {
    console.error('[PUT /api/admin/scores]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete score by admin (for emergency cases)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const scoreId = searchParams.get('scoreId');
    const reason = searchParams.get('reason');

    if (!scoreId) {
      return NextResponse.json({ error: 'Score ID is required' }, { status: 400 });
    }

    // Get score before deletion for logging
    const existingScore = await prisma.score.findUnique({
      where: { id: parseInt(scoreId) },
      include: {
        team: true,
        participant: true,
        judge: true,
        round: true,
      },
    });

    if (!existingScore) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    // Delete the score
    await prisma.score.delete({
      where: { id: parseInt(scoreId) },
    });

    // Log the activity
    await prisma.logActivity.create({
      data: {
        message: `Admin ${user.name} deleted ${existingScore.scoreType.toLowerCase()} score (${
          existingScore.value
        }) for ${
          existingScore.scoreType === 'TEAM' ? existingScore.team.name : existingScore.participant?.name
        } in ${existingScore.round.name}${reason ? ` (Reason: ${reason})` : ''}`,
      },
    });

    return NextResponse.json({
      message: 'Score deleted successfully',
    });
  } catch (err) {
    console.error('[DELETE /api/admin/scores]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
