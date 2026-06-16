import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { checkAndNotifyMatchChanges } from '../lib/notificationService';
import { getProfileStatus } from '../lib/profileHelpers';
import * as Icons from './Icons';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// 9 Premium Gradient SVG presets
const PRESET_AVATARS = [
  { id: 'preset-1', name: 'Indigo Dream', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f7cff"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-2', name: 'Emerald Forest', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%2314b8a6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-3', name: 'Sunset Glow', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23f43f5e"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-4', name: 'Ocean Cyan', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-5', name: 'Cyber Neon', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d946ef"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-6', name: 'Galaxy Nebula', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23c084fc"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-7', name: 'Solar Flare', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23ef4444"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-8', name: 'Industrial Slate', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2364748b"/><stop offset="100%" stop-color="%23334155"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
  { id: 'preset-9', name: 'Aurora Borealis', value: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230d9488"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(%23g)"/><circle cx="50" cy="38" r="18" fill="%23ffffff" opacity="0.95"/><path d="M22,82 C22,65 34,58 50,58 C66,58 78,65 78,82 Z" fill="%23ffffff" opacity="0.95"/></svg>` },
];

const FACULTIES = {
  'FTMK': ['Software Engineering', 'Game Technology', 'Data Science', 'Computer Networking', 'Interactive Media'],
  'FAIX': ['Artificial Intelligence', 'Cybersecurity']
};

const REQUIRED_FIELD_LABELS = {
  phone: 'Phone',
  dob: 'DOB',
  matric: 'Matric',
  faculty: 'Faculty',
  programme: 'Programme',
  skills: 'Skills'
};

const OPTIONAL_FIELD_LABELS = {
  avatar_url: 'Avatar',
  linkedin_url: 'LinkedIn',
  github_url: 'GitHub',
  portfolio_url: 'Portfolio'
};

// Reusable stat pill inside Profile Card (aligned to Skill Profile metrics)
const StatPill = ({ label, value, color }) => (
  <div
    className="flex flex-col items-center justify-center p-2.5 rounded-xl text-center w-full"
    style={{ 
      background: 'var(--surface-3)', 
      border: '1px solid var(--border)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}
  >
    <span
      className="text-lg font-bold leading-none tracking-tight font-space-grotesk"
      style={{ fontFamily: "'Space Grotesk', sans-serif", color: color || 'var(--text)' }}
    >
      {value}
    </span>
    <span className="text-[9px] uppercase tracking-wider mt-1.5 text-text-dim font-bold">
      {label}
    </span>
  </div>
);

// Reusable header component for settings cards with minimal styling
const CardHeader = ({ icon: IconComponent, title, subtitle }) => (
  <div className="flex items-center gap-5 border-b border-white/5 pb-4 select-none">
    <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0 flex items-center justify-center">
      <IconComponent size={18} />
    </div>
    <div>
      <h3 className="font-semibold text-base text-text tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {title}
      </h3>
      <p className="text-[11px] text-text-mute mt-0.5 font-medium leading-normal">
        {subtitle}
      </p>
    </div>
  </div>
);

// Reusable glassmorphism input wrapper with dropdown chevron support
const SettingsField = ({ label, icon: IconComponent, error, onIconClick, children }) => {
  const isSelect = React.Children.toArray(children).some(
    child => child.type === 'select'
  );

  return (
    <div className="input-group flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-semibold text-text-mute tracking-tight">{label}</label>}
      <div className="settings-glass-input relative flex items-center w-full">
        {IconComponent && (
          <div 
            className={`input-icon absolute left-4 text-text-dim flex items-center justify-center ${onIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
            onClick={onIconClick}
            style={onIconClick ? { pointerEvents: 'auto' } : undefined}
          >
            <IconComponent size={16} />
          </div>
        )}
        {children}
        {isSelect && (
          <div className="absolute right-4 text-text-dim pointer-events-none flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        )}
      </div>
      {error && <span className="text-[11px] text-red-400 mt-1">{error}</span>}
    </div>
  );
};

export const SettingsTab = ({ user, onUserUpdate }) => {
  const settingsDateRef = React.useRef(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [appCount, setAppCount] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [authUserDetail, setAuthUserDetail] = useState(null);

  // Form states - Personal Info
  const [fullName, setFullName] = useState(user?.full_name || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [nationality, setNationality] = useState(user?.nationality || 'Malaysian');

  // Form states - Academic Info (Student only)
  const [matric, setMatric] = useState(user?.matric || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [programme, setProgramme] = useState(user?.programme || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || '');
  const [semester, setSemester] = useState(user?.semester || '');

  // Socials
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || '');

  // Modal State Control
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form states - Credentials update (Modals only)
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState(() => {
    const defaultPrefs = {
      match_updates: true,
      new_internships: true,
      application_status: true,
      weekly_summary: false
    };
    return user?.notification_preferences || defaultPrefs;
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pwStrength = useMemo(() => {
    if (!newPassword) return null;
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) {
      return {
        label: 'Weak',
        color: 'text-red-400',
        barColor: 'bg-red-400',
        pct: Math.max(10, (score / 5) * 100)
      };
    } else if (score <= 4) {
      return {
        label: 'Medium',
        color: 'text-amber-400',
        barColor: 'bg-amber-400',
        pct: (score / 5) * 100
      };
    } else {
      return {
        label: 'Strong',
        color: 'text-emerald-400',
        barColor: 'bg-emerald-400',
        pct: 100
      };
    }
  }, [newPassword]);

  useEffect(() => {
    if (user) {
      // Pull skills list (required for getProfileStatus calculation)
      const skillsList = user?.skills || [];
      const status = getProfileStatus(user, skillsList);
      setProfileStatus(status);
    }
  }, [user]);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setGender(user.gender || '');
      setNationality(user.nationality || 'Malaysian');
      setMatric(user.matric || '');
      setFaculty(user.faculty || '');
      setProgramme(user.programme || '');
      setYearOfStudy(user.year_of_study || '');
      setSemester(user.semester || '');
      setLinkedinUrl(user.linkedin_url || '');
      setGithubUrl(user.github_url || '');
      setPortfolioUrl(user.portfolio_url || '');
      setEmail(user.email || '');
      if (user.notification_preferences) {
        setNotifications(user.notification_preferences);
      }
    }
  }, [user]);

  // Dynamic async statistics loader
  useEffect(() => {
    if (user) {
      const getAuthUserDetail = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setAuthUserDetail(authUser);
        }
      };
      
      const fetchDashboardStats = async () => {
        // Fetch saved applications count
        const { count, error: countErr } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id);
        if (!countErr && count !== null) {
          setAppCount(count);
        }

        // Fetch matched items score average
        const { data: matchesData, error: matchErr } = await supabase
          .from('matching_results')
          .select('match_score')
          .eq('student_id', user.id);
        if (!matchErr && matchesData && matchesData.length > 0) {
          const sum = matchesData.reduce((acc, curr) => acc + Number(curr.match_score), 0);
          setMatchScore(Math.round(sum / matchesData.length));
        }
      };

      getAuthUserDetail();
      if (user.role === 'student') {
        fetchDashboardStats();
      }
    }
  }, [user]);

  // Handle preset avatar selection
  const handleSelectPreset = async (presetValue) => {
    try {
      setUploadingAvatar(true);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: presetValue })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Avatar preset updated!");
      setShowAvatarPicker(false);
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to update avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle custom image file upload with compression
  const handleCustomAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Render onto canvas for 200x200 crop/resize to keep size small
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw cropped center square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.error('Image compression failed.');
            setUploadingAvatar(false);
            return;
          }

          try {
            // Upload to Supabase Storage in 'avatars' bucket (fixed file path)
            const filePath = `${user.id}/avatar.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, blob, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

            // Append timestamp query parameter to bypass browser image cache
            const cacheBusterUrl = `${publicUrl}?t=${Date.now()}`;

            // Save to Profiles table
            const { error: dbError } = await supabase
              .from('profiles')
              .update({ avatar_url: cacheBusterUrl })
              .eq('id', user.id);

            if (dbError) throw dbError;

            toast.success('Profile picture updated successfully!');
            setShowAvatarPicker(false);
            onUserUpdate();
          } catch (err) {
            toast.error(`Storage upload failed: ${err.message}`);
          } finally {
            setUploadingAvatar(false);
          }
        }, 'image/jpeg', 0.85); // 85% JPEG quality for optimal sizing
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Revert avatar to default initials
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      // Update Database
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Clean up storage object (optional fail-safe)
      try {
        await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
      } catch (storageErr) {
        console.warn("Storage object delete skipped:", storageErr);
      }

      toast.success('Profile picture removed!');
      setShowAvatarPicker(false);
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to remove avatar: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save profile information
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);

    try {
      // 1. Update Base Profiles table
      const { error: baseErr } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (baseErr) throw baseErr;

      // 2. Update Role Sub-profiles
      const subTable = user.role === 'student' ? 'student_profiles' : 'coordinator_profiles';
      const studentFields = user.role === 'student' ? {
        matric,
        faculty,
        programme,
        year_of_study: parseInt(yearOfStudy) || null,
        semester: parseInt(semester) || null,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl
      } : {};

      const { error: subErr } = await supabase
        .from(subTable)
        .upsert({
          id: user.id,
          phone,
          nationality,
          dob: dob || null,
          gender,
          ...studentFields
        });

      if (subErr) throw subErr;

      // 3. Update notification preferences JSONB
      const { error: notifyErr } = await supabase
        .from('profiles')
        .update({ notification_preferences: notifications })
        .eq('id', user.id);

      if (notifyErr) throw notifyErr;

      // 4. Regenerate matches if student (since preferred locations/academics might impact matching weights)
      if (user.role === 'student') {
        await supabase.rpc('generate_internship_matches', { p_student_id: user.id });
        await checkAndNotifyMatchChanges(user.id);
      }

      toast.success('Profile settings updated successfully!');
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle notification checkbox
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCancelChanges = () => {
    if (user) {
      setFullName(user.full_name || user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setGender(user.gender || '');
      setNationality(user.nationality || 'Malaysian');
      setMatric(user.matric || '');
      setFaculty(user.faculty || '');
      setProgramme(user.programme || '');
      setYearOfStudy(user.year_of_study || '');
      setSemester(user.semester || '');
      setLinkedinUrl(user.linkedin_url || '');
      setGithubUrl(user.github_url || '');
      setPortfolioUrl(user.portfolio_url || '');
      if (user.notification_preferences) {
        setNotifications(user.notification_preferences);
      }
      toast.success('Changes reverted');
    }
  };

  // Compute hasChanges dynamically
  const hasChanges = user && (
    fullName !== (user.full_name || user.name || '') ||
    phone !== (user.phone || '') ||
    dob !== (user.dob || '') ||
    gender !== (user.gender || '') ||
    nationality !== (user.nationality || 'Malaysian') ||
    matric !== (user.matric || '') ||
    faculty !== (user.faculty || '') ||
    programme !== (user.programme || '') ||
    String(yearOfStudy) !== String(user.year_of_study || '') ||
    String(semester) !== String(user.semester || '') ||
    linkedinUrl !== (user.linkedin_url || '') ||
    githubUrl !== (user.github_url || '') ||
    portfolioUrl !== (user.portfolio_url || '') ||
    JSON.stringify(notifications) !== JSON.stringify(user.notification_preferences || {
      match_updates: true,
      new_internships: true,
      application_status: true,
      weekly_summary: false
    })
  );

  const totalRequired = 6;
  const missingCount = profileStatus?.requiredMissingFields?.length || 0;
  const completedCount = totalRequired - missingCount;
  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── ROW 1: PROFILE, PERSONAL & ACADEMIC GRID ─────────── */}
      <form id="settings-form" onSubmit={handleSaveProfile}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Profile Card */}
          <div className="p-5 md:p-6 flex flex-col items-center justify-between settings-premium-card text-center relative overflow-hidden select-none">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full"
                   style={{ background: 'var(--accent)', filter: 'blur(64px)', opacity: 0.05 }} />
              <div className="absolute -left-16 bottom-0 w-36 h-36 rounded-full"
                   style={{ background: 'var(--hero-glow-b)', filter: 'blur(48px)', opacity: 0.08 }} />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full py-2">
              
              {/* Profile Badge */}
              <div className="mb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent font-bold border border-accent/20 text-[9px] uppercase tracking-wider">
                  {user?.role === 'student' ? 'Student' : 'Coordinator'}
                </span>
              </div>

              {/* Glowing Avatar (Increased size by 33%, from w-24 to w-32) */}
              <div className="relative shrink-0 select-none mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-surface-2 settings-avatar-glow shadow-lg">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user?.name || 'Avatar'} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span style={{ display: user?.avatar_url ? 'none' : 'flex' }} className="text-5xl font-bold text-accent">
                    {fullName?.slice(0, 2).toUpperCase() || 'FF'}
                  </span>
                </div>
              </div>

              {/* Spacing optimization & information hierarchy */}
              <div className="flex flex-col items-center gap-1">
                <h3 className="font-extrabold text-2xl text-text tracking-tight leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {fullName || 'Student Name'}
                </h3>
                
                <p className="text-xs text-text-mute mt-1 font-medium leading-relaxed max-w-[240px]">
                  {user?.role === 'student' ? (
                    <>
                      {programme || 'No Degree Selected'}
                      {faculty && <span className="block text-[10px] text-text-dim mt-0.5 font-semibold">Faculty of {faculty}</span>}
                      {matric && <span className="block text-[10px] text-accent/90 font-mono mt-1 font-semibold select-all">{matric}</span>}
                    </>
                  ) : (
                    user?.email
                  )}
                </p>
              </div>

              <button 
                type="button" 
                className="btn btn-glass btn-sm mt-5 shadow-sm font-semibold rounded-xl flex items-center gap-2" 
                onClick={() => setShowAvatarPicker(true)}
              >
                <Icons.IconDoc size={14} /> Change Photo
              </button>

              {/* Integrated Stats Section (visually integrated with tighter paddings) */}
              {isStudent && (
                <div className="w-full grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/5">
                  <StatPill label="Completion" value={`${profileStatus?.percentage || 0}%`} color="var(--accent)" />
                  <StatPill label="Skills" value={user?.skills?.length || 0} color="#38bdf8" />
                  <StatPill label="Applications" value={appCount} color="#ec4899" />
                  <StatPill label="Match Score" value={matchScore ? `${matchScore}%` : '0%'} color="#10b981" />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Personal Information Card */}
          <div className="p-5 md:p-6 space-y-5 settings-premium-card">
            <CardHeader 
              icon={Icons.IconUser} 
              title="Personal Information" 
              subtitle="Manage your identity and contact details" 
            />

            <div className="space-y-4">
              <SettingsField label="Full Name" icon={Icons.IconUser}>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                />
              </SettingsField>

              <SettingsField label="Phone Number" icon={Icons.IconPhone}>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+601XXXXXXXX"
                  required
                />
              </SettingsField>

              <SettingsField 
                label="Date of Birth" 
                icon={Icons.IconCalendar}
                onIconClick={() => settingsDateRef.current?.showPicker()}
              >
                <input 
                  type="date" 
                  ref={settingsDateRef}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </SettingsField>

              <SettingsField label="Gender" icon={Icons.IconUser}>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </SettingsField>

              <SettingsField label="Nationality" icon={Icons.IconMapPin}>
                <select 
                  value={nationality} 
                  onChange={(e) => setNationality(e.target.value)}
                  required
                >
                  <option value="Malaysian">Malaysian</option>
                  <option value="International">International</option>
                </select>
              </SettingsField>
            </div>
          </div>

          {/* Column 3: Academic Information Card */}
          <div className="p-5 md:p-6 space-y-5 settings-premium-card">
            <CardHeader 
              icon={Icons.IconCap} 
              title="Academic Information" 
              subtitle="Manage university and programme details" 
            />

            <div className="space-y-4">
              {isStudent ? (
                <>
                  {/* Matric Number spans full width of card to guarantee no truncation */}
                  <SettingsField label="Matric No" icon={Icons.IconCap}>
                    <input 
                      type="text" 
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      placeholder="B03XXXXXXXX"
                      required
                    />
                  </SettingsField>

                  <SettingsField label="Faculty" icon={Icons.IconBriefcase}>
                    <select 
                      value={faculty} 
                      onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}
                      required
                    >
                      <option value="">Select Faculty</option>
                      {Object.keys(FACULTIES).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </SettingsField>

                  <SettingsField label="Programme" icon={Icons.IconBook}>
                    <select 
                      value={programme} 
                      onChange={(e) => setProgramme(e.target.value)}
                      disabled={!faculty}
                      required
                    >
                      <option value="">Select Programme</option>
                      {faculty && FACULTIES[faculty]?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </SettingsField>

                  <div className="grid grid-cols-2 gap-4">
                    <SettingsField label="Year" icon={Icons.IconCalendar}>
                      <select 
                        value={yearOfStudy} 
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Semester" icon={Icons.IconClock}>
                      <select 
                        value={semester} 
                        onChange={(e) => setSemester(e.target.value)}
                        required
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">Short</option>
                      </select>
                    </SettingsField>
                  </div>

                  {/* Social Links */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-1 select-none">
                      <Icons.IconExternalLink size={12} />
                      Professional Portals
                    </div>
                    <SettingsField icon={Icons.IconTarget}>
                      <input 
                        type="url" 
                        placeholder="LinkedIn Profile URL (https://...)" 
                        value={linkedinUrl} 
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                    </SettingsField>
                    <SettingsField icon={Icons.IconBook}>
                      <input 
                        type="url" 
                        placeholder="GitHub Profile URL (https://...)" 
                        value={githubUrl} 
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </SettingsField>
                    <SettingsField icon={Icons.IconDoc}>
                      <input 
                        type="url" 
                        placeholder="Portfolio Website URL (https://...)" 
                        value={portfolioUrl} 
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                      />
                    </SettingsField>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                  <Icons.IconCap size={32} className="text-text-dim opacity-30 mb-3" />
                  <p className="text-sm font-semibold text-text-mute">Academic settings restricted</p>
                  <p className="text-[11px] text-text-dim mt-1.5 px-4 leading-relaxed">Coordinator accounts do not hold university student profiles.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── ROW 2: COMPLETION & NOTIFICATIONS GRID ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Profile Completion Card */}
          <div className="p-5 md:p-6 space-y-6 settings-premium-card">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <CardHeader 
                icon={Icons.IconSparkle} 
                title="Profile Completion" 
                subtitle="Fulfill required fields for better matching" 
              />

              {/* Circular Progress Ring */}
              {profileStatus && (
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.3)]">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.2" />
                    <path 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="url(#completion-grad-tab)" 
                      strokeWidth="3.4" 
                      strokeDasharray="100, 100"
                      strokeDashoffset={100 - profileStatus.percentage}
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    />
                    <defs>
                      <linearGradient id="completion-grad-tab" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f7cff" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tracking-tighter text-text font-space-grotesk" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {profileStatus.percentage}%
                  </div>
                </div>
              )}
            </div>

            {profileStatus ? (
              <div className="space-y-6">
                {/* Progress Line */}
                <div className="space-y-2">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative completion-bar-shine">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,124,255,0.3)]"
                      style={{ 
                        width: `${profileStatus.percentage}%`,
                        background: 'linear-gradient(90deg, #4f7cff 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-mute font-semibold tracking-tight uppercase">
                    <span>{completedCount} of {totalRequired} Required Setup Completed</span>
                    <span className="text-accent font-bold">{profileStatus.percentage}%</span>
                  </div>
                </div>

                {/* Status Badge Chips */}
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Required Checklist
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(REQUIRED_FIELD_LABELS).map((field) => {
                        const isMissing = profileStatus.requiredMissingFields.includes(field);
                        return (
                          <div 
                            key={field} 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 select-none ${
                              isMissing 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isMissing ? <Icons.IconX size={9} /> : <Icons.IconCheck size={9} />}
                            {REQUIRED_FIELD_LABELS[field]}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-mute mb-2.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-mute" />
                      Optional Improvements
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(OPTIONAL_FIELD_LABELS).map((field) => {
                        const isMissing = profileStatus.optionalMissingFields.includes(field);
                        return (
                          <div 
                            key={field} 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 select-none ${
                              isMissing 
                                ? 'bg-white/2 text-text-dim border-white/5' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isMissing ? <span className="font-bold text-[9px] mr-0.5 text-text-dim">!</span> : <Icons.IconCheck size={9} />}
                            {OPTIONAL_FIELD_LABELS[field]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-24 animate-pulse rounded-2xl bg-white/2" />
            )}
          </div>

          {/* Notification Preferences Card */}
          <div className="p-5 md:p-6 space-y-6 settings-premium-card">
            <CardHeader 
              icon={Icons.IconBell} 
              title="Notification Settings" 
              subtitle="Configure how you receive system updates and alerts" 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1 */}
              <div 
                onClick={() => handleNotificationChange('match_updates')}
                className="group flex items-center justify-between p-4 rounded-xl cursor-pointer select-none transition-all duration-300 bg-white/2 border border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(79,124,255,0.06)] hover:bg-white/4"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icons.IconSparkle size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-text truncate">Match Updates</div>
                    <div className="text-[10px] text-text-mute mt-0.5 leading-normal truncate">Score change alerts</div>
                  </div>
                </div>
                <div 
                  className="settings-premium-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.match_updates}
                />
              </div>

              {/* Option 2 */}
              <div 
                onClick={() => handleNotificationChange('new_internships')}
                className="group flex items-center justify-between p-4 rounded-xl cursor-pointer select-none transition-all duration-300 bg-white/2 border border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(79,124,255,0.06)] hover:bg-white/4"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icons.IconSearch size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-text truncate">New Positions</div>
                    <div className="text-[10px] text-text-mute mt-0.5 leading-normal truncate">Scraped matches alerts</div>
                  </div>
                </div>
                <div 
                  className="settings-premium-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.new_internships}
                />
              </div>

              {/* Option 3 */}
              <div 
                onClick={() => handleNotificationChange('application_status')}
                className="group flex items-center justify-between p-4 rounded-xl cursor-pointer select-none transition-all duration-300 bg-white/2 border border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(79,124,255,0.06)] hover:bg-white/4"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icons.IconCheckCircle size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-text truncate">Tracker Updates</div>
                    <div className="text-[10px] text-text-mute mt-0.5 leading-normal truncate">Status movement alerts</div>
                  </div>
                </div>
                <div 
                  className="settings-premium-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.application_status}
                />
              </div>

              {/* Option 4 */}
              <div 
                onClick={() => handleNotificationChange('weekly_summary')}
                className="group flex items-center justify-between p-4 rounded-xl cursor-pointer select-none transition-all duration-300 bg-white/2 border border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(79,124,255,0.06)] hover:bg-white/4"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icons.IconFileText size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-text truncate">Weekly Digest</div>
                    <div className="text-[10px] text-text-mute mt-0.5 leading-normal truncate">Weekend summary report</div>
                  </div>
                </div>
                <div 
                  className="settings-premium-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.weekly_summary}
                />
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* ── ROW 3: SECURITY & CREDENTIALS (FULL WIDTH) ───────── */}
      <div className="p-5 md:p-6 space-y-6 settings-premium-card">
        <CardHeader 
          icon={Icons.IconShield} 
          title="Security Summary" 
          subtitle="Manage your credentials and login safety" 
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none">
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/2 border border-white/5">
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">Current Email</span>
            <span className="text-sm font-bold text-text truncate mt-1 select-all">{authUserDetail?.email || user?.email || 'Loading...'}</span>
          </div>

          <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/2 border border-white/5">
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">Verification Status</span>
            <div>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
                authUserDetail?.email_confirmed_at 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {authUserDetail?.email_confirmed_at ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/2 border border-white/5">
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">Password Status</span>
            <span className="text-sm font-bold text-text mt-1.5 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Protected
            </span>
          </div>

          <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/2 border border-white/5">
            <span className="text-[10px] font-bold text-text-mute uppercase tracking-widest">Last Updated</span>
            <span className="text-sm font-bold text-text-dim mt-1.5 font-space-grotesk" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {authUserDetail?.updated_at 
                ? new Date(authUserDetail.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently'
              }
            </span>
          </div>
        </div>

        {/* Trigger modals instead of raw password forms inline */}
        <div className="pt-2 border-t border-white/5 flex gap-4">
          <button 
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white/2 border border-white/5 text-text hover:bg-white/5 hover:border-white/10 transition-all duration-200"
          >
            <Icons.IconMail size={14} className="text-accent" />
            Change Email
          </button>
          <button 
            type="button"
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white/2 border border-white/5 text-text hover:bg-white/5 hover:border-white/10 transition-all duration-200"
          >
            <Icons.IconLock size={14} className="text-accent" />
            Change Password
          </button>
        </div>
      </div>

      {/* ── STICKY ACTION BAR ────────────────────────────────── */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-[50%] -translate-x-[50%] lg:left-[calc(50%+124px)] z-[200] flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-lg w-[calc(100%-2.5rem)] max-w-3xl"
            style={{
              background: 'rgba(10, 15, 30, 0.9)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(79, 124, 255, 0.15)',
            }}
          >
            <div className="flex flex-col select-none">
              <span className="text-xs font-bold text-text">Unsaved changes detected</span>
              <span className="text-[10px] text-text-mute mt-0.5">You have modified your profile details</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelChanges}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-mute hover:text-text hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="settings-form"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent hover:bg-accent-2 text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center gap-2"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AVATAR PICKER MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowAvatarPicker(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-xl p-6 md:p-8 overflow-hidden max-h-[85vh] flex flex-col rounded-3xl border border-border bg-[#0B1220] shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)'
              }}
            >
              <header className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-text tracking-tight flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Icons.IconSparkle className="text-accent" size={18} />
                  Change Profile Picture
                </h3>
                <button 
                  className="p-1.5 hover:bg-white/5 text-text-mute hover:text-text rounded-full transition-colors" 
                  onClick={() => setShowAvatarPicker(false)}
                >
                  <Icons.IconX size={18} />
                </button>
              </header>

              {uploadingAvatar ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                  <div className="text-sm text-text-mute font-medium">Uploading image to storage...</div>
                </div>
              ) : (
                <div className="overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                  
                  {/* Custom upload trigger */}
                  <div className="p-8 border-2 border-dashed border-white/10 hover:border-accent rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group bg-white/2 hover:bg-white/4">
                    <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-xl mb-3 group-hover:scale-110 transition-transform">
                      <Icons.IconDoc size={24} />
                    </div>
                    <span className="font-bold text-sm text-text">Upload custom photo</span>
                    <span className="text-xs text-text-mute mt-1.5 text-center">PNG, JPG or JPEG. Max size 5MB (auto-cropped to 200x200).</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleCustomAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Presets Grid */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-1.5">
                      <Icons.IconSparkle size={12} />
                      Choose Premium Preset
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.value)}
                          className="group flex flex-col items-center p-2.5 rounded-xl bg-white/2 border border-white/5 hover:border-accent hover:bg-white/5 transition-all duration-200"
                        >
                          <div 
                            className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:scale-105 group-hover:border-accent transition-all duration-200"
                            dangerouslySetInnerHTML={{ __html: preset.value.replace('data:image/svg+xml;utf8,', '') }}
                          />
                          <span className="text-[10px] text-text-mute mt-1.5 text-center font-medium truncate w-full group-hover:text-text transition-colors">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Revert options */}
                  {user?.avatar_url && (
                    <div className="pt-4 border-t border-white/5 flex justify-end">
                      <button 
                        type="button" 
                        onClick={handleRemoveAvatar} 
                        className="btn btn-ghost text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-xl px-4 py-2 text-xs font-bold transition-all"
                      >
                        Delete Current Avatar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CHANGE EMAIL MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowEmailModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl border border-border/80 bg-[#0B1220] shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)'
              }}
            >
              <header className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-text tracking-tight flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Icons.IconMail className="text-accent" size={18} />
                  Change Email Address
                </h3>
                <button 
                  className="p-1.5 hover:bg-white/5 text-text-mute hover:text-text rounded-full transition-colors" 
                  onClick={() => setShowEmailModal(false)}
                >
                  <Icons.IconX size={18} />
                </button>
              </header>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setUpdatingCredentials(true);
                try {
                  if (email && email !== user.email) {
                    const { error } = await supabase.auth.updateUser({ email });
                    if (error) throw error;
                    toast.success('Confirmation link sent to your new email!');
                    setShowEmailModal(false);
                  } else {
                    toast.error('Please enter a new email address.');
                  }
                } catch (err) {
                  toast.error(err.message);
                } finally {
                  setUpdatingCredentials(false);
                }
              }} className="space-y-4">
                <SettingsField label="New Email Address" icon={Icons.IconMail}>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@student.utem.edu.my"
                    required
                  />
                </SettingsField>
                
                <p className="text-[11px] text-text-mute leading-relaxed">
                  Updating your email will trigger a confirmation link sent to the new address. Your account email won't change until verified.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    className="px-4 py-2 text-xs font-bold text-text-mute hover:text-text bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setShowEmailModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    disabled={updatingCredentials}
                  >
                    {updatingCredentials ? 'Sending...' : 'Send Confirmation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CHANGE PASSWORD MODAL ────────────────────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowPasswordModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl border border-border/80 bg-[#0B1220] shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)'
              }}
            >
              <header className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-text tracking-tight flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Icons.IconLock className="text-accent" size={18} />
                  Update Password
                </h3>
                <button 
                  className="p-1.5 hover:bg-white/5 text-text-mute hover:text-text rounded-full transition-colors" 
                  onClick={() => setShowPasswordModal(false)}
                >
                  <Icons.IconX size={18} />
                </button>
              </header>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!currentPassword || !newPassword || !confirmPassword) {
                  toast.error('All password fields are required.');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error('New passwords do not match.');
                  return;
                }
                if (newPassword.length < 8) {
                  toast.error('Password must meet minimum requirements.');
                  return;
                }
                if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                  toast.error('Password must meet minimum requirements.');
                  return;
                }

                setUpdatingCredentials(true);
                try {
                  // Dedicated Re-Auth Check: Verify user password before updating
                  const { error: authErr } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword
                  });

                  if (authErr) {
                    throw new Error('Current password verification failed. Please try again.');
                  }

                  // Perform password update
                  const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
                  if (passErr) throw passErr;

                  toast.success('Password updated successfully!');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPasswordModal(false);
                } catch (err) {
                  toast.error(err.message);
                } finally {
                  setUpdatingCredentials(false);
                }
              }} className="space-y-4">
                
                <SettingsField label="Current Password" icon={Icons.IconLock}>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="new-password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    className="absolute right-4 text-text-mute hover:text-text focus:outline-none transition-colors"
                  >
                    {showCurrentPassword ? <Icons.IconEyeOff size={16} /> : <Icons.IconEye size={16} />}
                  </button>
                </SettingsField>

                <SettingsField label="New Password" icon={Icons.IconLock}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    className="absolute right-4 text-text-mute hover:text-text focus:outline-none transition-colors"
                  >
                    {showNewPassword ? <Icons.IconEyeOff size={16} /> : <Icons.IconEye size={16} />}
                  </button>
                </SettingsField>

                <SettingsField label="Confirm New Password" icon={Icons.IconLock}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-4 text-text-mute hover:text-text focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <Icons.IconEyeOff size={16} /> : <Icons.IconEye size={16} />}
                  </button>
                </SettingsField>

                {/* Password Strength Indicator */}
                <div className="pt-1.5 space-y-2 select-none border-t border-white/5">
                  <div className="text-[11px] text-text-mute font-semibold">Minimum requirements:</div>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-center gap-2 transition-colors duration-200">
                      {newPassword.length >= 8 ? (
                        <span className="text-emerald-400 flex items-center justify-center shrink-0">
                          <Icons.IconCheck size={10} />
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      )}
                      <span className={newPassword.length >= 8 ? "text-emerald-400 font-semibold" : "text-text-dim text-[11px]"}>At least 8 characters</span>
                    </li>
                    <li className="flex items-center gap-2 transition-colors duration-200">
                      {/[A-Z]/.test(newPassword) ? (
                        <span className="text-emerald-400 flex items-center justify-center shrink-0">
                          <Icons.IconCheck size={10} />
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      )}
                      <span className={/[A-Z]/.test(newPassword) ? "text-emerald-400 font-semibold" : "text-text-dim text-[11px]"}>One uppercase letter</span>
                    </li>
                    <li className="flex items-center gap-2 transition-colors duration-200">
                      {/[0-9]/.test(newPassword) ? (
                        <span className="text-emerald-400 flex items-center justify-center shrink-0">
                          <Icons.IconCheck size={10} />
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      )}
                      <span className={/[0-9]/.test(newPassword) ? "text-emerald-400 font-semibold" : "text-text-dim text-[11px]"}>One number</span>
                    </li>
                  </ul>
                </div>

                {/* Password Strength Indicator Visual Bar */}
                {pwStrength && (
                  <div className="pt-1 space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-text-mute uppercase">
                      <span>Complexity:</span>
                      <span className={`font-bold ${pwStrength.color}`}>{pwStrength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${pwStrength.barColor} transition-all duration-300`} 
                        style={{ width: `${pwStrength.pct}%` }} 
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    className="px-4 py-2 text-xs font-bold text-text-mute hover:text-text bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    disabled={updatingCredentials}
                  >
                    {updatingCredentials ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
