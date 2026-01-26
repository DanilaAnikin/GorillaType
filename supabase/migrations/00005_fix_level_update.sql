-- =============================================================================
-- Fix Level Update Functionality
-- =============================================================================
-- This migration ensures that the level is properly updated whenever XP changes.
-- The level formula is: level = floor(sqrt(xp / 100)) + 1
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: calculate_level_from_xp()
-- Calculates the level based on XP using the formula: level = floor(sqrt(xp / 100)) + 1
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount BIGINT)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(xp_amount / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_level_from_xp(BIGINT) IS 'Calculates level from XP using formula: level = floor(sqrt(xp / 100)) + 1';

-- -----------------------------------------------------------------------------
-- Function: update_level_on_xp_change()
-- Trigger function that updates the level whenever XP is modified on profiles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_level_on_xp_change()
RETURNS TRIGGER AS $$
DECLARE
    calculated_level INTEGER;
BEGIN
    -- Only update level if XP actually changed
    IF NEW.xp IS DISTINCT FROM OLD.xp THEN
        calculated_level := calculate_level_from_xp(NEW.xp);

        -- Only update if level would be different
        IF calculated_level IS DISTINCT FROM NEW.level THEN
            NEW.level := calculated_level;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_level_on_xp_change() IS 'Trigger function to automatically update level when XP changes on profiles';

-- -----------------------------------------------------------------------------
-- Drop existing trigger if it exists, then create a new one
-- This ensures level is updated whenever XP is modified via any method
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_level_on_xp_change ON profiles;

CREATE TRIGGER trigger_update_level_on_xp_change
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.xp IS DISTINCT FROM OLD.xp)
    EXECUTE FUNCTION update_level_on_xp_change();

-- -----------------------------------------------------------------------------
-- Recalculate all existing levels to ensure consistency
-- This fixes any profiles where level may be out of sync with XP
-- -----------------------------------------------------------------------------
UPDATE profiles
SET level = calculate_level_from_xp(xp)
WHERE level IS DISTINCT FROM calculate_level_from_xp(xp);

-- -----------------------------------------------------------------------------
-- Update the existing update_profile_stats() function to use the helper function
-- This ensures consistency between the trigger and manual level calculations
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
    -- Use the helper function for level calculation
    new_level := calculate_level_from_xp(new_xp);

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

COMMENT ON FUNCTION update_profile_stats() IS 'Updates profile statistics and gamification data after test completion';
