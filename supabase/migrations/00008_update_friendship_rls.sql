-- =============================================================================
-- Update Friendships RLS Policies
-- =============================================================================
-- This migration updates the friendships RLS policies to allow both parties
-- to update friendships in certain cases (like blocking).

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can respond to friend requests" ON friendships;

-- Create a new policy that allows both parties to update friendships
-- The API layer will handle the business logic of what updates are allowed
CREATE POLICY "Users can update own friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
    WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Comment explaining the policy
COMMENT ON POLICY "Users can update own friendships" ON friendships IS
    'Allows either party in a friendship to update the record. Business logic for what updates are allowed is handled in the API.';
