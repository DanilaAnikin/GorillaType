-- =============================================================================
-- Migration: Clean up duplicate leaderboard entries
-- =============================================================================
-- This migration removes duplicate leaderboard entries, keeping only the
-- highest WPM entry for each user per configuration (mode, duration/word_count, language).
--
-- The issue: The unique constraint uses NULL values for test_duration and test_word_count,
-- and in PostgreSQL, NULL != NULL, so the constraint doesn't prevent duplicates when
-- these columns are NULL.
-- =============================================================================

-- Step 1: Create a temporary table to identify entries to keep
-- We want to keep the entry with the highest WPM for each user/config combination
CREATE TEMP TABLE leaderboard_entries_to_keep AS
SELECT DISTINCT ON (user_id, test_mode, COALESCE(test_duration, -1), COALESCE(test_word_count, -1), test_language)
    id
FROM leaderboards
ORDER BY
    user_id,
    test_mode,
    COALESCE(test_duration, -1),
    COALESCE(test_word_count, -1),
    test_language,
    wpm DESC,           -- Highest WPM first
    achieved_at ASC;    -- Earlier achievement wins ties

-- Step 2: Delete all entries that are NOT in the keep list
DELETE FROM leaderboards
WHERE id NOT IN (SELECT id FROM leaderboard_entries_to_keep);

-- Step 3: Drop the temporary table
DROP TABLE leaderboard_entries_to_keep;

-- Step 4: Create a unique index that properly handles NULLs
-- Drop the old constraint if it exists (it may fail silently if doesn't exist)
ALTER TABLE leaderboards DROP CONSTRAINT IF EXISTS unique_leaderboard_entry;

-- Create a new unique index using COALESCE to handle NULL values properly
-- This ensures true uniqueness even when test_duration or test_word_count is NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboards_unique_user_config
ON leaderboards (
    user_id,
    test_mode,
    COALESCE(test_duration, -1),
    COALESCE(test_word_count, -1),
    test_language
);

-- Step 5: Add a comment explaining the index
COMMENT ON INDEX idx_leaderboards_unique_user_config IS
'Ensures one leaderboard entry per user per test configuration. Uses COALESCE to handle NULL values in test_duration and test_word_count.';

-- =============================================================================
-- Verification query (run this to check results after migration):
-- =============================================================================
-- SELECT
--     user_id,
--     test_mode,
--     test_duration,
--     test_word_count,
--     test_language,
--     COUNT(*) as entry_count
-- FROM leaderboards
-- GROUP BY user_id, test_mode, test_duration, test_word_count, test_language
-- HAVING COUNT(*) > 1;
--
-- This should return 0 rows if the cleanup was successful.
-- =============================================================================
