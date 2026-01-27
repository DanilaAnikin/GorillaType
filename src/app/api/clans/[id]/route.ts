import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Type for profile data
type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  level: number | null;
  country_code: string | null;
} | null;

// Type for clan member with profile
type ClanMemberWithProfile = {
  id: string;
  clan_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  tests_contributed: number;
  joined_at: string;
  profile: ProfileData;
};

// Type for clan with owner
type ClanWithOwner = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  banner_url: string | null;
  is_public: boolean;
  owner_id: string;
  member_count: number;
  total_tests: number;
  average_wpm: number;
  created_at: string;
  updated_at: string;
  owner: ProfileData;
};

/**
 * GET /api/clans/[id]
 * Get clan details including members and stats
 * Special case: /api/clans/me returns the authenticated user's clan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!id) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    let clanId = id;

    // Handle special case: 'me' returns the authenticated user's clan
    if (id === 'me') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Look up the user's clan membership
      const { data: membership, error: membershipError } = await supabase
        .from('clan_members')
        .select('clan_id')
        .eq('user_id', user.id)
        .single();

      if (membershipError) {
        if (membershipError.code === 'PGRST116') {
          // User is not in any clan
          return NextResponse.json({ clan: null });
        }
        console.error('Error fetching clan membership:', membershipError);
        return NextResponse.json(
          { error: 'Failed to fetch clan membership', details: membershipError.message },
          { status: 500 }
        );
      }

      clanId = membership.clan_id;
    }

    // Fetch clan details
    const { data: clan, error: clanError } = await supabase
      .from('clans')
      .select(`
        id,
        name,
        tag,
        description,
        banner_url,
        is_public,
        owner_id,
        member_count,
        total_tests,
        average_wpm,
        created_at,
        updated_at,
        owner:owner_id (
          id,
          username,
          display_name,
          avatar_url,
          level,
          country_code
        )
      `)
      .eq('id', clanId)
      .single();

    if (clanError) {
      if (clanError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Clan not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching clan:', clanError);
      return NextResponse.json(
        { error: 'Failed to fetch clan', details: clanError.message },
        { status: 500 }
      );
    }

    // Fetch clan members with profile info including tests_completed for stats calculation
    const { data: members, error: membersError } = await supabase
      .from('clan_members')
      .select(`
        id,
        clan_id,
        user_id,
        role,
        tests_contributed,
        joined_at,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url,
          level,
          country_code,
          tests_completed
        )
      `)
      .eq('clan_id', clanId)
      .order('role', { ascending: true })
      .order('tests_contributed', { ascending: false });

    if (membersError) {
      console.error('Error fetching clan members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch clan members', details: membersError.message },
        { status: 500 }
      );
    }

    // Type assertions
    const typedClan = clan as unknown as ClanWithOwner;
    const typedMembers = (members || []) as unknown as ClanMemberWithProfile[];

    // Check if current user is authenticated and get their membership
    let userMembership: { role: 'owner' | 'admin' | 'member'; joinedAt: string } | null = null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userMember = typedMembers.find(m => m.user_id === user.id);
      if (userMember) {
        userMembership = {
          role: userMember.role,
          joinedAt: userMember.joined_at,
        };
      }
    }

    // Calculate stats dynamically from member profiles
    const actualMemberCount = typedMembers.length;

    // Calculate total tests from all members' profiles
    const calculatedTotalTests = typedMembers.reduce(
      (sum, m) => sum + ((m.profile as ProfileData & { tests_completed?: number })?.tests_completed || 0),
      0
    );

    // Get member user IDs to fetch their average WPM from typing_results
    const memberUserIds = typedMembers.map(m => m.user_id);

    // Calculate average WPM from typing_results for all clan members
    let calculatedAverageWpm = 0;
    if (memberUserIds.length > 0) {
      const { data: wpmData, error: wpmError } = await supabase
        .from('typing_results')
        .select('user_id, wpm')
        .in('user_id', memberUserIds)
        .is('invalid_reason', null)
        .eq('afk_detected', false);

      if (!wpmError && wpmData && wpmData.length > 0) {
        // Calculate average WPM per user first, then overall average
        const userWpmMap = new Map<string, number[]>();
        wpmData.forEach(result => {
          const wpms = userWpmMap.get(result.user_id) || [];
          wpms.push(Number(result.wpm));
          userWpmMap.set(result.user_id, wpms);
        });

        // Calculate each user's average WPM
        const userAverages: number[] = [];
        userWpmMap.forEach((wpms) => {
          const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
          userAverages.push(avg);
        });

        // Overall clan average (average of user averages)
        if (userAverages.length > 0) {
          calculatedAverageWpm = userAverages.reduce((a, b) => a + b, 0) / userAverages.length;
        }
      }
    }

    // Calculate additional stats
    const totalTestsContributed = typedMembers.reduce(
      (sum, m) => sum + (m.tests_contributed || 0),
      0
    );

    // Role distribution
    const roleDistribution = {
      owners: typedMembers.filter((m) => m.role === 'owner').length,
      admins: typedMembers.filter((m) => m.role === 'admin').length,
      members: typedMembers.filter((m) => m.role === 'member').length,
    };

    // Format members for response
    const formattedMembers = typedMembers.map((member) => ({
      id: member.id,
      userId: member.user_id,
      username: member.profile?.username || 'Anonymous',
      displayName: member.profile?.display_name,
      avatarUrl: member.profile?.avatar_url,
      level: member.profile?.level || 1,
      country: member.profile?.country_code,
      role: member.role,
      testsContributed: member.tests_contributed,
      joinedAt: member.joined_at,
    }));

    // Sort members: owner first, then admins, then by tests contributed
    formattedMembers.sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const roleDiff = roleOrder[a.role] - roleOrder[b.role];
      if (roleDiff !== 0) return roleDiff;
      return b.testsContributed - a.testsContributed;
    });

    return NextResponse.json({
      clan: {
        id: typedClan.id,
        name: typedClan.name,
        tag: typedClan.tag,
        description: typedClan.description,
        bannerUrl: typedClan.banner_url,
        isPublic: typedClan.is_public,
        ownerId: typedClan.owner_id,
        maxMembers: 50, // Default max members per clan
        owner: {
          id: typedClan.owner?.id || typedClan.owner_id,
          username: typedClan.owner?.username,
          displayName: typedClan.owner?.display_name,
          avatarUrl: typedClan.owner?.avatar_url,
          level: typedClan.owner?.level || 1,
          country: typedClan.owner?.country_code,
        },
        memberCount: actualMemberCount,
        totalTests: calculatedTotalTests,
        averageWpm: Math.round(calculatedAverageWpm * 100) / 100,
        createdAt: typedClan.created_at,
        updatedAt: typedClan.updated_at,
      },
      members: formattedMembers,
      stats: {
        totalMembers: actualMemberCount,
        totalTests: calculatedTotalTests,
        totalTestsContributed,
        averageWpm: Math.round(calculatedAverageWpm * 100) / 100,
        roleDistribution,
      },
      userMembership,
    });
  } catch (error) {
    console.error('Error in GET /api/clans/[id]:', error instanceof Error ? {
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
 * POST /api/clans/[id]
 * Join a clan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clanId } = await params;
    const supabase = await createClient();

    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    // Check if clan exists
    const { data: clan, error: clanError } = await supabase
      .from('clans')
      .select('id, name')
      .eq('id', clanId)
      .single();

    if (clanError) {
      if (clanError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Clan not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching clan:', clanError);
      return NextResponse.json(
        { error: 'Failed to fetch clan', details: clanError.message },
        { status: 500 }
      );
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('clan_members')
      .select('id')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking membership:', memberCheckError);
      return NextResponse.json(
        { error: 'Failed to check membership', details: memberCheckError.message },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this clan' },
        { status: 400 }
      );
    }

    // Add user to clan_members with role 'member'
    const { data: membership, error: joinError } = await supabase
      .from('clan_members')
      .insert({
        clan_id: clanId,
        user_id: user.id,
        role: 'member',
        tests_contributed: 0,
      })
      .select('id, clan_id, user_id, role, tests_contributed, joined_at')
      .single();

    if (joinError) {
      console.error('Error joining clan:', joinError);
      return NextResponse.json(
        { error: 'Failed to join clan', details: joinError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully joined clan',
      membership: {
        id: membership.id,
        clanId: membership.clan_id,
        clanName: clan.name,
        userId: membership.user_id,
        role: membership.role,
        testsContributed: membership.tests_contributed,
        joinedAt: membership.joined_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/clans/[id]:', error instanceof Error ? {
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
 * DELETE /api/clans/[id]
 * Leave a clan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clanId } = await params;
    const supabase = await createClient();

    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    // Check if user is a member
    const { data: membership, error: memberCheckError } = await supabase
      .from('clan_members')
      .select('id, role')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .single();

    if (memberCheckError) {
      if (memberCheckError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'You are not a member of this clan' },
          { status: 400 }
        );
      }
      console.error('Error checking membership:', memberCheckError);
      return NextResponse.json(
        { error: 'Failed to check membership', details: memberCheckError.message },
        { status: 500 }
      );
    }

    // Prevent owner from leaving (must transfer ownership first)
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Clan owner cannot leave. Transfer ownership first.' },
        { status: 400 }
      );
    }

    // Remove user from clan_members
    const { error: leaveError } = await supabase
      .from('clan_members')
      .delete()
      .eq('id', membership.id);

    if (leaveError) {
      console.error('Error leaving clan:', leaveError);
      return NextResponse.json(
        { error: 'Failed to leave clan', details: leaveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully left clan',
    });
  } catch (error) {
    console.error('Error in DELETE /api/clans/[id]:', error instanceof Error ? {
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
 * PATCH /api/clans/[id]
 * Update clan details (owner/admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clanId } = await params;
    const supabase = await createClient();

    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!clanId) {
      return NextResponse.json(
        { error: 'Clan ID is required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin of the clan
    const { data: membership, error: membershipError } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this clan' },
        { status: 403 }
      );
    }

    const allowedRoles = ['owner', 'admin'];
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update clan details' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, isPublic } = body;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 3 || name.length > 32) {
        return NextResponse.json(
          { error: 'Name must be between 3 and 32 characters' },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (description !== undefined) {
      if (description !== null && (typeof description !== 'string' || description.length > 500)) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
      updates.description = description;
    }

    if (isPublic !== undefined) {
      updates.is_public = Boolean(isPublic);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the clan
    const { data: clan, error: updateError } = await supabase
      .from('clans')
      .update(updates)
      .eq('id', clanId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating clan:', updateError);

      // Handle unique constraint violations
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A clan with this name already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update clan', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        description: clan.description,
        bannerUrl: clan.banner_url,
        isPublic: clan.is_public,
        memberCount: clan.member_count,
        totalTests: clan.total_tests,
        averageWpm: parseFloat(String(clan.average_wpm)),
        createdAt: clan.created_at,
        updatedAt: clan.updated_at,
      },
      message: 'Clan updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/clans/[id]:', error instanceof Error ? {
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
