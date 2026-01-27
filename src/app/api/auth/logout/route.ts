import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * Server-side logout that properly clears session cookies
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out server-side - this will clear the session cookies
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, we should clear cookies and return success
      // The client will handle clearing local state
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error);
    // Still return success - client should clear local state regardless
    return NextResponse.json({ success: true });
  }
}
