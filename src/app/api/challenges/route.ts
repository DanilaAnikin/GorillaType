import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWords } from '@/lib/utils/word-generator';

/**
 * Type for profile data joined from challenges query
 */
type ProfileData = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
} | null;

/**
 * Type for result data joined from challenges query
 */
type ResultData = {
  id: string;
  wpm: number | null;
  accuracy: number | null;
  consistency: number | null;
  raw_wpm: number | null;
} | null;

/**
 * Raw challenge row from Supabase with joined data
 */
type ChallengeRow = {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: string;
  test_mode: string;
  test_duration: number | null;
  test_word_count: number | null;
  test_language: string | null;
  test_text: string | null;
  message: string | null;
  winner_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  challenger: ProfileData;
  challenged: ProfileData;
  challenger_result: ResultData;
  challenged_result: ResultData;
};

/**
 * GET /api/challenges
 * List user's challenges (both sent and received)
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
    const status = searchParams.get('status');

    // Fetch challenges where user is challenger
    let sentQuery = supabase
      .from('challenges')
      .select(`
        id,
        challenger_id,
        challenged_id,
        status,
        test_mode,
        test_duration,
        test_word_count,
        test_language,
        test_text,
        message,
        winner_id,
        expires_at,
        created_at,
        updated_at,
        challenger:challenger_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        challenged:challenged_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        challenger_result:challenger_result_id (
          id,
          wpm,
          accuracy,
          consistency,
          raw_wpm
        ),
        challenged_result:challenged_result_id (
          id,
          wpm,
          accuracy,
          consistency,
          raw_wpm
        )
      `)
      .eq('challenger_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      sentQuery = sentQuery.eq('status', status);
    }

    // Fetch challenges where user is challenged
    let receivedQuery = supabase
      .from('challenges')
      .select(`
        id,
        challenger_id,
        challenged_id,
        status,
        test_mode,
        test_duration,
        test_word_count,
        test_language,
        test_text,
        message,
        winner_id,
        expires_at,
        created_at,
        updated_at,
        challenger:challenger_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        challenged:challenged_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        challenger_result:challenger_result_id (
          id,
          wpm,
          accuracy,
          consistency,
          raw_wpm
        ),
        challenged_result:challenged_result_id (
          id,
          wpm,
          accuracy,
          consistency,
          raw_wpm
        )
      `)
      .eq('challenged_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      receivedQuery = receivedQuery.eq('status', status);
    }

    const [sentResult, receivedResult] = await Promise.all([sentQuery, receivedQuery]);

    if (sentResult.error) {
      console.error('Error fetching sent challenges:', sentResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch challenges', details: sentResult.error.message },
        { status: 500 }
      );
    }

    if (receivedResult.error) {
      console.error('Error fetching received challenges:', receivedResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch challenges', details: receivedResult.error.message },
        { status: 500 }
      );
    }

    const typedSent = (sentResult.data || []) as unknown as ChallengeRow[];
    const typedReceived = (receivedResult.data || []) as unknown as ChallengeRow[];

    // Format challenges
    const formatChallenge = (c: ChallengeRow, direction: 'sent' | 'received') => ({
      id: c.id,
      challengerId: c.challenger_id,
      challengedId: c.challenged_id,
      status: c.status,
      direction,
      testMode: c.test_mode,
      testDuration: c.test_duration,
      testWordCount: c.test_word_count,
      testLanguage: c.test_language,
      testText: c.test_text,
      message: c.message,
      winnerId: c.winner_id,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      challenger: c.challenger ? {
        id: c.challenger.id,
        username: c.challenger.username,
        displayName: c.challenger.display_name,
        avatarUrl: c.challenger.avatar_url,
      } : null,
      challenged: c.challenged ? {
        id: c.challenged.id,
        username: c.challenged.username,
        displayName: c.challenged.display_name,
        avatarUrl: c.challenged.avatar_url,
      } : null,
      challengerResult: c.challenger_result ? {
        id: c.challenger_result.id,
        wpm: c.challenger_result.wpm,
        accuracy: c.challenger_result.accuracy,
        consistency: c.challenger_result.consistency,
        rawWpm: c.challenger_result.raw_wpm,
      } : null,
      challengedResult: c.challenged_result ? {
        id: c.challenged_result.id,
        wpm: c.challenged_result.wpm,
        accuracy: c.challenged_result.accuracy,
        consistency: c.challenged_result.consistency,
        rawWpm: c.challenged_result.raw_wpm,
      } : null,
    });

    const sent = typedSent.map(c => formatChallenge(c, 'sent'));
    const received = typedReceived.map(c => formatChallenge(c, 'received'));

    // Combine and sort by created_at descending
    const all = [...sent, ...received].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      challenges: all,
      sent,
      received,
      counts: {
        total: all.length,
        sent: sent.length,
        received: received.length,
        pending: all.filter(c => c.status === 'pending').length,
        active: all.filter(c => c.status === 'accepted' || c.status === 'in_progress').length,
        completed: all.filter(c => c.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/challenges:', error instanceof Error ? {
      message: error.message,
      stack: error.stack,
    } : error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges
 * Create a new challenge
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
    const { challengedId, testMode, testDuration, testWordCount, testLanguage, message } = body;

    // Validate required fields
    if (!challengedId) {
      return NextResponse.json(
        { error: 'challengedId is required' },
        { status: 400 }
      );
    }

    if (!testMode) {
      return NextResponse.json(
        { error: 'testMode is required' },
        { status: 400 }
      );
    }

    // Cannot challenge yourself
    if (challengedId === user.id) {
      return NextResponse.json(
        { error: 'Cannot challenge yourself' },
        { status: 400 }
      );
    }

    // Check that challenged user exists
    const { data: challengedUser } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', challengedId)
      .single();

    if (!challengedUser) {
      return NextResponse.json(
        { error: 'Challenged user not found' },
        { status: 404 }
      );
    }

    // Check for existing pending challenge between these users
    const { data: existingChallenge } = await supabase
      .from('challenges')
      .select('id')
      .eq('challenger_id', user.id)
      .eq('challenged_id', challengedId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingChallenge) {
      return NextResponse.json(
        { error: 'You already have a pending challenge with this user' },
        { status: 409 }
      );
    }

    // Generate test text for word-based challenges
    const wordCount = testMode === 'words' ? (testWordCount || 25) : 50;
    const language = testLanguage || 'english';
    const words = generateWords(language as 'english' | 'programming' | 'custom', wordCount);
    const testText = words.join(' ');

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create the challenge
    const { data: challenge, error: insertError } = await supabase
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenged_id: challengedId,
        status: 'pending',
        test_mode: testMode,
        test_duration: testMode === 'time' ? (testDuration || 30) : null,
        test_word_count: testMode === 'words' ? (testWordCount || 25) : null,
        test_language: language,
        test_text: testText,
        message: message || null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating challenge:', insertError);
      return NextResponse.json(
        { error: 'Failed to create challenge', details: insertError.message },
        { status: 500 }
      );
    }

    // Create notification for challenged user
    const { data: challengerProfile } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    const challengerName = challengerProfile?.display_name || challengerProfile?.username || 'Someone';

    try {
      await supabase.rpc('create_notification', {
        p_user_id: challengedId,
        p_type: 'challenge_received',
        p_title: 'New Challenge',
        p_message: `${challengerName} challenged you to a typing duel!`,
        p_data: JSON.stringify({ challenge_id: challenge.id }),
        p_link: '/challenges',
      });
    } catch {
      // Notification creation is non-critical
      console.warn('Failed to create challenge notification');
    }

    return NextResponse.json({
      challenge,
      message: 'Challenge sent successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
