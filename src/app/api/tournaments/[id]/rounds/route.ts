import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Compute the effective tournament status.
 *
 * The database `status` column is only set to 'upcoming' at creation time and
 * is never automatically transitioned. This helper derives the real status by
 * comparing `start_time` against the current clock:
 *   - 'completed' / 'cancelled' are terminal and kept as-is.
 *   - 'upcoming' transitions to 'active' once `start_time` has passed.
 *   - 'active' stays 'active' (until explicitly completed).
 */
function computeEffectiveStatus(
  dbStatus: string,
  startTime: string
): string {
  if (dbStatus === 'completed' || dbStatus === 'cancelled') {
    return dbStatus;
  }
  const now = new Date();
  const start = new Date(startTime);
  if (dbStatus === 'upcoming' && start.getTime() <= now.getTime()) {
    return 'active';
  }
  return dbStatus;
}

/**
 * POST /api/tournaments/[id]/rounds
 * Submit a round result for a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { round_number, result_id, wpm, accuracy } = body;

    // Validate required fields
    if (
      round_number === undefined ||
      round_number === null ||
      wpm === undefined ||
      accuracy === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: round_number, wpm, accuracy' },
        { status: 400 }
      );
    }

    if (typeof wpm !== 'number' || wpm < 0 || wpm > 350) {
      return NextResponse.json(
        { error: 'Invalid wpm value' },
        { status: 400 }
      );
    }

    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
      return NextResponse.json(
        { error: 'Invalid accuracy value' },
        { status: 400 }
      );
    }

    // Fetch tournament to validate
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, status, start_time, total_rounds')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const effectiveStatus = computeEffectiveStatus(tournament.status, tournament.start_time);

    if (effectiveStatus !== 'active') {
      return NextResponse.json(
        { error: 'Can only submit results for active tournaments' },
        { status: 400 }
      );
    }

    if (round_number < 1 || round_number > tournament.total_rounds) {
      return NextResponse.json(
        {
          error: `round_number must be between 1 and ${tournament.total_rounds}`,
        },
        { status: 400 }
      );
    }

    // Find the participant record for this user
    const { data: participant, error: participantError } = await supabase
      .from('tournament_participants')
      .select('id, total_score')
      .eq('tournament_id', id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this tournament' },
        { status: 403 }
      );
    }

    // Check if this round was already submitted
    const { data: existingRound } = await supabase
      .from('tournament_rounds')
      .select('id')
      .eq('tournament_id', id)
      .eq('participant_id', participant.id)
      .eq('round_number', round_number)
      .maybeSingle();

    if (existingRound) {
      return NextResponse.json(
        { error: 'Round result already submitted for this round' },
        { status: 400 }
      );
    }

    // Calculate score: wpm * (accuracy / 100)
    const score = Math.round(wpm * (accuracy / 100) * 100) / 100;

    // Insert round result
    const { data: roundResult, error: insertError } = await supabase
      .from('tournament_rounds')
      .insert({
        tournament_id: id,
        participant_id: participant.id,
        round_number,
        result_id: result_id || null,
        wpm,
        accuracy,
        score,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting round result:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit round result' },
        { status: 500 }
      );
    }

    // Update participant total_score
    const newTotalScore =
      Math.round(((participant.total_score || 0) + score) * 100) / 100;

    const { error: updateError } = await supabase
      .from('tournament_participants')
      .update({ total_score: newTotalScore })
      .eq('id', participant.id);

    if (updateError) {
      console.error('Error updating participant score:', updateError);
      // Don't fail -- the round result was saved successfully
    }

    return NextResponse.json(
      {
        round: {
          id: roundResult.id,
          roundNumber: roundResult.round_number,
          wpm: roundResult.wpm,
          accuracy: roundResult.accuracy,
          score: roundResult.score,
          completedAt: roundResult.completed_at,
        },
        totalScore: newTotalScore,
        message: 'Round result submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/tournaments/[id]/rounds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
