-- =============================================================================
-- Fix Clan Member Count Default Value
-- =============================================================================
-- The member_count defaults to 1 in the clans table, but the trigger
-- create_clan_owner_member() also inserts the owner as a member, which
-- triggers update_clan_member_count() to increment by 1.
-- This results in member_count = 2 when only the owner exists.
--
-- Solution: Change the default to 0 so that when the trigger adds the owner,
-- the count becomes 1 (correct).
-- =============================================================================

-- Update the default value for member_count from 1 to 0
ALTER TABLE clans ALTER COLUMN member_count SET DEFAULT 0;

-- Fix existing clans that have incorrect member counts
-- This will recalculate the actual member count from clan_members table
UPDATE clans c
SET member_count = (
    SELECT COUNT(*)
    FROM clan_members cm
    WHERE cm.clan_id = c.id
);

-- Also ensure total_tests and average_wpm are initially 0 (they already default to 0)
-- This is just a safety check to ensure consistency
UPDATE clans c
SET
    total_tests = 0,
    average_wpm = 0
WHERE total_tests != 0 OR average_wpm != 0;

-- =============================================================================
-- Note: The API now calculates these stats dynamically from:
-- - member_count: COUNT of clan_members
-- - total_tests: SUM of profiles.tests_completed for all clan members
-- - average_wpm: AVG of each member's average WPM from typing_results
--
-- The denormalized values in the clans table are kept for potential future
-- optimizations but are not used by the API.
-- =============================================================================
