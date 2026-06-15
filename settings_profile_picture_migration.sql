-- FitFlow Database Migration: Profile Pictures, Notification Settings, Social Links, and Storage Configuration
-- Please execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Add avatar_url and notification_preferences to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"match_updates": true, "new_internships": true, "application_status": true, "weekly_summary": false}'::jsonb;

-- 2. Add social and portfolio links to public.student_profiles table
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- 3. Create the 'avatars' storage bucket if it does not exist (Idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Clean up existing policies for avatars bucket to prevent duplicates
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatars" ON storage.objects;

-- 5. Create RLS Policies for avatars bucket

-- Policy A: Allow anyone to view avatar files
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy B: Allow authenticated users to upload files to their own directory (named after their UID)
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy C: Allow authenticated users to update files in their own directory
CREATE POLICY "Allow authenticated users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy D: Allow authenticated users to delete files from their own directory
CREATE POLICY "Allow authenticated users to delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
