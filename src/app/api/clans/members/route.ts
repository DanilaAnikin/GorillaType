import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ClanRole = 'owner' | 'admin' | 'member';

/**
 * POST /api/clans/members
 * Join a clan (via invite code or direct)
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
    const { clanId, inviteCode } = body;

    if (!clanId && !inviteCode) {
      return NextResponse.json(
        { error: 'Must provide clanId or inviteCode' },
        { status: 400 }
      );
    }

    let targetClanId = clanId;

    // If inviteCode is provided, find the clan from the invite
    if (inviteCode) {
      const { data: invite, error: inviteError } = await supabase
        .from('clan_invites')
        .select('id, clan_id, invitee_id, status, expires_at')
        .eq('code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        return NextResponse.json(
          { error: 'Invalid or expired invite code' },
          { status: 404 }
        );
      }

      // If invite is for a specific user, verify it matches
      if (invite.invitee_id && invite.invitee_id !== user.id) {
        return NextResponse.json(
          { error: 'This invite is for a different user' },
          { status: 403 }
        );
      }

      targetClanId = invite.clan_id;

      // Mark invite as accepted if it was for a specific user
      if (invite.invitee_id) {
        await supabase
          .from('clan_invites')
          .update({ status: 'accepted' })
          .eq('id', invite.id);
      }
    }

    // Check if clan exists
    const { data: clan, error: clanError } = await supabase
      .from('clans')
      .select('id, name, tag')
      .eq('id', targetClanId)
      .single();

    if (clanError || !clan) {
      return NextResponse.json(
        { error: 'Clan not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('clan_members')
      .select('id')
      .eq('clan_id', targetClanId)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this clan' },
        { status: 409 }
      );
    }

    // If joining without invite code, check for a valid invite
    if (!inviteCode) {
      const { data: directInvite } = await supabase
        .from('clan_invites')
        .select('id')
        .eq('clan_id', targetClanId)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      // Also check for open (code-based) invites
      const { data: openInvite } = await supabase
        .from('clan_invites')
        .select('id')
        .eq('clan_id', targetClanId)
        .eq('status', 'pending')
        .not('code', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (!directInvite && !openInvite) {
        return NextResponse.json(
          { error: 'No valid invite found for this clan. You need an invite to join.' },
          { status: 403 }
        );
      }

      // Mark direct invite as accepted if found
      if (directInvite) {
        await supabase
          .from('clan_invites')
          .update({ status: 'accepted' })
          .eq('id', directInvite.id);
      }
    }

    // Add user as member
    const { data: membership, error: joinError } = await supabase
      .from('clan_members')
      .insert({
        clan_id: targetClanId,
        user_id: user.id,
        role: 'member',
      })
      .select()
      .single();

    if (joinError) {
      console.error('Error joining clan:', joinError);
      return NextResponse.json(
        { error: 'Failed to join clan', details: joinError.message },
        { status: 500 }
      );
    }

    // Fetch user profile for response
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, level')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      membership: {
        id: membership.id,
        clanId: membership.clan_id,
        userId: membership.user_id,
        role: membership.role,
        testsContributed: membership.tests_contributed,
        joinedAt: membership.joined_at,
        user: {
          id: user.id,
          username: userProfile?.username || 'Anonymous',
          displayName: userProfile?.display_name,
          avatarUrl: userProfile?.avatar_url,
          level: userProfile?.level || 1,
        },
      },
      clan: {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
      },
      message: `Successfully joined clan "${clan.name}"`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clans/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clans/members
 * Update member role (admin only)
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
    const { clanId, userId, role } = body;

    if (!clanId) {
      return NextResponse.json(
        { error: 'clanId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      );
    }

    const validRoles: ClanRole[] = ['admin', 'member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 }
      );
    }

    // Check if requesting user is owner or admin
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .single();

    if (requesterError || !requesterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this clan' },
        { status: 403 }
      );
    }

    const requesterRole = requesterMembership.role as ClanRole;

    // Only owners and admins can change roles
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can update member roles' },
        { status: 403 }
      );
    }

    // Fetch target member
    const { data: targetMember, error: targetError } = await supabase
      .from('clan_members')
      .select('id, role, user_id')
      .eq('clan_id', clanId)
      .eq('user_id', userId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Target user is not a member of this clan' },
        { status: 404 }
      );
    }

    const targetRole = targetMember.role as ClanRole;

    // Cannot change owner role (ownership transfer is separate)
    if (targetRole === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change the role of the clan owner' },
        { status: 403 }
      );
    }

    // Cannot set someone to owner
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot promote to owner. Use ownership transfer instead.' },
        { status: 400 }
      );
    }

    // Admins cannot change other admins
    if (requesterRole === 'admin' && targetRole === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot change the role of other admins' },
        { status: 403 }
      );
    }

    // Cannot change own role
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update the role
    const { data: updatedMember, error: updateError } = await supabase
      .from('clan_members')
      .update({ role })
      .eq('id', targetMember.id)
      .select(`
        id,
        clan_id,
        user_id,
        role,
        tests_contributed,
        joined_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    // Fetch target user profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url, level')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      membership: {
        id: updatedMember.id,
        clanId: updatedMember.clan_id,
        userId: updatedMember.user_id,
        role: updatedMember.role,
        testsContributed: updatedMember.tests_contributed,
        joinedAt: updatedMember.joined_at,
        user: {
          id: userId,
          username: targetProfile?.username || 'Anonymous',
          displayName: targetProfile?.display_name,
          avatarUrl: targetProfile?.avatar_url,
          level: targetProfile?.level || 1,
        },
      },
      message: `Member role updated to ${role}`,
    });
  } catch (error) {
    console.error('Error in PATCH /api/clans/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clans/members
 * Leave clan or kick member
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
    const clanId = searchParams.get('clanId');
    const userId = searchParams.get('userId');

    if (!clanId) {
      return NextResponse.json(
        { error: 'clanId is required' },
        { status: 400 }
      );
    }

    // Determine target user (self if not specified)
    const targetUserId = userId || user.id;
    const isSelfLeaving = targetUserId === user.id;

    // Check if requester is a member
    const { data: requesterMembership, error: requesterError } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .single();

    if (requesterError || !requesterMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this clan' },
        { status: 403 }
      );
    }

    const requesterRole = requesterMembership.role as ClanRole;

    // If kicking someone else, check permissions
    if (!isSelfLeaving) {
      // Only owners and admins can kick members
      if (requesterRole !== 'owner' && requesterRole !== 'admin') {
        return NextResponse.json(
          { error: 'Only owners and admins can remove other members' },
          { status: 403 }
        );
      }

      // Fetch target member
      const { data: targetMember, error: targetError } = await supabase
        .from('clan_members')
        .select('role')
        .eq('clan_id', clanId)
        .eq('user_id', targetUserId)
        .single();

      if (targetError || !targetMember) {
        return NextResponse.json(
          { error: 'Target user is not a member of this clan' },
          { status: 404 }
        );
      }

      const targetRole = targetMember.role as ClanRole;

      // Cannot kick the owner
      if (targetRole === 'owner') {
        return NextResponse.json(
          { error: 'Cannot kick the clan owner' },
          { status: 403 }
        );
      }

      // Admins cannot kick other admins
      if (requesterRole === 'admin' && targetRole === 'admin') {
        return NextResponse.json(
          { error: 'Admins cannot kick other admins' },
          { status: 403 }
        );
      }
    } else {
      // Self-leaving: owner cannot leave without transferring ownership
      if (requesterRole === 'owner') {
        return NextResponse.json(
          { error: 'Clan owner cannot leave without transferring ownership first' },
          { status: 400 }
        );
      }
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('clan_members')
      .delete()
      .eq('clan_id', clanId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('Error removing clan member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member from clan' },
        { status: 500 }
      );
    }

    // Fetch clan name for response
    const { data: clan } = await supabase
      .from('clans')
      .select('name')
      .eq('id', clanId)
      .single();

    const message = isSelfLeaving
      ? `Successfully left clan "${clan?.name || 'Unknown'}"`
      : `Member removed from clan "${clan?.name || 'Unknown'}"`;

    return NextResponse.json({
      message,
      clanId,
      userId: targetUserId,
      action: isSelfLeaving ? 'left' : 'kicked',
    });
  } catch (error) {
    console.error('Error in DELETE /api/clans/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
