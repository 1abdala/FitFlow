-- ========================================================
-- FITFLOW INTERNSHIP PIPELINE MIGRATION: SCRAPER RUNS & METRICS
-- 1. Add columns to public.internships
-- 2. Create public.scrape_runs table for monitoring
-- 3. Implement get_freshness_metrics() RPC function
-- Run this in your Supabase SQL Editor
-- ========================================================

-- ── 1. Update public.internships ─────────────────────────
ALTER TABLE public.internships 
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- ── 2. Create public.scrape_runs ──────────────────────────
CREATE TABLE IF NOT EXISTS public.scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'running', 'success', 'failed'
  total_found INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.scrape_runs;
CREATE POLICY "Allow select for authenticated users" 
  ON public.scrape_runs 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- ── 3. Create get_freshness_metrics RPC function ─────────
CREATE OR REPLACE FUNCTION public.get_freshness_metrics()
RETURNS JSON AS $$
DECLARE
    v_total INTEGER;
    v_active INTEGER;
    v_inactive INTEGER;
    v_new_this_week INTEGER;
    v_avg_age_days NUMERIC;
    v_last_success TIMESTAMPTZ;
    v_failed_30_days INTEGER;
    v_success_rate NUMERIC;
    v_success_30_days INTEGER;
    v_total_30_days INTEGER;
BEGIN
    -- 3.1 Internships stats
    SELECT COUNT(*) INTO v_total FROM public.internships;
    SELECT COUNT(*) INTO v_active FROM public.internships WHERE is_active = True;
    SELECT COUNT(*) INTO v_inactive FROM public.internships WHERE is_active = False;
    SELECT COUNT(*) INTO v_new_this_week FROM public.internships WHERE created_at >= NOW() - INTERVAL '7 days';
    
    SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::numeric, 1), 0) 
    INTO v_avg_age_days 
    FROM public.internships;

    -- 3.2 Scrape runs stats
    SELECT MAX(completed_at) INTO v_last_success FROM public.scrape_runs WHERE status = 'success';
    SELECT COUNT(*) INTO v_failed_30_days FROM public.scrape_runs WHERE status = 'failed' AND completed_at >= NOW() - INTERVAL '30 days';

    -- 3.3 Success rate in last 30 days
    SELECT COUNT(*) INTO v_success_30_days FROM public.scrape_runs WHERE status = 'success' AND completed_at >= NOW() - INTERVAL '30 days';
    SELECT COUNT(*) INTO v_total_30_days FROM public.scrape_runs WHERE completed_at >= NOW() - INTERVAL '30 days';
    
    IF v_total_30_days > 0 THEN
        v_success_rate := ROUND((v_success_30_days::numeric / v_total_30_days::numeric) * 100, 1);
    ELSE
        v_success_rate := 100.0;
    END IF;

    RETURN json_build_object(
        'total_internships', v_total,
        'active_internships', v_active,
        'inactive_internships', v_inactive,
        'new_this_week', v_new_this_week,
        'average_age_days', v_avg_age_days,
        'last_successful_scrape', v_last_success,
        'failed_scrapes_30_days', v_failed_30_days,
        'success_rate_percent', v_success_rate
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
