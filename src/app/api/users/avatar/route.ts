import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Allowed image MIME types for avatar upload
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Maximum file size in bytes (2MB)
 */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Avatars storage bucket name
 */
const AVATARS_BUCKET = 'avatars';

/**
 * POST /api/users/avatar
 * Upload a new avatar image for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Check if bucket exists, if not attempt to create it
    // Note: Bucket creation typically requires admin privileges
    // For production, the bucket should be created via Supabase dashboard or migrations
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === AVATARS_BUCKET);

    if (!bucketExists) {
      // Try to create the bucket (may fail if user doesn't have permissions)
      const { error: createBucketError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });

      if (createBucketError) {
        console.error('Failed to create avatars bucket:', createBucketError);
        // Continue anyway - bucket might already exist or be created by admin
      }
    }

    // Delete existing avatar files for this user (cleanup)
    const { data: existingFiles } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
      await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(filesToDelete);
    }

    // Upload new avatar
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload avatar. Please try again.' },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Try to clean up the uploaded file
      await supabase.storage
        .from(AVATARS_BUCKET)
        .remove([fileName]);

      return NextResponse.json(
        { error: 'Failed to update profile with new avatar.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      avatarUrl,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/users/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/avatar
 * Remove the current user's avatar
 */
export async function DELETE() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all avatar files for this user
    const { data: existingFiles } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Avatar delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete avatar files.' },
          { status: 500 }
        );
      }
    }

    // Update the user's profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
