-- =============================================================================
-- Gorilla Type - Initial Database Schema
-- =============================================================================
-- A comprehensive typing test application with gamification, social features,
-- and competitive multiplayer functionality.
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Note: uuid-ossp extension not needed - using PostgreSQL's built-in gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram matching for username search

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Test mode types
CREATE TYPE test_mode AS ENUM ('time', 'words', 'quote', 'zen', 'custom');
CREATE TYPE test_difficulty AS ENUM ('easy', 'normal', 'hard', 'expert', 'master');
CREATE TYPE language_type AS ENUM ('english', 'english_1k', 'english_5k', 'english_10k', 'english_25k', 'english_50k', 'code_javascript', 'code_python', 'code_rust', 'code_go');
CREATE TYPE caret_style AS ENUM ('line', 'block', 'underline', 'outline', 'off');
CREATE TYPE sound_volume AS ENUM ('off', 'quiet', 'medium', 'loud');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE race_status AS ENUM ('waiting', 'countdown', 'racing', 'finished', 'cancelled');

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- Extends Supabase auth.users with application-specific data

CREATE TABLE profiles (
    -- Primary key references auth.users
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identity
    username VARCHAR(32) UNIQUE NOT NULL,
    display_name VARCHAR(64),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,

    -- Equipment
    keyboard VARCHAR(128),

    -- Social links (stored as JSONB for flexibility)
    social_links JSONB DEFAULT '{}'::JSONB,
    -- Expected structure:
    -- {
    --   "twitter": "username",
    --   "github": "username",
    --   "discord": "username#1234",
    --   "website": "https://example.com"
    -- }

    -- Privacy
    is_public BOOLEAN DEFAULT true NOT NULL,

    -- Location
    country_code CHAR(2),

    -- Denormalized stats (updated by triggers)
    tests_completed INTEGER DEFAULT 0 NOT NULL,
    tests_started INTEGER DEFAULT 0 NOT NULL,
    time_typing_ms BIGINT DEFAULT 0 NOT NULL,

    -- Gamification
    xp BIGINT DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_activity_date DATE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_username_trgm ON profiles USING GIN(username gin_trgm_ops);
CREATE INDEX idx_profiles_country_code ON profiles(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX idx_profiles_level ON profiles(level DESC);
CREATE INDEX idx_profiles_tests_completed ON profiles(tests_completed DESC);
CREATE INDEX idx_profiles_is_public ON profiles(is_public) WHERE is_public = true;
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- =============================================================================
-- USER CONFIGS TABLE
-- =============================================================================
-- Stores all user preferences and settings

CREATE TABLE user_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Test settings
    test_mode test_mode DEFAULT 'time' NOT NULL,
    test_duration INTEGER DEFAULT 30 NOT NULL, -- seconds for time mode
    test_word_count INTEGER DEFAULT 25 NOT NULL, -- words for word mode
    test_language language_type DEFAULT 'english' NOT NULL,
    test_difficulty test_difficulty DEFAULT 'normal' NOT NULL,
    punctuation_enabled BOOLEAN DEFAULT false NOT NULL,
    numbers_enabled BOOLEAN DEFAULT false NOT NULL,

    -- Visual settings
    theme VARCHAR(64) DEFAULT 'dark' NOT NULL,
    font_family VARCHAR(64) DEFAULT 'monospace' NOT NULL,
    font_size INTEGER DEFAULT 24 NOT NULL, -- pixels
    smooth_caret BOOLEAN DEFAULT true NOT NULL,
    caret_style caret_style DEFAULT 'line' NOT NULL,
    show_live_wpm BOOLEAN DEFAULT true NOT NULL,
    show_live_accuracy BOOLEAN DEFAULT true NOT NULL,
    show_timer BOOLEAN DEFAULT true NOT NULL,
    show_progress_bar BOOLEAN DEFAULT true NOT NULL,
    blind_mode BOOLEAN DEFAULT false NOT NULL,

    -- Sound settings
    sound_on_click sound_volume DEFAULT 'off' NOT NULL,
    sound_on_error sound_volume DEFAULT 'off' NOT NULL,
    sound_on_complete sound_volume DEFAULT 'medium' NOT NULL,

    -- Behavior settings
    stop_on_error BOOLEAN DEFAULT false NOT NULL,
    confidence_mode BOOLEAN DEFAULT false NOT NULL, -- no backspace
    quick_restart BOOLEAN DEFAULT true NOT NULL,
    auto_save_results BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_user_config UNIQUE(user_id)
);

-- Indexes for user_configs
CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);

-- =============================================================================
-- TYPING RESULTS TABLE
-- =============================================================================
-- Stores individual test results with detailed metrics

CREATE TABLE typing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Core metrics
    wpm DECIMAL(6,2) NOT NULL,
    raw_wpm DECIMAL(6,2) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL, -- percentage 0-100
    consistency DECIMAL(5,2), -- percentage 0-100, lower variance = higher

    -- Character stats
    chars_correct INTEGER NOT NULL,
    chars_incorrect INTEGER NOT NULL,
    chars_extra INTEGER DEFAULT 0 NOT NULL,
    chars_missed INTEGER DEFAULT 0 NOT NULL,

    -- Test configuration (denormalized for querying)
    test_mode test_mode NOT NULL,
    test_duration INTEGER, -- actual duration in seconds
    test_word_count INTEGER, -- actual word count
    test_language language_type NOT NULL,
    test_difficulty test_difficulty DEFAULT 'normal' NOT NULL,
    punctuation_enabled BOOLEAN DEFAULT false NOT NULL,
    numbers_enabled BOOLEAN DEFAULT false NOT NULL,

    -- Text content
    test_text TEXT, -- the actual text typed (optional, for replay)

    -- Chart data for results visualization (JSONB for flexibility)
    chart_data JSONB,
    -- Expected structure:
    -- {
    --   "wpm": [{"time": 1, "wpm": 45}, {"time": 2, "wpm": 52}, ...],
    --   "raw": [{"time": 1, "raw": 48}, {"time": 2, "raw": 55}, ...],
    --   "errors": [{"time": 3, "count": 1}, {"time": 7, "count": 2}, ...]
    -- }

    -- Validation flags
    is_personal_best BOOLEAN DEFAULT false NOT NULL,
    afk_detected BOOLEAN DEFAULT false NOT NULL,
    invalid_reason VARCHAR(128), -- null if valid

    -- Timestamps
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for typing_results
CREATE INDEX idx_typing_results_user_id ON typing_results(user_id);
CREATE INDEX idx_typing_results_user_completed ON typing_results(user_id, completed_at DESC);
CREATE INDEX idx_typing_results_wpm ON typing_results(wpm DESC);
CREATE INDEX idx_typing_results_mode_duration ON typing_results(test_mode, test_duration);
CREATE INDEX idx_typing_results_mode_words ON typing_results(test_mode, test_word_count);
CREATE INDEX idx_typing_results_language ON typing_results(test_language);
CREATE INDEX idx_typing_results_completed_at ON typing_results(completed_at DESC);
CREATE INDEX idx_typing_results_is_pb ON typing_results(is_personal_best) WHERE is_personal_best = true;
CREATE INDEX idx_typing_results_valid ON typing_results(user_id, wpm DESC)
    WHERE invalid_reason IS NULL AND afk_detected = false;

-- Composite index for common leaderboard queries
CREATE INDEX idx_typing_results_leaderboard ON typing_results(
    test_mode, test_duration, test_language, wpm DESC
) WHERE invalid_reason IS NULL AND afk_detected = false;

-- =============================================================================
-- PERSONAL BESTS TABLE
-- =============================================================================
-- Denormalized table for fast PB lookups per configuration

CREATE TABLE personal_bests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    result_id UUID NOT NULL REFERENCES typing_results(id) ON DELETE CASCADE,

    -- Configuration key (determines unique PB category)
    test_mode test_mode NOT NULL,
    test_duration INTEGER, -- for time mode
    test_word_count INTEGER, -- for word mode
    test_language language_type NOT NULL,
    punctuation_enabled BOOLEAN DEFAULT false NOT NULL,
    numbers_enabled BOOLEAN DEFAULT false NOT NULL,

    -- Denormalized metrics for fast display
    wpm DECIMAL(6,2) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,

    -- Timestamps
    achieved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint on configuration combination per user
    CONSTRAINT unique_pb_config UNIQUE(
        user_id, test_mode, test_duration, test_word_count,
        test_language, punctuation_enabled, numbers_enabled
    )
);

-- Indexes for personal_bests
CREATE INDEX idx_personal_bests_user_id ON personal_bests(user_id);
CREATE INDEX idx_personal_bests_wpm ON personal_bests(wpm DESC);
CREATE INDEX idx_personal_bests_config ON personal_bests(
    test_mode, test_duration, test_language
);

-- =============================================================================
-- LEADERBOARDS TABLE
-- =============================================================================
-- Denormalized leaderboard entries for fast queries

CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    result_id UUID NOT NULL REFERENCES typing_results(id) ON DELETE CASCADE,

    -- Leaderboard category
    test_mode test_mode NOT NULL,
    test_duration INTEGER, -- for time mode
    test_word_count INTEGER, -- for word mode
    test_language language_type NOT NULL,

    -- Denormalized data for display
    username VARCHAR(32) NOT NULL,
    wpm DECIMAL(6,2) NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    country_code CHAR(2),

    -- Ranking (updated periodically or on insert)
    rank INTEGER,

    -- Timestamps
    achieved_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- One entry per user per category
    CONSTRAINT unique_leaderboard_entry UNIQUE(
        user_id, test_mode, test_duration, test_word_count, test_language
    )
);

-- Indexes for leaderboards
CREATE INDEX idx_leaderboards_category ON leaderboards(
    test_mode, test_duration, test_language, wpm DESC
);
CREATE INDEX idx_leaderboards_rank ON leaderboards(
    test_mode, test_duration, test_language, rank
);
CREATE INDEX idx_leaderboards_country ON leaderboards(
    country_code, test_mode, test_duration, wpm DESC
) WHERE country_code IS NOT NULL;
CREATE INDEX idx_leaderboards_user_id ON leaderboards(user_id);

-- =============================================================================
-- ACHIEVEMENTS TABLE
-- =============================================================================
-- Tracks user achievements and badges

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Achievement identification
    achievement_key VARCHAR(64) NOT NULL,
    achievement_name VARCHAR(128) NOT NULL,
    achievement_description TEXT,
    achievement_icon VARCHAR(64),

    -- Achievement metadata
    tier INTEGER DEFAULT 1 NOT NULL, -- bronze, silver, gold, etc.
    xp_reward INTEGER DEFAULT 0 NOT NULL,

    -- Progress tracking (for progressive achievements)
    progress INTEGER DEFAULT 0 NOT NULL,
    target INTEGER DEFAULT 1 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,

    -- Timestamps
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_key)
);

-- Indexes for achievements
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_completed ON achievements(user_id, is_completed)
    WHERE is_completed = true;
CREATE INDEX idx_achievements_key ON achievements(achievement_key);

-- =============================================================================
-- FRIENDSHIPS TABLE
-- =============================================================================
-- Manages friend relationships between users

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User initiating the friend request
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    -- User receiving the friend request
    addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Friendship status
    status friendship_status DEFAULT 'pending' NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate friendships
    CONSTRAINT unique_friendship UNIQUE(requester_id, addressee_id),
    -- Prevent self-friendship
    CONSTRAINT no_self_friendship CHECK(requester_id != addressee_id)
);

-- Indexes for friendships
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_accepted ON friendships(requester_id, addressee_id)
    WHERE status = 'accepted';

-- =============================================================================
-- USER TAGS TABLE
-- =============================================================================
-- Custom tags created by users

CREATE TABLE user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Tag information
    name VARCHAR(32) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080' NOT NULL, -- hex color

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_user_tag UNIQUE(user_id, name)
);

-- Indexes for user_tags
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);

-- =============================================================================
-- RESULT TAGS TABLE
-- =============================================================================
-- Junction table for tagging results

CREATE TABLE result_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES typing_results(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES user_tags(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_result_tag UNIQUE(result_id, tag_id)
);

-- Indexes for result_tags
CREATE INDEX idx_result_tags_result_id ON result_tags(result_id);
CREATE INDEX idx_result_tags_tag_id ON result_tags(tag_id);

-- =============================================================================
-- RACE ROOMS TABLE
-- =============================================================================
-- Multiplayer race lobby management

CREATE TABLE race_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Room configuration
    room_code VARCHAR(8) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Room settings
    test_mode test_mode DEFAULT 'time' NOT NULL,
    test_duration INTEGER DEFAULT 30 NOT NULL,
    test_word_count INTEGER DEFAULT 25 NOT NULL,
    test_language language_type DEFAULT 'english' NOT NULL,
    test_text TEXT, -- pre-generated text for all participants

    -- Room state
    status race_status DEFAULT 'waiting' NOT NULL,
    max_participants INTEGER DEFAULT 5 NOT NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,

    -- Timing
    countdown_started_at TIMESTAMPTZ,
    race_started_at TIMESTAMPTZ,
    race_ended_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for race_rooms
CREATE INDEX idx_race_rooms_code ON race_rooms(room_code);
CREATE INDEX idx_race_rooms_host ON race_rooms(host_id);
CREATE INDEX idx_race_rooms_status ON race_rooms(status);
CREATE INDEX idx_race_rooms_public ON race_rooms(status, is_private)
    WHERE is_private = false AND status = 'waiting';
CREATE INDEX idx_race_rooms_created_at ON race_rooms(created_at DESC);

-- =============================================================================
-- RACE PARTICIPANTS TABLE
-- =============================================================================
-- Tracks participants in race rooms

CREATE TABLE race_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES race_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Participant state
    is_ready BOOLEAN DEFAULT false NOT NULL,
    is_finished BOOLEAN DEFAULT false NOT NULL,

    -- Results (populated after race)
    wpm DECIMAL(6,2),
    accuracy DECIMAL(5,2),
    progress DECIMAL(5,2) DEFAULT 0 NOT NULL, -- percentage 0-100
    finish_position INTEGER,
    finish_time_ms INTEGER, -- time to complete in milliseconds

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    finished_at TIMESTAMPTZ,

    CONSTRAINT unique_room_participant UNIQUE(room_id, user_id)
);

-- Indexes for race_participants
CREATE INDEX idx_race_participants_room ON race_participants(room_id);
CREATE INDEX idx_race_participants_user ON race_participants(user_id);
CREATE INDEX idx_race_participants_room_position ON race_participants(room_id, finish_position);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: update_updated_at()
-- Automatically updates the updated_at timestamp on row modification
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Function: handle_new_user()
-- Creates a profile when a new user signs up via Supabase Auth
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_username VARCHAR(32);
BEGIN
    -- Generate a unique username from email or random
    generated_username := COALESCE(
        SPLIT_PART(NEW.email, '@', 1),
        'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    );

    -- Ensure username is unique by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = generated_username) LOOP
        generated_username := generated_username || '_' || SUBSTRING(gen_random_uuid()::TEXT, 1, 4);
    END LOOP;

    -- Truncate to max length
    generated_username := SUBSTRING(generated_username, 1, 32);

    -- Create the profile
    INSERT INTO profiles (id, username, email, display_name)
    VALUES (
        NEW.id,
        generated_username,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', generated_username)
    );

    -- Create default user config
    INSERT INTO user_configs (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: update_profile_stats()
-- Updates profile statistics after a test is completed
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    xp_earned INTEGER;
    new_xp BIGINT;
    new_level INTEGER;
    current_date_val DATE;
    last_activity DATE;
    new_streak INTEGER;
BEGIN
    -- Only process valid tests
    IF NEW.invalid_reason IS NOT NULL OR NEW.afk_detected = true THEN
        RETURN NEW;
    END IF;

    -- Calculate XP earned (base: 10, plus bonuses for performance)
    xp_earned := 10;

    -- Bonus XP for high WPM
    IF NEW.wpm >= 100 THEN
        xp_earned := xp_earned + 20;
    ELSIF NEW.wpm >= 80 THEN
        xp_earned := xp_earned + 15;
    ELSIF NEW.wpm >= 60 THEN
        xp_earned := xp_earned + 10;
    ELSIF NEW.wpm >= 40 THEN
        xp_earned := xp_earned + 5;
    END IF;

    -- Bonus XP for high accuracy
    IF NEW.accuracy >= 100 THEN
        xp_earned := xp_earned + 15;
    ELSIF NEW.accuracy >= 98 THEN
        xp_earned := xp_earned + 10;
    ELSIF NEW.accuracy >= 95 THEN
        xp_earned := xp_earned + 5;
    END IF;

    -- Bonus XP for longer tests
    IF NEW.test_duration >= 120 THEN
        xp_earned := xp_earned + 10;
    ELSIF NEW.test_duration >= 60 THEN
        xp_earned := xp_earned + 5;
    END IF;

    -- Get current profile data
    SELECT xp, last_activity_date, current_streak
    INTO new_xp, last_activity, new_streak
    FROM profiles
    WHERE id = NEW.user_id;

    -- Update streak
    current_date_val := CURRENT_DATE;
    IF last_activity IS NULL OR last_activity < current_date_val - INTERVAL '1 day' THEN
        -- Streak broken or first activity
        new_streak := 1;
    ELSIF last_activity = current_date_val - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        new_streak := new_streak + 1;
    END IF;
    -- If last_activity = current_date, streak stays the same

    -- Calculate new XP and level
    new_xp := new_xp + xp_earned;
    -- Level formula: level = floor(sqrt(xp / 100)) + 1
    new_level := FLOOR(SQRT(new_xp / 100.0)) + 1;

    -- Update profile
    UPDATE profiles
    SET
        tests_completed = tests_completed + 1,
        time_typing_ms = time_typing_ms + COALESCE(NEW.test_duration * 1000, 0),
        xp = new_xp,
        level = new_level,
        current_streak = new_streak,
        longest_streak = GREATEST(longest_streak, new_streak),
        last_activity_date = current_date_val,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: check_personal_best()
-- Checks if a new result is a personal best and updates accordingly
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_personal_best()
RETURNS TRIGGER AS $$
DECLARE
    existing_pb_id UUID;
    existing_pb_wpm DECIMAL(6,2);
    user_country CHAR(2);
    user_username VARCHAR(32);
BEGIN
    -- Only process valid tests
    IF NEW.invalid_reason IS NOT NULL OR NEW.afk_detected = true THEN
        RETURN NEW;
    END IF;

    -- Check for existing PB with same configuration
    SELECT id, wpm INTO existing_pb_id, existing_pb_wpm
    FROM personal_bests
    WHERE user_id = NEW.user_id
        AND test_mode = NEW.test_mode
        AND (test_duration = NEW.test_duration OR (test_duration IS NULL AND NEW.test_duration IS NULL))
        AND (test_word_count = NEW.test_word_count OR (test_word_count IS NULL AND NEW.test_word_count IS NULL))
        AND test_language = NEW.test_language
        AND punctuation_enabled = NEW.punctuation_enabled
        AND numbers_enabled = NEW.numbers_enabled;

    -- If no existing PB or new WPM is higher
    IF existing_pb_id IS NULL OR NEW.wpm > existing_pb_wpm THEN
        -- Mark result as personal best
        NEW.is_personal_best := true;

        -- Get user info for leaderboard
        SELECT country_code, username INTO user_country, user_username
        FROM profiles WHERE id = NEW.user_id;

        IF existing_pb_id IS NOT NULL THEN
            -- Update existing PB
            UPDATE personal_bests
            SET
                result_id = NEW.id,
                wpm = NEW.wpm,
                accuracy = NEW.accuracy,
                achieved_at = NEW.completed_at,
                updated_at = NOW()
            WHERE id = existing_pb_id;

            -- Update leaderboard entry
            UPDATE leaderboards
            SET
                result_id = NEW.id,
                wpm = NEW.wpm,
                accuracy = NEW.accuracy,
                username = user_username,
                country_code = user_country,
                achieved_at = NEW.completed_at,
                updated_at = NOW()
            WHERE user_id = NEW.user_id
                AND test_mode = NEW.test_mode
                AND (test_duration = NEW.test_duration OR (test_duration IS NULL AND NEW.test_duration IS NULL))
                AND (test_word_count = NEW.test_word_count OR (test_word_count IS NULL AND NEW.test_word_count IS NULL))
                AND test_language = NEW.test_language;
        ELSE
            -- Insert new PB
            INSERT INTO personal_bests (
                user_id, result_id, test_mode, test_duration, test_word_count,
                test_language, punctuation_enabled, numbers_enabled,
                wpm, accuracy, achieved_at
            ) VALUES (
                NEW.user_id, NEW.id, NEW.test_mode, NEW.test_duration, NEW.test_word_count,
                NEW.test_language, NEW.punctuation_enabled, NEW.numbers_enabled,
                NEW.wpm, NEW.accuracy, NEW.completed_at
            );

            -- Insert leaderboard entry
            INSERT INTO leaderboards (
                user_id, result_id, test_mode, test_duration, test_word_count,
                test_language, username, wpm, accuracy, country_code, achieved_at
            ) VALUES (
                NEW.user_id, NEW.id, NEW.test_mode, NEW.test_duration, NEW.test_word_count,
                NEW.test_language, user_username, NEW.wpm, NEW.accuracy, user_country, NEW.completed_at
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps triggers
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_configs_updated_at
    BEFORE UPDATE ON user_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_personal_bests_updated_at
    BEFORE UPDATE ON personal_bests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_leaderboards_updated_at
    BEFORE UPDATE ON leaderboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_friendships_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_tags_updated_at
    BEFORE UPDATE ON user_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_race_rooms_updated_at
    BEFORE UPDATE ON race_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Handle new user signup
CREATE TRIGGER trigger_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profile stats after test completion
CREATE TRIGGER trigger_update_profile_stats
    AFTER INSERT ON typing_results
    FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- Check for personal best before insert (uses BEFORE to modify NEW)
CREATE TRIGGER trigger_check_personal_best
    BEFORE INSERT ON typing_results
    FOR EACH ROW EXECUTE FUNCTION check_personal_best();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles Policies
-- -----------------------------------------------------------------------------

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (is_public = true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Profiles are created via trigger (system only)
CREATE POLICY "System can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- User Configs Policies
-- -----------------------------------------------------------------------------

-- Users can only view their own config
CREATE POLICY "Users can view own config"
    ON user_configs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own config
CREATE POLICY "Users can update own config"
    ON user_configs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own config (backup for trigger)
CREATE POLICY "Users can insert own config"
    ON user_configs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Typing Results Policies
-- -----------------------------------------------------------------------------

-- Users can view their own results
CREATE POLICY "Users can view own results"
    ON typing_results FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can view results of public profiles (for profile pages)
CREATE POLICY "Public results are viewable"
    ON typing_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = typing_results.user_id
            AND profiles.is_public = true
        )
    );

-- Users can insert their own results
CREATE POLICY "Users can insert own results"
    ON typing_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own results (for tagging)
CREATE POLICY "Users can update own results"
    ON typing_results FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own results
CREATE POLICY "Users can delete own results"
    ON typing_results FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Personal Bests Policies
-- -----------------------------------------------------------------------------

-- Users can view their own PBs
CREATE POLICY "Users can view own personal bests"
    ON personal_bests FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can view PBs of public profiles
CREATE POLICY "Public personal bests are viewable"
    ON personal_bests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = personal_bests.user_id
            AND profiles.is_public = true
        )
    );

-- System manages PBs via triggers (no direct user modifications)
-- INSERT and UPDATE handled by trigger functions with SECURITY DEFINER

-- -----------------------------------------------------------------------------
-- Leaderboards Policies
-- -----------------------------------------------------------------------------

-- Everyone can view leaderboards
CREATE POLICY "Leaderboards are viewable by everyone"
    ON leaderboards FOR SELECT
    USING (true);

-- System manages leaderboards via triggers (no direct user modifications)

-- -----------------------------------------------------------------------------
-- Achievements Policies
-- -----------------------------------------------------------------------------

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
    ON achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can view achievements of public profiles
CREATE POLICY "Public achievements are viewable"
    ON achievements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = achievements.user_id
            AND profiles.is_public = true
        )
    );

-- System manages achievements (no direct user modifications)

-- -----------------------------------------------------------------------------
-- Friendships Policies
-- -----------------------------------------------------------------------------

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships they received (accept/block)
CREATE POLICY "Users can respond to friend requests"
    ON friendships FOR UPDATE
    USING (auth.uid() = addressee_id)
    WITH CHECK (auth.uid() = addressee_id);

-- Users can delete friendships they're part of
CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- -----------------------------------------------------------------------------
-- User Tags Policies
-- -----------------------------------------------------------------------------

-- Users can view their own tags
CREATE POLICY "Users can view own tags"
    ON user_tags FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own tags
CREATE POLICY "Users can create own tags"
    ON user_tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
    ON user_tags FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags"
    ON user_tags FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Result Tags Policies
-- -----------------------------------------------------------------------------

-- Users can view tags on their own results
CREATE POLICY "Users can view own result tags"
    ON result_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM typing_results
            WHERE typing_results.id = result_tags.result_id
            AND typing_results.user_id = auth.uid()
        )
    );

-- Users can add tags to their own results
CREATE POLICY "Users can add tags to own results"
    ON result_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM typing_results
            WHERE typing_results.id = result_tags.result_id
            AND typing_results.user_id = auth.uid()
        )
    );

-- Users can remove tags from their own results
CREATE POLICY "Users can remove tags from own results"
    ON result_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM typing_results
            WHERE typing_results.id = result_tags.result_id
            AND typing_results.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Race Rooms Policies
-- -----------------------------------------------------------------------------

-- Anyone can view public race rooms
CREATE POLICY "Public race rooms are viewable"
    ON race_rooms FOR SELECT
    USING (is_private = false OR host_id = auth.uid());

-- Users can view rooms they're participating in
CREATE POLICY "Participants can view room"
    ON race_rooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM race_participants
            WHERE race_participants.room_id = race_rooms.id
            AND race_participants.user_id = auth.uid()
        )
    );

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
    ON race_rooms FOR INSERT
    WITH CHECK (auth.uid() = host_id);

-- Hosts can update their rooms
CREATE POLICY "Hosts can update own rooms"
    ON race_rooms FOR UPDATE
    USING (auth.uid() = host_id)
    WITH CHECK (auth.uid() = host_id);

-- Hosts can delete their rooms
CREATE POLICY "Hosts can delete own rooms"
    ON race_rooms FOR DELETE
    USING (auth.uid() = host_id);

-- -----------------------------------------------------------------------------
-- Race Participants Policies
-- -----------------------------------------------------------------------------

-- Anyone can view participants in rooms they can see
CREATE POLICY "Participants are viewable in accessible rooms"
    ON race_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM race_rooms
            WHERE race_rooms.id = race_participants.room_id
            AND (race_rooms.is_private = false OR race_rooms.host_id = auth.uid())
        )
        OR user_id = auth.uid()
    );

-- Users can join rooms
CREATE POLICY "Users can join rooms"
    ON race_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own participant record (ready status, progress)
CREATE POLICY "Users can update own participation"
    ON race_participants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms
CREATE POLICY "Users can leave rooms"
    ON race_participants FOR DELETE
    USING (auth.uid() = user_id);

-- Hosts can remove participants
CREATE POLICY "Hosts can remove participants"
    ON race_participants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM race_rooms
            WHERE race_rooms.id = race_participants.room_id
            AND race_rooms.host_id = auth.uid()
        )
    );

-- =============================================================================
-- HELPER VIEWS (Optional)
-- =============================================================================

-- View for user stats summary
CREATE OR REPLACE VIEW user_stats_summary AS
SELECT
    p.id,
    p.username,
    p.tests_completed,
    p.time_typing_ms,
    p.xp,
    p.level,
    p.current_streak,
    p.longest_streak,
    ROUND(AVG(tr.wpm)::numeric, 2) as avg_wpm,
    ROUND(AVG(tr.accuracy)::numeric, 2) as avg_accuracy,
    MAX(tr.wpm) as max_wpm,
    COUNT(DISTINCT DATE(tr.completed_at)) as active_days
FROM profiles p
LEFT JOIN typing_results tr ON tr.user_id = p.id
    AND tr.invalid_reason IS NULL
    AND tr.afk_detected = false
WHERE p.is_public = true
GROUP BY p.id, p.username, p.tests_completed, p.time_typing_ms,
         p.xp, p.level, p.current_streak, p.longest_streak;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users with application-specific data';
COMMENT ON TABLE user_configs IS 'User preferences and test settings';
COMMENT ON TABLE typing_results IS 'Individual typing test results with detailed metrics';
COMMENT ON TABLE personal_bests IS 'Denormalized personal best records per test configuration';
COMMENT ON TABLE leaderboards IS 'Denormalized leaderboard entries for fast global ranking queries';
COMMENT ON TABLE achievements IS 'User achievements and badges with progress tracking';
COMMENT ON TABLE friendships IS 'Friend relationships between users';
COMMENT ON TABLE user_tags IS 'Custom tags created by users for organizing results';
COMMENT ON TABLE result_tags IS 'Junction table linking typing results to user tags';
COMMENT ON TABLE race_rooms IS 'Multiplayer race room configuration and state';
COMMENT ON TABLE race_participants IS 'Participants in multiplayer race rooms';

COMMENT ON FUNCTION handle_new_user() IS 'Creates profile and default config when a new user signs up';
COMMENT ON FUNCTION update_profile_stats() IS 'Updates profile statistics and gamification data after test completion';
COMMENT ON FUNCTION check_personal_best() IS 'Checks for and updates personal best records and leaderboard entries';
COMMENT ON FUNCTION update_updated_at() IS 'Generic trigger function to update updated_at timestamp';
