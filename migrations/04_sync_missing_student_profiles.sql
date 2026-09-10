-- Migration: 04_sync_missing_student_profiles.sql
-- Description: Idempotently creates default profile rows for genuine student users missing from public.profiles and attaches signup trigger.

INSERT INTO public.profiles (id, full_name, role, notification_preferences)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Student User') AS full_name,
    'student' AS role,
    '{"email_notifications": true, "new_high_match_alerts": true, "weekly_summary": true, "weekly_skills_recommendations": true}'::jsonb AS notification_preferences
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND id != '12345678-1234-1234-1234-123456789abc'::uuid -- Exclude legacy mock seed ID
ON CONFLICT (id) DO NOTHING;

-- Automated trigger for future Auth signups
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, notification_preferences)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Student User'),
        'student',
        '{"email_notifications": true, "new_high_match_alerts": true, "weekly_summary": true, "weekly_skills_recommendations": true}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
