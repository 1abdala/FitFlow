-- RUN THIS IN YOUR SUPABASE SQL EDITOR --

-- This fixes the PGRST200 PostgREST Error currently hiding all of your generated matches!
ALTER TABLE public.matching_results 
ADD CONSTRAINT matching_results_internship_id_fkey 
FOREIGN KEY (internship_id) 
REFERENCES public.internships(id) 
ON DELETE CASCADE;

-- Tell PostgREST to automatically refresh its layout mappings
NOTIFY pgrst, 'reload schema';
