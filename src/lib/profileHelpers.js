import { supabase } from './supabase';

/**
 * Dynamically computes user profile completion percentage, completed status, and lists missing fields
 * using a pure field-count ratio.
 * 
 * @param {Object} profile - The merged base profile + student/coordinator sub-profile
 * @param {Array<string>} skills - Array of skill names associated with the user
 * @returns {Object} { percentage: number, completed: boolean, requiredMissingFields: Array<string>, optionalMissingFields: Array<string> }
 */
export function getProfileStatus(profile, skills = []) {
  if (!profile) {
    return {
      percentage: 0,
      completed: false,
      requiredMissingFields: ['profile_data'],
      optionalMissingFields: []
    };
  }

  const role = profile.role || 'student';
  const requiredMissingFields = [];
  const optionalMissingFields = [];

  if (role === 'student') {
    // 1. Required Fields for Student Onboarding
    const requiredFields = ['phone', 'dob', 'matric', 'faculty', 'programme'];
    
    // 2. Optional Fields for Student
    const optionalFields = ['nationality', 'gender', 'address', 'year_of_study', 'semester', 'preferred_location', 'preferred_industry', 'university', 'course', 'cv_url', 'linkedin_url', 'github_url', 'portfolio_url', 'avatar_url'];

    // Track completed counts
    let completedCount = 0;
    
    requiredFields.forEach(f => {
      if (profile[f]) {
        completedCount++;
      } else {
        requiredMissingFields.push(f);
      }
    });

    if (skills && skills.length > 0) {
      completedCount++;
    } else {
      requiredMissingFields.push('skills');
    }

    optionalFields.forEach(f => {
      if (!profile[f]) {
        optionalMissingFields.push(f);
      }
    });

    const totalRequired = requiredFields.length + 1; // +1 for skills
    const percentage = Math.round((completedCount / totalRequired) * 100);

    return {
      percentage,
      completed: completedCount === totalRequired,
      requiredMissingFields,
      optionalMissingFields
    };
  } else {
    // 1. Required Fields for Coordinator Onboarding
    const requiredFields = ['phone', 'dob', 'staff_id', 'department', 'position'];
    
    // 2. Optional Fields for Coordinator
    const optionalFields = ['nationality', 'gender', 'address', 'company_name'];

    let completedCount = 0;

    requiredFields.forEach(f => {
      if (profile[f]) {
        completedCount++;
      } else {
        requiredMissingFields.push(f);
      }
    });

    optionalFields.forEach(f => {
      if (!profile[f]) {
        optionalMissingFields.push(f);
      }
    });

    const totalRequired = requiredFields.length;
    const percentage = Math.round((completedCount / totalRequired) * 100);

    return {
      percentage,
      completed: completedCount === totalRequired,
      requiredMissingFields,
      optionalMissingFields
    };
  }
}

/**
 * Unified fetch helper that retrieves user profiles, sub-profiles, and skills from the canonical tables.
 * 
 * @param {string} userId - The UUID of the authenticated user
 * @returns {Promise<Object>} The full merged user profile object with completion properties
 */
export async function fetchFullProfile(userId) {
  if (!userId) throw new Error("User ID is required");

  // 1. Fetch base profile
  const { data: baseProfile, error: baseErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (baseErr || !baseProfile) {
    throw new Error(baseErr?.message || "Base profile not found");
  }

  const role = baseProfile.role || 'student';
  const subTable = role === 'student' ? 'student_profiles' : 'coordinator_profiles';

  // 2. Fetch sub-profile
  const { data: subProfile, error: subErr } = await supabase
    .from(subTable)
    .select('*')
    .eq('id', userId)
    .single();

  // 3. Fetch skills if student
  let skills = [];
  if (role === 'student') {
    const { data: skillsData, error: skillsErr } = await supabase
      .from('user_skills')
      .select('skills:skill_id(name)')
      .eq('user_id', userId);

    if (!skillsErr && skillsData) {
      skills = skillsData.map(us => us.skills?.name).filter(Boolean);
    }
  }

  // Combine profiles, fallback to empty object if sub-profile doesn't exist yet (pre-onboarding)
  const mergedProfile = {
    ...baseProfile,
    ...(subProfile || {}),
    // Standardize naming conventions for frontend
    name: baseProfile.full_name,
    email: (await supabase.auth.getUser()).data.user?.email || ''
  };

  // 4. Calculate status
  const status = getProfileStatus(mergedProfile, skills);

  return {
    ...mergedProfile,
    skills,
    completion_percentage: status.percentage,
    profile_completed: status.completed,
    requiredMissingFields: status.requiredMissingFields,
    optionalMissingFields: status.optionalMissingFields
  };
}
