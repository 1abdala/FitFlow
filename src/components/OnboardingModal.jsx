import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notificationService';

const OnboardingModal = ({ user, onClose, onComplete, onNavigate }) => {
  const dateInputRef = React.useRef(null);
  const [step, setStep] = useState(() => {
    const hasStep2 = user?.phone && user?.dob;
    return hasStep2 ? 3 : 2;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wasCompleted] = useState(() => {
    if (user?.role === 'student') {
      return !!(user?.phone && user?.dob && user?.matric && user?.faculty && user?.programme && user?.skills?.length > 0);
    } else {
      return !!(user?.phone && user?.dob && user?.staff_id && user?.department && user?.position);
    }
  });

  useEffect(() => {
    const hasStep2 = user?.phone && user?.dob;
    if (hasStep2 && step < 3) {
      setStep(3);
    }
  }, [user?.phone, user?.dob, step]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const table = user?.role === 'student' ? 'student_profiles' : 'coordinator_profiles';
        const { data } = await supabase.from(table).select('*').eq('id', authUser.id).maybeSingle();

        if (data) {
          if (data.phone) setPhone(data.phone);
          if (data.nationality) setNationality(data.nationality);
          if (data.dob) setDob(data.dob);
          if (data.gender) setGender(data.gender);
          if (data.address) { setAddress(data.address); setShowAddress(true); }
          
          if (user?.role === 'student') {
            if (data.matric) setMatric(data.matric);
            if (data.faculty) setFaculty(data.faculty);
            if (data.programme) setProgramme(data.programme);
            if (data.year_of_study) setYearOfStudy(data.year_of_study);
            if (data.semester) setSemester(data.semester);
            if (data.preferred_location) setPreferredLocation(data.preferred_location);
            if (data.preferred_industry) setPreferredIndustry(data.preferred_industry);

            const { data: skData } = await supabase.from('user_skills')
              .select(`skills (name)`)
              .eq('user_id', authUser.id);
            if (skData) {
              const loadedSkills = skData.map(s => s?.skills?.name).filter(Boolean);
              if (loadedSkills.length > 0) setSkills(loadedSkills);
            }
          } else {
            if (data.staff_id) setStaffId(data.staff_id);
            if (data.department) setDepartment(data.department);
            if (data.position) setPosition(data.position);
            if (data.company_name) setFaculty(data.company_name);
          }
        }
      } catch (err) {
        console.warn("Could not load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user?.role]);

  // Step 2 Fields
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('Malaysian');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  // Step 3 Fields
  const [matric, setMatric] = useState('');
  const [faculty, setFaculty] = useState('');
  const [programme, setProgramme] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [preferredIndustry, setPreferredIndustry] = useState('');

  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  const faculties = {
    'FTMK': ['Software Engineering', 'Artificial Intelligence', 'Game Technology', 'Data Science', 'Cybersecurity', 'Computer Networking', 'Interactive Media'],
    'FKEKK': ['Electrical Engineering', 'Mechatronics', 'Computer Engineering'],
    'FkP': ['Manufacturing Engineering', 'Robotics']
  };

  const malaysianStates = ['Remote (Work from Home)', 'Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Putrajaya', 'Labuan'];

  const normalizeSkill = (raw) => raw.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  useEffect(() => {
    if (!skillInput.trim()) { setSkillSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('skills').select('name').ilike('name', `%${skillInput.trim()}%`).limit(6);
      if (data) {
        setSkillSuggestions(data.map(r => r.name).filter(n => !skills.includes(n)));
        setShowSuggestions(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [skillInput, skills]);

  const commitSkill = (rawName) => {
    const normalized = normalizeSkill(rawName);
    if (normalized && !skills.includes(normalized)) setSkills(prev => [...prev, normalized]);
    setSkillInput('');
    setShowSuggestions(false);
  };

  const removeSkill = (sk) => setSkills(prev => prev.filter(s => s !== sk));

  const handleNext = async () => {
    setError(null);
    if (step === 2) {
      if (!phone || !phone.startsWith('+60') || !dob) return setError('Check phone (+60) and DOB.');
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const profileData = { id: authUser.id, phone, nationality, dob: dob || null, gender, address, oku_status: 'None' };
        
        await supabase.from('profiles').upsert({ id: authUser.id, role: user.role, full_name: user.name });
        const table = user.role === 'student' ? 'student_profiles' : 'coordinator_profiles';
        await supabase.from(table).upsert(profileData);
        
        const { id: _, ...safeData } = profileData;
        const updatedUser = { ...user, ...safeData, completion_percentage: 66 };
        
        onComplete(updatedUser, false);
        setStep(3);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const wrapUpComplete = async () => {
    setError(null);
    if (user.role === 'student' && (!matric || !faculty || !programme)) return setError('Academic fields required.');
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (user.role === 'student') {
        await supabase.from('student_profiles').upsert({ id: authUser.id, matric, faculty, programme, year_of_study: parseInt(yearOfStudy) || null, semester: parseInt(semester) || null, preferred_location: preferredLocation, preferred_industry: preferredIndustry });
        for (const s of skills) {
          const { data: sid } = await supabase.rpc('get_or_create_skill', { p_name: s });
          await supabase.from('user_skills').upsert({ user_id: authUser.id, skill_id: sid }, { onConflict: 'user_id,skill_id' });
        }
      } else {
        await supabase.from('coordinator_profiles').upsert({ id: authUser.id, staff_id: staffId, department, position, company_name: faculty });
      }

      if (user.role === 'student') {
        await supabase.rpc('generate_internship_matches', { p_student_id: authUser.id });
        try {
          await sendNotification(authUser.id, {
            type: 'system',
            title: 'Profile initialized! Welcome to FitFlow, start exploring matches.',
            priority: 'low'
          });
        } catch (notifErr) {
          console.error("Failed to insert onboarding notification:", notifErr);
        }
      }

      const updatedUser = { ...user, completion_percentage: 100, profile_completed: true };
      onComplete(updatedUser, false);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-5xl border border-border rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]" style={{ background: 'linear-gradient(180deg, #0B1220 0%, #111A33 100%)', boxShadow: '0 0 80px rgba(var(--accent-rgb), 0.15), 0 20px 80px rgba(0,0,0,0.45)' }}>
        
        {/* SIDEBAR - CONTEXT & MOTIVATION WITH GALAXY EFFECT */}
        <div className="hidden md:flex w-1/3 border-r border-border p-8 flex-col relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
           
           {/* Galaxy Wave Background */}
           <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
             <svg viewBox="0 0 600 800" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                   <linearGradient id="ob-wave" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="var(--accent)" stopOpacity="0.4" />
                      <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.1" />
                   </linearGradient>
                </defs>
                <path d="M-100,0 C300,200 100,600 500,800 L-100,800 Z" fill="url(#ob-wave)" opacity="0.5" />
                <path d="M-100,100 C150,300 350,500 200,800 L-100,800 Z" fill="url(#ob-wave)" opacity="0.3" />
             </svg>
           </div>
           
           {/* Floating Particles */}
           <motion.div animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-accent z-0" />
           <motion.div animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-accent-2 z-0" />

           <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                 <div className="bg-accent/10 p-2 rounded-lg backdrop-blur-md border border-accent/20"><Icons.IconSparkle className="text-accent" size={20}/></div>
                 <span className="font-bold text-lg tracking-wide shadow-sm">FitFlow AI</span>
              </div>
              <h2 className="text-3xl font-bold text-text mb-3">Complete Profile</h2>
              <p className="text-text-mute text-sm leading-relaxed mb-10">
                Complete your profile to calibrate the AI match engine and unlock personalized internships.
              </p>

              <div className="space-y-6">
                <div className={`flex items-start gap-4 transition-all duration-300 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                   <div className={`mt-0.5 rounded-full p-2 ${step >= 2 ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={14} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Basic Information</p>
                      <p className="text-xs text-text-mute mt-1">Contact and demographic data</p>
                   </div>
                </div>
                <div className={`flex items-start gap-4 transition-all duration-300 ${step >= 3 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                   <div className={`mt-0.5 rounded-full p-2 ${step >= 3 ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={14} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Academic & Skills</p>
                      <p className="text-xs text-text-mute mt-1">Faculty, programme, and tech stack</p>
                   </div>
                </div>
                <div className={`flex items-start gap-4 transition-all duration-300 ${step >= 4 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2'}`}>
                   <div className={`mt-0.5 rounded-full p-2 ${step >= 4 ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={14} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">AI Match Engine</p>
                      <p className="text-xs text-text-mute mt-1">Unlock personalized recommendations</p>
                   </div>
                </div>
              </div>

              {/* ATS-Style Match Potential Ring */}
              <div className="mt-auto pt-6 border-t border-white/5 relative z-10 flex items-center justify-between">
                 <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">AI Match Potential</p>
                    <p className="text-xs text-text-mute">
                      {step < 4 ? `+${step === 2 ? '33%' : '34%'} expected boost` : 'Maximum accuracy reached!'}
                    </p>
                 </div>
                 <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                       <motion.path 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="var(--accent)" 
                          strokeWidth="3" 
                          strokeDasharray="100, 100"
                          initial={{ strokeDashoffset: 100 }}
                          animate={{ strokeDashoffset: 100 - (step === 2 ? 33 : step === 3 ? 66 : 100) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-tighter">
                       {step === 2 ? '33%' : step === 3 ? '66%' : '100%'}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT SIDE - FORM CONTENT */}
        <div className="w-full md:w-2/3 flex flex-col bg-transparent relative">
           
           {/* LIVE PROGRESS HEADER */}
           <div className="p-6 sm:px-10 sm:py-6 border-b border-white/5 flex flex-col gap-4 bg-transparent sticky top-0 z-30 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold tracking-tight">
                   {step === 2 ? 'Personal Information' : step === 3 ? 'Academic Information' : 'Profile Complete'}
                 </h3>
                 {step !== 4 && <button onClick={onClose} className="p-2 hover:bg-white/5 text-text-mute hover:text-text rounded-full transition-colors"><Icons.IconX size={20} /></button>}
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-xs font-bold text-accent uppercase tracking-widest whitespace-nowrap">
                    Step {step === 2 ? '1' : step === 3 ? '2' : '3'} of 3
                 </span>
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)] rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: step === 2 ? '33%' : step === 3 ? '66%' : '100%' }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                 </div>
                 <span className="text-xs font-bold text-text-mute w-8 text-right">{step === 2 ? '33%' : step === 3 ? '66%' : '100%'}</span>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
              {error && <div className="auth-err mb-6 shadow-lg">{error}</div>}
              
              <AnimatePresence mode="wait">
                 {step === 2 && (
                   <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="input-group">
                         <label className="input-label">Phone (+60) *</label>
                         <div className="ob-input-wrap">
                           <div className="input-icon"><Icons.IconPhone size={16} /></div>
                           <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60123456789" />
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Date of Birth *</label>
                         <div className="ob-input-wrap">
                           <Icons.IconCalendar size={16} className="input-icon" onClick={() => dateInputRef.current?.showPicker()} style={{ cursor: 'pointer', pointerEvents: 'auto' }} />
                           <input type="date" ref={dateInputRef} value={dob} onChange={(e) => setDob(e.target.value)} />
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Nationality</label>
                         <div className="ob-input-wrap">
                           <Icons.IconMapPin size={16} className="input-icon" />
                           <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                             <option value="Malaysian">Malaysian</option>
                             <option value="Non-Malaysian">Non-Malaysian</option>
                           </select>
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Gender</label>
                         <div className="ob-input-wrap">
                           <div className="input-icon"><Icons.IconUser size={16} /></div>
                           <select value={gender} onChange={(e) => setGender(e.target.value)}>
                             <option value="">Select</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                           </select>
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 )}

                 {step === 3 && (
                   <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     {user.role === 'student' ? (
                       <>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="input-group">
                             <label className="input-label">Matric Number *</label>
                             <div className="ob-input-wrap">
                               <Icons.IconCap size={16} className="input-icon" />
                               <input type="text" value={matric} onChange={(e) => setMatric(e.target.value.toUpperCase())} placeholder="B03..." />
                             </div>
                           </div>
                           <div className="input-group">
                             <label className="input-label">Faculty *</label>
                             <div className="ob-input-wrap">
                               <Icons.IconBriefcase size={16} className="input-icon" />
                               <select value={faculty} onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}>
                                 <option value="">Select</option>
                                 {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
                               </select>
                             </div>
                           </div>
                           <div className="input-group sm:col-span-2">
                             <label className="input-label">Programme *</label>
                             <div className="ob-input-wrap">
                               <Icons.IconBook size={16} className="input-icon" />
                               <select value={programme} onChange={(e) => setProgramme(e.target.value)} disabled={!faculty}>
                                 <option value="">Select</option>
                                 {faculty && faculties[faculty].map(p => <option key={p} value={p}>{p}</option>)}
                               </select>
                             </div>
                           </div>
                         </div>
                         
                         <div className="input-group mt-2">
                           <label className="input-label mb-3">Technical Skills</label>
                           
                           <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-xl p-4 mb-5 flex items-start gap-3 shadow-md">
                             <div className="bg-accent/20 p-1.5 rounded-md mt-0.5 border border-accent/30"><Icons.IconSparkle size={14} className="text-accent" /></div>
                             <div>
                               <p className="text-sm font-bold text-text mb-1 tracking-tight">Skip manual entry?</p>
                               <p className="text-xs text-text-mute leading-relaxed">
                                 You can skip typing your skills here! Just finish this profile, then upload your resume in the <span className="font-bold text-accent">CV Analyzer</span> to extract them automatically.
                               </p>
                             </div>
                           </div>

                           <div className="flex flex-wrap gap-2 mb-3">
                             {skills.map(s => (
                                <span key={s} className="bg-surface-2 text-text text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-sm transition-colors hover:border-white/20">
                                   {s} 
                                   <button onClick={() => removeSkill(s)} className="text-text-mute hover:text-red-400 transition-colors"><Icons.IconX size={12} /></button>
                                </span>
                             ))}
                           </div>
                           <div className="relative">
                             <div className="ob-input-wrap">
                               <Icons.IconPlus size={16} className="input-icon" />
                               <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitSkill(skillInput)} placeholder="Type a skill and hit Enter..." />
                             </div>
                             <AnimatePresence>
                               {showSuggestions && skillSuggestions.length > 0 && (
                                 <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                                   {skillSuggestions.map(s => <button key={s} onMouseDown={() => commitSkill(s)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2 transition-colors border-b border-border last:border-0">{s}</button>)}
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         </div>
                       </>
                     ) : (
                       <div className="space-y-6">
                         <div className="input-group">
                           <label className="input-label">Staff ID *</label>
                           <div className="ob-input-wrap">
                              <Icons.IconTarget size={16} className="input-icon" />
                              <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
                           </div>
                         </div>
                         <div className="input-group">
                           <label className="input-label">Faculty / Department *</label>
                           <div className="ob-input-wrap">
                              <Icons.IconBriefcase size={16} className="input-icon" />
                              <select value={faculty} onChange={(e) => setFaculty(e.target.value)}>
                                <option value="">Select</option>
                                {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                           </div>
                         </div>
                       </div>
                     )}
                   </motion.div>
                 )}

                 {step === 4 && (
                   <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 sm:py-10 space-y-8 flex flex-col items-center justify-center">
                     
                     <motion.div 
                       initial={{ scale: 0 }} 
                       animate={{ scale: 1 }} 
                       transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                       className="w-24 h-24 bg-pos/10 border border-pos/20 text-pos rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)]"
                     >
                       <Icons.IconCheck size={48} />
                     </motion.div>
                     
                     <div className="max-w-xs mx-auto">
                        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold mb-3 tracking-tight">
                          {wasCompleted ? 'Profile Updated' : 'Profile Complete'} 🎉
                        </motion.h2>
                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-text-mute text-sm leading-relaxed">
                          {wasCompleted ? 'Your profile changes have been saved successfully.' : 'Your internship recommendations are now personalized to your profile.'}
                        </motion.p>
                     </div>

                     {!wasCompleted && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-sm text-left bg-surface-2 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                          <div className="flex items-center gap-3">
                             <div className="bg-accent/20 text-accent p-1.5 rounded-md border border-accent/20"><Icons.IconSparkle size={16} /></div>
                             <span className="font-bold text-sm">Match Engine Activated</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="bg-accent/20 text-accent p-1.5 rounded-md border border-accent/20"><Icons.IconTarget size={16} /></div>
                             <span className="font-bold text-sm">Skill Gap Analysis Ready</span>
                          </div>
                          <div className="flex items-center gap-3">
                             <div className="bg-accent/20 text-accent p-1.5 rounded-md border border-accent/20"><Icons.IconBook size={16} /></div>
                             <span className="font-bold text-sm">Learning Hub Personalized</span>
                          </div>
                       </motion.div>
                     )}

                     {wasCompleted ? (
                       <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={onClose} className="btn btn-primary btn-lg w-full max-w-sm justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] mt-4">
                         Close Settings
                       </motion.button>
                     ) : (
                       <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} onClick={() => { onNavigate?.('matches'); onClose(); }} className="btn btn-primary btn-lg w-full max-w-sm justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] mt-4">
                         View My Matches <Icons.IconArrowRight size={18} />
                       </motion.button>
                     )}
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* Bottom Bar for Navigation */}
           {step !== 4 && (
             <div className="px-6 py-5 sm:px-10 border-t border-white/5 bg-transparent flex justify-between items-center sticky bottom-0 z-30 backdrop-blur-sm">
               <button onClick={onClose} className="btn btn-glass btn-sm px-4">I'll do this later</button>
               <div className="flex gap-3">
                 {step > 2 && <button onClick={() => setStep(step - 1)} className="btn btn-glass btn-sm px-4">Back</button>}
                 <button onClick={step === 3 ? wrapUpComplete : handleNext} disabled={loading} className="btn btn-primary px-8 shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]">
                   {loading ? 'Saving...' : (step === 3 ? 'Complete Profile' : 'Next Step')}
                 </button>
               </div>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
