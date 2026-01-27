-- =============================================================================
-- Migration: Fix handle_new_user() for Google OAuth signup
-- =============================================================================
-- Problem: "Database error saving new user" during Google OAuth signup.
--
-- Root cause: Migration 00009 redefined handle_new_user() as
-- LANGUAGE plpgsql SECURITY DEFINER but dropped the SET search_path = public
-- clause that migration 00003 had added. Without an explicit search_path,
-- the SECURITY DEFINER function runs with the definer's default search_path
-- and may fail to resolve unqualified table names (profiles, user_configs).
--
-- Fix: Recreate the function with the identical logic from 00009 but restore
-- SET search_path = public. Also re-ensure the auth trigger exists.
-- =============================================================================

-- ============================================================================
-- STEP 1: Recreate handle_new_user() with SET search_path = public
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_username VARCHAR(32);
    base_username VARCHAR(24);
    suffix VARCHAR(8);
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    -- Check if profile already exists (idempotency for webhook retries)
    IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Generate base username from email (truncate early to leave room for suffix)
    base_username := SUBSTRING(
        COALESCE(
            REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g'),
            'user'
        ),
        1, 24
    );

    -- If base_username is empty after sanitization, use fallback
    IF base_username = '' OR base_username IS NULL THEN
        base_username := 'user';
    END IF;

    -- Start with base username + random suffix to minimize collisions
    generated_username := base_username || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
    generated_username := SUBSTRING(generated_username, 1, 32);

    -- Try to insert with conflict handling (atomic operation)
    LOOP
        BEGIN
            INSERT INTO profiles (id, username, email, display_name)
            VALUES (
                NEW.id,
                generated_username,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', generated_username)
            );

            -- If we get here, insert succeeded
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- Username collision - generate a new one
            attempts := attempts + 1;
            IF attempts >= max_attempts THEN
                -- Use UUID-based username as last resort
                generated_username := 'user_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
                generated_username := SUBSTRING(generated_username, 1, 32);

                -- Final attempt
                INSERT INTO profiles (id, username, email, display_name)
                VALUES (
                    NEW.id,
                    generated_username,
                    NEW.email,
                    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', generated_username)
                );
                EXIT;
            END IF;

            -- Generate new username with random suffix
            suffix := SUBSTRING(gen_random_uuid()::TEXT, 1, 6);
            generated_username := SUBSTRING(base_username, 1, 24) || '_' || suffix;
            generated_username := SUBSTRING(generated_username, 1, 32);
        END;
    END LOOP;

    -- Create default user config (with conflict handling for idempotency)
    INSERT INTO user_configs (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STEP 2: Re-ensure the trigger exists on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
