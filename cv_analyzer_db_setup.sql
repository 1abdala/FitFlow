-- FitFlow CV Analyzer Database Setup
-- Please run this in the Supabase SQL Editor

-- 1. Create the cv_analyses table
CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  cv_score INTEGER,
  extracted_skills JSONB,
  skill_gaps JSONB,
  improvements JSONB,
  raw_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS so students can only see their own analyses
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" 
ON public.cv_analyses 
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own analyses" 
ON public.cv_analyses 
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own analyses" 
ON public.cv_analyses 
FOR UPDATE USING (auth.uid() = student_id);

-- 2. Ensure schema cache is updated
NOTIFY pgrst, 'reload schema';
