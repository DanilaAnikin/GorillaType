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
 * GET /api/tournaments
 * List tournaments with filters, pagination, and participant counts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // upcoming | active | completed
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('tournaments')
      .select(
        `
        id,
        name,
        description,
        status,
        test_mode,
        test_duration,
        test_word_count,
        test_language,
        max_participants,
        total_rounds,
        is_public,
        entry_xp_cost,
        start_time,
        created_at,
        creator:profiles!creator_id (
          id,
          username,
          avatar_url
        ),
        participants:tournament_participants (id)
      `,
        { count: 'exact' }
      )
      .eq('is_public', true);

    // Apply status filter.
    //
    // Because the DB 'status' column is not automatically updated when
    // start_time passes, we translate the requested filter into conditions
    // that match the real-time effective status:
    //   - 'upcoming'  => DB status is 'upcoming' AND start_time is still in the future
    //   - 'active'    => DB status is 'active' OR (DB status is 'upcoming' AND start_time <= now)
    //   - 'completed' => DB status is 'completed'
    //   - 'cancelled' => DB status is 'cancelled'
    if (status && ['upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
      const now = new Date().toISOString();
      if (status === 'upcoming') {
        query = query.eq('status', 'upcoming').gt('start_time', now);
      } else if (status === 'active') {
        // Tournaments that are either explicitly 'active' or still 'upcoming'
        // in the DB but whose start_time has already passed.
        query = query.or(
          `status.eq.active,and(status.eq.upcoming,start_time.lte.${now})`
        );
      } else {
        query = query.eq('status', status);
      }
    }

    // Order by start_time ascending for upcoming, descending for completed
    if (status === 'completed' || status === 'cancelled') {
      query = query.order('start_time', { ascending: false });
    } else {
      query = query.order('start_time', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tournaments, error, count } = await query;

    if (error) {
      console.error('Error fetching tournaments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      );
    }

    // Format response with participant counts.
    // Compute effective status for each tournament so the client sees the
    // correct real-time status even if the DB column has not been updated.
    const formattedTournaments = (tournaments || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: computeEffectiveStatus(t.status, t.start_time),
      testMode: t.test_mode,
      testDuration: t.test_duration,
      testWordCount: t.test_word_count,
      testLanguage: t.test_language,
      maxParticipants: t.max_participants,
      totalRounds: t.total_rounds,
      isPublic: t.is_public,
      entryXpCost: t.entry_xp_cost,
      startTime: t.start_time,
      createdAt: t.created_at,
      creator: {
        id: (t.creator as { id?: string })?.id,
        username: (t.creator as { username?: string })?.username || 'Anonymous',
        avatarUrl: (t.creator as { avatar_url?: string })?.avatar_url,
      },
      participantCount: (t.participants as { id: string }[])?.length || 0,
    }));

    return NextResponse.json({
      tournaments: formattedTournaments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/tournaments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament (authenticated)
 */
export async function POST(request: NextRequest) {
  try {
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

    const {
      name,
      description,
      test_mode,
      test_duration,
      test_word_count,
      test_language = 'english',
      max_participants,
      total_rounds = 3,
      start_time,
      is_public = true,
      entry_xp_cost = 0,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tournament name is required' },
        { status: 400 }
      );
    }

    if (!test_mode || !['time', 'words'].includes(test_mode)) {
      return NextResponse.json(
        { error: 'Invalid test_mode. Must be "time" or "words"' },
        { status: 400 }
      );
    }

    if (!start_time) {
      return NextResponse.json(
        { error: 'start_time is required' },
        { status: 400 }
      );
    }

    // Validate start_time is in the future
    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start_time format' },
        { status: 400 }
      );
    }

    if (startDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'start_time must be in the future' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (max_participants !== undefined && max_participants !== null) {
      if (typeof max_participants !== 'number' || max_participants < 2 || max_participants > 256) {
        return NextResponse.json(
          { error: 'max_participants must be between 2 and 256' },
          { status: 400 }
        );
      }
    }

    if (total_rounds < 1 || total_rounds > 10) {
      return NextResponse.json(
        { error: 'total_rounds must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Insert tournament
    const { data: tournament, error: createError } = await supabase
      .from('tournaments')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        creator_id: user.id,
        status: 'upcoming',
        test_mode,
        test_duration: test_mode === 'time' ? (test_duration || 60) : null,
        test_word_count: test_mode === 'words' ? (test_word_count || 50) : null,
        test_language,
        max_participants: max_participants || null,
        total_rounds,
        is_public,
        entry_xp_cost: entry_xp_cost || 0,
        start_time: startDate.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating tournament:', createError);
      return NextResponse.json(
        { error: 'Failed to create tournament' },
        { status: 500 }
      );
    }

    // Automatically add creator as first participant
    const { error: joinError } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournament.id,
        user_id: user.id,
        total_score: 0,
      });

    if (joinError) {
      console.error('Error adding creator as participant:', joinError);
      // Don't fail the request; tournament was created successfully
    }

    // Fetch creator profile for response
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json(
      {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          status: tournament.status,
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
          creator: {
            id: user.id,
            username: creatorProfile?.username || 'Anonymous',
            avatarUrl: creatorProfile?.avatar_url,
          },
          participantCount: 1,
        },
        message: 'Tournament created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/tournaments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
