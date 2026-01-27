import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/[username]/activity
 * Fetch a user's activity heatmap data and badge/achievement progress.
 *
 * Query params:
 * - days: number of days to include (default 500, 0 = all data)
 *
 * Returns:
 * - activity: Array of { date: string (YYYY-MM-DD), count: number }
 * - badges: Array of achievement data with progress tracking
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const supabase = await createClient();

    // Parse days query parameter (default 500, 0 means all data)
    const searchParams = _request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam !== null ? parseInt(daysParam, 10) : 500;
    const isMaxRange = days === 0;

    // Look up user by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_public')
      .eq('username', decodedUsername)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the profile is public, or if the requester is the profile owner
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const isOwner = currentUser?.id === profile.id;

    if (!profile.is_public && !isOwner) {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      );
    }

    // Build query for typing results within the requested range
    const now = new Date();

    let resultsQuery = supabase
      .from('typing_results')
      .select('completed_at')
      .eq('user_id', profile.id)
      .order('completed_at', { ascending: true });

    if (!isMaxRange) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (days - 1));
      const startDateStr = startDate.toISOString().split('T')[0];
      resultsQuery = resultsQuery.gte('completed_at', `${startDateStr}T00:00:00.000Z`);
    }

    // Fetch typing results for the configured range
    const { data: results, error: resultsError } = await resultsQuery;

    if (resultsError) {
      console.error('[Activity API] Error fetching typing results:', resultsError.message);
    }

    // Group results by date to build activity heatmap data
    const activityMap = new Map<string, number>();
    (results || []).forEach((result) => {
      const dateStr = result.completed_at.split('T')[0];
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    const activity = Array.from(activityMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fetch achievements for this user
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select(`
        id,
        achievement_key,
        achievement_name,
        achievement_description,
        achievement_icon,
        tier,
        is_completed,
        progress,
        target,
        unlocked_at
      `)
      .eq('user_id', profile.id);

    if (achievementsError) {
      console.error('[Activity API] Error fetching achievements:', achievementsError.message);
    }

    // Map achievements to badge format
    const badges = (achievements || []).map((a) => ({
      id: a.id,
      achievement_key: a.achievement_key,
      achievement_name: a.achievement_name,
      achievement_description: a.achievement_description || '',
      achievement_icon: a.achievement_icon || 'award',
      tier: a.tier ?? 1,
      is_completed: a.is_completed ?? false,
      progress: a.progress ?? 0,
      target: a.target ?? 1,
      unlocked_at: a.unlocked_at || null,
    }));

    return NextResponse.json({ activity, badges });
  } catch (error) {
    console.error('Error in GET /api/users/[username]/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
