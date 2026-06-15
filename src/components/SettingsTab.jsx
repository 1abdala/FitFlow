import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfileStatus } from '../lib/profileHelpers';
import * as Icons from './Icons';
import { toast } from 'react-hot-toast';

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
  'FTMK': ['Software Engineering', 'Artificial Intelligence', 'Game Technology', 'Data Science', 'Cybersecurity', 'Computer Networking', 'Interactive Media'],
  'FKEKK': ['Electrical Engineering', 'Mechatronics', 'Computer Engineering'],
  'FkP': ['Manufacturing Engineering', 'Robotics']
};

export const SettingsTab = ({ user, onUserUpdate }) => {
  const [profileStatus, setProfileStatus] = useState(null);

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

  // Form states - Credentials update
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
    e.preventDefault();
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
      }

      toast.success('Profile settings updated successfully!');
      onUserUpdate();
    } catch (err) {
      toast.error(`Failed to save settings: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Secure auth credentials update
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!email && !newPassword) return;

    setUpdatingCredentials(true);
    try {
      // A. Updating Email (Direct update - Supabase handles confirmation emails)
      if (email && email !== user.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email });
        if (emailErr) throw emailErr;
        toast.success('Confirmation link sent to your new email!');
      }

      // B. Updating Password
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('New passwords do not match.');
          setUpdatingCredentials(false);
          return;
        }

        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setUpdatingCredentials(false);
          return;
        }

        if (!currentPassword) {
          toast.error('Current password is required to verify identity.');
          setUpdatingCredentials(false);
          return;
        }

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
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingCredentials(false);
    }
  };

  // Toggle notification checkbox
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Clean field keys for presentation
  const formatFieldLabel = (field) => {
    const mapping = {
      phone: 'Phone Number',
      dob: 'Date of Birth',
      matric: 'Matric Card Number',
      faculty: 'Faculty Selection',
      programme: 'Degree Programme',
      skills: 'Skills List',
      avatar_url: 'Profile Picture',
      linkedin_url: 'LinkedIn URL',
      github_url: 'GitHub URL',
      portfolio_url: 'Portfolio Link',
      nationality: 'Nationality Status',
      gender: 'Gender',
      address: 'Home Address',
      year_of_study: 'Year of Study',
      semester: 'Academic Semester',
      preferred_location: 'Location Preferences',
      preferred_industry: 'Industry Focus',
      university: 'University Identity',
      course: 'Course Identity',
      cv_url: 'Uploaded CV Document'
    };
    return mapping[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      {/* Left Column - 1/3 width */}
      <div className="w-full lg:w-1/3 space-y-6">
        
        {/* Card A: Profile Header & Avatar Selection */}
        <div 
          className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-border relative overflow-hidden" 
          style={{ 
            background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
          }}
        >
          {/* Decorative glow in background */}
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-accent/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-accent-2/10 blur-xl pointer-events-none" />

          <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
            <div className="w-28 h-28 rounded-full border-2 border-accent/20 overflow-hidden flex items-center justify-center bg-surface-2 transition-all duration-300 group-hover:border-accent shadow-lg">
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
              <span style={{ display: user?.avatar_url ? 'none' : 'flex' }} className="text-4xl font-bold text-accent">
                {fullName?.slice(0, 2).toUpperCase() || 'FF'}
              </span>
            </div>
            
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Icons.IconDoc size={20} className="text-white mb-1" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
            </div>
          </div>
          
          <h4 className="mt-4 font-bold text-xl text-text tracking-tight">{fullName || 'User Profile'}</h4>
          <p className="text-xs text-text-mute capitalize mt-1.5 flex items-center gap-1.5 justify-center">
            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold border border-accent/20 text-[10px]">
              {user?.role}
            </span>
            {user?.role === 'student' && <span className="text-text-mute">·</span>}
            {user?.role === 'student' && <span className="text-text-mute font-medium">{programme || 'FitFlow Member'}</span>}
          </p>
          
          <button 
            type="button" 
            className="btn btn-glass btn-sm mt-5 shadow-sm font-semibold rounded-xl flex items-center gap-2" 
            onClick={() => setShowAvatarPicker(true)}
          >
            <Icons.IconDoc size={14} /> Change Photo
          </button>
        </div>

        {/* Card B: Profile Completion Progress Status */}
        {profileStatus && (
          <div 
            className="p-6 flex flex-col justify-between rounded-3xl border border-border relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
            }}
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-text tracking-tight text-md">Profile Completion</span>
                
                {/* Circular Progress from Onboarding */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <path 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="var(--accent)" 
                      strokeWidth="3.2" 
                      strokeDasharray="100, 100"
                      strokeDashoffset={100 - profileStatus.percentage}
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-tighter text-text">
                    {profileStatus.percentage}%
                  </div>
                </div>
              </div>
              
              {/* Progress Line */}
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-6 relative">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]"
                  style={{ width: `${profileStatus.percentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Required checklist */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Required Fields
                </div>
                <div className="space-y-2.5">
                  {['phone', 'dob', 'matric', 'faculty', 'programme', 'skills'].map((field) => {
                    const isMissing = profileStatus.requiredMissingFields.includes(field);
                    return (
                      <div key={field} className="flex items-center gap-2.5 text-xs">
                        {isMissing ? (
                          <div className="w-4 h-4 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                            <Icons.IconX size={10} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Icons.IconCheck size={10} />
                          </div>
                        )}
                        <span className={isMissing ? 'text-text-mute font-medium' : 'text-text/90 font-medium'}>{formatFieldLabel(field)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Improvements checklist */}
              <div className="p-4 rounded-2xl bg-white/2 border border-white/5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-mute mb-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-mute" />
                  Optional Upgrades
                </div>
                <div className="space-y-2.5">
                  {['avatar_url', 'linkedin_url', 'github_url', 'portfolio_url'].map((field) => {
                    const isMissing = profileStatus.optionalMissingFields.includes(field);
                    return (
                      <div key={field} className="flex items-center gap-2.5 text-xs">
                        {isMissing ? (
                          <div className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-500/20">
                            !
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Icons.IconCheck size={10} />
                          </div>
                        )}
                        <span className={isMissing ? 'text-text-mute font-medium' : 'text-text/90 font-medium'}>{formatFieldLabel(field)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - 2/3 width */}
      <div className="w-full lg:w-2/3 space-y-6">
        
        {/* Form: Profile Settings */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Card C: Personal Details */}
          <div 
            className="p-6 space-y-5 rounded-3xl border border-border relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
            }}
          >
            <h3 className="font-bold text-md border-b border-white/5 pb-3.5 flex items-center gap-2.5 text-text tracking-tight">
              <div className="bg-accent/10 text-accent p-1.5 rounded-lg border border-accent/20 shrink-0">
                <Icons.IconGear size={16} />
              </div>
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="ob-input-wrap">
                  <div className="input-icon"><Icons.IconUser size={16} /></div>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div className="ob-input-wrap">
                    <div className="input-icon"><Icons.IconPhone size={16} /></div>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+601XXXXXXXX"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Date of Birth</label>
                  <div className="ob-input-wrap">
                    <Icons.IconCalendar size={16} className="input-icon" />
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <div className="ob-input-wrap">
                    <div className="input-icon"><Icons.IconUser size={16} /></div>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Nationality</label>
                  <div className="ob-input-wrap">
                    <Icons.IconMapPin size={16} className="input-icon" />
                    <select 
                      value={nationality} 
                      onChange={(e) => setNationality(e.target.value)}
                    >
                      <option value="Malaysian">Malaysian</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Academic Details (Students Only) */}
          {user.role === 'student' && (
            <div 
              className="p-6 space-y-5 rounded-3xl border border-border relative overflow-hidden"
              style={{ 
                background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
              }}
            >
              <h3 className="font-bold text-md border-b border-white/5 pb-3.5 flex items-center gap-2.5 text-text tracking-tight">
                <div className="bg-accent/10 text-accent p-1.5 rounded-lg border border-accent/20 shrink-0">
                  <Icons.IconCap size={16} />
                </div>
                Academic Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="input-group">
                    <label className="input-label">Matric No</label>
                    <div className="ob-input-wrap">
                      <Icons.IconCap size={16} className="input-icon" />
                      <input 
                        type="text" 
                        value={matric}
                        onChange={(e) => setMatric(e.target.value)}
                        placeholder="B03XXXXXXXX"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Faculty</label>
                    <div className="ob-input-wrap">
                      <Icons.IconBriefcase size={16} className="input-icon" />
                      <select 
                        value={faculty} 
                        onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}
                        required
                      >
                        <option value="">Select</option>
                        {Object.keys(FACULTIES).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Programme</label>
                    <div className="ob-input-wrap">
                      <Icons.IconBook size={16} className="input-icon" />
                      <select 
                        value={programme} 
                        onChange={(e) => setProgramme(e.target.value)}
                        disabled={!faculty}
                        required
                      >
                        <option value="">Select</option>
                        {faculty && FACULTIES[faculty]?.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Year of Study</label>
                    <div className="ob-input-wrap">
                      <Icons.IconCalendar size={16} className="input-icon" />
                      <select 
                        value={yearOfStudy} 
                        onChange={(e) => setYearOfStudy(e.target.value)}
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Semester</label>
                    <div className="ob-input-wrap">
                      <Icons.IconClock size={16} className="input-icon" />
                      <select 
                        value={semester} 
                        onChange={(e) => setSemester(e.target.value)}
                      >
                        <option value="">Select Sem</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Short Semester</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-1">
                    <Icons.IconExternalLink size={12} />
                    Professional Portals (Optional)
                  </div>
                  <div className="space-y-3">
                    <div className="input-group">
                      <div className="ob-input-wrap">
                        <div className="input-icon"><Icons.IconTarget size={16} /></div>
                        <input 
                          type="url" 
                          placeholder="LinkedIn Profile URL (https://...)" 
                          value={linkedinUrl} 
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <div className="ob-input-wrap">
                        <div className="input-icon"><Icons.IconBook size={16} /></div>
                        <input 
                          type="url" 
                          placeholder="GitHub Profile URL (https://...)" 
                          value={githubUrl} 
                          onChange={(e) => setGithubUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <div className="ob-input-wrap">
                        <div className="input-icon"><Icons.IconDoc size={16} /></div>
                        <input 
                          type="url" 
                          placeholder="Personal Portfolio URL (https://...)" 
                          value={portfolioUrl} 
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Card E: Notification Preferences JSONB */}
          <div 
            className="p-6 space-y-5 rounded-3xl border border-border relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
            }}
          >
            <h3 className="font-bold text-md border-b border-white/5 pb-3.5 flex items-center gap-2.5 text-text tracking-tight">
              <div className="bg-accent/10 text-accent p-1.5 rounded-lg border border-accent/20 shrink-0">
                <Icons.IconBell size={16} />
              </div>
              Notification Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <label className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 cursor-pointer select-none hover:bg-white/5 transition-all duration-200 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0">
                    <Icons.IconSparkle size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">Internship Match Updates</div>
                    <div className="text-[11px] text-text-mute mt-0.5 leading-normal">Score change alerts for targeted positions</div>
                  </div>
                </div>
                <div 
                  className="ob-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.match_updates}
                  onClick={() => handleNotificationChange('match_updates')}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 cursor-pointer select-none hover:bg-white/5 transition-all duration-200 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0">
                    <Icons.IconSearch size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">New Internships</div>
                    <div className="text-[11px] text-text-mute mt-0.5 leading-normal">Notifies when fresh matched postings are scraped</div>
                  </div>
                </div>
                <div 
                  className="ob-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.new_internships}
                  onClick={() => handleNotificationChange('new_internships')}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 cursor-pointer select-none hover:bg-white/5 transition-all duration-200 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0">
                    <Icons.IconCheckCircle size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">Application Status Changes</div>
                    <div className="text-[11px] text-text-mute mt-0.5 leading-normal">Alerts when internship status moves in the tracker</div>
                  </div>
                </div>
                <div 
                  className="ob-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.application_status}
                  onClick={() => handleNotificationChange('application_status')}
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5 cursor-pointer select-none hover:bg-white/5 transition-all duration-200 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg border border-accent/20 shrink-0">
                    <Icons.IconFileText size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">Weekly Summary Digest</div>
                    <div className="text-[11px] text-text-mute mt-0.5 leading-normal">Condensed weekend report of matches & stats</div>
                  </div>
                </div>
                <div 
                  className="ob-toggle shrink-0" 
                  role="switch" 
                  aria-checked={!!notifications.weekly_summary}
                  onClick={() => handleNotificationChange('weekly_summary')}
                />
              </label>

            </div>
          </div>

          {/* Form Action Save */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="btn btn-primary font-bold shadow-md shadow-accent/20 px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-accent/40"
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>

        {/* ── Form: Account Credentials ────────────────────── */}
        <form 
          onSubmit={handleUpdateCredentials} 
          className="p-6 space-y-5 rounded-3xl border border-border relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)' 
          }}
        >
          <h3 className="font-bold text-md border-b border-white/5 pb-3.5 flex items-center gap-2.5 text-text tracking-tight">
            <div className="bg-accent/10 text-accent p-1.5 rounded-lg border border-accent/20 shrink-0">
              <Icons.IconShield size={16} />
            </div>
            Security & Credentials
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Email Update section */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                <Icons.IconMail size={12} />
                Change Email Address
              </div>
              <div className="input-group">
                <label className="input-label">New Email Address</label>
                <div className="ob-input-wrap">
                  <div className="input-icon"><Icons.IconMail size={16} /></div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@student.utem.edu.my"
                    required
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-mute leading-relaxed">
                Updating your email will trigger a confirmation link sent to the new address. Your account email won't change until verified.
              </p>
            </div>

            {/* Password Update section */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-5 md:pt-0 md:pl-6">
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                <Icons.IconLock size={12} />
                Update Password
              </div>
              
              <div className="space-y-4">
                <div className="input-group">
                  <label className="input-label">Current Password (Required for changes)</label>
                  <div className="ob-input-wrap">
                    <div className="input-icon"><Icons.IconLock size={16} /></div>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <div className="ob-input-wrap">
                      <div className="input-icon"><Icons.IconLock size={16} /></div>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 chars"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Confirm New Password</label>
                    <div className="ob-input-wrap">
                      <div className="input-icon"><Icons.IconLock size={16} /></div>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              type="submit" 
              className="btn btn-glass font-bold text-accent border border-accent/20 hover:border-accent hover:bg-accent/5 rounded-xl px-6 py-2.5 transition-all duration-200"
              disabled={updatingCredentials}
            >
              {updatingCredentials ? 'Updating Credentials...' : 'Update Auth Credentials'}
            </button>
          </div>
        </form>

      </div>

      {/* ── Avatar Picker Modal ─────────────────────────────── */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAvatarPicker(false)} />
          <div 
            className="relative w-full max-w-xl p-8 overflow-hidden max-h-[85vh] flex flex-col rounded-3xl border border-border"
            style={{ 
              background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', 
              boxShadow: '0 20px 80px rgba(0,0,0,0.5)' 
            }}
          >
            
            <header className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-text tracking-tight flex items-center gap-2">
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
                
                {/* 1. Custom upload trigger */}
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

                {/* 2. Presets Grid */}
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

                {/* 3. Revert options */}
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
          </div>
        </div>
      )}

    </div>
  );
};

