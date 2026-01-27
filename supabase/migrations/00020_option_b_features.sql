-- =============================================================================
-- Gorilla Type - Option B Features: Keystroke Analytics, Notifications,
--                                   Tournaments, and Challenges
-- =============================================================================
-- Adds per-key timing analytics for replay/heatmaps, an in-app notification
-- system, a competitive tournament system with multi-round brackets, and
-- 1v1 typing challenges between users.
-- =============================================================================

-- =============================================================================
-- KEYSTROKE EVENTS TABLE
-- =============================================================================
-- Per-key timing data for analytics, replay, and keyboard heatmap

CREATE TABLE IF NOT EXISTS keystroke_events (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    result_id UUID NOT NULL REFERENCES typing_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Keystroke data
    key_char VARCHAR(8) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT true,
    timestamp_ms INTEGER NOT NULL,  -- milliseconds from test start
    key_code VARCHAR(32),           -- physical key code (e.g. 'KeyA', 'Space')

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for keystroke_events
CREATE INDEX IF NOT EXISTS idx_keystroke_events_result_id
    ON keystroke_events(result_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_user_id
    ON keystroke_events(user_id);
CREATE INDEX IF NOT EXISTS idx_keystroke_events_result_timestamp
    ON keystroke_events(result_id, timestamp_ms);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
-- In-app notification system for friend requests, achievements, tournaments, etc.

CREATE TABLE IF NOT EXISTS notifications (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(32) NOT NULL
        CHECK (type IN (
            'friend_request',
            'clan_invite',
            'pb_achieved',
            'tournament_start',
            'challenge_received',
            'challenge_result',
            'system'
        )),
    title VARCHAR(128) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::JSONB,

    -- State
    is_read BOOLEAN DEFAULT false,

    -- Optional navigation link
    link VARCHAR(256),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications(user_id, created_at DESC);

-- =============================================================================
-- TOURNAMENTS TABLE
-- =============================================================================
-- Competitive tournament system with multi-round elimination brackets

CREATE TABLE IF NOT EXISTS tournaments (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(128) NOT NULL,
    description TEXT,

    -- Ownership
    creator_id UUID NOT NULL REFERENCES profiles(id),

    -- Tournament state
    status VARCHAR(20) DEFAULT 'upcoming' NOT NULL
        CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),

    -- Test configuration
    test_mode test_mode NOT NULL DEFAULT 'time',
    test_duration INTEGER DEFAULT 30,
    test_word_count INTEGER DEFAULT 25,
    test_language language_type DEFAULT 'english',

    -- Tournament structure
    max_participants INTEGER DEFAULT 32,
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 3,

    -- Scheduling
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,

    -- Economy
    entry_xp_cost INTEGER DEFAULT 0,
    xp_prize_pool INTEGER DEFAULT 0,

    -- Visibility
    is_public BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_status
    ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time
    ON tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id
    ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_start
    ON tournaments(status, start_time);

-- =============================================================================
-- TOURNAMENT PARTICIPANTS TABLE
-- =============================================================================
-- Tracks tournament registrations, progression, and final results

CREATE TABLE IF NOT EXISTS tournament_participants (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Participant state
    status VARCHAR(20) DEFAULT 'registered' NOT NULL
        CHECK (status IN ('registered', 'active', 'eliminated', 'winner', 'disqualified')),

    -- Progress tracking
    current_round INTEGER DEFAULT 0,
    best_wpm DECIMAL(6,2) DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0,
    final_rank INTEGER,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- One registration per user per tournament
    CONSTRAINT unique_tournament_participant UNIQUE(tournament_id, user_id)
);

-- Indexes for tournament_participants
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id
    ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id
    ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_leaderboard
    ON tournament_participants(tournament_id, total_score DESC);

-- =============================================================================
-- TOURNAMENT ROUNDS TABLE
-- =============================================================================
-- Individual round results within a tournament for each participant

CREATE TABLE IF NOT EXISTS tournament_rounds (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
    result_id UUID REFERENCES typing_results(id) ON DELETE SET NULL,

    -- Round identification
    round_number INTEGER NOT NULL,

    -- Round results
    wpm DECIMAL(6,2),
    accuracy DECIMAL(5,2),
    score DECIMAL(10,2) DEFAULT 0,

    -- Timing
    completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One result per participant per round in a tournament
    CONSTRAINT unique_tournament_round_entry UNIQUE(tournament_id, participant_id, round_number)
);

-- Indexes for tournament_rounds
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament_id
    ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_participant_id
    ON tournament_rounds(participant_id);

-- =============================================================================
-- CHALLENGES TABLE
-- =============================================================================
-- 1v1 typing challenges between users

CREATE TABLE IF NOT EXISTS challenges (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenged_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Challenge state
    status VARCHAR(20) DEFAULT 'pending' NOT NULL
        CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'expired')),

    -- Test configuration
    test_mode test_mode NOT NULL DEFAULT 'time',
    test_duration INTEGER DEFAULT 30,
    test_word_count INTEGER DEFAULT 25,
    test_language language_type DEFAULT 'english',
    test_text TEXT,  -- pre-generated text both players type

    -- Results
    challenger_result_id UUID REFERENCES typing_results(id) ON DELETE SET NULL,
    challenged_result_id UUID REFERENCES typing_results(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES profiles(id),

    -- Optional message from challenger
    message VARCHAR(256),

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent self-challenges
    CONSTRAINT no_self_challenge CHECK (challenger_id != challenged_id)
);

-- Indexes for challenges
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id
    ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged_id
    ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status
    ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_status_expires
    ON challenges(status, expires_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers for tables with updated_at columns
CREATE TRIGGER trigger_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE keystroke_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Keystroke Events Policies
-- -----------------------------------------------------------------------------

-- Users can view their own keystroke data
CREATE POLICY "Users can view own keystroke events"
    ON keystroke_events FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own keystroke data
CREATE POLICY "Users can insert own keystroke events"
    ON keystroke_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Notifications Policies
-- -----------------------------------------------------------------------------

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- System inserts notifications via SECURITY DEFINER functions
-- Allow service-role / trigger-based inserts
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Tournaments Policies
-- -----------------------------------------------------------------------------

-- Everyone can view public tournaments
CREATE POLICY "Public tournaments are viewable by everyone"
    ON tournaments FOR SELECT
    USING (is_public = true);

-- Creators can view their own tournaments (including private)
CREATE POLICY "Creators can view own tournaments"
    ON tournaments FOR SELECT
    USING (auth.uid() = creator_id);

-- Participants can view tournaments they are registered in (including private)
CREATE POLICY "Participants can view joined tournaments"
    ON tournaments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournament_participants tp
            WHERE tp.tournament_id = tournaments.id
            AND tp.user_id = auth.uid()
        )
    );

-- Authenticated users can create tournaments
CREATE POLICY "Authenticated users can create tournaments"
    ON tournaments FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own tournaments
CREATE POLICY "Creators can update own tournaments"
    ON tournaments FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own tournaments (only if upcoming)
CREATE POLICY "Creators can delete own upcoming tournaments"
    ON tournaments FOR DELETE
    USING (auth.uid() = creator_id AND status = 'upcoming');

-- -----------------------------------------------------------------------------
-- Tournament Participants Policies
-- -----------------------------------------------------------------------------

-- Everyone can view tournament participants (leaderboards are public)
CREATE POLICY "Tournament participants are viewable by everyone"
    ON tournament_participants FOR SELECT
    USING (true);

-- Authenticated users can register themselves for tournaments
CREATE POLICY "Users can register for tournaments"
    ON tournament_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- System updates participant status/scores via SECURITY DEFINER
-- Allow tournament creators to update participants (advance rounds, eliminate, etc.)
CREATE POLICY "Tournament creators can update participants"
    ON tournament_participants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_participants.tournament_id
            AND t.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_participants.tournament_id
            AND t.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Tournament Rounds Policies
-- -----------------------------------------------------------------------------

-- Everyone can view tournament round results
CREATE POLICY "Tournament rounds are viewable by everyone"
    ON tournament_rounds FOR SELECT
    USING (true);

-- Participants can insert their own round results
CREATE POLICY "Participants can insert own round results"
    ON tournament_rounds FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournament_participants tp
            WHERE tp.id = tournament_rounds.participant_id
            AND tp.user_id = auth.uid()
        )
    );

-- Tournament creators can update round results (scoring adjustments)
CREATE POLICY "Tournament creators can update rounds"
    ON tournament_rounds FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_rounds.tournament_id
            AND t.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_rounds.tournament_id
            AND t.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- Challenges Policies
-- -----------------------------------------------------------------------------

-- Users can view challenges they are involved in
CREATE POLICY "Users can view own challenges"
    ON challenges FOR SELECT
    USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Authenticated users can create challenges (as the challenger)
CREATE POLICY "Users can create challenges"
    ON challenges FOR INSERT
    WITH CHECK (auth.uid() = challenger_id);

-- Involved users can update challenges (accept, decline, submit results)
CREATE POLICY "Involved users can update challenges"
    ON challenges FOR UPDATE
    USING (auth.uid() = challenger_id OR auth.uid() = challenged_id)
    WITH CHECK (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Challengers can delete their own pending challenges
CREATE POLICY "Challengers can delete pending challenges"
    ON challenges FOR DELETE
    USING (auth.uid() = challenger_id AND status = 'pending');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: create_notification()
-- SECURITY DEFINER helper to create notifications from triggers/server code
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(32),
    p_title VARCHAR(128),
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::JSONB,
    p_link VARCHAR(256) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data, link)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, p_link)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: expire_pending_challenges()
-- Marks expired challenges as 'expired'
-- Can be called periodically via pg_cron or on-demand
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_pending_challenges()
RETURNS void AS $$
BEGIN
    UPDATE challenges
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: determine_challenge_winner()
-- Determines the winner of a completed challenge based on WPM
-- Called after both results are submitted
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION determine_challenge_winner()
RETURNS TRIGGER AS $$
DECLARE
    challenger_wpm DECIMAL(6,2);
    challenged_wpm DECIMAL(6,2);
BEGIN
    -- Only act when both results are present
    IF NEW.challenger_result_id IS NOT NULL AND NEW.challenged_result_id IS NOT NULL
       AND NEW.status = 'in_progress' THEN

        -- Get WPM from both results
        SELECT wpm INTO challenger_wpm
        FROM typing_results WHERE id = NEW.challenger_result_id;

        SELECT wpm INTO challenged_wpm
        FROM typing_results WHERE id = NEW.challenged_result_id;

        -- Determine winner (higher WPM wins)
        IF challenger_wpm IS NOT NULL AND challenged_wpm IS NOT NULL THEN
            IF challenger_wpm >= challenged_wpm THEN
                NEW.winner_id := NEW.challenger_id;
            ELSE
                NEW.winner_id := NEW.challenged_id;
            END IF;
            NEW.status := 'completed';

            -- Notify both users of the result
            PERFORM create_notification(
                NEW.challenger_id,
                'challenge_result',
                'Challenge Complete',
                CASE WHEN NEW.winner_id = NEW.challenger_id
                    THEN 'You won the challenge!'
                    ELSE 'You lost the challenge.'
                END,
                jsonb_build_object(
                    'challenge_id', NEW.id,
                    'your_wpm', challenger_wpm,
                    'opponent_wpm', challenged_wpm
                ),
                '/challenges/' || NEW.id::TEXT
            );

            PERFORM create_notification(
                NEW.challenged_id,
                'challenge_result',
                'Challenge Complete',
                CASE WHEN NEW.winner_id = NEW.challenged_id
                    THEN 'You won the challenge!'
                    ELSE 'You lost the challenge.'
                END,
                jsonb_build_object(
                    'challenge_id', NEW.id,
                    'your_wpm', challenged_wpm,
                    'opponent_wpm', challenger_wpm
                ),
                '/challenges/' || NEW.id::TEXT
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-determine challenge winner when results are submitted
CREATE TRIGGER trigger_determine_challenge_winner
    BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION determine_challenge_winner();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE keystroke_events IS 'Per-key timing data for analytics, replay, and keyboard heatmap visualization';
COMMENT ON TABLE notifications IS 'In-app notification system for friend requests, achievements, tournaments, and challenges';
COMMENT ON TABLE tournaments IS 'Competitive tournament system with multi-round brackets and XP prizes';
COMMENT ON TABLE tournament_participants IS 'Tournament registrations tracking participant status, scores, and final rankings';
COMMENT ON TABLE tournament_rounds IS 'Individual round results within a tournament for each participant';
COMMENT ON TABLE challenges IS '1v1 typing challenges between users with configurable test settings';

COMMENT ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR) IS 'SECURITY DEFINER helper to create notifications from triggers and server-side code';
COMMENT ON FUNCTION expire_pending_challenges() IS 'Utility function to mark expired challenges, callable via pg_cron or on-demand';
COMMENT ON FUNCTION determine_challenge_winner() IS 'Trigger function that determines the winner when both challenge results are submitted';
