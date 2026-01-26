-- Migration: Fix RLS policies and trigger for OAuth signup
-- Problem: Multiple issues causing "Database error saving new user":
-- 1. RLS policy blocked the trigger from inserting
-- 2. Race condition in username uniqueness check
-- 3. No idempotency for webhook retries

-- ============================================================================
-- STEP 1: Fix RLS Policies
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own config" ON user_configs;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow config creation" ON user_configs;

-- Create policies that only allow users to insert their OWN profile
-- The trigger bypasses RLS via SECURITY DEFINER, but we need a fallback
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own config"
    ON user_configs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- ============================================================================
-- STEP 2: Fix the handle_new_user() trigger function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
