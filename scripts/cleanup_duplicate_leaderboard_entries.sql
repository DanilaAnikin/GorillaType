-- =============================================================================
-- SQL Script: Clean up duplicate leaderboard entries
-- =============================================================================
-- Run this script manually to remove duplicate leaderboard entries.
-- Keeps only the highest WPM entry for each user per configuration.
--
-- USAGE:
--   1. Connect to your Supabase database
--   2. Run this script in the SQL editor
--   3. Verify with the check query at the bottom
-- =============================================================================

-- Preview: See which entries will be DELETED (run this first to verify)
-- This shows entries that are NOT the best for each user/config
SELECT
    l.id,
    l.user_id,
    l.username,
    l.test_mode,
    l.test_duration,
    l.test_word_count,
    l.test_language,
    l.wpm,
    l.achieved_at,
    'WILL BE DELETED' as action
FROM leaderboards l
WHERE l.id NOT IN (
    SELECT DISTINCT ON (user_id, test_mode, COALESCE(test_duration, -1), COALESCE(test_word_count, -1), test_language)
        id
    FROM leaderboards
    ORDER BY
        user_id,
        test_mode,
        COALESCE(test_duration, -1),
        COALESCE(test_word_count, -1),
        test_language,
        wpm DESC,
        achieved_at ASC
)
ORDER BY user_id, test_mode, test_language, wpm DESC;

-- =============================================================================
-- ACTUAL CLEANUP: Uncomment and run this section to delete duplicates
-- =============================================================================

-- BEGIN;
--
-- -- Delete duplicate entries, keeping only the highest WPM per user/config
-- DELETE FROM leaderboards
-- WHERE id NOT IN (
--     SELECT DISTINCT ON (user_id, test_mode, COALESCE(test_duration, -1), COALESCE(test_word_count, -1), test_language)
--         id
--     FROM leaderboards
--     ORDER BY
--         user_id,
--         test_mode,
--         COALESCE(test_duration, -1),
--         COALESCE(test_word_count, -1),
--         test_language,
--         wpm DESC,
--         achieved_at ASC
-- );
--
-- -- Show how many rows were deleted
-- -- (The DELETE statement above will show the count)
--
-- COMMIT;

-- =============================================================================
-- VERIFICATION: Run this after cleanup to ensure no duplicates remain
-- =============================================================================

-- Check for any remaining duplicates (should return 0 rows)
SELECT
    user_id,
    test_mode,
    test_duration,
    test_word_count,
    test_language,
    COUNT(*) as entry_count,
    ARRAY_AGG(wpm ORDER BY wpm DESC) as wpm_values
FROM leaderboards
GROUP BY user_id, test_mode, test_duration, test_word_count, test_language
HAVING COUNT(*) > 1;

-- =============================================================================
-- OPTIONAL: Fix the unique constraint to handle NULLs properly
-- =============================================================================

-- Drop old constraint and create new index that handles NULLs
-- ALTER TABLE leaderboards DROP CONSTRAINT IF EXISTS unique_leaderboard_entry;
--
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique_user_config
-- ON leaderboards (
--     user_id,
--     test_mode,
--     COALESCE(test_duration, -1),
--     COALESCE(test_word_count, -1),
--     test_language
-- );
