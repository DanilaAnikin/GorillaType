-- =============================================================================
-- Gorilla Type - Setup Avatars Storage Bucket
-- =============================================================================
-- Creates the storage bucket for user avatars with appropriate policies
-- =============================================================================

-- Note: Supabase storage bucket creation is typically done via the dashboard
-- or the Management API. This SQL file documents the bucket configuration
-- and sets up the storage policies.

-- If using supabase-js client or dashboard, create bucket with these settings:
-- Bucket name: avatars
-- Public bucket: true
-- File size limit: 2MB (2097152 bytes)
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Note: Storage policies use the storage schema, not public
-- These policies need to be applied after the bucket is created

-- Allow anyone to view avatars (public bucket)
-- This is handled by making the bucket public

-- Allow authenticated users to upload their own avatars
DO $$
BEGIN
  -- Check if the policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload their own avatars'
  ) THEN
    CREATE POLICY "Users can upload their own avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update their own avatars'
  ) THEN
    CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow authenticated users to delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete their own avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatars'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Allow anyone to read avatars (public access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Anyone can view avatars'
  ) THEN
    CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- =============================================================================
-- BUCKET CREATION HELPER FUNCTION
-- =============================================================================
-- This function can be called to create the avatars bucket programmatically
-- Note: Requires elevated privileges and may not work in all environments

CREATE OR REPLACE FUNCTION create_avatars_bucket()
RETURNS void AS $$
BEGIN
  -- Insert bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars',
    true,
    2097152,  -- 2MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to create the bucket (may fail if storage schema doesn't exist yet)
-- This is wrapped in a DO block to catch errors gracefully
DO $$
BEGIN
  PERFORM create_avatars_bucket();
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Storage schema not found. Please create the avatars bucket manually via the Supabase dashboard.';
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to create bucket. Please create the avatars bucket manually via the Supabase dashboard.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create avatars bucket automatically: %. Please create it manually via the Supabase dashboard.', SQLERRM;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION create_avatars_bucket() IS 'Helper function to create the avatars storage bucket with proper configuration';
