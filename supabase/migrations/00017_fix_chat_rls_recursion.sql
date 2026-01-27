-- =============================================================================
-- Fix RLS Policy Infinite Recursion
-- =============================================================================
-- This migration fixes infinite recursion issues in RLS policies:
-- 1. chat_participants SELECT policy references itself
-- 2. race_rooms and race_participants have circular references
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: is_chat_participant()
-- Checks if the current user is a participant in a given chat room
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_chat_participant(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM chat_participants
        WHERE room_id = p_room_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- Function: is_race_participant()
-- Checks if the current user is a participant in a given race room
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_race_participant(p_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM race_participants
        WHERE room_id = p_room_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- Function: can_view_race_room()
-- Checks if the current user can view a race room (public, host, or participant)
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_view_race_room(p_room_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_private BOOLEAN;
    v_host_id UUID;
BEGIN
    SELECT is_private, host_id INTO v_is_private, v_host_id
    FROM race_rooms
    WHERE id = p_room_id;

    -- Room not found
    IF v_host_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Public room or user is host
    IF NOT v_is_private OR v_host_id = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- Check if user is a participant
    RETURN is_race_participant(p_room_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- FIX CHAT_PARTICIPANTS RLS POLICIES
-- =============================================================================

-- Drop the problematic self-referencing SELECT policy
DROP POLICY IF EXISTS "Users can view participants in own rooms" ON chat_participants;

-- Create new SELECT policy using the helper function
-- Users can see participants in rooms where they are also a participant
CREATE POLICY "Users can view participants in own rooms"
    ON chat_participants FOR SELECT
    USING (
        -- User can see their own participation records directly
        user_id = auth.uid()
        OR
        -- User can see other participants if they're in the same room
        is_chat_participant(room_id)
    );

-- Note: The other chat_participants policies (UPDATE, INSERT, DELETE) are fine
-- because they use direct auth.uid() checks without subqueries to the same table

-- =============================================================================
-- FIX RACE_ROOMS RLS POLICIES
-- =============================================================================

-- Drop the problematic policy that queries race_participants
DROP POLICY IF EXISTS "Participants can view room" ON race_rooms;

-- The "Public race rooms are viewable" policy is fine, keep it
-- It only checks: is_private = false OR host_id = auth.uid()

-- Create new policy for participants to view race rooms using the helper function
CREATE POLICY "Participants can view room"
    ON race_rooms FOR SELECT
    USING (is_race_participant(id));

-- =============================================================================
-- FIX RACE_PARTICIPANTS RLS POLICIES
-- =============================================================================

-- Drop the problematic policy that queries race_rooms
DROP POLICY IF EXISTS "Participants are viewable in accessible rooms" ON race_participants;

-- Create new SELECT policy using the helper function
-- Users can view participants in rooms they have access to
CREATE POLICY "Participants are viewable in accessible rooms"
    ON race_participants FOR SELECT
    USING (
        -- User can always see their own participation
        user_id = auth.uid()
        OR
        -- User can see other participants if they can view the room
        can_view_race_room(room_id)
    );

-- Drop the problematic DELETE policy for hosts that queries race_rooms
DROP POLICY IF EXISTS "Hosts can remove participants" ON race_participants;

-- Create new DELETE policy for hosts using a direct approach
-- Hosts can remove participants from their rooms
CREATE POLICY "Hosts can remove participants"
    ON race_participants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM race_rooms
            WHERE race_rooms.id = race_participants.room_id
            AND race_rooms.host_id = auth.uid()
        )
    );

-- Note: This policy queries race_rooms, but race_rooms policies now use
-- is_race_participant() function which doesn't query race_rooms, breaking the cycle

-- =============================================================================
-- FIX CHAT_ROOMS RLS POLICIES (use helper functions)
-- =============================================================================

-- Drop and recreate the race chat rooms policy to use the helper function
DROP POLICY IF EXISTS "Race chat rooms are viewable by race participants" ON chat_rooms;

CREATE POLICY "Race chat rooms are viewable by race participants"
    ON chat_rooms FOR SELECT
    USING (
        type = 'race' AND is_active = true AND
        is_race_participant(race_room_id)
    );

-- Drop and recreate the direct chat rooms policy to use the helper function
DROP POLICY IF EXISTS "Direct chat rooms are viewable by participants" ON chat_rooms;

CREATE POLICY "Direct chat rooms are viewable by participants"
    ON chat_rooms FOR SELECT
    USING (
        type = 'direct' AND
        is_chat_participant(id)
    );

-- =============================================================================
-- FIX CHAT_MESSAGES RLS POLICIES (use helper functions)
-- =============================================================================

-- Drop and recreate the messages SELECT policy to use helper functions
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON chat_messages;

CREATE POLICY "Users can view messages in accessible rooms"
    ON chat_messages FOR SELECT
    USING (
        -- Global chat (everyone can read)
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            WHERE cr.id = chat_messages.room_id
            AND cr.type = 'global'
            AND cr.is_active = true
        )
        OR
        -- Direct chat (participants only) - use helper function
        (
            EXISTS (
                SELECT 1 FROM chat_rooms cr
                WHERE cr.id = chat_messages.room_id
                AND cr.type = 'direct'
            )
            AND is_chat_participant(room_id)
        )
        OR
        -- Race chat (race participants only) - use helper function
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            WHERE cr.id = chat_messages.room_id
            AND cr.type = 'race'
            AND is_race_participant(cr.race_room_id)
        )
    );

-- Drop and recreate the messages INSERT policy to use helper functions
DROP POLICY IF EXISTS "Users can send messages if not banned" ON chat_messages;

CREATE POLICY "Users can send messages if not banned"
    ON chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND NOT is_user_banned_from_chat(auth.uid(), room_id)
        AND (
            -- Global chat (any authenticated user)
            EXISTS (
                SELECT 1 FROM chat_rooms cr
                WHERE cr.id = room_id
                AND cr.type = 'global'
                AND cr.is_active = true
            )
            OR
            -- Direct chat (participants only) - use helper function
            (
                EXISTS (
                    SELECT 1 FROM chat_rooms cr
                    WHERE cr.id = room_id
                    AND cr.type = 'direct'
                )
                AND is_chat_participant(room_id)
            )
            OR
            -- Race chat (race participants only) - use helper function
            EXISTS (
                SELECT 1 FROM chat_rooms cr
                WHERE cr.id = room_id
                AND cr.type = 'race'
                AND is_race_participant(cr.race_room_id)
            )
        )
    );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION is_chat_participant(UUID) IS 'Checks if the current user is a participant in a chat room (SECURITY DEFINER to bypass RLS)';
COMMENT ON FUNCTION is_race_participant(UUID) IS 'Checks if the current user is a participant in a race room (SECURITY DEFINER to bypass RLS)';
COMMENT ON FUNCTION can_view_race_room(UUID) IS 'Checks if the current user can view a race room (SECURITY DEFINER to bypass RLS)';
