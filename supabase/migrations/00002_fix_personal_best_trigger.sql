-- =============================================================================
-- Fix personal_bests foreign key constraint error
-- =============================================================================
-- The check_personal_best() trigger was running BEFORE INSERT on typing_results,
-- which meant it tried to insert into personal_bests with a result_id that
-- didn't exist yet (the typing_results row hadn't been committed).
--
-- This migration changes the trigger to AFTER INSERT so the typing_results
-- row exists when the personal_bests insert happens.
-- =============================================================================

-- Drop the existing BEFORE INSERT trigger
DROP TRIGGER IF EXISTS trigger_check_personal_best ON typing_results;

-- Recreate the trigger as AFTER INSERT
-- Note: The function needs to be modified since we can't use RETURN NEW in AFTER triggers
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
        RETURN NULL;
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
        -- Mark result as personal best (update the row since it's now inserted)
        UPDATE typing_results SET is_personal_best = true WHERE id = NEW.id;

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

    RETURN NULL; -- AFTER triggers should return NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger as AFTER INSERT
CREATE TRIGGER trigger_check_personal_best
    AFTER INSERT ON typing_results
    FOR EACH ROW EXECUTE FUNCTION check_personal_best();

-- Add comment
COMMENT ON FUNCTION check_personal_best() IS 'Checks for and updates personal best records and leaderboard entries (runs AFTER insert to ensure typing_results row exists)';
