import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tournaments/[id]/start
 * Start a tournament (creator only).
 *
 * Transitions the tournament status from 'upcoming' to 'active'.
 * The creator can start the tournament early (before start_time) or
 * at any point while it is still in 'upcoming' status.
 */
export async function POST(
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

    // Fetch tournament to verify ownership and status
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
        { error: 'Only the creator can start this tournament' },
        { status: 403 }
      );
    }

    if (tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: `Tournament is already ${tournament.status}` },
        { status: 400 }
      );
    }

    // Check that at least one participant has joined (including the creator)
    const { count, error: countError } = await supabase
      .from('tournament_participants')
      .select('id', { count: 'exact', head: true })
      .eq('tournament_id', id);

    if (countError) {
      console.error('Error counting participants:', countError);
      return NextResponse.json(
        { error: 'Failed to verify participants' },
        { status: 500 }
      );
    }

    if (!count || count < 1) {
      return NextResponse.json(
        { error: 'Cannot start a tournament with no participants' },
        { status: 400 }
      );
    }

    // Transition to active
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'active' })
      .eq('id', id);

    if (updateError) {
      console.error('Error starting tournament:', updateError);
      return NextResponse.json(
        { error: 'Failed to start tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Tournament started successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/tournaments/[id]/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
