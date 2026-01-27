import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
type ChallengeDetailRow = {
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
 * GET /api/challenges/[id]
 * Get challenge details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the challenge with joined data
    const { data, error: fetchError } = await supabase
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
      .eq('id', id)
      .single();

    if (fetchError || !data) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    const challenge = data as unknown as ChallengeDetailRow;

    // Verify user is part of this challenge
    if (challenge.challenger_id !== user.id && challenge.challenged_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this challenge' },
        { status: 403 }
      );
    }

    const direction = challenge.challenger_id === user.id ? 'sent' : 'received';

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        challengerId: challenge.challenger_id,
        challengedId: challenge.challenged_id,
        status: challenge.status,
        direction,
        testMode: challenge.test_mode,
        testDuration: challenge.test_duration,
        testWordCount: challenge.test_word_count,
        testLanguage: challenge.test_language,
        testText: challenge.test_text,
        message: challenge.message,
        winnerId: challenge.winner_id,
        expiresAt: challenge.expires_at,
        createdAt: challenge.created_at,
        updatedAt: challenge.updated_at,
        challenger: challenge.challenger ? {
          id: challenge.challenger.id,
          username: challenge.challenger.username,
          displayName: challenge.challenger.display_name,
          avatarUrl: challenge.challenger.avatar_url,
        } : null,
        challenged: challenge.challenged ? {
          id: challenge.challenged.id,
          username: challenge.challenged.username,
          displayName: challenge.challenged.display_name,
          avatarUrl: challenge.challenged.avatar_url,
        } : null,
        challengerResult: challenge.challenger_result ? {
          id: challenge.challenger_result.id,
          wpm: challenge.challenger_result.wpm,
          accuracy: challenge.challenger_result.accuracy,
          consistency: challenge.challenger_result.consistency,
          rawWpm: challenge.challenger_result.raw_wpm,
        } : null,
        challengedResult: challenge.challenged_result ? {
          id: challenge.challenged_result.id,
          wpm: challenge.challenged_result.wpm,
          accuracy: challenge.challenged_result.accuracy,
          consistency: challenge.challenged_result.consistency,
          rawWpm: challenge.challenged_result.raw_wpm,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/challenges/[id]
 * Update challenge status (accept, decline, submit result)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this challenge
    const isChallenger = challenge.challenger_id === user.id;
    const isChallenged = challenge.challenged_id === user.id;

    if (!isChallenger && !isChallenged) {
      return NextResponse.json(
        { error: 'Not authorized to update this challenge' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, resultId } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'accept': {
        // Only challenged user can accept
        if (!isChallenged) {
          return NextResponse.json(
            { error: 'Only the challenged user can accept' },
            { status: 403 }
          );
        }

        if (challenge.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only accept pending challenges' },
            { status: 400 }
          );
        }

        // Check if expired
        if (new Date(challenge.expires_at) < new Date()) {
          await supabase
            .from('challenges')
            .update({ status: 'expired' })
            .eq('id', id);

          return NextResponse.json(
            { error: 'Challenge has expired' },
            { status: 400 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({ status: 'accepted' })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error accepting challenge:', updateError);
          return NextResponse.json(
            { error: 'Failed to accept challenge' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          challenge: updated,
          message: 'Challenge accepted',
        });
      }

      case 'decline': {
        // Only challenged user can decline
        if (!isChallenged) {
          return NextResponse.json(
            { error: 'Only the challenged user can decline' },
            { status: 403 }
          );
        }

        if (challenge.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only decline pending challenges' },
            { status: 400 }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update({ status: 'declined' })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error declining challenge:', updateError);
          return NextResponse.json(
            { error: 'Failed to decline challenge' },
            { status: 500 }
          );
        }

        // Notify the challenger that their challenge was declined
        try {
          const { data: declineProfile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', user.id)
            .single();

          const declineName = declineProfile?.display_name || declineProfile?.username || 'Someone';

          await supabase.rpc('create_notification', {
            p_user_id: challenge.challenger_id,
            p_type: 'challenge_result',
            p_title: 'Challenge Declined',
            p_message: `${declineName} declined your challenge.`,
            p_data: JSON.stringify({ challenge_id: id }),
            p_link: `/challenges`,
          });
        } catch {
          console.warn('Failed to create decline notification');
        }

        return NextResponse.json({
          challenge: updated,
          message: 'Challenge declined',
        });
      }

      case 'submit_result': {
        // Both participants can submit results
        if (!resultId) {
          return NextResponse.json(
            { error: 'resultId is required for submitting a result' },
            { status: 400 }
          );
        }

        // Challenge must be accepted or in_progress
        if (challenge.status !== 'accepted' && challenge.status !== 'in_progress') {
          return NextResponse.json(
            { error: 'Challenge must be accepted to submit results' },
            { status: 400 }
          );
        }

        // Verify the result exists and belongs to this user
        const { data: result } = await supabase
          .from('typing_results')
          .select('id, wpm')
          .eq('id', resultId)
          .eq('user_id', user.id)
          .single();

        if (!result) {
          return NextResponse.json(
            { error: 'Result not found or does not belong to you' },
            { status: 404 }
          );
        }

        // Determine which result field to set
        const updateData: Record<string, unknown> = {
          status: 'in_progress',
        };

        if (isChallenger) {
          if (challenge.challenger_result_id) {
            return NextResponse.json(
              { error: 'You have already submitted a result' },
              { status: 400 }
            );
          }
          updateData.challenger_result_id = resultId;
        } else {
          if (challenge.challenged_result_id) {
            return NextResponse.json(
              { error: 'You have already submitted a result' },
              { status: 400 }
            );
          }
          updateData.challenged_result_id = resultId;
        }

        // Check if the other side has already submitted
        // If so, the DB trigger will auto-determine the winner and set status to 'completed'
        const otherResultSubmitted = isChallenger
          ? challenge.challenged_result_id !== null
          : challenge.challenger_result_id !== null;

        if (otherResultSubmitted) {
          // Both results will be present after this update,
          // the DB trigger (determine_challenge_winner) handles completion
          updateData.status = 'in_progress';
        }

        const { data: updated, error: updateError } = await supabase
          .from('challenges')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Error submitting challenge result:', updateError);
          return NextResponse.json(
            { error: 'Failed to submit result' },
            { status: 500 }
          );
        }

        // If both results are now submitted, notify both participants
        if (otherResultSubmitted) {
          try {
            const { data: completedChallenge } = await supabase
              .from('challenges')
              .select('status, winner_id, challenger_id, challenged_id')
              .eq('id', id)
              .single();

            if (completedChallenge) {
              const winnerId = completedChallenge.winner_id;
              const participantIds = [
                completedChallenge.challenger_id,
                completedChallenge.challenged_id,
              ];

              // Get submitter profile name for notification message
              const { data: submitterProfile } = await supabase
                .from('profiles')
                .select('username, display_name')
                .eq('id', user.id)
                .single();

              const submitterName = submitterProfile?.display_name || submitterProfile?.username || 'Your opponent';

              for (const participantId of participantIds) {
                const isWinner = winnerId === participantId;
                const notifTitle = isWinner
                  ? 'Challenge Won!'
                  : winnerId
                    ? 'Challenge Lost'
                    : 'Challenge Completed';
                const notifMessage = isWinner
                  ? `You won the challenge against ${submitterName}!`
                  : winnerId
                    ? `${submitterName} won the challenge. Better luck next time!`
                    : 'The challenge has been completed. View the results!';

                await supabase.rpc('create_notification', {
                  p_user_id: participantId,
                  p_type: 'challenge_result',
                  p_title: notifTitle,
                  p_message: notifMessage,
                  p_data: JSON.stringify({ challenge_id: id }),
                  p_link: `/challenges`,
                });
              }
            }
          } catch {
            console.warn('Failed to create challenge completion notifications');
          }
        }

        return NextResponse.json({
          challenge: updated,
          message: otherResultSubmitted
            ? 'Result submitted. Challenge complete!'
            : 'Result submitted. Waiting for opponent.',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: accept, decline, or submit_result' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in PATCH /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/challenges/[id]
 * Cancel a pending challenge (only by challenger)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('id, challenger_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Only the challenger can cancel
    if (challenge.challenger_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the challenger can cancel a challenge' },
        { status: 403 }
      );
    }

    // Can only cancel pending challenges
    if (challenge.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending challenges' },
        { status: 400 }
      );
    }

    // Delete the challenge
    const { error: deleteError } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting challenge:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cancel challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Challenge cancelled successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/challenges/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
