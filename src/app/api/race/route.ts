import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TestMode } from '@/types/test';

/**
 * Generate a random room code
 */
function generateRoomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Room status types
 */
type RoomStatus = 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled';

/**
 * GET /api/race
 * Get race room by code, list public rooms, or get race history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const roomId = searchParams.get('roomId');
    const action = searchParams.get('action');

    // Handle list action - return all public waiting rooms
    if (action === 'list') {
      const { data: rooms, error: listError } = await supabase
        .from('race_rooms')
        .select(`
          id,
          room_code,
          status,
          test_mode,
          test_duration,
          test_word_count,
          max_participants,
          is_private,
          created_at,
          host:host_id (
            id,
            username,
            display_name,
            avatar_url,
            level
          ),
          participants:race_participants (user_id)
        `)
        .eq('status', 'waiting')
        .eq('is_private', false)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Only rooms from last hour
        .order('created_at', { ascending: false })
        .limit(20);

      if (listError) {
        console.error('Error fetching rooms:', listError);
        return NextResponse.json(
          { error: 'Failed to fetch rooms' },
          { status: 500 }
        );
      }

      const formattedRooms = (rooms || []).map((room) => ({
        id: room.id,
        code: room.room_code,
        host: {
          username: (room.host as { username?: string })?.username || 'Anonymous',
          avatarUrl: (room.host as { avatar_url?: string })?.avatar_url,
          level: (room.host as { level?: number })?.level || 1,
        },
        participantCount: (room.participants as { user_id: string }[])?.length || 0,
        maxParticipants: room.max_participants,
        mode: room.test_mode,
        timeLimit: room.test_duration,
        wordLimit: room.test_word_count,
        status: room.status,
        isPrivate: room.is_private,
        createdAt: room.created_at,
      }));

      return NextResponse.json({ rooms: formattedRooms });
    }

    // Handle history action - return user's race history
    if (action === 'history') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { data: history, error: historyError } = await supabase
        .from('race_participants')
        .select(`
          id,
          wpm,
          accuracy,
          finished_at,
          room:room_id (
            id,
            room_code,
            test_mode,
            test_duration,
            test_word_count,
            status,
            race_participants (user_id)
          )
        `)
        .eq('user_id', user.id)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error fetching race history:', historyError);
        return NextResponse.json(
          { error: 'Failed to fetch race history' },
          { status: 500 }
        );
      }

      // Calculate positions and format history
      const formattedHistory = (history || []).map((entry) => {
        // Supabase returns joined data - handle both array and object cases
        const roomData = entry.room;
        const room = (Array.isArray(roomData) ? roomData[0] : roomData) as {
          id: string;
          room_code: string;
          test_mode: 'time' | 'words';
          test_duration: number | null;
          test_word_count: number | null;
          status: string;
          race_participants: { user_id: string }[];
        } | null;

        const totalRacers = room?.race_participants?.length || 1;

        // Position would need to be calculated based on WPM ranking
        // For now, we'll return a placeholder - in production, this should be stored
        const position = 1; // This should be calculated or stored during the race

        return {
          id: entry.id,
          roomCode: room?.room_code || 'UNKNOWN',
          finishedAt: entry.finished_at,
          position,
          totalRacers,
          wpm: entry.wpm || 0,
          accuracy: entry.accuracy || 0,
          mode: room?.test_mode || 'time',
          timeLimit: room?.test_duration,
          wordLimit: room?.test_word_count,
        };
      });

      return NextResponse.json({ history: formattedHistory });
    }

    if (!code && !roomId) {
      return NextResponse.json(
        { error: 'Must provide code, roomId, or action' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('race_rooms')
      .select(`
        *,
        host:host_id (
          id,
          username,
          display_name,
          avatar_url,
          level
        ),
        participants:race_participants (
          user_id,
          is_ready,
          is_finished,
          wpm,
          accuracy,
          progress,
          finished_at,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            level
          )
        )
      `);

    if (code) {
      query = query.eq('room_code', code.toUpperCase());
    } else if (roomId) {
      query = query.eq('id', roomId);
    }

    const { data: room, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching room:', error);
      return NextResponse.json(
        { error: 'Failed to fetch room' },
        { status: 500 }
      );
    }

    // Check if room is expired (older than 1 hour)
    const roomAge = Date.now() - new Date(room.created_at).getTime();
    if (roomAge > 60 * 60 * 1000 && room.status !== 'finished') {
      return NextResponse.json(
        { error: 'Room has expired' },
        { status: 410 }
      );
    }

    // Format participants - DB uses is_ready/is_finished booleans, map to status string
    const participants = (room.participants || []).map((p: {
      user_id: string;
      is_ready: boolean;
      is_finished: boolean;
      wpm: number | null;
      accuracy: number | null;
      progress: number;
      finished_at: string | null;
      profiles: {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        level: number;
      } | null;
    }) => ({
      userId: p.user_id,
      username: p.profiles?.username || 'Anonymous',
      displayName: p.profiles?.display_name,
      avatarUrl: p.profiles?.avatar_url,
      level: p.profiles?.level || 1,
      status: p.is_finished ? 'finished' : p.is_ready ? 'ready' : 'racing',
      wpm: p.wpm,
      accuracy: p.accuracy,
      progress: p.progress,
      finishedAt: p.finished_at,
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.room_code,
        status: room.status,
        mode: room.test_mode,
        timeLimit: room.test_duration,
        wordLimit: room.test_word_count,
        language: room.test_language,
        punctuation: false, // DB schema doesn't have separate punctuation column for race_rooms
        numbers: false, // DB schema doesn't have separate numbers column for race_rooms
        text: room.test_text,
        maxParticipants: room.max_participants,
        isPrivate: room.is_private,
        host: {
          id: room.host?.id,
          username: room.host?.username,
          displayName: room.host?.display_name,
          avatarUrl: room.host?.avatar_url,
          level: room.host?.level,
        },
        participants,
        participantCount: participants.length,
        createdAt: room.created_at,
        startedAt: room.race_started_at,
        finishedAt: room.race_ended_at,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/race
 * Create a new race room
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    const {
      mode = 'time',
      timeLimit = 60,
      wordLimit = 50,
      language = 'english',
      punctuation = false,
      numbers = false,
      maxParticipants = 5,
      isPrivate = false,
      text, // Pre-generated text for the race
    } = body;

    // Validate mode
    const validModes: TestMode[] = ['time', 'words'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be time or words' },
        { status: 400 }
      );
    }

    // Validate participant limit
    if (maxParticipants < 2 || maxParticipants > 10) {
      return NextResponse.json(
        { error: 'maxParticipants must be between 2 and 10' },
        { status: 400 }
      );
    }

    // Validate text if provided
    if (text && (typeof text !== 'string' || text.length < 10)) {
      return NextResponse.json(
        { error: 'Text must be a string with at least 10 characters' },
        { status: 400 }
      );
    }

    // Generate a unique room code
    let roomCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomCode = generateRoomCode();
      const { data: existing } = await supabase
        .from('race_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code' },
        { status: 500 }
      );
    }

    // Create the race room
    const { data: room, error: createError } = await supabase
      .from('race_rooms')
      .insert({
        room_code: roomCode,
        host_id: user.id,
        status: 'waiting' as RoomStatus,
        test_mode: mode,
        test_duration: mode === 'time' ? timeLimit : 30,
        test_word_count: mode === 'words' ? wordLimit : 25,
        test_language: language,
        test_text: text || null,
        max_participants: maxParticipants,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating room:', createError);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    // Add host as first participant
    const { error: participantError } = await supabase
      .from('race_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        is_ready: true,
        is_finished: false,
        progress: 0,
      });

    if (participantError) {
      console.error('Error adding host as participant:', participantError);
      // Clean up the room if we couldn't add the host
      await supabase.from('race_rooms').delete().eq('id', room.id);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    // Fetch the host profile
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, level')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.room_code,
        status: room.status,
        mode: room.test_mode,
        timeLimit: room.test_duration,
        wordLimit: room.test_word_count,
        language: room.test_language,
        punctuation: false,
        numbers: false,
        text: room.test_text,
        maxParticipants: room.max_participants,
        isPrivate: room.is_private,
        host: {
          id: user.id,
          username: hostProfile?.username || 'Anonymous',
          displayName: hostProfile?.display_name,
          avatarUrl: hostProfile?.avatar_url,
          level: hostProfile?.level || 1,
        },
        participants: [{
          userId: user.id,
          username: hostProfile?.username || 'Anonymous',
          displayName: hostProfile?.display_name,
          avatarUrl: hostProfile?.avatar_url,
          level: hostProfile?.level || 1,
          status: 'ready',
          progress: 0,
        }],
        participantCount: 1,
        createdAt: room.created_at,
      },
      message: 'Room created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/race
 * Update room status or join/leave room
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { roomId, code, action, text } = body;

    if (!roomId && !code) {
      return NextResponse.json(
        { error: 'Must provide roomId or code' },
        { status: 400 }
      );
    }

    // Fetch the room
    let query = supabase
      .from('race_rooms')
      .select('*, race_participants(user_id, is_ready, is_finished)');

    if (roomId) {
      query = query.eq('id', roomId);
    } else if (code) {
      query = query.eq('room_code', code.toUpperCase());
    }

    const { data: room, error: fetchError } = await query.single();

    if (fetchError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const isHost = room.host_id === user.id;
    const participants = room.race_participants || [];
    const isParticipant = participants.some((p: { user_id: string }) => p.user_id === user.id);

    switch (action) {
      case 'join': {
        if (isParticipant) {
          return NextResponse.json(
            { error: 'Already in this room' },
            { status: 400 }
          );
        }

        if (room.status !== 'waiting') {
          return NextResponse.json(
            { error: 'Cannot join room that has already started' },
            { status: 400 }
          );
        }

        if (participants.length >= room.max_participants) {
          return NextResponse.json(
            { error: 'Room is full' },
            { status: 400 }
          );
        }

        // Add participant
        const { error: joinError } = await supabase
          .from('race_participants')
          .insert({
            room_id: room.id,
            user_id: user.id,
            is_ready: true,
            is_finished: false,
            progress: 0,
          });

        if (joinError) {
          console.error('Error joining room:', joinError);
          return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Joined room successfully',
          roomId: room.id,
        });
      }

      case 'leave': {
        if (!isParticipant) {
          return NextResponse.json(
            { error: 'Not in this room' },
            { status: 400 }
          );
        }

        // Remove participant
        const { error: leaveError } = await supabase
          .from('race_participants')
          .delete()
          .eq('room_id', room.id)
          .eq('user_id', user.id);

        if (leaveError) {
          console.error('Error leaving room:', leaveError);
          return NextResponse.json(
            { error: 'Failed to leave room' },
            { status: 500 }
          );
        }

        // If host left and room is waiting, cancel it
        if (isHost && room.status === 'waiting') {
          await supabase
            .from('race_rooms')
            .update({ status: 'cancelled' })
            .eq('id', room.id);
        }

        return NextResponse.json({
          message: 'Left room successfully',
        });
      }

      case 'start': {
        if (!isHost) {
          return NextResponse.json(
            { error: 'Only host can start the race' },
            { status: 403 }
          );
        }

        if (room.status !== 'waiting') {
          return NextResponse.json(
            { error: 'Race has already started or finished' },
            { status: 400 }
          );
        }

        if (participants.length < 2) {
          return NextResponse.json(
            { error: 'Need at least 2 participants to start' },
            { status: 400 }
          );
        }

        // Update room to countdown status
        const updates: Record<string, unknown> = {
          status: 'countdown' as RoomStatus,
          countdown_started_at: new Date().toISOString(),
        };

        // Add text if provided
        if (text) {
          updates.test_text = text;
        }

        const { error: startError } = await supabase
          .from('race_rooms')
          .update(updates)
          .eq('id', room.id);

        if (startError) {
          console.error('Error starting race:', startError);
          return NextResponse.json(
            { error: 'Failed to start race' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Race starting',
          status: 'countdown',
        });
      }

      case 'racing': {
        // Transition from countdown to racing
        if (!isHost) {
          return NextResponse.json(
            { error: 'Only host can update race status' },
            { status: 403 }
          );
        }

        if (room.status !== 'countdown') {
          return NextResponse.json(
            { error: 'Race must be in countdown to start racing' },
            { status: 400 }
          );
        }

        const { error: racingError } = await supabase
          .from('race_rooms')
          .update({
            status: 'racing' as RoomStatus,
            race_started_at: new Date().toISOString(),
          })
          .eq('id', room.id);

        if (racingError) {
          return NextResponse.json(
            { error: 'Failed to update race status' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Race started',
          status: 'racing',
        });
      }

      case 'finish': {
        if (!isHost) {
          return NextResponse.json(
            { error: 'Only host can finish the race' },
            { status: 403 }
          );
        }

        const { error: finishError } = await supabase
          .from('race_rooms')
          .update({
            status: 'finished' as RoomStatus,
            race_ended_at: new Date().toISOString(),
          })
          .eq('id', room.id);

        if (finishError) {
          return NextResponse.json(
            { error: 'Failed to finish race' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Race finished',
          status: 'finished',
        });
      }

      case 'cancel': {
        if (!isHost) {
          return NextResponse.json(
            { error: 'Only host can cancel the race' },
            { status: 403 }
          );
        }

        const { error: cancelError } = await supabase
          .from('race_rooms')
          .update({ status: 'cancelled' as RoomStatus })
          .eq('id', room.id);

        if (cancelError) {
          return NextResponse.json(
            { error: 'Failed to cancel race' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Race cancelled',
          status: 'cancelled',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: join, leave, start, racing, finish, or cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in PATCH /api/race:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
