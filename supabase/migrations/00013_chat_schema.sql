-- =============================================================================
-- Gorilla Type - Chat System Schema
-- =============================================================================
-- Adds chat functionality including global chat, clan chat, race chat,
-- and direct messaging between users.
-- =============================================================================

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Chat room types
DO $$ BEGIN
    CREATE TYPE chat_room_type AS ENUM ('global', 'clan', 'race', 'direct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chat message types
DO $$ BEGIN
    CREATE TYPE chat_message_type AS ENUM ('text', 'result_share', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- CHAT ROOMS TABLE
-- =============================================================================
-- Stores different chat room configurations

CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room type and identification
    type chat_room_type NOT NULL,
    name VARCHAR(128), -- For global/clan rooms, nullable for direct/race

    -- Foreign keys (nullable based on room type)
    clan_id UUID, -- FK to clans table (to be added when clans feature is implemented)
    race_room_id UUID REFERENCES race_rooms(id) ON DELETE CASCADE,

    -- Room state
    is_active BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add constraint for clan_id when clans table exists
-- ALTER TABLE chat_rooms ADD CONSTRAINT fk_chat_rooms_clan_id
--     FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE;

-- Indexes for chat_rooms
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_clan_id ON chat_rooms(clan_id) WHERE clan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_race_room_id ON chat_rooms(race_room_id) WHERE race_room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_active ON chat_rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_active ON chat_rooms(type, is_active) WHERE is_active = true;

-- =============================================================================
-- CHAT MESSAGES TABLE
-- =============================================================================
-- Stores individual chat messages

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room and sender
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Message content
    content TEXT NOT NULL,
    message_type chat_message_type DEFAULT 'text' NOT NULL,

    -- Optional result share reference
    result_id UUID REFERENCES typing_results(id) ON DELETE SET NULL,

    -- Soft delete and edit tracking
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    edited_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Content length constraint (max 500 characters)
    CONSTRAINT chat_message_content_length CHECK (char_length(content) <= 500)
);

-- Indexes for chat_messages (optimized for message retrieval)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_result_id ON chat_messages(result_id) WHERE result_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_not_deleted ON chat_messages(room_id, created_at DESC)
    WHERE is_deleted = false;

-- Composite index for paginated message retrieval (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_pagination ON chat_messages(room_id, created_at DESC, id)
    WHERE is_deleted = false;

-- =============================================================================
-- CHAT PARTICIPANTS TABLE
-- =============================================================================
-- Tracks participants in chat rooms (primarily for direct messages)

CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room and user
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Participant state
    last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_muted BOOLEAN DEFAULT false NOT NULL,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint per room/user combination
    CONSTRAINT unique_chat_participant UNIQUE(room_id, user_id)
);

-- Indexes for chat_participants
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room ON chat_participants(user_id, room_id);

-- Index for finding unread messages
CREATE INDEX IF NOT EXISTS idx_chat_participants_last_read ON chat_participants(user_id, last_read_at);

-- =============================================================================
-- CHAT BANS TABLE
-- =============================================================================
-- Tracks chat bans (room-specific or global)

CREATE TABLE IF NOT EXISTS chat_bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room reference (nullable for global bans)
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,

    -- User being banned and who banned them
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Ban details
    reason TEXT,
    expires_at TIMESTAMPTZ, -- NULL for permanent bans

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for chat_bans
CREATE INDEX IF NOT EXISTS idx_chat_bans_room_id ON chat_bans(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_bans_user_id ON chat_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_bans_room_user ON chat_bans(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_bans_global ON chat_bans(user_id) WHERE room_id IS NULL;
-- Index for looking up bans (without time-based predicate since NOW() is not immutable)
CREATE INDEX IF NOT EXISTS idx_chat_bans_active ON chat_bans(user_id, room_id, expires_at);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: create_global_chat_room()
-- Creates the global chat room if it doesn't exist
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_global_chat_room()
RETURNS UUID AS $$
DECLARE
    global_room_id UUID;
BEGIN
    -- Try to find existing global room
    SELECT id INTO global_room_id
    FROM chat_rooms
    WHERE type = 'global' AND name = 'Global Chat'
    LIMIT 1;

    -- Create if not exists
    IF global_room_id IS NULL THEN
        INSERT INTO chat_rooms (type, name, is_active)
        VALUES ('global', 'Global Chat', true)
        RETURNING id INTO global_room_id;
    END IF;

    RETURN global_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: get_or_create_direct_chat_room()
-- Gets or creates a direct message room between two users
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_or_create_direct_chat_room(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    direct_room_id UUID;
BEGIN
    -- Check if a direct room already exists between these users
    SELECT cp1.room_id INTO direct_room_id
    FROM chat_participants cp1
    INNER JOIN chat_participants cp2 ON cp1.room_id = cp2.room_id
    INNER JOIN chat_rooms cr ON cr.id = cp1.room_id
    WHERE cp1.user_id = user1_id
      AND cp2.user_id = user2_id
      AND cr.type = 'direct'
    LIMIT 1;

    -- Create new direct room if not exists
    IF direct_room_id IS NULL THEN
        INSERT INTO chat_rooms (type, is_active)
        VALUES ('direct', true)
        RETURNING id INTO direct_room_id;

        -- Add both participants
        INSERT INTO chat_participants (room_id, user_id)
        VALUES
            (direct_room_id, user1_id),
            (direct_room_id, user2_id);
    END IF;

    RETURN direct_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: create_race_chat_room()
-- Creates a chat room for a race room
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_race_chat_room(p_race_room_id UUID)
RETURNS UUID AS $$
DECLARE
    race_chat_room_id UUID;
BEGIN
    -- Check if race chat room already exists
    SELECT id INTO race_chat_room_id
    FROM chat_rooms
    WHERE race_room_id = p_race_room_id
    LIMIT 1;

    -- Create if not exists
    IF race_chat_room_id IS NULL THEN
        INSERT INTO chat_rooms (type, race_room_id, is_active)
        VALUES ('race', p_race_room_id, true)
        RETURNING id INTO race_chat_room_id;
    END IF;

    RETURN race_chat_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: is_user_banned_from_chat()
-- Checks if a user is banned from a specific room or globally
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_user_banned_from_chat(p_user_id UUID, p_room_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM chat_bans
        WHERE user_id = p_user_id
          AND (room_id = p_room_id OR room_id IS NULL) -- Check specific room or global ban
          AND (expires_at IS NULL OR expires_at > NOW()) -- Not expired
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: get_unread_message_count()
-- Gets the count of unread messages for a user in a room
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID, p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
    last_read TIMESTAMPTZ;
    unread_count INTEGER;
BEGIN
    -- Get user's last read timestamp for this room
    SELECT last_read_at INTO last_read
    FROM chat_participants
    WHERE user_id = p_user_id AND room_id = p_room_id;

    -- If not a participant, return 0
    IF last_read IS NULL THEN
        RETURN 0;
    END IF;

    -- Count messages after last read
    SELECT COUNT(*) INTO unread_count
    FROM chat_messages
    WHERE room_id = p_room_id
      AND created_at > last_read
      AND sender_id != p_user_id
      AND is_deleted = false;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to automatically create race chat room when race room is created
CREATE OR REPLACE FUNCTION trigger_create_race_chat_room()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_race_chat_room(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_race_room_chat_creation ON race_rooms;
CREATE TRIGGER trigger_race_room_chat_creation
    AFTER INSERT ON race_rooms
    FOR EACH ROW EXECUTE FUNCTION trigger_create_race_chat_room();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all chat tables
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_bans ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Chat Rooms Policies
-- -----------------------------------------------------------------------------

-- Global rooms are viewable by everyone
DROP POLICY IF EXISTS "Global chat rooms are viewable by everyone" ON chat_rooms;
CREATE POLICY "Global chat rooms are viewable by everyone"
    ON chat_rooms FOR SELECT
    USING (type = 'global' AND is_active = true);

-- Race rooms are viewable by race participants
DROP POLICY IF EXISTS "Race chat rooms are viewable by race participants" ON chat_rooms;
CREATE POLICY "Race chat rooms are viewable by race participants"
    ON chat_rooms FOR SELECT
    USING (
        type = 'race' AND is_active = true AND
        EXISTS (
            SELECT 1 FROM race_participants rp
            WHERE rp.room_id = chat_rooms.race_room_id
            AND rp.user_id = auth.uid()
        )
    );

-- Direct message rooms are viewable by participants
DROP POLICY IF EXISTS "Direct chat rooms are viewable by participants" ON chat_rooms;
CREATE POLICY "Direct chat rooms are viewable by participants"
    ON chat_rooms FOR SELECT
    USING (
        type = 'direct' AND
        EXISTS (
            SELECT 1 FROM chat_participants cp
            WHERE cp.room_id = chat_rooms.id
            AND cp.user_id = auth.uid()
        )
    );

-- Clan rooms are viewable by clan members (placeholder - implement when clans exist)
-- CREATE POLICY "Clan chat rooms are viewable by clan members"
--     ON chat_rooms FOR SELECT
--     USING (
--         type = 'clan' AND is_active = true AND
--         EXISTS (
--             SELECT 1 FROM clan_members cm
--             WHERE cm.clan_id = chat_rooms.clan_id
--             AND cm.user_id = auth.uid()
--         )
--     );

-- System can create chat rooms (via functions with SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert chat rooms" ON chat_rooms;
CREATE POLICY "System can insert chat rooms"
    ON chat_rooms FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Chat Messages Policies
-- -----------------------------------------------------------------------------

-- Users can view messages in rooms they have access to
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
        -- Direct chat (participants only)
        EXISTS (
            SELECT 1 FROM chat_participants cp
            INNER JOIN chat_rooms cr ON cr.id = cp.room_id
            WHERE cp.room_id = chat_messages.room_id
            AND cp.user_id = auth.uid()
            AND cr.type = 'direct'
        )
        OR
        -- Race chat (race participants only)
        EXISTS (
            SELECT 1 FROM chat_rooms cr
            INNER JOIN race_participants rp ON rp.room_id = cr.race_room_id
            WHERE cr.id = chat_messages.room_id
            AND cr.type = 'race'
            AND rp.user_id = auth.uid()
        )
    );

-- Users can send messages if not banned
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
            -- Direct chat (participants only)
            EXISTS (
                SELECT 1 FROM chat_participants cp
                WHERE cp.room_id = chat_messages.room_id
                AND cp.user_id = auth.uid()
            )
            OR
            -- Race chat (race participants only)
            EXISTS (
                SELECT 1 FROM chat_rooms cr
                INNER JOIN race_participants rp ON rp.room_id = cr.race_room_id
                WHERE cr.id = room_id
                AND cr.type = 'race'
                AND rp.user_id = auth.uid()
            )
        )
    );

-- Users can edit their own messages (soft delete or edit)
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
CREATE POLICY "Users can update own messages"
    ON chat_messages FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages"
    ON chat_messages FOR DELETE
    USING (auth.uid() = sender_id);

-- -----------------------------------------------------------------------------
-- Chat Participants Policies
-- -----------------------------------------------------------------------------

-- Users can view participants in rooms they're in
DROP POLICY IF EXISTS "Users can view participants in own rooms" ON chat_participants;
CREATE POLICY "Users can view participants in own rooms"
    ON chat_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_participants cp
            WHERE cp.room_id = chat_participants.room_id
            AND cp.user_id = auth.uid()
        )
    );

-- Users can update their own participant record (mute, last_read)
DROP POLICY IF EXISTS "Users can update own participation" ON chat_participants;
CREATE POLICY "Users can update own participation"
    ON chat_participants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System manages participant creation (via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "System can insert participants" ON chat_participants;
CREATE POLICY "System can insert participants"
    ON chat_participants FOR INSERT
    WITH CHECK (true);

-- Users can leave chat rooms
DROP POLICY IF EXISTS "Users can leave chat rooms" ON chat_participants;
CREATE POLICY "Users can leave chat rooms"
    ON chat_participants FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Chat Bans Policies
-- -----------------------------------------------------------------------------

-- Users can view their own bans
DROP POLICY IF EXISTS "Users can view own bans" ON chat_bans;
CREATE POLICY "Users can view own bans"
    ON chat_bans FOR SELECT
    USING (auth.uid() = user_id);

-- Admins/moderators can view all bans (implement admin check when roles exist)
-- For now, only allow viewing own bans

-- System manages ban creation (via admin functions with SECURITY DEFINER)
DROP POLICY IF EXISTS "System can manage bans" ON chat_bans;
CREATE POLICY "System can manage bans"
    ON chat_bans FOR ALL
    USING (false)
    WITH CHECK (false);

-- =============================================================================
-- INITIALIZE GLOBAL CHAT ROOM
-- =============================================================================

-- Create the global chat room on migration run
SELECT create_global_chat_room();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE chat_rooms IS 'Chat room configurations for global, clan, race, and direct messaging';
COMMENT ON TABLE chat_messages IS 'Individual chat messages with support for text, result shares, and system messages';
COMMENT ON TABLE chat_participants IS 'Tracks users participating in chat rooms with read status and preferences';
COMMENT ON TABLE chat_bans IS 'Chat ban records for room-specific or global bans';

COMMENT ON FUNCTION create_global_chat_room() IS 'Creates or retrieves the global chat room';
COMMENT ON FUNCTION get_or_create_direct_chat_room(UUID, UUID) IS 'Gets or creates a direct message room between two users';
COMMENT ON FUNCTION create_race_chat_room(UUID) IS 'Creates a chat room for a race room';
COMMENT ON FUNCTION is_user_banned_from_chat(UUID, UUID) IS 'Checks if a user is banned from a chat room or globally';
COMMENT ON FUNCTION get_unread_message_count(UUID, UUID) IS 'Gets the count of unread messages for a user in a room';

COMMENT ON TYPE chat_room_type IS 'Types of chat rooms: global, clan, race, direct';
COMMENT ON TYPE chat_message_type IS 'Types of chat messages: text, result_share, system';
