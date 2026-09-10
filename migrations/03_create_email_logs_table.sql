-- Migration: 03_create_email_logs_table.sql
-- Description: Creates the email_logs audit table and partial unique indexes for deduplication.

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
    email_address TEXT NOT NULL,
    notification_type TEXT NOT NULL, -- 'high_match_alert', 'weekly_summary', 'weekly_skills_recommendation'
    reporting_period TEXT, -- e.g. '2026-W35' for weekly digests
    resend_email_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'sent', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index 1: Prevent duplicate high-match alerts per student + internship
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_high_match 
ON public.email_logs (student_id, internship_id, notification_type) 
WHERE notification_type = 'high_match_alert' AND internship_id IS NOT NULL;

-- Index 2: Prevent duplicate weekly emails per student + type + reporting_period
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_weekly_period 
ON public.email_logs (student_id, notification_type, reporting_period) 
WHERE reporting_period IS NOT NULL;

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_email_logs_student_id ON public.email_logs (student_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at);

-- RLS Policy: Students can view their own email delivery logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own email logs" ON public.email_logs;
CREATE POLICY "Students can view own email logs" ON public.email_logs
    FOR SELECT USING (auth.uid() = student_id);
