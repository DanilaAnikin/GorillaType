import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ClanRole = 'owner' | 'admin' | 'member';

// Type for the nested profile data from Supabase select
type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
} | null;

// Type for clan with owner data
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
 * GET /api/clans
 * List clans with optional search query
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'members';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
          avatar_url
        )
      `, { count: 'exact' });

    // Apply search filter
    if (q) {
      query = query.or(`name.ilike.%${q}%,tag.ilike.%${q}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'wpm':
        query = query.order('average_wpm', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'members':
      default:
        query = query.order('member_count', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clans, error, count } = await query;

    if (error) {
      console.error('Error fetching clans:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: 'Failed to fetch clans', details: error.message },
        { status: 500 }
      );
    }

    const typedClans = (clans || []) as unknown as ClanWithOwner[];

    // Get all clan IDs to fetch member counts and stats
    const clanIds = typedClans.map(c => c.id);

    // Fetch actual member counts for all clans
    const { data: memberCounts } = await supabase
      .from('clan_members')
      .select('clan_id, user_id, profile:user_id(tests_completed)')
      .in('clan_id', clanIds);

    // Calculate member counts and total tests per clan
    type MemberWithProfile = {
      clan_id: string;
      user_id: string;
      profile: { tests_completed: number } | { tests_completed: number }[] | null;
    };
    const clanStatsMap = new Map<string, { memberCount: number; totalTests: number; memberUserIds: string[] }>();
    ((memberCounts || []) as MemberWithProfile[]).forEach((member) => {
      const stats = clanStatsMap.get(member.clan_id) || { memberCount: 0, totalTests: 0, memberUserIds: [] };
      stats.memberCount++;
      // Handle both single object and array formats from Supabase
      const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
      stats.totalTests += profile?.tests_completed || 0;
      stats.memberUserIds.push(member.user_id);
      clanStatsMap.set(member.clan_id, stats);
    });

    // Get all unique member user IDs across all clans for WPM calculation
    const allMemberUserIds = [...new Set(((memberCounts || []) as MemberWithProfile[]).map((m) => m.user_id))];

    // Fetch average WPM for all members
    const userWpmMap = new Map<string, number>();
    if (allMemberUserIds.length > 0) {
      const { data: wpmData } = await supabase
        .from('typing_results')
        .select('user_id, wpm')
        .in('user_id', allMemberUserIds)
        .is('invalid_reason', null)
        .eq('afk_detected', false);

      if (wpmData && wpmData.length > 0) {
        // Group WPMs by user
        type WpmResult = { user_id: string; wpm: number };
        const userWpmsTemp = new Map<string, number[]>();
        (wpmData as WpmResult[]).forEach((result) => {
          const wpms = userWpmsTemp.get(result.user_id) || [];
          wpms.push(Number(result.wpm));
          userWpmsTemp.set(result.user_id, wpms);
        });

        // Calculate average per user
        userWpmsTemp.forEach((wpms, userId) => {
          userWpmMap.set(userId, wpms.reduce((a, b) => a + b, 0) / wpms.length);
        });
      }
    }

    // Format the response with calculated stats
    const formattedClans = typedClans.map((clan) => {
      const stats = clanStatsMap.get(clan.id) || { memberCount: 0, totalTests: 0, memberUserIds: [] };

      // Calculate average WPM for this clan's members
      let clanAvgWpm = 0;
      const memberAvgs = stats.memberUserIds
        .map(userId => userWpmMap.get(userId))
        .filter((avg): avg is number => avg !== undefined);
      if (memberAvgs.length > 0) {
        clanAvgWpm = memberAvgs.reduce((a, b) => a + b, 0) / memberAvgs.length;
      }

      return {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        description: clan.description,
        bannerUrl: clan.banner_url,
        isPublic: clan.is_public,
        owner: {
          id: clan.owner?.id || clan.owner_id,
          username: clan.owner?.username,
          displayName: clan.owner?.display_name,
          avatarUrl: clan.owner?.avatar_url,
        },
        memberCount: stats.memberCount,
        totalTests: stats.totalTests,
        averageWpm: Math.round(clanAvgWpm * 100) / 100,
        createdAt: clan.created_at,
        updatedAt: clan.updated_at,
      };
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      clans: formattedClans,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/clans:', error instanceof Error ? {
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
 * POST /api/clans
 * Create a new clan
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
    const { name, tag, description, banner_url, isPublic } = body;

    // Validate name
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (name.length < 3 || name.length > 32) {
      return NextResponse.json(
        { error: 'Name must be between 3 and 32 characters' },
        { status: 400 }
      );
    }

    // Validate tag
    if (!tag || typeof tag !== 'string') {
      return NextResponse.json(
        { error: 'Tag is required' },
        { status: 400 }
      );
    }

    const upperTag = tag.toUpperCase();
    if (upperTag.length < 2 || upperTag.length > 5) {
      return NextResponse.json(
        { error: 'Tag must be between 2 and 5 characters' },
        { status: 400 }
      );
    }

    if (!/^[A-Z]+$/.test(upperTag)) {
      return NextResponse.json(
        { error: 'Tag must contain only uppercase letters (A-Z)' },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Check if user is already in a clan (optional: uncomment if users can only be in one clan)
    // const { data: existingMembership } = await supabase
    //   .from('clan_members')
    //   .select('id')
    //   .eq('user_id', user.id)
    //   .single();
    //
    // if (existingMembership) {
    //   return NextResponse.json(
    //     { error: 'You are already a member of a clan' },
    //     { status: 409 }
    //   );
    // }

    // Check if name or tag already exists
    const { data: existingClan } = await supabase
      .from('clans')
      .select('id, name, tag')
      .or(`name.eq.${name},tag.eq.${upperTag}`)
      .single();

    if (existingClan) {
      if (existingClan.name.toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          { error: 'A clan with this name already exists' },
          { status: 409 }
        );
      }
      if (existingClan.tag === upperTag) {
        return NextResponse.json(
          { error: 'A clan with this tag already exists' },
          { status: 409 }
        );
      }
    }

    // Create the clan (trigger will automatically add owner as member)
    const { data: clan, error: createError } = await supabase
      .from('clans')
      .insert({
        name,
        tag: upperTag,
        description: description || null,
        banner_url: banner_url || null,
        owner_id: user.id,
        is_public: isPublic !== false, // Default to true if not provided
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating clan:', createError);

      // Handle unique constraint violations
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A clan with this name or tag already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create clan', details: createError.message },
        { status: 500 }
      );
    }

    // Fetch owner profile for response
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      clan: {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        description: clan.description,
        bannerUrl: clan.banner_url,
        isPublic: clan.is_public,
        owner: {
          id: user.id,
          username: ownerProfile?.username || 'Anonymous',
          displayName: ownerProfile?.display_name,
          avatarUrl: ownerProfile?.avatar_url,
        },
        memberCount: clan.member_count,
        totalTests: clan.total_tests,
        averageWpm: parseFloat(String(clan.average_wpm)),
        createdAt: clan.created_at,
        updatedAt: clan.updated_at,
      },
      message: 'Clan created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clans
 * Update clan details (owner/admin only)
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
    const { clanId, name, tag, description, banner_url, isPublic } = body;

    if (!clanId) {
      return NextResponse.json(
        { error: 'clanId is required' },
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

    const allowedRoles: ClanRole[] = ['owner', 'admin'];
    if (!allowedRoles.includes(membership.role as ClanRole)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update clan details' },
        { status: 403 }
      );
    }

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

    if (tag !== undefined) {
      const upperTag = tag.toUpperCase();
      if (upperTag.length < 2 || upperTag.length > 5) {
        return NextResponse.json(
          { error: 'Tag must be between 2 and 5 characters' },
          { status: 400 }
        );
      }
      if (!/^[A-Z]+$/.test(upperTag)) {
        return NextResponse.json(
          { error: 'Tag must contain only uppercase letters (A-Z)' },
          { status: 400 }
        );
      }
      updates.tag = upperTag;
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

    if (banner_url !== undefined) {
      updates.banner_url = banner_url;
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
      .select(`
        *,
        owner:owner_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating clan:', updateError);

      // Handle unique constraint violations
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A clan with this name or tag already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update clan', details: updateError.message },
        { status: 500 }
      );
    }

    const typedClan = clan as unknown as ClanWithOwner;

    return NextResponse.json({
      clan: {
        id: typedClan.id,
        name: typedClan.name,
        tag: typedClan.tag,
        description: typedClan.description,
        bannerUrl: typedClan.banner_url,
        isPublic: typedClan.is_public,
        owner: {
          id: typedClan.owner?.id || typedClan.owner_id,
          username: typedClan.owner?.username,
          displayName: typedClan.owner?.display_name,
          avatarUrl: typedClan.owner?.avatar_url,
        },
        memberCount: typedClan.member_count,
        totalTests: typedClan.total_tests,
        averageWpm: parseFloat(String(typedClan.average_wpm)),
        createdAt: typedClan.created_at,
        updatedAt: typedClan.updated_at,
      },
      message: 'Clan updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/clans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clans
 * Delete clan (owner only)
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

    if (!clanId) {
      return NextResponse.json(
        { error: 'clanId is required' },
        { status: 400 }
      );
    }

    // Fetch the clan and verify ownership
    const { data: clan, error: fetchError } = await supabase
      .from('clans')
      .select('id, owner_id, name')
      .eq('id', clanId)
      .single();

    if (fetchError || !clan) {
      return NextResponse.json(
        { error: 'Clan not found' },
        { status: 404 }
      );
    }

    if (clan.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the clan owner can delete the clan' },
        { status: 403 }
      );
    }

    // Delete the clan (cascade will handle members and invites)
    const { error: deleteError } = await supabase
      .from('clans')
      .delete()
      .eq('id', clanId);

    if (deleteError) {
      console.error('Error deleting clan:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete clan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Clan "${clan.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/clans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
