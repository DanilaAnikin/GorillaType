import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/results/[id]
 * Fetch a single test result by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    // Fetch the result with user profile info
    const { data: result, error } = await supabase
      .from('typing_results')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url,
          is_public
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Result not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching result:', error);
      return NextResponse.json(
        { error: 'Failed to fetch result' },
        { status: 500 }
      );
    }

    // Check if user can view this result
    const isOwner = result.user_id === user.id;
    const isPublic = result.profiles?.is_public;

    if (!isOwner && !isPublic) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ result, isOwner });
  } catch (error) {
    console.error('Error in GET /api/results/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/results/[id]
 * Delete a test result (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    // First, check if the result exists and belongs to the user
    const { data: existing, error: fetchError } = await supabase
      .from('typing_results')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own results' },
        { status: 403 }
      );
    }

    // Check if this result is linked to a personal best
    const { data: linkedPb } = await supabase
      .from('personal_bests')
      .select('id')
      .eq('result_id', id)
      .single();

    // Delete the personal best if it's linked to this result
    if (linkedPb) {
      await supabase
        .from('personal_bests')
        .delete()
        .eq('result_id', id);
    }

    // Delete the result
    const { error: deleteError } = await supabase
      .from('typing_results')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting result:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete result' },
        { status: 500 }
      );
    }

    // Decrement user stats (ignore errors if RPC doesn't exist)
    try {
      await supabase.rpc('decrement_tests_completed', { user_id_param: user.id });
    } catch {
      // Ignore if the RPC doesn't exist
    }

    return NextResponse.json({
      message: 'Result deleted successfully',
      deletedPb: !!linkedPb,
    });
  } catch (error) {
    console.error('Error in DELETE /api/results/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
