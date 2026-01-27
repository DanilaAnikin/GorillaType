-- =============================================================================
-- Add is_public column to clans table
-- =============================================================================
-- This migration adds the is_public boolean column to the clans table
-- to support public/private clan visibility settings.
-- =============================================================================

-- Add is_public column with default true (public by default)
ALTER TABLE clans ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;

-- Add index for filtering by visibility
CREATE INDEX IF NOT EXISTS idx_clans_is_public ON clans(is_public);

-- Comment
COMMENT ON COLUMN clans.is_public IS 'Whether the clan is publicly visible and joinable';
