import { supabase } from './supabase';

/**
 * Dynamically computes user profile completion percentage, completed status, and lists missing fields
 * using a pure field-count ratio.
 * 
 * @param {Object} profile - The merged base profile + student sub-profile
 * @param {Array<string>} skills - Array of skill names associated with the user
 * @returns {Object} { percentage: number, completed: boolean, requiredMissingFields: Array<string>, optionalMissingFields: Array<string> }
 */
export function getProfileStatus(profile, skills = []) {
  if (!profile) {
    return {
      percentage: 0,
      completed: false,
      completedFields: 0,
      totalFields: 13,
      missingFields: ['profile_data'],
      requiredMissingFields: ['profile_data'],
      optionalMissingFields: []
    };
  }

  const requiredMissingFields = [];
  const optionalMissingFields = [];

  // 1. Required Fields for Student Onboarding (excluding array-based skills and preferred_roles)
  const requiredFields = [
    'full_name',
    'phone',
    'dob',
    'nationality',
    'gender',
    'matric',
    'faculty',
    'programme',
    'year_of_study',
    'semester',
    'preferred_location'
  ];
  
  // 2. Optional Fields for Student
  const optionalFields = ['address', 'cv_url', 'linkedin_url', 'github_url', 'portfolio_url', 'avatar_url'];

  // Track completed counts
  let completedCount = 0;
  
  const hasValue = (val) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'number') return true; // year_of_study, semester
    return !!val;
  };

  requiredFields.forEach(f => {
    let val = profile[f];
    if (f === 'full_name' && !hasValue(val)) {
      val = profile.name;
    }
    if (hasValue(val)) {
      completedCount++;
    } else {
      requiredMissingFields.push(f);
    }
  });

  // Check preferred_roles (required for completed status)
  const pRoles = profile.preferred_roles;
  if (pRoles && Array.isArray(pRoles) && pRoles.length > 0) {
    completedCount++;
  } else {
    requiredMissingFields.push('preferred_roles');
  }

  // Check skills (optional, but counts towards completion percentage)
  const skillList = (skills && skills.length > 0) ? skills : (profile.skills || []);
  if (skillList && Array.isArray(skillList) && skillList.length > 0) {
    completedCount++;
  } else {
    requiredMissingFields.push('skills');
  }

  optionalFields.forEach(f => {
    if (!hasValue(profile[f])) {
      optionalMissingFields.push(f);
    }
  });

  const totalFields = requiredFields.length + 2; // 11 required + preferred_roles + skills = 13 total fields
  const percentage = Math.round((completedCount / totalFields) * 100);

  // Profile is complete if all 11 required fields are filled AND preferred_roles is filled.
  // skills are optional and do not block completion status.
  const requiredFieldsCompleted = requiredMissingFields.filter(f => f !== 'skills').length === 0;

  return {
    percentage,
    completed: requiredFieldsCompleted,
    completedFields: completedCount,
    totalFields,
    missingFields: requiredMissingFields,
    requiredMissingFields,
    optionalMissingFields
  };
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
    .maybeSingle();

  if (baseErr || !baseProfile) {
    throw new Error(baseErr?.message || "Base profile not found");
  }

  const subTable = 'student_profiles';

  // 2. Fetch sub-profile
  let { data: subProfile, error: subErr } = await supabase
    .from(subTable)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // Self-healing fallback: insert a placeholder sub-profile if missing
  if (!subProfile && !subErr) {
    const { data: newSubProfile, error: createErr } = await supabase
      .from(subTable)
      .insert([{ id: userId }])
      .select('*')
      .maybeSingle();
    if (!createErr && newSubProfile) {
      subProfile = newSubProfile;
    }
  }

  // 3. Fetch skills
  let skills = [];
  const { data: skillsData, error: skillsErr } = await supabase
    .from('user_skills')
    .select('skills:skill_id(name)')
    .eq('user_id', userId);

  if (!skillsErr && skillsData) {
    skills = skillsData.map(us => us.skills?.name).filter(Boolean);
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
    completedFields: status.completedFields,
    totalFields: status.totalFields,
    missingFields: status.missingFields,
    requiredMissingFields: status.requiredMissingFields,
    optionalMissingFields: status.optionalMissingFields
  };
}
