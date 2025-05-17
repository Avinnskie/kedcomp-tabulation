import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roundNumber } = body;

    let round;
    try {
      round = await prisma.round.findFirst({ where: { number: roundNumber } });
    } catch (dbError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error when searching for round',
          details: dbError.message,
        },
        { status: 500 }
      );
    }

    // If round doesn't exist, create it
    if (!round) {
      // Create round names based on number
      let roundName = 'Preliminary';
      if (roundNumber === 4) {
        roundName = 'Semifinal';
      } else if (roundNumber === 5) {
        roundName = 'Final';
      } else if (roundNumber > 1) {
        roundName = `Preliminary ${roundNumber}`;
      }

      try {
        round = await prisma.round.create({
          data: {
            name: roundName,
            number: roundNumber,
          },
        });
      } catch (createError: any) {
        console.error('[ERROR] Failed to create round:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create round', details: createError.message },
          { status: 500 }
        );
      }
    }

    // Get all teams
    let teams;
    try {
      teams = await prisma.team.findMany();

      if (teams.length === 0) {
        console.error('[ERROR] No teams found in the database');
        return NextResponse.json(
          { success: false, error: 'No teams found in the database' },
          { status: 400 }
        );
      }

      if (teams.length % 4 !== 0) {
        console.error(`[ERROR] Invalid team count: ${teams.length}. Must be a multiple of 4.`);
        return NextResponse.json(
          { success: false, error: 'Jumlah tim harus kelipatan 4' },
          { status: 400 }
        );
      }
    } catch (teamsError: any) {
      console.error('[ERROR] Failed to retrieve teams:', teamsError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve teams', details: teamsError.message },
        { status: 500 }
      );
    }

    // Shuffle teams
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    let rooms;
    try {
      rooms = await prisma.room.findMany();

      const requiredRooms = teams.length / 4;
      if (rooms.length < requiredRooms) {
        console.error(
          `[ERROR] Not enough rooms. Need ${requiredRooms} rooms but only have ${rooms.length}`
        );
        return NextResponse.json(
          {
            success: false,
            error: `Not enough rooms. Need ${requiredRooms} rooms but only have ${rooms.length}`,
          },
          { status: 400 }
        );
      }
    } catch (roomsError: any) {
      console.error('[ERROR] Failed to retrieve rooms:', roomsError);
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve rooms', details: roomsError.message },
        { status: 500 }
      );
    }

    // Get judges for assignments
    let judges;
    try {
      judges = await prisma.judge.findMany();
      console.log(`[INFO] Found ${judges.length} judges in the database`);
    } catch (judgesError: any) {
      console.error('[ERROR] Failed to retrieve judges:', judgesError);
      // We'll continue even if we can't get judges, they're optional
      judges = [];
    }
    
    let idx = 0;
    let createdAssignments = 0;
    
    // Process each room and create assignments
    for (const room of rooms) {
      // Get 4 teams for this room
      const roomTeams = shuffled.slice(idx, idx + 4);
      if (roomTeams.length < 4) {
        console.log(`[INFO] Not enough teams left for room ${room.name}, stopping`);
        break;
      }

      // Select a judge if available (based on room index)
      const judgeIndex = Math.floor(idx / 4);
      const judge = judgeIndex < judges.length ? judges[judgeIndex] : null;
      
      console.log(
        `[INFO] Assigning to room ${room.name} (id: ${room.id}):`,
        roomTeams.map(t => `${t.name} (id: ${t.id})`),
        judge ? `with Judge: ${judge.name} (id: ${judge.id})` : 'without a judge'
      );
      
      try {
        // Create the assignment
        await prisma.roundAssignment.create({
          data: {
            roundId: round.id,
            roomId: room.id,
            judgeId: judge?.id || null,
            teams: {
              connect: roomTeams.map(t => ({ id: t.id })),
            },
          },
        });
        
        createdAssignments++;
        console.log(`[INFO] Successfully created assignment for room ${room.name}`);
      } catch (assignmentError: any) {
        console.error(`[ERROR] Failed to create assignment for room ${room.name}:`, assignmentError);
        // Continue trying other rooms instead of failing the entire process
      }
      
      // Move to the next 4 teams
      idx += 4;
    }

    if (createdAssignments === 0) {
      console.error('[ERROR] Failed to create any round assignments');
      return NextResponse.json(
        { success: false, error: 'Failed to create any round assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created bracket for round ${roundNumber}`,
      roundId: round.id,
      assignmentsCreated: createdAssignments,
    });
  } catch (err: any) {
    console.error('[ERROR] Unhandled exception in generateBracket API:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: err.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
