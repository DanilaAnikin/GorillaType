import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics
 * Fetch comprehensive analytics data for the authenticated user.
 * Returns WPM progression, accuracy trends, daily activity, mode/language breakdowns,
 * overall stats, and recent progress comparison.
 *
 * Query params:
 * - days: number of days to include in daily activity heatmap (default 500, 0 = all data)
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

    // Parse days query parameter (default 500, 0 means all data)
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam !== null ? parseInt(daysParam, 10) : 500;
    const isMaxRange = days === 0;

    // Fetch last 100 test results ordered by completion date
    const { data: results, error: resultsError } = await supabase
      .from('typing_results')
      .select('wpm, raw_wpm, accuracy, consistency, test_mode, test_language, test_duration, chars_correct, chars_incorrect, chars_extra, chars_missed, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: true })
      .limit(100);

    if (resultsError) {
      console.error('Error fetching analytics results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    const allResults = results || [];

    // --- WPM History (last 100 tests with timestamps) ---
    const wpmHistory = allResults.map(r => ({
      wpm: r.wpm,
      raw_wpm: r.raw_wpm || 0,
      accuracy: r.accuracy,
      date: r.completed_at,
      test_mode: r.test_mode,
    }));

    // --- Daily Tests (configurable range, default 500 days) ---
    const now = new Date();

    // Build the query for daily activity data
    let recentQuery = supabase
      .from('typing_results')
      .select('wpm, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: true });

    if (!isMaxRange) {
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      recentQuery = recentQuery.gte('completed_at', startDate.toISOString());
    }

    const { data: recentResults } = await recentQuery;

    const dailyMap = new Map<string, { count: number; totalWpm: number }>();

    if (!isMaxRange) {
      // Initialize all days in the range
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { count: 0, totalWpm: 0 });
      }
    }

    // Populate from results
    (recentResults || []).forEach(r => {
      const dateStr = r.completed_at.split('T')[0];
      const existing = dailyMap.get(dateStr);
      if (existing) {
        existing.count += 1;
        existing.totalWpm += r.wpm;
      } else {
        // For max range, add days that have data even if not pre-initialized
        dailyMap.set(dateStr, { count: 1, totalWpm: r.wpm });
      }
    });

    const dailyTests = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avg_wpm: data.count > 0 ? Math.round((data.totalWpm / data.count) * 10) / 10 : 0,
    }));

    // --- Mode Stats ---
    const modeMap = new Map<string, { totalWpm: number; bestWpm: number; tests: number }>();
    allResults.forEach(r => {
      const mode = r.test_mode;
      const existing = modeMap.get(mode) || { totalWpm: 0, bestWpm: 0, tests: 0 };
      existing.totalWpm += r.wpm;
      existing.bestWpm = Math.max(existing.bestWpm, r.wpm);
      existing.tests += 1;
      modeMap.set(mode, existing);
    });

    const modeStats = Array.from(modeMap.entries()).map(([mode, data]) => ({
      mode,
      avg_wpm: Math.round((data.totalWpm / data.tests) * 10) / 10,
      best_wpm: data.bestWpm,
      tests: data.tests,
    }));

    // --- Language Stats ---
    const langMap = new Map<string, { totalWpm: number; totalAccuracy: number; tests: number }>();
    allResults.forEach(r => {
      const lang = r.test_language;
      const existing = langMap.get(lang) || { totalWpm: 0, totalAccuracy: 0, tests: 0 };
      existing.totalWpm += r.wpm;
      existing.totalAccuracy += r.accuracy;
      existing.tests += 1;
      langMap.set(lang, existing);
    });

    const languageStats = Array.from(langMap.entries()).map(([language, data]) => ({
      language,
      avg_wpm: Math.round((data.totalWpm / data.tests) * 10) / 10,
      avg_accuracy: Math.round((data.totalAccuracy / data.tests) * 10) / 10,
      tests: data.tests,
    }));

    // --- Overall Stats ---
    const totalTests = allResults.length;
    let totalTime = 0;
    let totalWpm = 0;
    let totalAccuracy = 0;
    let totalConsistency = 0;
    let consistencyCount = 0;
    let bestWpm = 0;
    let totalCharsCorrect = 0;
    let totalCharsIncorrect = 0;
    let totalCharsExtra = 0;
    let totalCharsMissed = 0;

    allResults.forEach(r => {
      totalWpm += r.wpm;
      totalAccuracy += r.accuracy;
      totalTime += r.test_duration || 0;
      bestWpm = Math.max(bestWpm, r.wpm);
      totalCharsCorrect += r.chars_correct || 0;
      totalCharsIncorrect += r.chars_incorrect || 0;
      totalCharsExtra += r.chars_extra || 0;
      totalCharsMissed += r.chars_missed || 0;

      if (r.consistency !== null && r.consistency !== undefined) {
        totalConsistency += r.consistency;
        consistencyCount += 1;
      }
    });

    const overallStats = {
      totalTests,
      totalTime: Math.round(totalTime),
      avgWpm: totalTests > 0 ? Math.round((totalWpm / totalTests) * 10) / 10 : 0,
      avgAccuracy: totalTests > 0 ? Math.round((totalAccuracy / totalTests) * 10) / 10 : 0,
      avgConsistency: consistencyCount > 0 ? Math.round((totalConsistency / consistencyCount) * 10) / 10 : 0,
      bestWpm,
      charsCorrect: totalCharsCorrect,
      charsIncorrect: totalCharsIncorrect,
      charsExtra: totalCharsExtra,
      charsMissed: totalCharsMissed,
    };

    // --- Recent Progress (compare last 10 tests vs previous 10 tests) ---
    const recentSlice = allResults.slice(-10);
    const previousSlice = allResults.slice(-20, -10);

    const currentAvg = recentSlice.length > 0
      ? Math.round((recentSlice.reduce((sum, r) => sum + r.wpm, 0) / recentSlice.length) * 10) / 10
      : 0;

    const previousAvg = previousSlice.length > 0
      ? Math.round((previousSlice.reduce((sum, r) => sum + r.wpm, 0) / previousSlice.length) * 10) / 10
      : 0;

    const improvement = previousAvg > 0
      ? Math.round(((currentAvg - previousAvg) / previousAvg) * 1000) / 10
      : 0;

    const recentProgress = {
      currentAvg,
      previousAvg,
      improvement,
    };

    return NextResponse.json({
      wpmHistory,
      dailyTests,
      modeStats,
      languageStats,
      overallStats,
      recentProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
