-- Apply in the Supabase SQL editor after confirming no existing records violate these rules.
-- NOT VALID protects all new and updated rows while allowing legacy data to be remediated first.
ALTER TABLE public.student_profiles
  ADD CONSTRAINT student_profiles_matric_format_check
  CHECK (matric IS NULL OR matric ~ '^B[0-9]{9}$') NOT VALID;

ALTER TABLE public.student_profiles
  ADD CONSTRAINT student_profiles_phone_format_check
  CHECK (phone IS NULL OR phone ~ '^\+60[0-9]{8,10}$') NOT VALID;

-- After remediating legacy records, enforce the constraints against the full table:
-- ALTER TABLE public.student_profiles VALIDATE CONSTRAINT student_profiles_matric_format_check;
-- ALTER TABLE public.student_profiles VALIDATE CONSTRAINT student_profiles_phone_format_check;
