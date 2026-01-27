import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TestMode } from '@/types/test';

/**
 * GET /api/results
 * Fetch user's test results with pagination and optional mode filter
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const mode = searchParams.get('mode') as TestMode | null;
    const language = searchParams.get('language');
    const sortBy = searchParams.get('sortBy') || 'completed_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('typing_results')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (mode) {
      query = query.eq('test_mode', mode);
    }
    if (language) {
      query = query.eq('test_language', language);
    }

    // Apply sorting
    const validSortFields = ['completed_at', 'wpm', 'accuracy', 'consistency', 'test_duration'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'completed_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: results, error, count } = await query;

    if (error) {
      console.error('Error fetching results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: results || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Anti-cheat validation for test results
 */
function validateResult(data: {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  duration: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  wpmHistory: number[];
}): { valid: boolean; reason?: string } {
  // Check for undefined/null values that should be numbers
  if (
    data.wpm === undefined ||
    data.wpm === null ||
    data.accuracy === undefined ||
    data.accuracy === null ||
    data.duration === undefined ||
    data.duration === null
  ) {
    return { valid: false, reason: 'Missing required numeric fields' };
  }

  // WPM sanity check (world record is ~300 WPM)
  if (data.wpm > 350 || (data.rawWpm && data.rawWpm > 400)) {
    return { valid: false, reason: 'WPM exceeds reasonable limits' };
  }

  // Negative values check
  if (data.wpm < 0 || data.accuracy < 0 || data.duration < 0) {
    return { valid: false, reason: 'Invalid negative values' };
  }

  // Accuracy bounds check
  if (data.accuracy > 100) {
    return { valid: false, reason: 'Accuracy exceeds 100%' };
  }

  // Duration sanity check (minimum 1 second)
  if (data.duration < 1) {
    return { valid: false, reason: 'Duration too short' };
  }

  // Character count consistency (only if values are provided)
  if (
    data.totalCharacters !== undefined &&
    data.correctCharacters !== undefined &&
    data.incorrectCharacters !== undefined
  ) {
    const totalChars = (data.correctCharacters || 0) + (data.incorrectCharacters || 0);
    if (data.totalCharacters > 0 && totalChars > data.totalCharacters * 1.5) {
      return { valid: false, reason: 'Character count inconsistency' };
    }
  }

  // WPM history consistency check (only if history is provided and has data)
  if (data.wpmHistory && Array.isArray(data.wpmHistory) && data.wpmHistory.length > 0) {
    const validHistory = data.wpmHistory.filter((w) => typeof w === 'number' && !isNaN(w));
    if (validHistory.length > 0) {
      const avgHistoryWpm = validHistory.reduce((a, b) => a + b, 0) / validHistory.length;
      // Allow 50% variance between reported WPM and average history
      if (avgHistoryWpm > 0 && Math.abs(data.wpm - avgHistoryWpm) > avgHistoryWpm * 0.5) {
        return { valid: false, reason: 'WPM history inconsistency' };
      }
    }
  }

  // WPM spike detection (only if history is provided)
  if (data.wpmHistory && Array.isArray(data.wpmHistory) && data.wpmHistory.length >= 3) {
    for (let i = 1; i < data.wpmHistory.length; i++) {
      const spike = data.wpmHistory[i] - data.wpmHistory[i - 1];
      // Suspicious if WPM jumps more than 100 in one second
      if (spike > 100) {
        return { valid: false, reason: 'Suspicious WPM spike detected' };
      }
    }
  }

  return { valid: true };
}

/**
 * POST /api/results
 * Save a new test result with anti-cheat validation
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

    const {
      mode,
      timeLimit,
      wordLimit,
      quoteId,
      language,
      punctuation,
      numbers,
      wpm,
      rawWpm,
      accuracy,
      consistency,
      totalCharacters,
      correctCharacters,
      incorrectCharacters,
      extraCharacters,
      missedCharacters,
      duration,
      wpmHistory,
      rawWpmHistory,
      accuracyHistory,
    } = body;

    // Validate required fields
    if (!mode || !language || wpm === undefined || accuracy === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Anti-cheat validation
    const validation = validateResult({
      wpm,
      rawWpm,
      accuracy,
      consistency,
      duration,
      totalCharacters,
      correctCharacters,
      incorrectCharacters,
      wpmHistory,
    });

    if (!validation.valid) {
      console.warn(`Anti-cheat flagged result from user ${user.id}: ${validation.reason}`);
      return NextResponse.json(
        { error: 'Result validation failed', reason: validation.reason },
        { status: 400 }
      );
    }

    // Check for personal best (includes punctuation/numbers in unique key)
    let isPb = false;

    // Build the filter for personal best comparison
    const pbQuery = supabase
      .from('personal_bests')
      .select('wpm')
      .eq('user_id', user.id)
      .eq('test_mode', mode)
      .eq('test_language', language)
      .eq('punctuation_enabled', punctuation || false)
      .eq('numbers_enabled', numbers || false);

    // Add mode-specific filters
    if (mode === 'time' && timeLimit) {
      pbQuery.eq('test_duration', timeLimit);
    } else if (mode === 'words' && wordLimit) {
      pbQuery.eq('test_word_count', wordLimit);
    }

    const { data: existingPb } = await pbQuery.single();

    // Determine if this is a new personal best
    isPb = !existingPb || wpm > existingPb.wpm;

    // Also check if this should update the leaderboard (different unique key - no punctuation/numbers)
    let shouldUpdateLeaderboard = false;
    let lbQuery = supabase
      .from('leaderboards')
      .select('wpm')
      .eq('user_id', user.id)
      .eq('test_mode', mode)
      .eq('test_language', language);

    // Add mode-specific filters for leaderboard
    if (mode === 'time' && timeLimit) {
      lbQuery = lbQuery.eq('test_duration', timeLimit);
    } else if (mode === 'words' && wordLimit) {
      lbQuery = lbQuery.eq('test_word_count', wordLimit);
    }

    const { data: existingLb } = await lbQuery.single();
    shouldUpdateLeaderboard = !existingLb || wpm > existingLb.wpm;

    // Build chart_data JSONB from history arrays
    const chartData = {
      wpm: wpmHistory ? wpmHistory.map((wpm: number, index: number) => ({ time: index + 1, wpm })) : [],
      raw: rawWpmHistory ? rawWpmHistory.map((raw: number, index: number) => ({ time: index + 1, raw })) : [],
      errors: [], // Could be populated if we track errors per second
    };

    // Insert the test result
    const { data: result, error: insertError } = await supabase
      .from('typing_results')
      .insert({
        user_id: user.id,
        test_mode: mode,
        test_duration: timeLimit || null,
        test_word_count: wordLimit || null,
        test_language: language,
        punctuation_enabled: punctuation || false,
        numbers_enabled: numbers || false,
        wpm,
        raw_wpm: rawWpm,
        accuracy,
        consistency,
        chars_correct: correctCharacters,
        chars_incorrect: incorrectCharacters,
        chars_extra: extraCharacters || 0,
        chars_missed: missedCharacters || 0,
        chart_data: chartData,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting result:', insertError);
      return NextResponse.json(
        { error: 'Failed to save result' },
        { status: 500 }
      );
    }

    // Update or create personal best if applicable
    // Note: There's also a database trigger that handles this, but we handle it here as well
    // for robustness. We use upsert with onConflict to avoid duplicates.
    if (isPb && result) {
      const pbData = {
        user_id: user.id,
        test_mode: mode,
        test_duration: timeLimit || null,
        test_word_count: wordLimit || null,
        test_language: language,
        punctuation_enabled: punctuation || false,
        numbers_enabled: numbers || false,
        wpm,
        accuracy,
        result_id: result.id,
        achieved_at: new Date().toISOString(),
      };

      // Use upsert to handle both insert and update cases, avoiding conflicts with the trigger
      const { error: pbError } = await supabase
        .from('personal_bests')
        .upsert(pbData, {
          onConflict: 'user_id,test_mode,test_duration,test_word_count,test_language,punctuation_enabled,numbers_enabled',
        });

      if (pbError) {
        // Log but don't fail the request - the result was saved successfully
        console.error('Error upserting personal best:', pbError);
      }
    }

    // Update leaderboard entry if this score beats the existing leaderboard entry
    // The leaderboard has a different unique constraint (no punctuation/numbers)
    // so we check shouldUpdateLeaderboard separately from isPb
    if (shouldUpdateLeaderboard && result) {
      // Get user profile info for leaderboard entry
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, country_code')
        .eq('id', user.id)
        .single();

      // Build the query to find existing leaderboard entry
      // We need to handle NULL values properly since the unique index uses COALESCE
      let existingEntryQuery = supabase
        .from('leaderboards')
        .select('id')
        .eq('user_id', user.id)
        .eq('test_mode', mode)
        .eq('test_language', language);

      // Handle NULL values for test_duration and test_word_count
      if (timeLimit) {
        existingEntryQuery = existingEntryQuery.eq('test_duration', timeLimit);
      } else {
        existingEntryQuery = existingEntryQuery.is('test_duration', null);
      }

      if (wordLimit) {
        existingEntryQuery = existingEntryQuery.eq('test_word_count', wordLimit);
      } else {
        existingEntryQuery = existingEntryQuery.is('test_word_count', null);
      }

      const { data: existingEntry } = await existingEntryQuery.maybeSingle();

      if (existingEntry) {
        // Update existing entry
        const { error: lbError } = await supabase
          .from('leaderboards')
          .update({
            result_id: result.id,
            username: userProfile?.username || 'Anonymous',
            wpm,
            accuracy,
            country_code: userProfile?.country_code || null,
            achieved_at: new Date().toISOString(),
          })
          .eq('id', existingEntry.id);

        if (lbError) {
          console.error('Error updating leaderboard entry:', lbError);
        }
      } else {
        // Insert new entry
        const { error: lbError } = await supabase
          .from('leaderboards')
          .insert({
            user_id: user.id,
            result_id: result.id,
            test_mode: mode,
            test_duration: timeLimit || null,
            test_word_count: wordLimit || null,
            test_language: language,
            username: userProfile?.username || 'Anonymous',
            wpm,
            accuracy,
            country_code: userProfile?.country_code || null,
            achieved_at: new Date().toISOString(),
          });

        if (lbError) {
          console.error('Error inserting leaderboard entry:', lbError);
        }
      }
    }

    // Update user profile stats (ignore errors if RPC doesn't exist)
    try {
      await supabase.rpc('increment_user_stats', {
        p_user_id: user.id,
        p_tests: 1,
        p_time: Math.round(duration),
      });
    } catch {
      // If the RPC doesn't exist, just ignore - stats update is not critical
    }

    return NextResponse.json({
      result,
      isPb,
      message: isPb ? 'New personal best!' : 'Result saved successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
