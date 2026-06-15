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
    <div className="space-y-8 pb-12">
      {/* ── Grid Row 1: Profile & Progress ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card A: Profile Header & Avatar Selection */}
        <div className="card flex flex-col items-center justify-center p-8 text-center lg:col-span-1">
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
            <div className="w-24 h-24 rounded-full border-2 border-accent/20 overflow-hidden flex items-center justify-center bg-surface-2 transition-all duration-300 group-hover:border-accent">
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
              <span style={{ display: user?.avatar_url ? 'none' : 'flex' }} className="text-3xl font-bold text-accent">
                {fullName?.slice(0, 2).toUpperCase() || 'FF'}
              </span>
            </div>
            
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Icons.IconDoc size={18} className="text-white mb-1" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Edit</span>
            </div>
          </div>
          
          <h4 className="mt-4 font-bold text-lg text-text">{fullName || 'User Profile'}</h4>
          <p className="text-xs text-text-mute capitalize mt-1">{user?.role} · {user?.programme || 'FitFlow Member'}</p>
          
          <button 
            type="button" 
            className="btn btn-ghost btn-sm mt-4" 
            onClick={() => setShowAvatarPicker(true)}
            style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            Change Profile Picture
          </button>
        </div>

        {/* Card B: Profile Completion Progress Status */}
        {profileStatus && (
          <div className="card p-6 flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-text">Profile Completion</span>
                <span className="text-sm font-bold text-accent">{profileStatus.percentage}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${profileStatus.percentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Required checklist */}
              <div className="p-4 rounded-xl bg-surface-2 border border-border">
                <div className="text-xs font-bold uppercase tracking-wider text-text-mute mb-3">Required Fields</div>
                <div className="space-y-2">
                  {['phone', 'dob', 'matric', 'faculty', 'programme', 'skills'].map((field) => {
                    const isMissing = profileStatus.requiredMissingFields.includes(field);
                    return (
                      <div key={field} className="flex items-center gap-2 text-xs">
                        {isMissing ? (
                          <Icons.IconX size={12} className="text-red-500 shrink-0" />
                        ) : (
                          <Icons.IconCheck size={12} className="text-emerald-500 shrink-0" />
                        )}
                        <span className={isMissing ? 'text-text-mute' : 'text-text'}>{formatFieldLabel(field)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Improvements checklist */}
              <div className="p-4 rounded-xl bg-surface-2 border border-border">
                <div className="text-xs font-bold uppercase tracking-wider text-text-mute mb-3">Optional Improvements</div>
                <div className="space-y-2">
                  {['avatar_url', 'linkedin_url', 'github_url', 'portfolio_url'].map((field) => {
                    const isMissing = profileStatus.optionalMissingFields.includes(field);
                    return (
                      <div key={field} className="flex items-center gap-2 text-xs">
                        {isMissing ? (
                          <span className="w-3 h-3 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-[9px] shrink-0">!</span>
                        ) : (
                          <Icons.IconCheck size={12} className="text-emerald-500 shrink-0" />
                        )}
                        <span className={isMissing ? 'text-text-mute' : 'text-text'}>{formatFieldLabel(field)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Avatar Picker Modal ─────────────────────────────── */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowAvatarPicker(false)} />
          <div className="relative card w-full max-w-xl p-6 overflow-hidden max-h-[85vh] flex flex-col">
            
            <header className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Change Profile Picture</h3>
              <button className="icon-btn" onClick={() => setShowAvatarPicker(false)}><Icons.IconX size={18} /></button>
            </header>

            {uploadingAvatar ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-text-mute">Uploading image to storage...</div>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-6 pr-1">
                
                {/* 1. Custom upload trigger */}
                <div className="p-6 border-2 border-dashed border-border hover:border-accent rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                  <Icons.IconDoc size={24} className="text-text-mute mb-2" />
                  <span className="font-bold text-sm">Upload custom photo</span>
                  <span className="text-xs text-text-mute mt-1">PNG, JPG or JPEG. Max size 5MB.</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCustomAvatarUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* 2. Presets Grid */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-text-mute mb-3">Choose Premium Preset</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.value)}
                        className="group flex flex-col items-center p-2 rounded-xl bg-surface-2 border border-border hover:border-accent hover:bg-surface-3 transition-all"
                      >
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden border border-border group-hover:scale-105 transition-transform"
                          dangerouslySetInnerHTML={{ __html: preset.value.replace('data:image/svg+xml;utf8,', '') }}
                        />
                        <span className="text-[10px] text-text-mute mt-1 text-center font-medium truncate w-full">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Revert options */}
                {user?.avatar_url && (
                  <div className="pt-4 border-t border-border flex justify-end">
                    <button 
                      type="button" 
                      onClick={handleRemoveAvatar} 
                      className="btn btn-ghost text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10"
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

      {/* ── Form: Profile Settings ────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Grid: Personal & Academic Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card C: Personal Details */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-md border-b border-border pb-3 flex items-center gap-2"><Icons.IconGear size={16} className="text-accent" />Personal Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+601XXXXXXXX"
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Nationality</label>
                  <select 
                    value={nationality} 
                    onChange={(e) => setNationality(e.target.value)}
                    className="input w-full"
                  >
                    <option value="Malaysian">Malaysian</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Academic Details (Students Only) */}
          {user.role === 'student' && (
            <div className="card p-6 space-y-4">
              <h3 className="font-bold text-md border-b border-border pb-3 flex items-center gap-2"><Icons.IconCap size={16} className="text-accent" />Academic Information</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Matric No</label>
                    <input 
                      type="text" 
                      value={matric}
                      onChange={(e) => setMatric(e.target.value)}
                      placeholder="B03XXXXXXXX"
                      className="input w-full"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Faculty</label>
                    <select 
                      value={faculty} 
                      onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}
                      className="input w-full"
                      required
                    >
                      <option value="">Select</option>
                      {Object.keys(FACULTIES).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Programme</label>
                    <select 
                      value={programme} 
                      onChange={(e) => setProgramme(e.target.value)}
                      className="input w-full"
                      disabled={!faculty}
                      required
                    >
                      <option value="">Select</option>
                      {faculty && FACULTIES[faculty]?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Year of Study</label>
                    <select 
                      value={yearOfStudy} 
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Select Year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-mute uppercase tracking-wider mb-1">Semester</label>
                    <select 
                      value={semester} 
                      onChange={(e) => setSemester(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Select Sem</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Short Semester</option>
                    </select>
                  </div>
                </div>

                {/* Social Links */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-text-mute">Professional Portals</div>
                  <div className="space-y-2">
                    <div className="flex items-center bg-surface-2 border border-border rounded-xl px-3 py-1">
                      <Icons.IconTarget size={14} className="text-text-mute mr-2 shrink-0" />
                      <input 
                        type="url" 
                        placeholder="LinkedIn Profile URL" 
                        value={linkedinUrl} 
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-full py-1 text-text"
                      />
                    </div>
                    <div className="flex items-center bg-surface-2 border border-border rounded-xl px-3 py-1">
                      <Icons.IconBook size={14} className="text-text-mute mr-2 shrink-0" />
                      <input 
                        type="url" 
                        placeholder="GitHub Profile URL" 
                        value={githubUrl} 
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-full py-1 text-text"
                      />
                    </div>
                    <div className="flex items-center bg-surface-2 border border-border rounded-xl px-3 py-1">
                      <Icons.IconDoc size={14} className="text-text-mute mr-2 shrink-0" />
                      <input 
                        type="url" 
                        placeholder="Personal Portfolio Website URL" 
                        value={portfolioUrl} 
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-full py-1 text-text"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Card E: Notification Preferences JSONB */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-md border-b border-border pb-3 flex items-center gap-2"><Icons.IconBell size={16} className="text-accent" />Notification Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <label className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border cursor-pointer select-none hover:bg-surface-3 transition-colors">
              <input 
                type="checkbox" 
                checked={!!notifications.match_updates}
                onChange={() => handleNotificationChange('match_updates')}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="font-bold text-sm">Internship Match Updates</div>
                <div className="text-xs text-text-mute mt-0.5">Get notified when your skill matching score updates for key jobs</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border cursor-pointer select-none hover:bg-surface-3 transition-colors">
              <input 
                type="checkbox" 
                checked={!!notifications.new_internships}
                onChange={() => handleNotificationChange('new_internships')}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="font-bold text-sm">New Internships</div>
                <div className="text-xs text-text-mute mt-0.5">Get notified when new tech listings matching your filters are scraped</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border cursor-pointer select-none hover:bg-surface-3 transition-colors">
              <input 
                type="checkbox" 
                checked={!!notifications.application_status}
                onChange={() => handleNotificationChange('application_status')}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="font-bold text-sm">Application Status Changes</div>
                <div className="text-xs text-text-mute mt-0.5">Alerts when coordinator moves your applications on the tracker</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border cursor-pointer select-none hover:bg-surface-3 transition-colors">
              <input 
                type="checkbox" 
                checked={!!notifications.weekly_summary}
                onChange={() => handleNotificationChange('weekly_summary')}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="font-bold text-sm">Weekly Summary Digest</div>
                <div className="text-xs text-text-mute mt-0.5">A condensed weekend email outlining matches and tracker highlights</div>
              </div>
            </label>

          </div>
        </div>

        {/* Form Action Save */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn btn-primary font-bold shadow-md shadow-accent/20 px-8 py-3"
            disabled={savingProfile}
          >
            {savingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>

      {/* ── Form: Account Credentials ────────────────────── */}
      <form onSubmit={handleUpdateCredentials} className="card p-6 space-y-4">
        <h3 className="font-bold text-md border-b border-border pb-3 flex items-center gap-2"><Icons.IconShield size={16} className="text-accent" />Security & Credentials</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Email Update section */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-text-mute">Change Email Address</div>
            <div>
              <label className="block text-xs text-text-mute mb-1">New Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="text-[11px] text-text-mute leading-relaxed">
              Updating your email will trigger a confirmation link sent to the new address. Your account email won't change until verified.
            </div>
          </div>

          {/* Password Update section */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="text-xs font-bold uppercase tracking-wider text-text-mute">Update Password</div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-mute mb-1">Current Password (Required for password changes)</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs text-text-mute mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs text-text-mute mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button 
            type="submit" 
            className="btn btn-ghost font-bold text-accent border border-accent/20 hover:border-accent"
            disabled={updatingCredentials}
          >
            {updatingCredentials ? 'Updating credentials...' : 'Update Auth Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
};
