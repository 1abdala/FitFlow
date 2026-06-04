import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';
import { supabase } from '../lib/supabase';

const OnboardingModal = ({ user, onClose, onComplete, onNavigate }) => {
  const [step, setStep] = useState(() => {
    return Number(user?.completion_percentage) >= 66 ? 3 : 2;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (Number(user?.completion_percentage) >= 66 && step < 3) {
      setStep(3);
    }
  }, [user?.completion_percentage]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const table = user?.role === 'student' ? 'student_profiles' : 'coordinator_profiles';
        const { data } = await supabase.from(table).select('*').eq('id', authUser.id).single();

        if (data) {
          if (data.phone) setPhone(data.phone);
          if (data.nationality) setNationality(data.nationality);
          if (data.dob) setDob(data.dob);
          if (data.gender) setGender(data.gender);
          if (data.address) { setAddress(data.address); setShowAddress(true); }
          if (data.oku_status && data.oku_status !== 'None') { setHasOku(true); setOkuCategory(data.oku_status); }
          
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
  const [hasOku, setHasOku] = useState(false);
  const [okuCategory, setOkuCategory] = useState('');

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
    'FTMK': ['Software Engineering', 'Artificial Intelligence', 'Game Technology', 'Data Science'],
    'FKEKK': ['Electrical Engineering', 'Mechatronics'],
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
        const profileData = { id: authUser.id, phone, nationality, dob: dob || null, gender, address, oku_status: hasOku ? okuCategory : 'None' };
        
        await supabase.from('profiles').upsert({ id: authUser.id, role: user.role, full_name: user.name });
        const table = user.role === 'student' ? 'student_profiles' : 'coordinator_profiles';
        await supabase.from(table).upsert(profileData);
        
        const { id: _, ...safeData } = profileData;
        const updatedUser = { ...user, ...safeData, completion_percentage: 66 };
        await supabase.from('users').update({ completion_percentage: 66 }).eq('id', user.id);
        
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

      const syncPayload = { completion_percentage: 100, profile_completed: true };
      await supabase.from('users').update(syncPayload).eq('id', user.id);
      if (user.role === 'student') await supabase.rpc('generate_internship_matches', { p_student_id: authUser.id });

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-5xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* SIDEBAR - CONTEXT & MOTIVATION */}
        <div className="hidden md:flex w-1/3 bg-surface border-r border-border p-8 flex-col justify-between relative overflow-hidden">
           {/* glow effect */}
           <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
           
           <div>
              <div className="flex items-center gap-2 mb-6 relative z-10">
                 <div className="bg-accent/10 p-2 rounded-lg"><Icons.IconSparkle className="text-accent" size={20}/></div>
                 <span className="font-bold text-lg">FitFlow AI</span>
              </div>
              <h2 className="text-2xl font-bold text-text mb-2 relative z-10">Complete Profile</h2>
              <p className="text-text-mute text-sm leading-relaxed mb-8 relative z-10">
                Complete your profile to calibrate the AI match engine and unlock personalized internships.
              </p>

              <div className="space-y-4 relative z-10">
                <div className={`flex items-start gap-3 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                   <div className={`mt-0.5 rounded-full p-1.5 ${step >= 2 ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={12} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Basic Information</p>
                      <p className="text-xs text-text-mute mt-0.5">Contact and demographic data</p>
                   </div>
                </div>
                <div className={`flex items-start gap-3 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                   <div className={`mt-0.5 rounded-full p-1.5 ${step >= 3 ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={12} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Academic & Skills</p>
                      <p className="text-xs text-text-mute mt-0.5">Faculty, programme, and tech stack</p>
                   </div>
                </div>
                <div className={`flex items-start gap-3 transition-opacity duration-300 ${step >= 4 ? 'opacity-100' : 'opacity-40'}`}>
                   <div className={`mt-0.5 rounded-full p-1.5 ${step >= 4 ? 'bg-accent/10 text-accent' : 'bg-surface-2 text-text-mute'}`}>
                      <Icons.IconCheck size={12} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">AI Match Engine</p>
                      <p className="text-xs text-text-mute mt-0.5">Unlock personalized recommendations</p>
                   </div>
                </div>
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-border relative z-10">
              <div className="flex justify-between items-end mb-2">
                 <p className="text-xs font-bold uppercase tracking-wider text-accent">Match Accuracy</p>
                 <span className="text-sm font-bold">{step === 2 ? '33%' : step === 3 ? '66%' : '100%'}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" 
                   initial={{ width: 0 }}
                   animate={{ width: step === 2 ? '33%' : step === 3 ? '66%' : '100%' }}
                   transition={{ duration: 0.5, ease: 'easeInOut' }}
                 />
              </div>
              <p className="text-xs text-text-mute mt-2">
                {step < 4 ? `+${step === 2 ? '33%' : '34%'} expected boost on next step` : 'Maximum accuracy reached!'}
              </p>
           </div>
        </div>

        {/* RIGHT SIDE - FORM CONTENT */}
        <div className="w-full md:w-2/3 flex flex-col bg-surface relative">
           <div className="p-6 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/80 backdrop-blur-md sticky top-0 z-30">
              <div>
                 <p className="text-xs font-bold text-accent mb-1 uppercase tracking-wider">
                   {step === 2 ? 'Step 1 of 2' : step === 3 ? 'Step 2 of 2' : 'Setup Complete'}
                 </p>
                 <h3 className="text-lg font-bold">
                   {step === 2 ? 'Personal Information' : step === 3 ? 'Academic Information' : 'Profile Complete'}
                 </h3>
              </div>
              {step !== 4 && <button onClick={onClose} className="p-2 hover:bg-surface-3 text-text-mute hover:text-text rounded-full transition-colors"><Icons.IconX size={20} /></button>}
           </div>

           <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative">
              {error && <div className="auth-err mb-6">{error}</div>}
              
              <AnimatePresence mode="wait">
                 {step === 2 && (
                   <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="input-group">
                         <label className="input-label">Phone (+60) *</label>
                         <div className="input-wrap">
                           <div className="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                           <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60123456789" />
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Date of Birth *</label>
                         <div className="input-wrap">
                           <Icons.IconCalendar size={16} className="input-icon" />
                           <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Nationality</label>
                         <div className="input-wrap">
                           <Icons.IconMapPin size={16} className="input-icon" />
                           <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                             <option value="Malaysian">Malaysian</option>
                             <option value="Non-Malaysian">Non-Malaysian</option>
                           </select>
                         </div>
                       </div>
                       <div className="input-group">
                         <label className="input-label">Gender</label>
                         <div className="input-wrap">
                           <div className="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                           <select value={gender} onChange={(e) => setGender(e.target.value)}>
                             <option value="">Select</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                           </select>
                         </div>
                       </div>
                     </div>
                     
                     <div className="input-group mt-6 p-5 rounded-2xl border border-border bg-transparent transition-all duration-300">
                       <label className="flex items-center gap-3 cursor-pointer">
                         <input type="checkbox" checked={hasOku} onChange={(e) => setHasOku(e.target.checked)} className="accent-accent w-4 h-4 rounded" />
                         <span className="text-sm font-bold">Register as OKU (Optional)</span>
                       </label>
                       <AnimatePresence>
                         {hasOku && (
                           <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 16 }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden">
                             <div className="input-wrap">
                               <Icons.IconUsers size={16} className="input-icon" />
                               <select value={okuCategory} onChange={(e) => setOkuCategory(e.target.value)}>
                                 <option value="">Select Category</option>
                                 <option value="Visual">Visual</option>
                                 <option value="Hearing">Hearing</option>
                                 <option value="Physical">Physical</option>
                               </select>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </motion.div>
                 )}

                 {step === 3 && (
                   <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                     {user.role === 'student' ? (
                       <>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div className="input-group">
                             <label className="input-label">Matric Number *</label>
                             <div className="input-wrap">
                               <Icons.IconCap size={16} className="input-icon" />
                               <input type="text" value={matric} onChange={(e) => setMatric(e.target.value.toUpperCase())} placeholder="B03..." />
                             </div>
                           </div>
                           <div className="input-group">
                             <label className="input-label">Faculty *</label>
                             <div className="input-wrap">
                               <Icons.IconBriefcase size={16} className="input-icon" />
                               <select value={faculty} onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}>
                                 <option value="">Select</option>
                                 {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
                               </select>
                             </div>
                           </div>
                           <div className="input-group sm:col-span-2">
                             <label className="input-label">Programme *</label>
                             <div className="input-wrap">
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
                           
                           {/* CV Analyzer upsell banner */}
                           <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                             <div className="bg-accent/20 p-1.5 rounded-md mt-0.5"><Icons.IconSparkle size={14} className="text-accent" /></div>
                             <div>
                               <p className="text-sm font-bold text-text mb-1">Skip manual entry?</p>
                               <p className="text-xs text-text-mute leading-relaxed">
                                 You can skip typing your skills here! Just finish this profile, then upload your resume in the <span className="font-bold text-accent">CV Analyzer</span> to extract them automatically.
                               </p>
                             </div>
                           </div>

                           <div className="flex flex-wrap gap-2 mb-3">
                             {skills.map(s => (
                                <span key={s} className="bg-surface-2 text-text text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-border shadow-sm">
                                   {s} 
                                   <button onClick={() => removeSkill(s)} className="text-text-mute hover:text-red-400 transition-colors"><Icons.IconX size={12} /></button>
                                </span>
                             ))}
                           </div>
                           <div className="relative">
                             <div className="input-wrap">
                               <Icons.IconPlus size={16} className="input-icon" />
                               <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitSkill(skillInput)} placeholder="Type a skill and hit Enter..." />
                             </div>
                             <AnimatePresence>
                               {showSuggestions && skillSuggestions.length > 0 && (
                                 <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden">
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
                           <div className="input-wrap">
                              <Icons.IconTarget size={16} className="input-icon" />
                              <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
                           </div>
                         </div>
                         <div className="input-group">
                           <label className="input-label">Faculty / Department *</label>
                           <div className="input-wrap">
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
                        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold mb-3">Profile Complete 🎉</motion.h2>
                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-text-mute text-sm">
                          Your internship recommendations are now personalized to your profile.
                        </motion.p>
                     </div>

                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-sm text-left bg-surface-2 border border-border rounded-2xl p-5 space-y-4 shadow-lg">
                        <div className="flex items-center gap-3">
                           <div className="bg-accent/20 text-accent p-1.5 rounded-md"><Icons.IconSparkle size={16} /></div>
                           <span className="font-bold text-sm">Match Engine Activated</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="bg-accent/20 text-accent p-1.5 rounded-md"><Icons.IconTarget size={16} /></div>
                           <span className="font-bold text-sm">Skill Gap Analysis Ready</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="bg-accent/20 text-accent p-1.5 rounded-md"><Icons.IconBook size={16} /></div>
                           <span className="font-bold text-sm">Learning Hub Personalized</span>
                        </div>
                     </motion.div>

                     <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} onClick={() => { onNavigate?.('matches'); onClose(); }} className="btn btn-primary btn-lg w-full max-w-sm justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] mt-4">
                       View My Matches <Icons.IconArrowRight size={18} />
                     </motion.button>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>

           {/* Bottom Bar for Navigation */}
           {step !== 4 && (
             <div className="px-6 py-5 sm:px-10 border-t border-border bg-surface/80 backdrop-blur-md flex justify-between items-center sticky bottom-0 z-30">
               <button onClick={onClose} className="btn btn-ghost text-text-mute hover:text-text">I'll do this later</button>
               <div className="flex gap-3">
                 {step > 2 && <button onClick={() => setStep(step - 1)} className="btn btn-ghost border-border bg-transparent">Back</button>}
                 <button onClick={step === 3 ? wrapUpComplete : handleNext} disabled={loading} className="btn btn-primary px-8 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
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
