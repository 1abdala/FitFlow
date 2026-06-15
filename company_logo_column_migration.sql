-- FitFlow Database Migration: Add Company Logo Column
-- Please execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Add company_logo_url column to public.internships table
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- 2. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
