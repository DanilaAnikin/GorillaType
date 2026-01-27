-- =============================================================================
-- Migration: Fix leaderboard RLS policies for direct API inserts/updates
-- =============================================================================
-- The original schema assumed leaderboards would only be managed by triggers,
-- but the API also makes direct inserts/updates when saving results.
-- This migration adds the necessary RLS policies.
-- =============================================================================

-- Allow authenticated users to insert their own leaderboard entries
DROP POLICY IF EXISTS "Users can insert own leaderboard entries" ON leaderboards;
CREATE POLICY "Users can insert own leaderboard entries"
    ON leaderboards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own leaderboard entries
DROP POLICY IF EXISTS "Users can update own leaderboard entries" ON leaderboards;
CREATE POLICY "Users can update own leaderboard entries"
    ON leaderboards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Note: Delete policy not needed as users shouldn't delete leaderboard entries
-- The SELECT policy "Leaderboards are viewable by everyone" already exists
