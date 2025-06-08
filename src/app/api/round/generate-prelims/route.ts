import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { DebatePosition } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        teamAssignments: true,
      },
    });

    const judges = await prisma.judge.findMany();

    const existingPrelimRounds = await prisma.round.count({
      where: {
        name: {
          startsWith: 'Preliminary',
        },
      },
    });

    if (existingPrelimRounds > 0) {
      const teamsWithMissingAssignments = teams.filter(
        team => team.teamAssignments.length < existingPrelimRounds
      );
      if (teamsWithMissingAssignments.length > 0) {
        return NextResponse.json(
          {
            error: `Some teams have not been assigned a room in ${existingPrelimRounds} previous round.`,
            unassignedTeamNames: teamsWithMissingAssignments.map(t => t.name),
            debug: teamsWithMissingAssignments.map(t => ({
              name: t.name,
              assignments: t.teamAssignments.length,
            })),
          },
          { status: 400 }
        );
      }
    }

    if (existingPrelimRounds >= 3) {
      return NextResponse.json(
        { error: 'There are already 3 preliminary rounds.' },
        { status: 400 }
      );
    }

    const numRooms = Math.ceil(teams.length / 4);
    const allRooms = await prisma.room.findMany();

    if (allRooms.length < numRooms) {
      return NextResponse.json(
        {
          error: `The number of rooms is insufficient. Needed ${numRooms}, available ${allRooms.length}`,
        },
        { status: 400 }
      );
    }

    const roomsToUse = allRooms.slice(0, numRooms); // Gunakan N room pertama untuk semua ronde
    const createdRounds = [];

    for (let r = existingPrelimRounds + 1; r <= 3; r++) {
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);

      const round = await prisma.round.create({
        data: {
          number: r,
          name: `Preliminary ${r}`,
          assignments: {
            create: Array.from({ length: numRooms }, (_, i) => {
              const judge = shuffledJudges[i] || null;
              const teamSet = shuffledTeams.slice(i * 4, i * 4 + 4);
              const positions: DebatePosition[] = ['OG', 'OO', 'CG', 'CO'];

              const selectedRoom = roomsToUse[i];
              if (!selectedRoom) {
                throw new Error(`Room ke-${i + 1} not found.`);
              }

              return {
                room: {
                  connect: { id: selectedRoom.id },
                },
                ...(judge && { judge: { connect: { id: judge.id } } }),
                teamAssignments: {
                  create: teamSet.map((team, j) => ({
                    team: { connect: { id: team.id } },
                    position: positions[j],
                  })),
                },
              };
            }),
          },
        },
        include: {
          assignments: {
            include: {
              room: true,
              judge: true,
              teamAssignments: {
                include: {
                  team: true,
                },
              },
            },
          },
        },
      });

      createdRounds.push(round);
    }

    return NextResponse.json({
      message: `Successfully created ${createdRounds.length} preliminary round.`,
      rounds: createdRounds,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to make the preliminary round.', details: String(err) },
      { status: 500 }
    );
  }
}
