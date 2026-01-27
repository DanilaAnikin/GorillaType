import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tournaments/[id]/join
 * Join a tournament (authenticated)
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

    // Fetch tournament details
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, status, max_participants')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check tournament is upcoming
    if (tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Can only join upcoming tournaments' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this tournament' },
        { status: 400 }
      );
    }

    // Check max_participants not exceeded
    if (tournament.max_participants) {
      const { count, error: countError } = await supabase
        .from('tournament_participants')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', id);

      if (countError) {
        console.error('Error counting participants:', countError);
        return NextResponse.json(
          { error: 'Failed to check participant count' },
          { status: 500 }
        );
      }

      if ((count || 0) >= tournament.max_participants) {
        return NextResponse.json(
          { error: 'Tournament is full' },
          { status: 400 }
        );
      }
    }

    // Insert participant
    const { error: joinError } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: id,
        user_id: user.id,
        total_score: 0,
      });

    if (joinError) {
      console.error('Error joining tournament:', joinError);
      return NextResponse.json(
        { error: 'Failed to join tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully joined the tournament',
    });
  } catch (error) {
    console.error('Error in POST /api/tournaments/[id]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
