import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types for room data
type ChatRoomType = 'global' | 'clan' | 'race' | 'direct';

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  country_code: string | null;
} | null;

type ParticipantData = {
  id: string;
  user_id: string;
  last_read_at: string;
  is_muted: boolean;
  joined_at: string;
  profile: ProfileData;
};

type ChatRoomWithDetails = {
  id: string;
  type: ChatRoomType;
  name: string | null;
  clan_id: string | null;
  race_room_id: string | null;
  is_active: boolean;
  created_at: string;
};

/**
 * GET /api/chat/[roomId]
 * Get room details including participants
 */
export async function GET(
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

    // Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        type,
        name,
        clan_id,
        race_room_id,
        is_active,
        created_at
      `)
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

    const typedRoom = room as ChatRoomWithDetails;

    // Check access based on room type
    let hasAccess = false;

    switch (typedRoom.type) {
      case 'global':
        // Everyone has access to global chat
        hasAccess = true;
        break;

      case 'direct':
        // Check if user is a participant
        const { data: directParticipant } = await supabase
          .from('chat_participants')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();
        hasAccess = !!directParticipant;
        break;

      case 'race':
        // Check if user is a race participant
        if (typedRoom.race_room_id) {
          const { data: raceParticipant } = await supabase
            .from('race_participants')
            .select('id')
            .eq('room_id', typedRoom.race_room_id)
            .eq('user_id', user.id)
            .single();
          hasAccess = !!raceParticipant;
        }
        break;

      case 'clan':
        // Check if user is a clan member
        if (typedRoom.clan_id) {
          const { data: clanMember } = await supabase
            .from('clan_members')
            .select('id')
            .eq('clan_id', typedRoom.clan_id)
            .eq('user_id', user.id)
            .single();
          hasAccess = !!clanMember;
        }
        break;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this room' },
        { status: 403 }
      );
    }

    // Fetch participants (for direct messages and to show who's in the room)
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select(`
        id,
        user_id,
        last_read_at,
        is_muted,
        joined_at,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url,
          level,
          country_code
        )
      `)
      .eq('room_id', roomId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    }

    const typedParticipants = (participants || []) as unknown as ParticipantData[];

    // Get current user's participant record
    const currentUserParticipant = typedParticipants.find(p => p.user_id === user.id);

    // Get message count
    const { count: messageCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_deleted', false);

    // Get unread count for current user
    let unreadCount = 0;
    if (currentUserParticipant) {
      const { data: unread } = await supabase
        .rpc('get_unread_message_count', {
          p_user_id: user.id,
          p_room_id: roomId,
        });
      unreadCount = unread || 0;
    }

    // Format room name for direct messages
    let roomName = typedRoom.name;
    if (typedRoom.type === 'direct') {
      const otherParticipant = typedParticipants.find(p => p.user_id !== user.id);
      if (otherParticipant) {
        roomName = otherParticipant.profile?.display_name ||
                   otherParticipant.profile?.username ||
                   'Unknown User';
      }
    }

    // Format participants
    const formattedParticipants = typedParticipants.map(p => ({
      id: p.user_id,
      username: p.profile?.username,
      displayName: p.profile?.display_name,
      avatarUrl: p.profile?.avatar_url,
      level: p.profile?.level || 1,
      country: p.profile?.country_code,
      lastReadAt: p.last_read_at,
      joinedAt: p.joined_at,
      isCurrentUser: p.user_id === user.id,
    }));

    return NextResponse.json({
      room: {
        id: typedRoom.id,
        type: typedRoom.type,
        name: roomName,
        clanId: typedRoom.clan_id,
        raceRoomId: typedRoom.race_room_id,
        isActive: typedRoom.is_active,
        createdAt: typedRoom.created_at,
        messageCount: messageCount || 0,
        unreadCount,
        isMuted: currentUserParticipant?.is_muted || false,
      },
      participants: formattedParticipants,
    });
  } catch (error) {
    console.error('Error in GET /api/chat/[roomId]:', error instanceof Error ? {
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

/**
 * PATCH /api/chat/[roomId]
 * Update read status, mute status
 */
export async function PATCH(
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
    const { action } = body;

    // Validate action
    const validActions = ['markRead', 'mute', 'unmute'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, type')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if user has a participant record
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id, is_muted, last_read_at')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    // For global chat, create participant record if it doesn't exist
    if (!participant && room.type === 'global') {
      const { data: newParticipant, error: insertError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: user.id,
        })
        .select('id, is_muted, last_read_at')
        .single();

      if (insertError) {
        console.error('Error creating participant record:', insertError);
        return NextResponse.json(
          { error: 'Failed to create participant record', details: insertError.message },
          { status: 500 }
        );
      }

      // Continue with the new participant
      return handleAction(supabase, newParticipant.id, action, user.id, roomId);
    }

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this room' },
        { status: 403 }
      );
    }

    return handleAction(supabase, participant.id, action, user.id, roomId);
  } catch (error) {
    console.error('Error in PATCH /api/chat/[roomId]:', error instanceof Error ? {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAction(supabase: any, participantId: string, action: string, userId: string, roomId: string) {
  let updateData: Record<string, unknown> = {};

  switch (action) {
    case 'markRead':
      updateData = { last_read_at: new Date().toISOString() };
      break;

    case 'mute':
      updateData = { is_muted: true };
      break;

    case 'unmute':
      updateData = { is_muted: false };
      break;
  }

  const { data: updatedParticipant, error: updateError } = await supabase
    .from('chat_participants')
    .update(updateData)
    .eq('id', participantId)
    .select('id, is_muted, last_read_at')
    .single();

  if (updateError) {
    console.error('Error updating participant:', updateError);
    return NextResponse.json(
      { error: 'Failed to update room settings', details: updateError.message },
      { status: 500 }
    );
  }

  // Get updated unread count
  let unreadCount = 0;
  if (action === 'markRead') {
    unreadCount = 0;
  } else {
    const { data: unread } = await supabase
      .rpc('get_unread_message_count', {
        p_user_id: userId,
        p_room_id: roomId,
      });
    unreadCount = unread || 0;
  }

  return NextResponse.json({
    message: `Room ${action === 'markRead' ? 'marked as read' : action === 'mute' ? 'muted' : 'unmuted'} successfully`,
    isMuted: updatedParticipant.is_muted,
    lastReadAt: updatedParticipant.last_read_at,
    unreadCount,
  });
}
