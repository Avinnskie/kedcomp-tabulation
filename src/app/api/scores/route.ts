import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/src/lib/prisma';
import { ScoreType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { roundAssignmentId, teamScores, individualScores } = body;

    if (!roundAssignmentId || !Array.isArray(teamScores) || !Array.isArray(individualScores)) {
      return NextResponse.json({ message: 'Missing or invalid data' }, { status: 400 });
    }

    const judge = await prisma.judge.findUnique({
      where: { userId: user.id },
    });

    if (!judge) {
      return NextResponse.json({ message: 'You are not a judge' }, { status: 403 });
    }

    const assignment = await prisma.roundAssignment.findUnique({
      where: { id: Number(roundAssignmentId) },
      include: {
        judges: true,
        judge: true,
        round: true,
        room: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    const isAuthorized =
      assignment.judgeId === judge.id || assignment.judges?.some(j => j.id === judge.id);

    if (!isAuthorized) {
      return NextResponse.json({ message: 'You are not assigned to this round' }, { status: 403 });
    }

    const isGrandFinal = assignment.round.number === 5;

    // Grand Final special rule:
    if (isGrandFinal) {
      const existingGFScore = await prisma.score.findFirst({
        where: { roundId: assignment.roundId },
      });

      if (existingGFScore) {
        return NextResponse.json(
          { message: 'Grand Final scores already submitted by another judge.' },
          { status: 409 }
        );
      }
    } else {
      // Normal round rule (per judge)
      const existing = await prisma.score.findFirst({
        where: {
          judgeId: judge.id,
          roundId: assignment.roundId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { message: 'Scores already submitted for this round by this judge' },
          { status: 409 }
        );
      }
    }

    const scoreEntries = [
      ...teamScores.map((teamScore: { teamId: number; value: number }) => ({
        teamId: teamScore.teamId,
        participantId: null,
        scoreType: ScoreType.TEAM,
        value: teamScore.value,
      })),
      ...individualScores.map(
        (indivScore: { teamId: number; participantId: number; value: number }) => ({
          teamId: indivScore.teamId,
          participantId: indivScore.participantId,
          scoreType: ScoreType.INDIVIDUAL,
          value: indivScore.value,
        })
      ),
    ];

    const createdScores = await Promise.all(
      scoreEntries.map(score =>
        prisma.score.create({
          data: {
            judgeId: judge.id,
            roundId: assignment.roundId,
            teamId: score.teamId,
            participantId: score.participantId,
            scoreType: score.scoreType,
            value: score.value,
          },
        })
      )
    );

    await prisma.logActivity.create({
      data: {
        message: `Judge ${user.name} submitted scores for ${assignment.round.name} in ${assignment.room?.name ?? 'Room ID ' + assignment.roomId}`,
      },
    });

    return NextResponse.json(
      { message: 'Scores submitted successfully', scores: createdScores },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting scores:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
