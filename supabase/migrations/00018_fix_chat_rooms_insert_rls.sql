-- =============================================================================
-- Fix Chat Rooms INSERT RLS Policy
-- =============================================================================
-- Fixes the RLS INSERT policy issue for chat_rooms and chat_participants tables.
-- When creating group chats via POST /api/chat, the INSERT into chat_rooms fails
-- with "42501: new row violates row-level security policy for table chat_rooms".
-- The original INSERT policies from migration 00013 may not have been fully
-- applied due to earlier migration failures.
--
-- This migration:
-- 1. Drops and recreates INSERT policies on chat_rooms and chat_participants
-- 2. Creates a create_group_chat_room() SECURITY DEFINER function for atomic
--    group chat creation (similar to get_or_create_direct_chat_room for DMs)
-- =============================================================================

-- =============================================================================
-- FIX CHAT_ROOMS INSERT POLICY
-- =============================================================================

-- Drop the old policy (may not have been applied correctly)
DROP POLICY IF EXISTS "System can insert chat rooms" ON chat_rooms;

-- Recreate with explicit role grant for authenticated users
CREATE POLICY "Authenticated users can create chat rooms"
    ON chat_rooms FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =============================================================================
-- FIX CHAT_PARTICIPANTS INSERT POLICY
-- =============================================================================

-- Drop the old policy (may not have been applied correctly)
DROP POLICY IF EXISTS "System can insert participants" ON chat_participants;

-- Recreate with explicit role grant for authenticated users
CREATE POLICY "Authenticated users can add participants"
    ON chat_participants FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =============================================================================
-- GROUP CHAT ROOM CREATION FUNCTION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: create_group_chat_room()
-- Creates a group chat room and adds all participants atomically.
-- Uses SECURITY DEFINER to bypass RLS (similar to get_or_create_direct_chat_room).
-- Groups use the 'direct' room type and are differentiated by participant
-- count and room name.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_group_chat_room(
    p_creator_id UUID,
    p_name TEXT,
    p_participant_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    new_room_id UUID;
    participant_id UUID;
    all_participants UUID[];
BEGIN
    -- Create the room (using 'direct' type - groups are differentiated by participant count/name)
    INSERT INTO chat_rooms (type, name, is_active)
    VALUES ('direct', p_name, true)
    RETURNING id INTO new_room_id;

    -- Build full participant list (creator + specified participants)
    all_participants := array_prepend(p_creator_id, p_participant_ids);

    -- Add all participants
    FOREACH participant_id IN ARRAY all_participants
    LOOP
        INSERT INTO chat_participants (room_id, user_id)
        VALUES (new_room_id, participant_id)
        ON CONFLICT (room_id, user_id) DO NOTHING;
    END LOOP;

    RETURN new_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION create_group_chat_room(UUID, TEXT, UUID[]) IS 'Creates a group chat room with participants atomically (SECURITY DEFINER to bypass RLS)';
