import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Missing round ID' }, { status: 400 });

    const roundId = parseInt(id);
    if (isNaN(roundId)) return NextResponse.json({ message: 'Invalid round ID' }, { status: 400 });

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        assignments: {
          include: {
            room: true,
            judge: true,
            teamAssignments: {
              include: { team: true },
            },
          },
        },
        Score: {
          include: {
            judge: true,
            team: true,
            participant: true,
          },
        },
      },
    });

    if (!round) return NextResponse.json({ message: 'Round not found' }, { status: 404 });

    const groupedByRoom: {
      [roomId: number]: {
        roomName: string;
        judges: {
          judgeName: string;
          isSubmitted: boolean;
          scores: { teamName: string; score: number }[];
        }[];
        teamScores: { teamName: string; totalScore: number }[];
      };
    } = {};

    for (const assignment of round.assignments) {
      const roomId = assignment.roomId;
      if (!roomId || !assignment.room) continue;

      if (!groupedByRoom[roomId]) {
        groupedByRoom[roomId] = {
          roomName: assignment.room.name,
          judges: [],
          teamScores: [],
        };
      }

      const teamsInRoom = assignment.teamAssignments.map(ta => ta.team);

      if (assignment.judge) {
        const judgeScores = round.Score.filter(s => s.judgeId === assignment.judge!.id);

        const isSubmitted = judgeScores.length > 0;

        const groupedScores = Object.values(
          judgeScores.reduce(
            (acc, s) => {
              const key = s.team?.name ?? 'Unknown';
              if (!acc[key]) {
                acc[key] = {
                  teamName: key,
                  vp: 0,
                  participants: [],
                };
              }

              if (s.scoreType === 'TEAM') {
                acc[key].vp += s.value;
              } else if (s.scoreType === 'INDIVIDUAL' && s.participant) {
                acc[key].participants.push({
                  name: s.participant.name,
                  value: s.value,
                });
              }

              return acc;
            },
            {} as Record<
              string,
              {
                teamName: string;
                vp: number;
                participants: { name: string; value: number }[];
              }
            >
          )
        );

        groupedByRoom[roomId].judges.push({
          judgeName: assignment.judge.name,
          isSubmitted,
          scores: groupedScores,
        });
      }

      for (const team of teamsInRoom) {
        const totalScore = round.Score.filter(s => s.teamId === team.id).reduce(
          (sum, s) => sum + s.value,
          0
        );

        if (!groupedByRoom[roomId].teamScores.some(t => t.teamName === team.name)) {
          groupedByRoom[roomId].teamScores.push({
            teamName: team.name,
            totalScore,
          });
        }
      }
    }

    const rooms = Object.values(groupedByRoom).map(room => ({
      roomName: room.roomName,
      judges: room.judges,
      teamScores: room.teamScores,
      isComplete: room.judges.length > 0 && room.judges.every(j => j.isSubmitted),
    }));

    return NextResponse.json({
      roundName: round.name,
      rooms,
    });
  } catch (error) {
    console.error('Error fetching round recap:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
