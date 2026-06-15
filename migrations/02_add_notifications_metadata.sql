-- ========================================================
-- FITFLOW MIGRATION: ADD NOTIFICATIONS METADATA COLUMNS & INDEXES
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ========================================================

-- 1. Add metadata columns for actionable routing and priority levels
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'low';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_target TEXT;

-- 2. Add performance indexes for real-time querying and ordering
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON public.notifications(sent_at);

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
