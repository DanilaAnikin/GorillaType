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
 * GET /api/tournaments/[id]
 * Get tournament details with participants and round results
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch tournament with creator profile
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(
        `
        *,
        creator:profiles!creator_id (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tournament not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching tournament:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tournament' },
        { status: 500 }
      );
    }

    // Fetch participants with profiles
    const { data: participants, error: participantsError } = await supabase
      .from('tournament_participants')
      .select(
        `
        id,
        user_id,
        total_score,
        joined_at,
        profile:user_id (
          username,
          avatar_url
        )
      `
      )
      .eq('tournament_id', id)
      .order('total_score', { ascending: false });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
    }

    // Fetch round results
    const { data: rounds, error: roundsError } = await supabase
      .from('tournament_rounds')
      .select(
        `
        id,
        participant_id,
        round_number,
        result_id,
        wpm,
        accuracy,
        score,
        completed_at
      `
      )
      .eq('tournament_id', id)
      .order('round_number', { ascending: true });

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
    }

    // Format participants
    const formattedParticipants = (participants || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      username:
        (p.profile as { username?: string })?.username || 'Anonymous',
      avatarUrl: (p.profile as { avatar_url?: string })?.avatar_url || null,
      totalScore: p.total_score,
      joinedAt: p.joined_at,
    }));

    // Group rounds by participant
    const formattedRounds = (rounds || []).map((r) => ({
      id: r.id,
      participantId: r.participant_id,
      roundNumber: r.round_number,
      resultId: r.result_id,
      wpm: r.wpm,
      accuracy: r.accuracy,
      score: r.score,
      completedAt: r.completed_at,
    }));

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: computeEffectiveStatus(tournament.status, tournament.start_time),
        testMode: tournament.test_mode,
        testDuration: tournament.test_duration,
        testWordCount: tournament.test_word_count,
        testLanguage: tournament.test_language,
        maxParticipants: tournament.max_participants,
        totalRounds: tournament.total_rounds,
        isPublic: tournament.is_public,
        entryXpCost: tournament.entry_xp_cost,
        startTime: tournament.start_time,
        createdAt: tournament.created_at,
        creatorId: tournament.creator_id,
        creator: {
          id: (tournament.creator as { id?: string })?.id,
          username:
            (tournament.creator as { username?: string })?.username ||
            'Anonymous',
          avatarUrl:
            (tournament.creator as { avatar_url?: string })?.avatar_url,
        },
        participants: formattedParticipants,
        participantCount: formattedParticipants.length,
        rounds: formattedRounds,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/tournaments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tournaments/[id]
 * Update tournament (creator only)
 */
export async function PUT(
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

    // Fetch tournament to verify ownership
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, creator_id, status, start_time')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can update this tournament' },
        { status: 403 }
      );
    }

    const effectiveStatus = computeEffectiveStatus(tournament.status, tournament.start_time);
    if (effectiveStatus !== 'upcoming') {
      return NextResponse.json(
        { error: 'Can only update upcoming tournaments' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const allowedFields = [
      'name',
      'description',
      'test_mode',
      'test_duration',
      'test_word_count',
      'test_language',
      'max_participants',
      'total_rounds',
      'is_public',
      'start_time',
      'entry_xp_cost',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate start_time if provided
    if (updates.start_time) {
      const startDate = new Date(updates.start_time as string);
      if (isNaN(startDate.getTime()) || startDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'start_time must be a valid future date' },
          { status: 400 }
        );
      }
      updates.start_time = startDate.toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tournament:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tournament: updated,
      message: 'Tournament updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/tournaments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id]
 * Cancel tournament (creator only, sets status to 'cancelled')
 */
export async function DELETE(
  _request: NextRequest,
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

    // Fetch tournament to verify ownership
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, creator_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can cancel this tournament' },
        { status: 403 }
      );
    }

    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Tournament is already ' + tournament.status },
        { status: 400 }
      );
    }

    // Set status to cancelled
    const { error: cancelError } = await supabase
      .from('tournaments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (cancelError) {
      console.error('Error cancelling tournament:', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Tournament cancelled successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/tournaments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
