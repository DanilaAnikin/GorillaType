import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/stats
 * Fetch user's statistics summary
 * Includes averages, totals, trends, and personal bests
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

    // Parse query parameters for optional filtering
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode');
    const language = searchParams.get('language');
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Calculate date range for trends
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch user profile for basic stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('tests_completed, time_typing_ms, current_streak, longest_streak, xp, level')
      .eq('id', user.id)
      .single();

    // Build base query for results
    let resultsQuery = supabase
      .from('typing_results')
      .select('wpm, raw_wpm, accuracy, consistency, test_duration, completed_at, test_mode, test_language')
      .eq('user_id', user.id);

    if (mode) {
      resultsQuery = resultsQuery.eq('test_mode', mode);
    }
    if (language) {
      resultsQuery = resultsQuery.eq('test_language', language);
    }

    const { data: allResults } = await resultsQuery;

    // Filter results for trend analysis (within date range)
    const recentResults = (allResults || []).filter(
      r => new Date(r.completed_at) >= startDate
    );

    // Calculate overall statistics
    const stats = calculateStats(allResults || []);
    const recentStats = calculateStats(recentResults);

    // Fetch personal bests
    let pbQuery = supabase
      .from('personal_bests')
      .select('test_mode, test_duration, test_word_count, test_language, punctuation_enabled, numbers_enabled, wpm, accuracy, achieved_at')
      .eq('user_id', user.id);

    if (mode) {
      pbQuery = pbQuery.eq('test_mode', mode);
    }
    if (language) {
      pbQuery = pbQuery.eq('test_language', language);
    }

    const { data: personalBests } = await pbQuery;

    // Calculate trends (compare recent period to previous period)
    const previousPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousResults = (allResults || []).filter(
      r => {
        const date = new Date(r.completed_at);
        return date >= previousPeriodStart && date < startDate;
      }
    );
    const previousStats = calculateStats(previousResults);
    const trends = calculateTrends(recentStats, previousStats);

    // Calculate activity heatmap data (tests per day)
    const activityMap = new Map<string, number>();
    (allResults || []).forEach(result => {
      const date = result.completed_at.split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });
    const activity = Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate mode breakdown
    const modeBreakdown = new Map<string, number>();
    (allResults || []).forEach(result => {
      modeBreakdown.set(result.test_mode, (modeBreakdown.get(result.test_mode) || 0) + 1);
    });

    // Calculate language breakdown
    const languageBreakdown = new Map<string, number>();
    (allResults || []).forEach(result => {
      languageBreakdown.set(result.test_language, (languageBreakdown.get(result.test_language) || 0) + 1);
    });

    // Calculate WPM progression over time (daily averages)
    const wpmProgression = calculateDailyAverages(allResults || [], 'wpm', 30);
    const accuracyProgression = calculateDailyAverages(allResults || [], 'accuracy', 30);

    return NextResponse.json({
      profile: {
        testsCompleted: profile?.tests_completed || 0,
        timeTyping: profile?.time_typing_ms || 0,
        streak: profile?.current_streak || 0,
        maxStreak: profile?.longest_streak || 0,
        xp: profile?.xp || 0,
        level: profile?.level || 1,
      },
      overall: stats,
      recent: {
        ...recentStats,
        periodDays: days,
        testsCount: recentResults.length,
      },
      trends,
      personalBests: (personalBests || []).map(pb => ({
        mode: pb.test_mode,
        timeLimit: pb.test_duration,
        wordLimit: pb.test_word_count,
        language: pb.test_language,
        punctuation: pb.punctuation_enabled,
        numbers: pb.numbers_enabled,
        wpm: pb.wpm,
        accuracy: pb.accuracy,
        achievedAt: pb.achieved_at,
      })),
      breakdown: {
        byMode: Object.fromEntries(modeBreakdown),
        byLanguage: Object.fromEntries(languageBreakdown),
      },
      activity: activity.slice(-90), // Last 90 days
      progression: {
        wpm: wpmProgression,
        accuracy: accuracyProgression,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate statistics from an array of results
 */
function calculateStats(results: Array<{
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number | null;
  test_duration: number | null;
}>) {
  if (results.length === 0) {
    return {
      averageWpm: 0,
      averageRawWpm: 0,
      averageAccuracy: 0,
      averageConsistency: 0,
      highestWpm: 0,
      lowestWpm: 0,
      totalDuration: 0,
      testsCount: 0,
    };
  }

  const sum = results.reduce(
    (acc, r) => ({
      wpm: acc.wpm + r.wpm,
      rawWpm: acc.rawWpm + (r.raw_wpm || 0),
      accuracy: acc.accuracy + r.accuracy,
      consistency: acc.consistency + (r.consistency || 0),
      duration: acc.duration + (r.test_duration || 0),
    }),
    { wpm: 0, rawWpm: 0, accuracy: 0, consistency: 0, duration: 0 }
  );

  const wpms = results.map(r => r.wpm);
  const resultsWithConsistency = results.filter(r => r.consistency !== null);

  return {
    averageWpm: Math.round((sum.wpm / results.length) * 10) / 10,
    averageRawWpm: Math.round((sum.rawWpm / results.length) * 10) / 10,
    averageAccuracy: Math.round((sum.accuracy / results.length) * 10) / 10,
    averageConsistency: resultsWithConsistency.length > 0
      ? Math.round((sum.consistency / resultsWithConsistency.length) * 10) / 10
      : 0,
    highestWpm: Math.max(...wpms),
    lowestWpm: Math.min(...wpms),
    totalDuration: Math.round(sum.duration),
    testsCount: results.length,
  };
}

/**
 * Calculate trends between two periods
 */
function calculateTrends(
  current: ReturnType<typeof calculateStats>,
  previous: ReturnType<typeof calculateStats>
) {
  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
  };

  return {
    wpmChange: calculateChange(current.averageWpm, previous.averageWpm),
    accuracyChange: calculateChange(current.averageAccuracy, previous.averageAccuracy),
    consistencyChange: calculateChange(current.averageConsistency, previous.averageConsistency),
    testsChange: calculateChange(current.testsCount, previous.testsCount),
    improving: current.averageWpm > previous.averageWpm,
  };
}

/**
 * Calculate daily averages for a metric over the last N days
 */
function calculateDailyAverages(
  results: Array<{ completed_at: string; [key: string]: unknown }>,
  metric: string,
  days: number
) {
  const now = new Date();
  const dailyData: { date: string; value: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const dayResults = results.filter(r => r.completed_at.startsWith(dateStr));

    if (dayResults.length > 0) {
      const avg = dayResults.reduce((sum, r) => sum + (r[metric] as number), 0) / dayResults.length;
      dailyData.push({
        date: dateStr,
        value: Math.round(avg * 10) / 10,
      });
    }
  }

  return dailyData;
}
