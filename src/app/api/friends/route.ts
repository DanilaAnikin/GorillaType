import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

// Type for the nested profile data from Supabase select
type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  level: number | null;
  last_activity_date: string | null;
  is_public: boolean | null;
} | null;

// Type for friendship with addressee (sent requests)
type SentFriendship = {
  id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  addressee: ProfileData;
};

// Type for friendship with requester (received requests)
type ReceivedFriendship = {
  id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  requester: ProfileData;
};

/**
 * GET /api/friends
 * List user's friends and friend requests
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
    const status = searchParams.get('status') as FriendshipStatus | 'all' | null;
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'

    // Fetch friendships where user is requester
    const { data: sentRequests, error: sentError } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        addressee:addressee_id (
          id,
          username,
          display_name,
          avatar_url,
          country_code,
          level,
          last_activity_date,
          is_public
        )
      `)
      .eq('requester_id', user.id)
      .neq('status', 'blocked');

    if (sentError) {
      console.error('Error fetching sent friendships:', {
        message: sentError.message,
        details: sentError.details,
        hint: sentError.hint,
        code: sentError.code,
      });
    }

    // Fetch friendships where user is addressee
    const { data: receivedRequests, error: receivedError } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        requester:requester_id (
          id,
          username,
          display_name,
          avatar_url,
          country_code,
          level,
          last_activity_date,
          is_public
        )
      `)
      .eq('addressee_id', user.id)
      .neq('status', 'blocked');

    if (receivedError) {
      console.error('Error fetching received friendships:', {
        message: receivedError.message,
        details: receivedError.details,
        hint: receivedError.hint,
        code: receivedError.code,
      });
    }

    if (sentError || receivedError) {
      return NextResponse.json(
        { error: 'Failed to fetch friends', details: (sentError || receivedError)?.message },
        { status: 500 }
      );
    }

    // Cast to proper types
    const typedSentRequests = (sentRequests || []) as unknown as SentFriendship[];
    const typedReceivedRequests = (receivedRequests || []) as unknown as ReceivedFriendship[];

    // Format sent requests
    const sent = typedSentRequests
      .filter(r => r.addressee?.is_public !== false)
      .map(r => ({
        id: r.id,
        status: r.status,
        direction: 'sent' as const,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        friend: {
          id: r.addressee?.id,
          username: r.addressee?.username,
          displayName: r.addressee?.display_name,
          avatarUrl: r.addressee?.avatar_url,
          country: r.addressee?.country_code,
          level: r.addressee?.level,
          lastSeenAt: r.addressee?.last_activity_date,
        },
      }));

    // Format received requests
    const received = typedReceivedRequests
      .filter(r => r.requester?.is_public !== false)
      .map(r => ({
        id: r.id,
        status: r.status,
        direction: 'received' as const,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        friend: {
          id: r.requester?.id,
          username: r.requester?.username,
          displayName: r.requester?.display_name,
          avatarUrl: r.requester?.avatar_url,
          country: r.requester?.country_code,
          level: r.requester?.level,
          lastSeenAt: r.requester?.last_activity_date,
        },
      }));

    // Combine and filter results
    let allFriendships = [...sent, ...received];

    // Filter by status
    if (status && status !== 'all') {
      allFriendships = allFriendships.filter(f => f.status === status);
    }

    // Filter by type
    if (type === 'sent') {
      allFriendships = allFriendships.filter(f => f.direction === 'sent');
    } else if (type === 'received') {
      allFriendships = allFriendships.filter(f => f.direction === 'received');
    }

    // Separate into categories
    const friends = allFriendships.filter(f => f.status === 'accepted');
    const pendingReceived = allFriendships.filter(
      f => f.status === 'pending' && f.direction === 'received'
    );
    const pendingSent = allFriendships.filter(
      f => f.status === 'pending' && f.direction === 'sent'
    );

    return NextResponse.json({
      friends,
      pendingReceived,
      pendingSent,
      counts: {
        friends: friends.length,
        pendingReceived: pendingReceived.length,
        pendingSent: pendingSent.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/friends:', error instanceof Error ? {
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
 * POST /api/friends
 * Send a friend request
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
    const { userId, username } = body;

    // Must provide either userId or username
    if (!userId && !username) {
      return NextResponse.json(
        { error: 'Must provide userId or username' },
        { status: 400 }
      );
    }

    // Find the target user
    let targetUserId = userId;

    if (!targetUserId && username) {
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .eq('is_public', true)
        .single();

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      targetUserId = targetUser.id;
    }

    // Cannot friend yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if a friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status, requester_id')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .single();

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends with this user' },
          { status: 409 }
        );
      }
      if (existingFriendship.status === 'pending') {
        // If they sent us a request, accept it instead
        if (existingFriendship.requester_id === targetUserId) {
          const { data: friendship, error: updateError } = await supabase
            .from('friendships')
            .update({
              status: 'accepted',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingFriendship.id)
            .select()
            .single();

          if (updateError) {
            return NextResponse.json(
              { error: 'Failed to accept friend request' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            friendship,
            message: 'Friend request accepted',
            action: 'accepted',
          });
        }
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 409 }
        );
      }
      if (existingFriendship.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot send friend request to this user' },
          { status: 403 }
        );
      }
      if (existingFriendship.status === 'declined') {
        // Allow re-sending after decline
        const { data: friendship, error: updateError } = await supabase
          .from('friendships')
          .update({
            status: 'pending',
            requester_id: user.id,
            addressee_id: targetUserId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingFriendship.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to send friend request' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          friendship,
          message: 'Friend request sent',
          action: 'sent',
        }, { status: 201 });
      }
    }

    // Create new friendship
    const { data: friendship, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating friendship:', insertError);
      return NextResponse.json(
        { error: 'Failed to send friend request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      friendship,
      message: 'Friend request sent',
      action: 'sent',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/friends
 * Accept or reject a friend request
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
    const { friendshipId, action } = body;

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'friendshipId is required' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'reject', 'block', 'unblock'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: accept, reject, block, or unblock' },
        { status: 400 }
      );
    }

    // Fetch the friendship
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .single();

    if (fetchError || !friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this friendship
    const isRequester = friendship.requester_id === user.id;
    const isAddressee = friendship.addressee_id === user.id;

    if (!isRequester && !isAddressee) {
      return NextResponse.json(
        { error: 'Not authorized to modify this friendship' },
        { status: 403 }
      );
    }

    // Handle different actions
    let newStatus: FriendshipStatus;

    switch (action) {
      case 'accept':
        // Only addressee can accept
        if (!isAddressee) {
          return NextResponse.json(
            { error: 'Only the recipient can accept a friend request' },
            { status: 403 }
          );
        }
        if (friendship.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only accept pending requests' },
            { status: 400 }
          );
        }
        newStatus = 'accepted';
        break;

      case 'reject':
        // Only addressee can reject
        if (!isAddressee) {
          return NextResponse.json(
            { error: 'Only the recipient can reject a friend request' },
            { status: 403 }
          );
        }
        if (friendship.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only reject pending requests' },
            { status: 400 }
          );
        }
        newStatus = 'declined';
        break;

      case 'block':
        // Either party can block
        newStatus = 'blocked';
        break;

      case 'unblock':
        // Only the blocker can unblock
        if (friendship.status !== 'blocked') {
          return NextResponse.json(
            { error: 'Friendship is not blocked' },
            { status: 400 }
          );
        }
        newStatus = 'declined';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the friendship
    const { data: updatedFriendship, error: updateError } = await supabase
      .from('friendships')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating friendship:', updateError);
      return NextResponse.json(
        { error: 'Failed to update friendship' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      friendship: updatedFriendship,
      message: `Friend request ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/friends
 * Remove a friend or cancel a friend request
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
    const friendshipId = searchParams.get('friendshipId');

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'friendshipId is required' },
        { status: 400 }
      );
    }

    // Fetch and verify the friendship
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('id', friendshipId)
      .single();

    if (fetchError || !friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this friendship
    if (friendship.requester_id !== user.id && friendship.addressee_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this friendship' },
        { status: 403 }
      );
    }

    // Delete the friendship
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (deleteError) {
      console.error('Error deleting friendship:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove friend' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Friend removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
