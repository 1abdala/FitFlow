-- FitFlow Database Migration: Profile Pictures, Notification Settings, and Social Links
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

-- 4. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
