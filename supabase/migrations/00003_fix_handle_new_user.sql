-- =============================================================================
-- Fix handle_new_user function to use username from user_metadata
-- =============================================================================

-- Drop and recreate the function to properly use the username from registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    provided_username VARCHAR(32);
    generated_username VARCHAR(32);
BEGIN
    -- First, try to get username from user_metadata (set during registration)
    provided_username := NEW.raw_user_meta_data->>'username';

    -- If no username provided, generate one from email or random
    IF provided_username IS NULL OR provided_username = '' THEN
        generated_username := COALESCE(
            SPLIT_PART(NEW.email, '@', 1),
            'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
        );
    ELSE
        generated_username := provided_username;
    END IF;

    -- Ensure username is unique by appending random suffix if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = generated_username) LOOP
        generated_username := generated_username || '_' || SUBSTRING(gen_random_uuid()::TEXT, 1, 4);
    END LOOP;

    -- Truncate to max length
    generated_username := SUBSTRING(generated_username, 1, 32);

    -- Create the profile
    INSERT INTO profiles (id, username, email, display_name)
    VALUES (
        NEW.id,
        generated_username,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'full_name',
            generated_username
        )
    );

    -- Create default user config
    INSERT INTO user_configs (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment for the updated function
COMMENT ON FUNCTION handle_new_user() IS 'Creates profile and default config when a new user signs up, using username from registration metadata if provided';
