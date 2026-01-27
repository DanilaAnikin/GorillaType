import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/chat/[roomId]/members
 * Add members to a group chat
 *
 * Request body:
 * { userIds: string[] } - array of user IDs to add
 *
 * Returns:
 * {
 *   added: [{ id, username, displayName, avatarUrl }],
 *   alreadyMembers: string[],
 *   participantCount: number
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userIds } = body;

    // Validate userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Verify the room exists and is a 'direct' type room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, type, name')
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching room:', roomError);
      return NextResponse.json(
        { error: 'Failed to fetch room', details: roomError.message },
        { status: 500 }
      );
    }

    if (room.type !== 'direct') {
      return NextResponse.json(
        { error: 'Members can only be added to direct-type rooms' },
        { status: 400 }
      );
    }

    // Fetch current participants to verify access and determine if it's a group
    const { data: currentParticipants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', roomId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch room participants', details: participantsError.message },
        { status: 500 }
      );
    }

    const participantUserIds = (currentParticipants || []).map(p => p.user_id);

    // Verify the current user is a participant
    if (!participantUserIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'You are not a participant in this room' },
        { status: 403 }
      );
    }

    // Verify this is a group (3+ participants OR has a name set)
    const isGroup = participantUserIds.length > 2 || !!room.name;
    if (!isGroup) {
      return NextResponse.json(
        { error: 'Cannot add members to a direct message. Create a group instead.' },
        { status: 400 }
      );
    }

    // Deduplicate requested userIds
    const uniqueUserIds = Array.from(new Set(userIds as string[]));

    // Verify all userIds exist in the profiles table
    const { data: validProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', uniqueUserIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to verify users', details: profilesError.message },
        { status: 500 }
      );
    }

    if (!validProfiles || validProfiles.length !== uniqueUserIds.length) {
      const foundIds = (validProfiles || []).map(p => p.id);
      const notFound = uniqueUserIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: 'One or more users not found', details: `User IDs not found: ${notFound.join(', ')}` },
        { status: 404 }
      );
    }

    // Filter out users who are already participants
    const alreadyMembers = uniqueUserIds.filter(id => participantUserIds.includes(id));
    const newUserIds = uniqueUserIds.filter(id => !participantUserIds.includes(id));

    // Insert new participants
    const addedProfiles: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null }[] = [];

    if (newUserIds.length > 0) {
      const insertRows = newUserIds.map(userId => ({
        room_id: roomId,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from('chat_participants')
        .insert(insertRows);

      if (insertError) {
        console.error('Error inserting participants:', insertError);
        return NextResponse.json(
          { error: 'Failed to add members', details: insertError.message },
          { status: 500 }
        );
      }

      // Build the added profiles list from the validated profiles
      for (const userId of newUserIds) {
        const profile = validProfiles.find(p => p.id === userId);
        if (profile) {
          addedProfiles.push({
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
          });
        }
      }
    }

    // Calculate updated participant count
    const participantCount = participantUserIds.length + newUserIds.length;

    return NextResponse.json({
      added: addedProfiles,
      alreadyMembers,
      participantCount,
    });
  } catch (error) {
    console.error('Error in POST /api/chat/[roomId]/members:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
