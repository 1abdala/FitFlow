-- =======================================================
-- FITFLOW PREFERRED ROLES & WEIGHTED MATCHING ENGINE
-- =======================================================

-- 1. ADD COLUMNS
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS preferred_roles TEXT[];
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS classification_confidence DOUBLE PRECISION;

-- 2. CREATE PROGRAMME RELEVANCE MAPPING FUNCTION
CREATE OR REPLACE FUNCTION public.is_programme_relevant(p_programme TEXT, p_category TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_prog TEXT := lower(p_programme);
    v_cat TEXT := lower(p_category);
BEGIN
    -- If programme is not set, treat as relevant (fallback)
    IF p_programme IS NULL OR p_programme = '' THEN
        RETURN TRUE;
    END IF;
    
    -- BITS / Software Engineering
    IF v_prog LIKE '%bits%' OR v_prog LIKE '%software%engineering%' THEN
        IF v_cat IN ('software engineer', 'full stack developer', 'backend developer', 'frontend developer', 'mobile app developer', 'qa tester', 'devops engineer', 'software engineering') THEN
            RETURN TRUE;
        END IF;
    -- BITD / Networking
    ELSIF v_prog LIKE '%bitd%' OR v_prog LIKE '%network%' OR v_prog LIKE '%cloud%' THEN
        IF v_cat IN ('networking', 'cloud computing', 'devops engineer') THEN
            RETURN TRUE;
        END IF;
    -- BITZ / Cybersecurity
    ELSIF v_prog LIKE '%bitz%' OR v_prog LIKE '%security%' OR v_prog LIKE '%cyber%' THEN
        IF v_cat IN ('cybersecurity', 'networking') THEN
            RETURN TRUE;
        END IF;
    -- BITM / Interactive Media
    ELSIF v_prog LIKE '%bitm%' OR v_prog LIKE '%media%' OR v_prog LIKE '%ui%' OR v_prog LIKE '%ux%' OR v_prog LIKE '%design%' THEN
        IF v_cat IN ('ui / ux designer', 'frontend developer', 'mobile app developer') THEN
            RETURN TRUE;
        END IF;
    -- BITA / AI & Data
    ELSIF v_prog LIKE '%bita%' OR v_prog LIKE '%intelligent%' OR v_prog LIKE '%data%' OR v_prog LIKE '%ai%' OR v_prog LIKE '%ml%' THEN
        IF v_cat IN ('data analyst', 'data scientist', 'ai / machine learning', 'business analyst') THEN
            RETURN TRUE;
        END IF;
    ELSE
        -- Default generic relevance fallback
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 3. RECREATE MATCHING ENGINE STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.generate_internship_matches(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
    v_student_skills UUID[];
    v_preferred_roles TEXT[];
    v_programme TEXT;
    v_job RECORD;
    v_matched_count INTEGER;
    v_required_count INTEGER;
    v_skill_score FLOAT;
    v_role_score FLOAT;
    v_prog_score FLOAT;
    v_final_score FLOAT;
    v_pref_role TEXT;
    v_match_id UUID;
BEGIN
    -- 1. Retrieve student skills from user_skills
    SELECT array_agg(skill_id) INTO v_student_skills
    FROM public.user_skills
    WHERE user_id = p_student_id;

    -- 2. Retrieve student preferred_roles and programme
    SELECT preferred_roles, programme INTO v_preferred_roles, v_programme
    FROM public.student_profiles
    WHERE id = p_student_id;

    -- Handle case where v_student_skills is null
    IF v_student_skills IS NULL THEN
        v_student_skills := ARRAY[]::UUID[];
    END IF;

    -- 3. Delete existing matching results and skill gaps for this student
    -- Deleting skill gaps first due to dependency on matching results
    DELETE FROM public.skill_gaps 
    WHERE match_id IN (
        SELECT id FROM public.matching_results WHERE student_id = p_student_id
    );
    DELETE FROM public.matching_results WHERE student_id = p_student_id;

    -- 4. Loop through all active internships
    FOR v_job IN 
        SELECT i.id, i.title, i.category, array_agg(isk.skill_id) AS required_skills
        FROM public.internships i
        LEFT JOIN public.internship_skills isk ON i.id = isk.internship_id
        WHERE i.is_active = TRUE
        GROUP BY i.id, i.title, i.category
    LOOP
        -- Calculate total required skills (filter out null from left join)
        v_required_count := 0;
        IF v_job.required_skills IS NOT NULL THEN
            SELECT count(*) INTO v_required_count
            FROM unnest(v_job.required_skills) s_id
            WHERE s_id IS NOT NULL;
        END IF;

        IF v_required_count > 0 THEN
            -- Calculate matched skills count
            SELECT count(*) INTO v_matched_count
            FROM unnest(v_job.required_skills) s_id
            WHERE s_id = ANY(v_student_skills);

            -- Calculate 75% Skill Score
            v_skill_score := (v_matched_count::FLOAT / v_required_count::FLOAT) * 100.0;
        ELSE
            v_matched_count := 0;
            v_skill_score := 0.0;
        END IF;

        -- Calculate 10% Programme Relevance Score
        v_prog_score := 0.0;
        IF public.is_programme_relevant(v_programme, COALESCE(v_job.category, '')) THEN
            v_prog_score := 100.0;
        END IF;

        -- Calculate final weighted score (75/15/10 if preferred roles exist, else 90/10 fallback)
        IF v_preferred_roles IS NULL OR cardinality(v_preferred_roles) = 0 THEN
            v_final_score := (0.90 * v_skill_score) + (0.10 * v_prog_score);
        ELSE
            -- Calculate 15% Preferred Role Score
            v_role_score := 0.0;
            FOREACH v_pref_role IN ARRAY v_preferred_roles LOOP
                IF lower(v_job.title) LIKE '%' || lower(v_pref_role) || '%' 
                   OR lower(COALESCE(v_job.category, '')) = lower(v_pref_role) THEN
                    v_role_score := 100.0;
                    EXIT;
                END IF;
            END LOOP;
            v_final_score := (0.75 * v_skill_score) + (0.15 * v_role_score) + (0.10 * v_prog_score);
        END IF;

        -- Insert matching result
        INSERT INTO public.matching_results (
            student_id,
            internship_id,
            match_score,
            matched_skills_count,
            total_required_skills
        ) VALUES (
            p_student_id,
            v_job.id,
            v_final_score,
            v_matched_count,
            v_required_count
        ) RETURNING id INTO v_match_id;

        -- 5. Insert skill gaps (required skills the student does not have)
        IF v_required_count > 0 AND v_match_id IS NOT NULL THEN
            INSERT INTO public.skill_gaps (match_id, missing_skill_id)
            SELECT DISTINCT v_match_id, s_id
            FROM unnest(v_job.required_skills) s_id
            WHERE s_id IS NOT NULL AND NOT (s_id = ANY(v_student_skills));
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
