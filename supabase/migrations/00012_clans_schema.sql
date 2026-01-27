-- =============================================================================
-- Gorilla Type - Clans System Schema
-- =============================================================================
-- Team/clan functionality allowing users to form groups, compete together,
-- and track collective statistics.
-- =============================================================================

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

-- Clan member role types
DO $$ BEGIN
    CREATE TYPE clan_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Clan invite status types
DO $$ BEGIN
    CREATE TYPE clan_invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- CLANS TABLE
-- =============================================================================
-- Main clans table storing clan information and aggregate statistics

CREATE TABLE IF NOT EXISTS clans (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(32) UNIQUE NOT NULL,
    tag VARCHAR(5) UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,

    -- Ownership
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Denormalized statistics (updated by triggers)
    member_count INTEGER DEFAULT 1 NOT NULL,
    total_tests INTEGER DEFAULT 0 NOT NULL,
    average_wpm DECIMAL(6,2) DEFAULT 0 NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT clans_name_length CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 32),
    CONSTRAINT clans_tag_length CHECK (LENGTH(tag) >= 2 AND LENGTH(tag) <= 5),
    CONSTRAINT clans_tag_uppercase CHECK (tag = UPPER(tag)),
    CONSTRAINT clans_description_length CHECK (description IS NULL OR LENGTH(description) <= 500),
    CONSTRAINT clans_member_count_positive CHECK (member_count >= 0),
    CONSTRAINT clans_total_tests_positive CHECK (total_tests >= 0),
    CONSTRAINT clans_average_wpm_positive CHECK (average_wpm >= 0)
);

-- Indexes for clans
CREATE INDEX IF NOT EXISTS idx_clans_name ON clans(name);
CREATE INDEX IF NOT EXISTS idx_clans_tag ON clans(tag);
CREATE INDEX IF NOT EXISTS idx_clans_owner_id ON clans(owner_id);
CREATE INDEX IF NOT EXISTS idx_clans_member_count ON clans(member_count DESC);
CREATE INDEX IF NOT EXISTS idx_clans_average_wpm ON clans(average_wpm DESC);
CREATE INDEX IF NOT EXISTS idx_clans_total_tests ON clans(total_tests DESC);
CREATE INDEX IF NOT EXISTS idx_clans_created_at ON clans(created_at DESC);

-- =============================================================================
-- CLAN MEMBERS TABLE
-- =============================================================================
-- Junction table tracking clan membership and member statistics

CREATE TABLE IF NOT EXISTS clan_members (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Role within the clan
    role clan_role DEFAULT 'member' NOT NULL,

    -- Member statistics
    tests_contributed INTEGER DEFAULT 0 NOT NULL,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_clan_member UNIQUE(clan_id, user_id),
    CONSTRAINT clan_members_tests_positive CHECK (tests_contributed >= 0)
);

-- Indexes for clan_members
CREATE INDEX IF NOT EXISTS idx_clan_members_clan_id ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user_id ON clan_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_role ON clan_members(clan_id, role);
CREATE INDEX IF NOT EXISTS idx_clan_members_joined_at ON clan_members(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_clan_members_tests_contributed ON clan_members(tests_contributed DESC);

-- =============================================================================
-- CLAN INVITES TABLE
-- =============================================================================
-- Tracks clan invitations (both direct and code-based)

CREATE TABLE IF NOT EXISTS clan_invites (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- nullable for open/code invites

    -- Invite code (for shareable links)
    code VARCHAR(16) UNIQUE, -- nullable for direct invites

    -- Status tracking
    status clan_invite_status DEFAULT 'pending' NOT NULL,

    -- Timestamps
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints: either invitee_id or code must be set (but not both required)
    CONSTRAINT clan_invites_valid_type CHECK (
        invitee_id IS NOT NULL OR code IS NOT NULL
    )
);

-- Indexes for clan_invites
CREATE INDEX IF NOT EXISTS idx_clan_invites_clan_id ON clan_invites(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_invites_inviter_id ON clan_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_clan_invites_invitee_id ON clan_invites(invitee_id) WHERE invitee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clan_invites_code ON clan_invites(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clan_invites_status ON clan_invites(status);
CREATE INDEX IF NOT EXISTS idx_clan_invites_expires_at ON clan_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_clan_invites_pending ON clan_invites(clan_id, status) WHERE status = 'pending';

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: update_clan_member_count()
-- Updates the member_count on the clans table when members are added/removed
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clans
        SET member_count = member_count + 1,
            updated_at = NOW()
        WHERE id = NEW.clan_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clans
        SET member_count = member_count - 1,
            updated_at = NOW()
        WHERE id = OLD.clan_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: create_clan_owner_member()
-- Automatically adds the clan owner as a member when a clan is created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_clan_owner_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO clan_members (clan_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: validate_clan_owner_change()
-- Ensures the owner is always a member with 'owner' role
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_clan_owner_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If owner is changing, update the roles accordingly
    IF OLD.owner_id != NEW.owner_id THEN
        -- Demote old owner to admin
        UPDATE clan_members
        SET role = 'admin'
        WHERE clan_id = NEW.id AND user_id = OLD.owner_id;

        -- Promote new owner (must already be a member)
        UPDATE clan_members
        SET role = 'owner'
        WHERE clan_id = NEW.id AND user_id = NEW.owner_id;

        -- Verify new owner is a member
        IF NOT FOUND THEN
            RAISE EXCEPTION 'New owner must be an existing clan member';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Function: prevent_owner_leave()
-- Prevents the clan owner from leaving without transferring ownership
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_owner_leave()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'owner' THEN
        RAISE EXCEPTION 'Clan owner cannot leave without transferring ownership first';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Function: expire_old_invites()
-- Updates status to 'expired' for invites past their expiration date
-- Called periodically or on-demand
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
    UPDATE clan_invites
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps trigger for clans
DROP TRIGGER IF EXISTS trigger_clans_updated_at ON clans;
CREATE TRIGGER trigger_clans_updated_at
    BEFORE UPDATE ON clans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create owner as member when clan is created
DROP TRIGGER IF EXISTS trigger_create_clan_owner_member ON clans;
CREATE TRIGGER trigger_create_clan_owner_member
    AFTER INSERT ON clans
    FOR EACH ROW EXECUTE FUNCTION create_clan_owner_member();

-- Validate owner changes
DROP TRIGGER IF EXISTS trigger_validate_clan_owner_change ON clans;
CREATE TRIGGER trigger_validate_clan_owner_change
    BEFORE UPDATE OF owner_id ON clans
    FOR EACH ROW EXECUTE FUNCTION validate_clan_owner_change();

-- Update member count when members join
DROP TRIGGER IF EXISTS trigger_clan_member_added ON clan_members;
CREATE TRIGGER trigger_clan_member_added
    AFTER INSERT ON clan_members
    FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- Update member count when members leave
DROP TRIGGER IF EXISTS trigger_clan_member_removed ON clan_members;
CREATE TRIGGER trigger_clan_member_removed
    AFTER DELETE ON clan_members
    FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- Prevent owner from leaving
DROP TRIGGER IF EXISTS trigger_prevent_owner_leave ON clan_members;
CREATE TRIGGER trigger_prevent_owner_leave
    BEFORE DELETE ON clan_members
    FOR EACH ROW EXECUTE FUNCTION prevent_owner_leave();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all clan tables
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_invites ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Clans Policies
-- -----------------------------------------------------------------------------

-- Anyone can view clans
DROP POLICY IF EXISTS "Clans are viewable by everyone" ON clans;
CREATE POLICY "Clans are viewable by everyone"
    ON clans FOR SELECT
    USING (true);

-- Authenticated users can create clans
DROP POLICY IF EXISTS "Authenticated users can create clans" ON clans;
CREATE POLICY "Authenticated users can create clans"
    ON clans FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Owners and admins can update clan details
DROP POLICY IF EXISTS "Owners and admins can update clans" ON clans;
CREATE POLICY "Owners and admins can update clans"
    ON clans FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clan_members
            WHERE clan_members.clan_id = clans.id
            AND clan_members.user_id = auth.uid()
            AND clan_members.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clan_members
            WHERE clan_members.clan_id = clans.id
            AND clan_members.user_id = auth.uid()
            AND clan_members.role IN ('owner', 'admin')
        )
    );

-- Only owners can delete clans
DROP POLICY IF EXISTS "Owners can delete clans" ON clans;
CREATE POLICY "Owners can delete clans"
    ON clans FOR DELETE
    USING (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- Clan Members Policies
-- -----------------------------------------------------------------------------

-- Anyone can view clan members
DROP POLICY IF EXISTS "Clan members are viewable by everyone" ON clan_members;
CREATE POLICY "Clan members are viewable by everyone"
    ON clan_members FOR SELECT
    USING (true);

-- System handles member creation via triggers and invite acceptance
-- Allow users to insert themselves (when accepting an invite)
DROP POLICY IF EXISTS "Users can join clans via invites" ON clan_members;
CREATE POLICY "Users can join clans via invites"
    ON clan_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Check for valid pending invite (direct or code-based)
            EXISTS (
                SELECT 1 FROM clan_invites
                WHERE clan_invites.clan_id = clan_members.clan_id
                AND clan_invites.status = 'pending'
                AND clan_invites.expires_at > NOW()
                AND (
                    clan_invites.invitee_id = auth.uid()
                    OR clan_invites.code IS NOT NULL
                )
            )
            -- Or they are the owner creating the clan (handled by trigger, but backup)
            OR EXISTS (
                SELECT 1 FROM clans
                WHERE clans.id = clan_members.clan_id
                AND clans.owner_id = auth.uid()
            )
        )
    );

-- Owners and admins can update member roles (except owner role)
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON clan_members;
CREATE POLICY "Owners and admins can update member roles"
    ON clan_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clan_members cm
            WHERE cm.clan_id = clan_members.clan_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clan_members cm
            WHERE cm.clan_id = clan_members.clan_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Members can leave (delete themselves), owners/admins can kick members
DROP POLICY IF EXISTS "Members can leave or be kicked" ON clan_members;
CREATE POLICY "Members can leave or be kicked"
    ON clan_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM clan_members cm
            WHERE cm.clan_id = clan_members.clan_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- -----------------------------------------------------------------------------
-- Clan Invites Policies
-- -----------------------------------------------------------------------------

-- Users can view invites they sent, received, or are open (code-based)
DROP POLICY IF EXISTS "Users can view relevant invites" ON clan_invites;
CREATE POLICY "Users can view relevant invites"
    ON clan_invites FOR SELECT
    USING (
        auth.uid() = inviter_id
        OR auth.uid() = invitee_id
        OR (code IS NOT NULL AND status = 'pending' AND expires_at > NOW())
        OR EXISTS (
            SELECT 1 FROM clan_members
            WHERE clan_members.clan_id = clan_invites.clan_id
            AND clan_members.user_id = auth.uid()
            AND clan_members.role IN ('owner', 'admin')
        )
    );

-- Owners and admins can create invites
DROP POLICY IF EXISTS "Owners and admins can create invites" ON clan_invites;
CREATE POLICY "Owners and admins can create invites"
    ON clan_invites FOR INSERT
    WITH CHECK (
        auth.uid() = inviter_id
        AND EXISTS (
            SELECT 1 FROM clan_members
            WHERE clan_members.clan_id = clan_invites.clan_id
            AND clan_members.user_id = auth.uid()
            AND clan_members.role IN ('owner', 'admin')
        )
    );

-- Invitees can update their invite status (accept/decline)
DROP POLICY IF EXISTS "Invitees can respond to invites" ON clan_invites;
CREATE POLICY "Invitees can respond to invites"
    ON clan_invites FOR UPDATE
    USING (
        auth.uid() = invitee_id
        OR (code IS NOT NULL AND status = 'pending')
    )
    WITH CHECK (
        auth.uid() = invitee_id
        OR (code IS NOT NULL AND status = 'pending')
    );

-- Inviters and clan admins can delete invites
DROP POLICY IF EXISTS "Inviters and admins can delete invites" ON clan_invites;
CREATE POLICY "Inviters and admins can delete invites"
    ON clan_invites FOR DELETE
    USING (
        auth.uid() = inviter_id
        OR EXISTS (
            SELECT 1 FROM clan_members
            WHERE clan_members.clan_id = clan_invites.clan_id
            AND clan_members.user_id = auth.uid()
            AND clan_members.role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================

-- View for clan summary with member info
CREATE OR REPLACE VIEW clan_summary AS
SELECT
    c.id,
    c.name,
    c.tag,
    c.description,
    c.banner_url,
    c.owner_id,
    p.username as owner_username,
    c.member_count,
    c.total_tests,
    c.average_wpm,
    c.created_at
FROM clans c
JOIN profiles p ON p.id = c.owner_id;

-- View for user's clan membership
CREATE OR REPLACE VIEW user_clan_membership AS
SELECT
    cm.user_id,
    cm.clan_id,
    cm.role,
    cm.tests_contributed,
    cm.joined_at,
    c.name as clan_name,
    c.tag as clan_tag,
    c.banner_url as clan_banner_url
FROM clan_members cm
JOIN clans c ON c.id = cm.clan_id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE clans IS 'Clans/teams that users can create and join for group competition';
COMMENT ON TABLE clan_members IS 'Membership records linking users to clans with roles';
COMMENT ON TABLE clan_invites IS 'Invitations to join clans, supporting both direct and code-based invites';

COMMENT ON TYPE clan_role IS 'Role hierarchy within a clan: owner > admin > member';
COMMENT ON TYPE clan_invite_status IS 'Status tracking for clan invitations';

COMMENT ON FUNCTION update_clan_member_count() IS 'Maintains accurate member_count on clans table';
COMMENT ON FUNCTION create_clan_owner_member() IS 'Automatically adds clan creator as owner member';
COMMENT ON FUNCTION validate_clan_owner_change() IS 'Ensures proper role transitions when clan ownership changes';
COMMENT ON FUNCTION prevent_owner_leave() IS 'Prevents clan owner from leaving without transferring ownership';
COMMENT ON FUNCTION expire_old_invites() IS 'Utility function to mark expired invites';
