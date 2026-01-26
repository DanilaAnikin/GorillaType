import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TestMode } from '@/types/test';

type LeaderboardPeriod = 'all' | 'day' | 'week' | 'month';

/**
 * GET /api/leaderboards
 * Fetch leaderboard with filters (mode, modeConfig, language, timeFrame)
 * Returns ranked entries with user info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const mode = (searchParams.get('mode') || 'time') as TestMode;
    const timeLimit = searchParams.get('timeLimit') ? parseInt(searchParams.get('timeLimit')!, 10) : 30;
    const wordLimit = searchParams.get('wordLimit') ? parseInt(searchParams.get('wordLimit')!, 10) : null;
    const language = searchParams.get('language') || 'english';
    const period = (searchParams.get('period') || 'all') as LeaderboardPeriod;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Calculate period start date for filtering
    let periodStart: string | null = null;
    const now = new Date();

    switch (period) {
      case 'day':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
        periodStart = weekStart.toISOString();
        break;
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'all':
      default:
        periodStart = null;
    }

    // Build leaderboard query using the correct 'leaderboards' table
    // The leaderboards table has denormalized data including username
    // Note: We fetch all matching entries and deduplicate in JS to ensure
    // only ONE entry per user is returned (the one with highest WPM)
    let query = supabase
      .from('leaderboards')
      .select(`
        id,
        user_id,
        result_id,
        test_mode,
        test_duration,
        test_word_count,
        test_language,
        username,
        wpm,
        accuracy,
        country_code,
        rank,
        achieved_at,
        created_at,
        updated_at
      `)
      .eq('test_mode', mode)
      .eq('test_language', language);

    // Add mode-specific filters
    if (mode === 'time' && timeLimit) {
      query = query.eq('test_duration', timeLimit);
    } else if (mode === 'words' && wordLimit) {
      query = query.eq('test_word_count', wordLimit);
    }

    // Filter by period start if applicable
    if (periodStart) {
      query = query.gte('achieved_at', periodStart);
    }

    // Order by WPM (highest first), then by achieved_at (earlier = better for ties)
    query = query
      .order('wpm', { ascending: false })
      .order('achieved_at', { ascending: true });

    const { data: rawEntries, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Deduplicate: keep only the highest WPM entry per user
    // Since results are already sorted by WPM desc, the first occurrence of each user is their best
    const seenUsers = new Set<string>();
    const deduplicatedEntries = (rawEntries || []).filter((entry) => {
      if (seenUsers.has(entry.user_id)) {
        return false; // Skip duplicate user entries
      }
      seenUsers.add(entry.user_id);
      return true;
    });

    // Total unique users count (for pagination)
    const count = deduplicatedEntries.length;

    // Apply pagination AFTER deduplication
    const entries = deduplicatedEntries.slice(offset, offset + limit);

    // Fetch avatar URLs for all users in this page
    const userIds = entries.map((e) => e.user_id);
    let avatarMap: Record<string, { avatar_url: string | null; display_name: string | null; level: number }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url, display_name, level')
        .in('id', userIds);

      if (profiles) {
        avatarMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = {
            avatar_url: profile.avatar_url,
            display_name: profile.display_name,
            level: profile.level || 1,
          };
          return acc;
        }, {} as Record<string, { avatar_url: string | null; display_name: string | null; level: number }>);
      }
    }

    // Format response with proper ranking
    // Note: The frontend LeaderboardEntry interface expects 'id' and 'date' fields
    const rankedEntries = (entries || []).map((entry, index) => ({
      id: entry.id,
      rank: entry.rank || offset + index + 1,
      userId: entry.user_id,
      username: entry.username || 'Anonymous',
      displayName: avatarMap[entry.user_id]?.display_name || null,
      avatarUrl: avatarMap[entry.user_id]?.avatar_url || null,
      country: entry.country_code,
      level: avatarMap[entry.user_id]?.level || 1,
      wpm: Number(entry.wpm),
      accuracy: Number(entry.accuracy),
      consistency: 0, // Not stored in leaderboards table
      date: entry.achieved_at,
    }));

    // Get current user's rank if authenticated
    let userRank = null;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Build user query with EXACT same filters as main leaderboard
      let userQuery = supabase
        .from('leaderboards')
        .select('rank, wpm, accuracy, username')
        .eq('user_id', user.id)
        .eq('test_mode', mode)
        .eq('test_language', language);

      if (mode === 'time' && timeLimit) {
        userQuery = userQuery.eq('test_duration', timeLimit);
      } else if (mode === 'words' && wordLimit) {
        userQuery = userQuery.eq('test_word_count', wordLimit);
      }

      // Apply the same period filter as the main leaderboard query
      if (periodStart) {
        userQuery = userQuery.gte('achieved_at', periodStart);
      }

      // Get user's best entry (highest WPM) - use maybeSingle to handle 0 or 1+ results
      const { data: userEntry } = await userQuery
        .order('wpm', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userEntry) {
        // For period-filtered queries, calculate the dynamic rank
        // by counting how many entries have higher WPM
        let dynamicRank = userEntry.rank;

        if (periodStart || period !== 'all') {
          // Count entries with higher WPM than user's best
          let rankQuery = supabase
            .from('leaderboards')
            .select('id', { count: 'exact', head: true })
            .eq('test_mode', mode)
            .eq('test_language', language)
            .gt('wpm', userEntry.wpm);

          if (mode === 'time' && timeLimit) {
            rankQuery = rankQuery.eq('test_duration', timeLimit);
          } else if (mode === 'words' && wordLimit) {
            rankQuery = rankQuery.eq('test_word_count', wordLimit);
          }

          if (periodStart) {
            rankQuery = rankQuery.gte('achieved_at', periodStart);
          }

          const { count: higherCount } = await rankQuery;
          dynamicRank = (higherCount || 0) + 1;
        }

        // Get the user's profile for additional info
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        // Count user's tests for this mode/config
        // Note: The table is 'typing_results' with columns: test_mode, test_language, test_duration, test_word_count
        let testCountQuery = supabase
          .from('typing_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('test_mode', mode)
          .eq('test_language', language);

        if (mode === 'time' && timeLimit) {
          testCountQuery = testCountQuery.eq('test_duration', timeLimit);
        } else if (mode === 'words' && wordLimit) {
          testCountQuery = testCountQuery.eq('test_word_count', wordLimit);
        }

        const { count: testCount } = await testCountQuery;

        userRank = {
          rank: dynamicRank,
          username: profile?.username || userEntry.username || user.email?.split('@')[0] || 'User',
          avatarUrl: profile?.avatar_url || null,
          wpm: Number(userEntry.wpm),
          accuracy: Number(userEntry.accuracy),
          testCount: testCount || 0,
          totalEntries: count || 0,
          percentile: count ? ((count - dynamicRank) / count) * 100 : undefined,
        };
      }
    }

    return NextResponse.json({
      entries: rankedEntries,
      total: count || 0,
      filters: {
        mode,
        timeLimit: mode === 'time' ? timeLimit : null,
        wordLimit: mode === 'words' ? wordLimit : null,
        language,
        period,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      userRank,
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
