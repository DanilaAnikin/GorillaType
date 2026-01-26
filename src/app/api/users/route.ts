import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users
 * Search users by username
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // Require at least 2 characters for search
    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search for users (only public profiles)
    const { data: users, error, count } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        country_code,
        level,
        tests_completed,
        created_at
      `, { count: 'exact' })
      .eq('is_public', true)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order('tests_completed', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    // Format response
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      country: user.country_code,
      level: user.level,
      testsCompleted: user.tests_completed,
      joinedAt: user.created_at,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users
 * Update current user's profile
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

    // Define allowed update fields (matching database schema)
    const allowedFields = [
      'username',
      'display_name',
      'avatar_url',
      'bio',
      'country_code',
      'keyboard',
      'is_public',
    ];

    // Filter out non-allowed fields
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle social_links JSONB field separately
    if (body.social_links && typeof body.social_links === 'object') {
      updates.social_links = body.social_links;
    }

    // Handle legacy field names (map to correct database columns)
    if (body.country !== undefined && updates.country_code === undefined) {
      updates.country_code = body.country;
    }

    // Validate username if being updated
    if (updates.username) {
      const username = updates.username as string;

      // Username validation rules
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 20 characters' },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        );
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
    }

    // Validate bio length
    if (updates.bio && (updates.bio as string).length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate avatar URL if provided
    if (updates.avatar_url) {
      try {
        new URL(updates.avatar_url as string);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL for avatar' },
          { status: 400 }
        );
      }
    }

    // Validate country code (if provided)
    if (updates.country_code && (updates.country_code as string).length !== 2) {
      return NextResponse.json(
        { error: 'Country must be a 2-letter ISO code' },
        { status: 400 }
      );
    }

    // Update the profile
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        country: profile.country_code,
        keyboard: profile.keyboard,
        socialLinks: profile.social_links,
        isPublic: profile.is_public,
        updatedAt: profile.updated_at,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
