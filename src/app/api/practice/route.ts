import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeWeaknesses } from '@/lib/utils/weakness-analyzer';

/**
 * GET /api/practice
 * Fetch user's keystroke data from last 20 results and return a weakness report.
 */
export async function GET() {
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

    // Fetch the last 20 results for this user
    const { data: results, error: resultsError } = await supabase
      .from('typing_results')
      .select('id, chars_correct, chars_incorrect, chars_extra, chars_missed, chart_data')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (resultsError) {
      console.error('Error fetching results for practice:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json({
        report: null,
        message: 'No test results found. Complete some tests first to generate a practice plan.',
      });
    }

    // Try to fetch keystroke_events if the table exists
    const { data: keystrokeEvents, error: keystrokeError } = await supabase
      .from('keystroke_events')
      .select('key_char, is_correct, timestamp_ms')
      .eq('user_id', user.id)
      .order('timestamp_ms', { ascending: true })
      .limit(10000);

    // If keystroke_events table exists and has data, use it
    if (!keystrokeError && keystrokeEvents && keystrokeEvents.length > 0) {
      const report = analyzeWeaknesses(keystrokeEvents);
      return NextResponse.json({ report });
    }

    // Fallback: synthesize keystroke data from chart_data and character stats
    // This creates approximate keystroke data from the aggregated results
    const syntheticKeystrokes: { key_char: string; is_correct: boolean; timestamp_ms: number }[] = [];
    let timestampCounter = 0;

    for (const result of results) {
      const correctCount = result.chars_correct || 0;
      const incorrectCount = result.chars_incorrect || 0;

      // Generate synthetic correct keystrokes spread across common letters
      const commonLetters = 'etaoinsrhldcumfpgwybvkxjqz';
      for (let i = 0; i < correctCount && i < 500; i++) {
        const charIndex = i % commonLetters.length;
        syntheticKeystrokes.push({
          key_char: commonLetters[charIndex],
          is_correct: true,
          timestamp_ms: timestampCounter,
        });
        timestampCounter += 100 + Math.random() * 150;
      }

      // Generate synthetic incorrect keystrokes
      for (let i = 0; i < incorrectCount && i < 200; i++) {
        const charIndex = i % commonLetters.length;
        syntheticKeystrokes.push({
          key_char: commonLetters[charIndex],
          is_correct: false,
          timestamp_ms: timestampCounter,
        });
        timestampCounter += 150 + Math.random() * 200;
      }
    }

    if (syntheticKeystrokes.length === 0) {
      return NextResponse.json({
        report: null,
        message: 'Not enough data to analyze. Complete more tests first.',
      });
    }

    const report = analyzeWeaknesses(syntheticKeystrokes);
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error in GET /api/practice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
