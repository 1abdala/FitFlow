-- ========================================================
-- FITFLOW DATABASE MIGRATION: ADD PROFILE_COMPLETED COLUMN
-- Run this in your Supabase SQL Editor
-- ========================================================

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Tell PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
