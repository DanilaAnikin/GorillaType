import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/replay?resultId=xxx
 * Retrieve keystroke replay data for a specific test result.
 * Only returns data if the result belongs to the authenticated user
 * or the result owner's profile is public.
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
    const resultId = searchParams.get('resultId');

    if (!resultId) {
      return NextResponse.json(
        { error: 'Missing required parameter: resultId' },
        { status: 400 }
      );
    }

    // Fetch the typing result to verify ownership or public access
    const { data: result, error: resultError } = await supabase
      .from('typing_results')
      .select('id, user_id')
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Check access: must be the owner or the owner's profile must be public
    if (result.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_public')
        .eq('id', result.user_id)
        .single();

      if (!profile?.is_public) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Fetch keystroke events for this result
    const { data: keystrokes, error: keystrokesError } = await supabase
      .from('keystroke_events')
      .select('id, key_char, key_code, is_correct, timestamp_ms, char_index, word_index')
      .eq('result_id', resultId)
      .order('timestamp_ms', { ascending: true });

    if (keystrokesError) {
      console.error('Error fetching keystrokes:', keystrokesError);
      return NextResponse.json(
        { error: 'Failed to fetch replay data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resultId,
      keystrokes: (keystrokes || []).map((k) => ({
        key: k.key_char,
        keyCode: k.key_code,
        isCorrect: k.is_correct,
        timestampMs: k.timestamp_ms,
        charIndex: k.char_index,
        wordIndex: k.word_index,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/replay:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/replay
 * Save keystroke replay data for a test result.
 * Body: { resultId: string, keystrokes: KeystrokeEvent[] }
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
    const { resultId, keystrokes } = body;

    if (!resultId || !keystrokes || !Array.isArray(keystrokes)) {
      return NextResponse.json(
        { error: 'Missing required fields: resultId, keystrokes' },
        { status: 400 }
      );
    }

    // Validate keystroke count (prevent abuse)
    if (keystrokes.length > 10000) {
      return NextResponse.json(
        { error: 'Too many keystrokes (max 10000)' },
        { status: 400 }
      );
    }

    // Verify the result belongs to the user
    const { data: result, error: resultError } = await supabase
      .from('typing_results')
      .select('id, user_id')
      .eq('id', resultId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    if (result.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied: result does not belong to user' },
        { status: 403 }
      );
    }

    // Prepare batch insert data
    const rows = keystrokes.map((ks: {
      key: string
      keyCode?: string
      isCorrect: boolean
      timestampMs: number
      charIndex: number
      wordIndex: number
    }) => ({
      result_id: resultId,
      user_id: user.id,
      key_char: ks.key,
      key_code: ks.keyCode || ks.key,
      is_correct: ks.isCorrect,
      timestamp_ms: ks.timestampMs,
      char_index: ks.charIndex,
      word_index: ks.wordIndex,
    }));

    // Batch insert keystrokes
    const { error: insertError } = await supabase
      .from('keystroke_events')
      .insert(rows);

    if (insertError) {
      console.error('Error inserting keystroke events:', insertError);
      return NextResponse.json(
        { error: 'Failed to save replay data' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Replay data saved successfully', count: rows.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/replay:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
