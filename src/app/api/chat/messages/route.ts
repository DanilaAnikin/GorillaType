import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Types for message data
type ChatMessageType = 'text' | 'result_share' | 'system';

type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
} | null;

type TypingResultData = {
  id: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  test_duration: number;
  test_mode: string;
  created_at: string;
} | null;

type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: ChatMessageType;
  result_id: string | null;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  sender: ProfileData;
  result: TypingResultData;
};

const MAX_CONTENT_LENGTH = 500;

/**
 * GET /api/chat/messages
 * Get messages for a room
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
    const roomId = searchParams.get('roomId');
    const before = searchParams.get('before'); // Cursor for pagination (message created_at)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, type, clan_id, race_room_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check access based on room type
    let hasAccess = false;

    switch (room.type) {
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
        if (room.race_room_id) {
          const { data: raceParticipant } = await supabase
            .from('race_participants')
            .select('id')
            .eq('room_id', room.race_room_id)
            .eq('user_id', user.id)
            .single();
          hasAccess = !!raceParticipant;
        }
        break;

      case 'clan':
        // Check if user is a clan member (placeholder)
        if (room.clan_id) {
          const { data: clanMember } = await supabase
            .from('clan_members')
            .select('id')
            .eq('clan_id', room.clan_id)
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

    // Build the query
    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        room_id,
        sender_id,
        content,
        message_type,
        result_id,
        is_deleted,
        edited_at,
        created_at,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url,
          level
        ),
        result:result_id (
          id,
          wpm,
          raw_wpm,
          accuracy,
          test_duration,
          test_mode,
          created_at
        )
      `)
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply cursor if provided
    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: messagesError.message },
        { status: 500 }
      );
    }

    // Check if there are more messages
    const hasMore = messages && messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : (messages || []);

    // Format messages
    const formattedMessages = (resultMessages as unknown as ChatMessage[]).map(msg => ({
      id: msg.id,
      roomId: msg.room_id,
      content: msg.content,
      messageType: msg.message_type,
      isDeleted: msg.is_deleted,
      editedAt: msg.edited_at,
      createdAt: msg.created_at,
      sender: {
        id: msg.sender?.id || msg.sender_id,
        username: msg.sender?.username,
        displayName: msg.sender?.display_name,
        avatarUrl: msg.sender?.avatar_url,
        level: msg.sender?.level || 1,
      },
      result: msg.result ? {
        id: msg.result.id,
        wpm: msg.result.wpm,
        rawWpm: msg.result.raw_wpm,
        accuracy: msg.result.accuracy,
        testDuration: msg.result.test_duration,
        testMode: msg.result.test_mode,
        createdAt: msg.result.created_at,
      } : null,
    }));

    // Reverse to get chronological order
    formattedMessages.reverse();

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
      cursor: hasMore && resultMessages.length > 0
        ? resultMessages[resultMessages.length - 1].created_at
        : null,
    });
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error instanceof Error ? {
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
 * POST /api/chat/messages
 * Send a message
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
    const { roomId, content, messageType = 'text', resultId } = body;

    // Validate required fields
    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `content must be ${MAX_CONTENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Validate content is not empty after trimming
    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content cannot be empty' },
        { status: 400 }
      );
    }

    // Validate message type
    const validMessageTypes: ChatMessageType[] = ['text', 'result_share', 'system'];
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `messageType must be one of: ${validMessageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // If result_share, validate resultId
    if (messageType === 'result_share' && !resultId) {
      return NextResponse.json(
        { error: 'resultId is required for result_share messages' },
        { status: 400 }
      );
    }

    // Verify user has access to this room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, type, clan_id, race_room_id, is_active')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (!room.is_active) {
      return NextResponse.json(
        { error: 'This room is no longer active' },
        { status: 400 }
      );
    }

    // Check if user is banned
    const { data: isBanned } = await supabase
      .rpc('is_user_banned_from_chat', {
        p_user_id: user.id,
        p_room_id: roomId,
      });

    if (isBanned) {
      return NextResponse.json(
        { error: 'You are banned from sending messages in this room' },
        { status: 403 }
      );
    }

    // Check access based on room type
    let hasAccess = false;

    switch (room.type) {
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
        if (room.race_room_id) {
          const { data: raceParticipant } = await supabase
            .from('race_participants')
            .select('id')
            .eq('room_id', room.race_room_id)
            .eq('user_id', user.id)
            .single();
          hasAccess = !!raceParticipant;
        }
        break;

      case 'clan':
        // Check if user is a clan member
        if (room.clan_id) {
          const { data: clanMember } = await supabase
            .from('clan_members')
            .select('id')
            .eq('clan_id', room.clan_id)
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

    // Validate result ownership if sharing a result
    if (messageType === 'result_share' && resultId) {
      const { data: result, error: resultError } = await supabase
        .from('typing_results')
        .select('id, user_id')
        .eq('id', resultId)
        .single();

      if (resultError || !result) {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }

      if (result.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You can only share your own results' },
          { status: 403 }
        );
      }
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType,
        result_id: resultId || null,
      })
      .select(`
        id,
        room_id,
        sender_id,
        content,
        message_type,
        result_id,
        is_deleted,
        edited_at,
        created_at,
        sender:sender_id (
          id,
          username,
          display_name,
          avatar_url,
          level
        ),
        result:result_id (
          id,
          wpm,
          raw_wpm,
          accuracy,
          test_duration,
          test_mode,
          created_at
        )
      `)
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message', details: insertError.message },
        { status: 500 }
      );
    }

    const typedMessage = message as unknown as ChatMessage;

    return NextResponse.json({
      message: {
        id: typedMessage.id,
        roomId: typedMessage.room_id,
        content: typedMessage.content,
        messageType: typedMessage.message_type,
        isDeleted: typedMessage.is_deleted,
        editedAt: typedMessage.edited_at,
        createdAt: typedMessage.created_at,
        sender: {
          id: typedMessage.sender?.id || typedMessage.sender_id,
          username: typedMessage.sender?.username,
          displayName: typedMessage.sender?.display_name,
          avatarUrl: typedMessage.sender?.avatar_url,
          level: typedMessage.sender?.level || 1,
        },
        result: typedMessage.result ? {
          id: typedMessage.result.id,
          wpm: typedMessage.result.wpm,
          rawWpm: typedMessage.result.raw_wpm,
          accuracy: typedMessage.result.accuracy,
          testDuration: typedMessage.result.test_duration,
          testMode: typedMessage.result.test_mode,
          createdAt: typedMessage.result.created_at,
        } : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chat/messages:', error instanceof Error ? {
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
 * DELETE /api/chat/messages
 * Delete a message (soft delete)
 */
export async function DELETE(request: NextRequest) {
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
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    // Fetch the message
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('id, sender_id, is_deleted')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user is the message author
    if (message.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Check if already deleted
    if (message.is_deleted) {
      return NextResponse.json(
        { error: 'Message is already deleted' },
        { status: 400 }
      );
    }

    // Soft delete the message
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error deleting message:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete message', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/chat/messages:', error instanceof Error ? {
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
