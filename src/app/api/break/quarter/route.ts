// app/api/break/quarterfinal/route.ts
import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';
import { NextResponse } from 'next/server';

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

    const teams = quarter.assignments.flatMap(assignment =>
      assignment.teamAssignments.map(ta => ({
        teamId: ta.teamId,
        teamName: ta.team.name,
        position: ta.position,
        room: assignment.room.name,
      }))
    );

    return NextResponse.json({ roundId: quarter.id, teams });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching quarterfinal teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mode = 'auto', teams = [] } = body;

    // Check if quarterfinal already exists
    const existingQuarter = await prisma.round.findFirst({ where: { number: 4 } });
    if (existingQuarter) {
      return NextResponse.json({ message: 'Quarterfinal already exists' }, { status: 400 });
    }

    let selectedTeams: { teamId: number; teamName: string; totalPoints: number; totalScore: number }[] = [];

    if (mode === 'manual' && teams.length > 0) {
      // Manual mode: use provided teams
      selectedTeams = teams.slice(0, 16); // Ensure max 16 teams
    } else {
      // Auto mode: calculate from preliminary rounds
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

      // Calculate cumulative team scores
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

      // Get top 16 teams
      selectedTeams = Object.values(teamMap)
        .sort((a, b) =>
          b.totalPoints === a.totalPoints
            ? b.totalScore - a.totalScore
            : b.totalPoints - a.totalPoints
        )
        .slice(0, 16);
    }

    if (selectedTeams.length < 16) {
      return NextResponse.json(
        { message: `Need at least 16 teams for quarterfinal. Only ${selectedTeams.length} available.` },
        { status: 400 }
      );
    }

    // New pairing system: 4 highest ranked teams per room
    // Room 1: teams ranked 1,2,3,4
    // Room 2: teams ranked 5,6,7,8
    // Room 3: teams ranked 9,10,11,12
    // Room 4: teams ranked 13,14,15,16
    const roomPairings = [
      [0, 1, 2, 3],   // Top 4 teams
      [4, 5, 6, 7],   // Next 4 teams
      [8, 9, 10, 11], // Next 4 teams
      [12, 13, 14, 15], // Bottom 4 teams
    ];

    // Create quarterfinal round
    const quarterfinal = await prisma.round.create({
      data: { name: 'Quarterfinal', number: 4 },
    });

    // Create or get rooms for quarterfinal
    const rooms = await Promise.all(
      roomPairings.map(async (_, idx) => {
        const roomName = `Quarterfinal Room ${idx + 1}`;
        // Check if room already exists
        let room = await prisma.room.findFirst({
          where: { name: roomName }
        });
        // If room doesn't exist, create it
        if (!room) {
          room = await prisma.room.create({
            data: { name: roomName }
          });
        }
        return room;
      })
    );

    // Create room assignments and team assignments
    for (let i = 0; i < roomPairings.length; i++) {
      const assignment = await prisma.roundAssignment.create({
        data: { roundId: quarterfinal.id, roomId: rooms[i].id },
      });

      const teamsInRoom = roomPairings[i].map(j => selectedTeams[j]);
      await Promise.all(
        teamsInRoom.map((team, posIdx) =>
          prisma.teamAssignment.create({
            data: {
              roundAssignmentId: assignment.id,
              teamId: team.teamId,
              position: ['OG', 'OO', 'CG', 'CO'][posIdx] as DebatePosition,
            },
          })
        )
      );
    }

    return NextResponse.json({
      message: 'Quarterfinal bracket created successfully',
      roundId: quarterfinal.id,
      mode,
      teamsUsed: selectedTeams.map((t, idx) => ({ ...t, rank: idx + 1 })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error generating quarterfinal' }, { status: 500 });
  }
}
