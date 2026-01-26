-- =============================================================================
-- Add 'declined' status to friendship_status enum
-- =============================================================================
-- This migration adds the 'declined' status to the friendship_status enum
-- to allow users to decline friend requests without blocking.

-- Add 'declined' to the friendship_status enum
ALTER TYPE friendship_status ADD VALUE IF NOT EXISTS 'declined';

-- Add a comment explaining the status values
COMMENT ON TYPE friendship_status IS 'Friendship status: pending (awaiting response), accepted (friends), declined (request rejected), blocked (user blocked)';
