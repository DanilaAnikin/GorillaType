import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types for chat room data
type ChatRoomType = 'global' | 'clan' | 'race' | 'direct';

// Virtual type for frontend - 'direct' with 2 participants = DM, 'direct' with 3+ = group
type VirtualChatType = 'direct' | 'group';

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type ParticipantData = {
  user_id: string;
  last_read_at: string;
  is_muted: boolean;
  profile: ProfileData;
};

type ChatRoomWithParticipants = {
  id: string;
  type: ChatRoomType;
  name: string | null;
  clan_id: string | null;
  race_room_id: string | null;
  is_active: boolean;
  created_at: string;
  chat_participants: ParticipantData[];
};

type LatestMessage = {
  room_id: string;
  content: string;
  created_at: string;
  sender: ProfileData;
};

// Helper to determine if a 'direct' room is a DM or a group
function getVirtualType(room: ChatRoomWithParticipants): VirtualChatType {
  // Groups have more than 2 participants OR have a name set
  if (room.type === 'direct') {
    const participantCount = room.chat_participants?.length || 0;
    if (participantCount > 2 || room.name) {
      return 'group';
    }
    return 'direct';
  }
  return 'direct';
}

/**
 * GET /api/chat
 * List chat rooms user has access to
 *
 * Query params:
 * - type: 'global' | 'clan' | 'race' | 'direct' | 'group' - filter by room type
 * - withUser: string (userId) - get DM room with specific user (creates if doesn't exist)
 * - page: number - pagination page
 * - limit: number - items per page (max 50)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ChatRoomType | VirtualChatType | null;
    const withUser = searchParams.get('withUser'); // Get DM room with specific user
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = (page - 1) * limit;

    // Special case: get or create DM room with specific user
    if (withUser) {
      return await getOrCreateDMRoom(supabase, user.id, withUser);
    }

    // Build the query based on room type
    let rooms: ChatRoomWithParticipants[] = [];
    let totalCount = 0;

    if (!type || type === 'global') {
      // Fetch global chat rooms
      const { data: globalRooms, error: globalError, count: globalCount } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          type,
          name,
          clan_id,
          race_room_id,
          is_active,
          created_at,
          chat_participants!left (
            user_id,
            last_read_at,
            is_muted,
            profile:user_id (
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('type', 'global')
        .eq('is_active', true)
        .range(offset, offset + limit - 1);

      if (globalError) {
        console.error('Error fetching global chat rooms:', globalError);
      } else if (globalRooms) {
        rooms = [...rooms, ...(globalRooms as unknown as ChatRoomWithParticipants[])];
        totalCount += globalCount || 0;
      }
    }

    // Fetch direct/group chat rooms where user is a participant
    // 'direct' = DMs (2 participants, no name)
    // 'group' = groups (3+ participants OR has a name)
    // null = both
    if (!type || type === 'direct' || type === 'group') {
      const { data: directRooms, error: directError, count: directCount } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          type,
          name,
          clan_id,
          race_room_id,
          is_active,
          created_at,
          chat_participants!inner (
            user_id,
            last_read_at,
            is_muted,
            profile:user_id (
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('type', 'direct')
        .eq('chat_participants.user_id', user.id)
        .range(offset, offset + limit - 1);

      if (directError) {
        console.error('Error fetching direct chat rooms:', directError);
      } else if (directRooms) {
        // For direct rooms, we need to fetch all participants (not just the current user)
        const roomIds = directRooms.map(r => r.id);
        if (roomIds.length > 0) {
          const { data: allParticipants } = await supabase
            .from('chat_participants')
            .select(`
              room_id,
              user_id,
              last_read_at,
              is_muted,
              profile:user_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .in('room_id', roomIds);

          // Map participants to rooms
          const participantsByRoom = (allParticipants || []).reduce((acc, p) => {
            if (!acc[p.room_id]) acc[p.room_id] = [];
            acc[p.room_id].push(p as unknown as ParticipantData);
            return acc;
          }, {} as Record<string, ParticipantData[]>);

          const roomsWithAllParticipants = directRooms.map(room => ({
            ...room,
            chat_participants: participantsByRoom[room.id] || [],
          }));

          // Filter by virtual type if specified
          let filteredRooms = roomsWithAllParticipants as unknown as ChatRoomWithParticipants[];

          if (type === 'direct') {
            // Only DMs: 2 participants AND no name
            filteredRooms = filteredRooms.filter(room =>
              room.chat_participants.length === 2 && !room.name
            );
          } else if (type === 'group') {
            // Only groups: 3+ participants OR has a name
            filteredRooms = filteredRooms.filter(room =>
              room.chat_participants.length > 2 || room.name
            );
          }

          rooms = [...rooms, ...filteredRooms];
        }
        totalCount += directCount || 0;
      }
    }

    if (type === 'race') {
      // Fetch race chat rooms where user is a race participant
      const { data: raceRooms, error: raceError, count: raceCount } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          type,
          name,
          clan_id,
          race_room_id,
          is_active,
          created_at,
          chat_participants (
            user_id,
            last_read_at,
            is_muted,
            profile:user_id (
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('type', 'race')
        .eq('is_active', true)
        .range(offset, offset + limit - 1);

      if (raceError) {
        console.error('Error fetching race chat rooms:', raceError);
      } else if (raceRooms) {
        rooms = [...rooms, ...(raceRooms as unknown as ChatRoomWithParticipants[])];
        totalCount += raceCount || 0;
      }
    }

    if (type === 'clan') {
      // Fetch clan chat rooms (placeholder - implement when clans feature is complete)
      const { data: clanRooms, error: clanError, count: clanCount } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          type,
          name,
          clan_id,
          race_room_id,
          is_active,
          created_at,
          chat_participants (
            user_id,
            last_read_at,
            is_muted,
            profile:user_id (
              id,
              username,
              display_name,
              avatar_url
            )
          )
        `, { count: 'exact' })
        .eq('type', 'clan')
        .eq('is_active', true)
        .range(offset, offset + limit - 1);

      if (clanError) {
        console.error('Error fetching clan chat rooms:', clanError);
      } else if (clanRooms) {
        rooms = [...rooms, ...(clanRooms as unknown as ChatRoomWithParticipants[])];
        totalCount += clanCount || 0;
      }
    }

    // Fetch latest message for each room
    const roomIds = rooms.map(r => r.id);
    let latestMessages: Record<string, LatestMessage> = {};

    if (roomIds.length > 0) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
          room_id,
          content,
          created_at,
          sender:sender_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('room_id', roomIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Group by room_id and take the first (latest) message
      if (messages) {
        latestMessages = messages.reduce((acc, msg) => {
          if (!acc[msg.room_id]) {
            acc[msg.room_id] = msg as unknown as LatestMessage;
          }
          return acc;
        }, {} as Record<string, LatestMessage>);
      }
    }

    // Get unread counts for the current user
    const { data: unreadCounts } = await supabase.rpc('get_unread_counts_for_user', {
      p_user_id: user.id,
      p_room_ids: roomIds,
    }).maybeSingle();

    // Format response
    const formattedRooms = rooms.map(room => {
      const currentUserParticipant = room.chat_participants?.find(
        p => p.user_id === user.id
      );
      const otherParticipants = room.chat_participants?.filter(
        p => p.user_id !== user.id
      ) || [];

      // Determine the virtual type (direct = DM, group = group chat)
      const virtualType = getVirtualType(room);
      const isGroup = virtualType === 'group';

      // For direct messages (DMs), use the other participant's name as room name
      // For groups, use the room name or generate from participants
      let roomName = room.name;
      if (room.type === 'direct') {
        if (isGroup) {
          // Group: use room name or generate from first few participants
          if (!roomName && otherParticipants.length > 0) {
            const names = otherParticipants
              .slice(0, 3)
              .map(p => p.profile?.display_name || p.profile?.username || 'Unknown')
              .join(', ');
            roomName = otherParticipants.length > 3
              ? `${names} +${otherParticipants.length - 3} more`
              : names;
          }
        } else {
          // DM: use other participant's name
          if (otherParticipants.length > 0) {
            const other = otherParticipants[0];
            roomName = other.profile?.display_name || other.profile?.username || 'Unknown User';
          }
        }
      }

      const latestMessage = latestMessages[room.id];

      return {
        id: room.id,
        type: room.type,
        virtualType, // 'direct' for DMs, 'group' for group chats
        isGroup,
        name: roomName,
        clanId: room.clan_id,
        raceRoomId: room.race_room_id,
        isActive: room.is_active,
        createdAt: room.created_at,
        isMuted: currentUserParticipant?.is_muted || false,
        lastReadAt: currentUserParticipant?.last_read_at,
        participantCount: room.chat_participants?.length || 0,
        participants: otherParticipants.map(p => ({
          id: p.user_id,
          username: p.profile?.username,
          displayName: p.profile?.display_name,
          avatarUrl: p.profile?.avatar_url,
        })),
        latestMessage: latestMessage ? {
          content: latestMessage.content,
          createdAt: latestMessage.created_at,
          sender: {
            id: latestMessage.sender?.id,
            username: latestMessage.sender?.username,
            displayName: latestMessage.sender?.display_name,
          },
        } : null,
        unreadCount: (unreadCounts as Record<string, number>)?.[room.id] || 0,
      };
    });

    // Sort by latest message timestamp
    formattedRooms.sort((a, b) => {
      const aTime = a.latestMessage?.createdAt || a.createdAt;
      const bTime = b.latestMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({
      rooms: formattedRooms,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/chat:', error instanceof Error ? {
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
 * POST /api/chat
 * Create a new chat room (DM or group)
 *
 * Request body for DM:
 * { type: 'direct', participantId: string }
 *
 * Request body for Group:
 * { type: 'group', name: string, participantIds: string[] }
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
    const { type, participantId, participantIds, name } = body;

    // Validate type
    if (type !== 'direct' && type !== 'group') {
      return NextResponse.json(
        { error: 'type must be "direct" or "group"' },
        { status: 400 }
      );
    }

    // Handle DM creation
    if (type === 'direct') {
      return await createDirectMessage(supabase, user.id, participantId);
    }

    // Handle Group creation
    if (type === 'group') {
      return await createGroupChat(supabase, user.id, name, participantIds);
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/chat:', error instanceof Error ? {
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
 * Helper function to get or create a DM room with a specific user
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateDMRoom(supabase: any, currentUserId: string, otherUserId: string) {
  // Cannot create a DM with yourself
  if (otherUserId === currentUserId) {
    return NextResponse.json(
      { error: 'Cannot create a direct message room with yourself' },
      { status: 400 }
    );
  }

  // Check if participant exists
  const { data: participant, error: participantError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', otherUserId)
    .single();

  if (participantError || !participant) {
    console.error('Error fetching participant profile:', participantError);
    return NextResponse.json(
      { error: 'User not found', details: participantError?.message },
      { status: 404 }
    );
  }

  // Check if user is blocked
  const { data: friendship } = await supabase
    .from('friendships')
    .select('status')
    .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`)
    .eq('status', 'blocked')
    .single();

  if (friendship) {
    return NextResponse.json(
      { error: 'Cannot message this user' },
      { status: 403 }
    );
  }

  // Use the database function to get or create the direct chat room
  console.log('[Chat API] Calling get_or_create_direct_chat_room with:', { user1_id: currentUserId, user2_id: otherUserId });
  const { data: roomId, error: roomError } = await supabase
    .rpc('get_or_create_direct_chat_room', {
      user1_id: currentUserId,
      user2_id: otherUserId,
    });

  if (roomError) {
    console.error('[Chat API] Error creating direct chat room:', roomError);
    // Check for common migration-related errors
    const errorMessage = roomError.message || '';
    if (errorMessage.includes('does not exist') || errorMessage.includes('function') || roomError.code === '42883') {
      return NextResponse.json(
        {
          error: 'Chat feature not available',
          details: 'The chat system database migrations may not have been applied. Please run: supabase db push or apply migration 00013_chat_schema.sql'
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create chat room', details: roomError.message },
      { status: 500 }
    );
  }

  if (!roomId) {
    console.error('[Chat API] No room ID returned from get_or_create_direct_chat_room');
    return NextResponse.json(
      { error: 'Failed to create chat room', details: 'No room ID returned from database' },
      { status: 500 }
    );
  }

  console.log('[Chat API] Room ID:', roomId);

  // Fetch the room details
  const { data: room, error: fetchError } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      type,
      name,
      is_active,
      created_at,
      chat_participants (
        user_id,
        last_read_at,
        is_muted,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', roomId)
    .single();

  if (fetchError) {
    console.error('[Chat API] Error fetching chat room:', fetchError);
    // Check for table not existing
    const errorMessage = fetchError.message || '';
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || fetchError.code === '42P01') {
      return NextResponse.json(
        {
          error: 'Chat feature not available',
          details: 'The chat_rooms table does not exist. Please run database migrations.'
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch chat room details', details: fetchError.message },
      { status: 500 }
    );
  }

  if (!room) {
    console.error('[Chat API] Room not found after creation, roomId:', roomId);
    return NextResponse.json(
      { error: 'Failed to fetch chat room details', details: 'Room not found after creation' },
      { status: 500 }
    );
  }

  const typedRoom = room as unknown as ChatRoomWithParticipants;
  const otherParticipants = typedRoom.chat_participants?.filter(
    p => p.user_id !== currentUserId
  ) || [];

  console.log('[Chat API] Successfully created/retrieved DM room:', { id: typedRoom.id, participantCount: typedRoom.chat_participants?.length });

  return NextResponse.json({
    room: {
      id: typedRoom.id,
      type: typedRoom.type,
      virtualType: 'direct' as VirtualChatType,
      isGroup: false,
      name: otherParticipants[0]?.profile?.display_name ||
            otherParticipants[0]?.profile?.username ||
            'Unknown User',
      isActive: typedRoom.is_active,
      createdAt: typedRoom.created_at,
      participantCount: typedRoom.chat_participants?.length || 0,
      participants: otherParticipants.map(p => ({
        id: p.user_id,
        username: p.profile?.username,
        displayName: p.profile?.display_name,
        avatarUrl: p.profile?.avatar_url,
      })),
    },
  });
}

/**
 * Helper function to create a DM
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDirectMessage(supabase: any, currentUserId: string, participantId: string) {
  // Validate participantId
  if (!participantId) {
    return NextResponse.json(
      { error: 'participantId is required for direct messages' },
      { status: 400 }
    );
  }

  // Use the getOrCreateDMRoom helper
  return getOrCreateDMRoom(supabase, currentUserId, participantId);
}

/**
 * Helper function to create a group chat
 */
async function createGroupChat(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  currentUserId: string,
  name: string | undefined,
  participantIds: string[] | undefined
) {
  // Validate participantIds
  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return NextResponse.json(
      { error: 'participantIds must be a non-empty array for group chats' },
      { status: 400 }
    );
  }

  // Remove duplicates and current user from participant list
  const uniqueParticipantIds = Array.from(new Set(participantIds)).filter(id => id !== currentUserId);

  if (uniqueParticipantIds.length === 0) {
    return NextResponse.json(
      { error: 'Cannot create a group with only yourself' },
      { status: 400 }
    );
  }

  // If only one participant and no name, this should be a DM
  if (uniqueParticipantIds.length === 1 && !name) {
    return createDirectMessage(supabase, currentUserId, uniqueParticipantIds[0]);
  }

  // Validate name if provided
  if (name && (typeof name !== 'string' || name.trim().length === 0)) {
    return NextResponse.json(
      { error: 'name must be a non-empty string' },
      { status: 400 }
    );
  }

  if (name && name.length > 128) {
    return NextResponse.json(
      { error: 'name must be 128 characters or less' },
      { status: 400 }
    );
  }

  // Verify all participants exist
  const { data: validParticipants, error: participantsError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', uniqueParticipantIds);

  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    return NextResponse.json(
      { error: 'Failed to verify participants', details: participantsError.message },
      { status: 500 }
    );
  }

  if (!validParticipants || validParticipants.length !== uniqueParticipantIds.length) {
    return NextResponse.json(
      { error: 'One or more participants not found' },
      { status: 404 }
    );
  }

  // Check for any blocked relationships
  const { data: blockedRelationships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'blocked')
    .or(
      uniqueParticipantIds.map(id =>
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${currentUserId})`
      ).join(',')
    );

  if (blockedRelationships && blockedRelationships.length > 0) {
    return NextResponse.json(
      { error: 'Cannot create group with blocked users' },
      { status: 403 }
    );
  }

  // Instead of separate inserts, use the SECURITY DEFINER function
  const { data: newRoomId, error: createRoomError } = await supabase
    .rpc('create_group_chat_room', {
      p_creator_id: currentUserId,
      p_name: name?.trim() || null,
      p_participant_ids: uniqueParticipantIds,
    });

  if (createRoomError) {
    console.error('Error creating group chat room:', createRoomError);
    return NextResponse.json(
      { error: 'Failed to create group chat room', details: createRoomError.message },
      { status: 500 }
    );
  }

  // Fetch the complete room details
  const { data: room, error: fetchError } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      type,
      name,
      is_active,
      created_at,
      chat_participants (
        user_id,
        last_read_at,
        is_muted,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('id', newRoomId)
    .single();

  if (fetchError) {
    console.error('Error fetching group chat room:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch group chat room details', details: fetchError.message },
      { status: 500 }
    );
  }

  const typedRoom = room as unknown as ChatRoomWithParticipants;
  const otherParticipants = typedRoom.chat_participants?.filter(
    p => p.user_id !== currentUserId
  ) || [];

  // Generate room name if not provided
  let roomName = typedRoom.name;
  if (!roomName && otherParticipants.length > 0) {
    const names = otherParticipants
      .slice(0, 3)
      .map(p => p.profile?.display_name || p.profile?.username || 'Unknown')
      .join(', ');
    roomName = otherParticipants.length > 3
      ? `${names} +${otherParticipants.length - 3} more`
      : names;
  }

  return NextResponse.json({
    room: {
      id: typedRoom.id,
      type: typedRoom.type,
      virtualType: 'group' as VirtualChatType,
      isGroup: true,
      name: roomName,
      isActive: typedRoom.is_active,
      createdAt: typedRoom.created_at,
      participantCount: typedRoom.chat_participants?.length || 0,
      participants: otherParticipants.map(p => ({
        id: p.user_id,
        username: p.profile?.username,
        displayName: p.profile?.display_name,
        avatarUrl: p.profile?.avatar_url,
      })),
    },
  }, { status: 201 });
}
