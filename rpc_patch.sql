-- RUN THIS IN YOUR SUPABASE SQL EDITOR --

CREATE OR REPLACE FUNCTION public.get_or_create_skill(p_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_skill_id UUID;
    v_clean_name TEXT;
BEGIN
    -- 1. Clean the incoming text
    v_clean_name := trim(p_name);
    
    -- 2. Check if the skill already exists (case insensitive)
    SELECT id INTO v_skill_id 
    FROM public.skills 
    WHERE lower(name) = lower(v_clean_name) 
    LIMIT 1;
    
    -- 3. If it does not exist, bypass RLS structurally and insert it
    IF v_skill_id IS NULL THEN
        INSERT INTO public.skills (name, category)
        VALUES (v_clean_name, 'Custom')
        RETURNING id INTO v_skill_id;
    END IF;
    
    RETURN v_skill_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
