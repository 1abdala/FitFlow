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
        const updatedUser = { ...user, ...safeData, completion_percentage: 33 };
        await supabase.from('users').update({ completion_percentage: 33 }).eq('id', user.id);
        
        localStorage.setItem('fitflow_user', JSON.stringify(updatedUser));
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
      localStorage.setItem('fitflow_user', JSON.stringify(updatedUser));
      onComplete(updatedUser, false);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {step !== 4 && (
          <div className="p-6 border-b border-border bg-surface-2 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Complete profile</h2>
              <div className="flex gap-1 mt-2">
                <div className={`h-1 w-8 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-surface-3'}`} />
                <div className={`h-1 w-8 rounded-full ${step >= 3 ? 'bg-accent' : 'bg-surface-3'}`} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-full"><Icons.IconX size={20} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && <div className="auth-err mb-6">{error}</div>}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Phone (+60) *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60123456789" />
                </div>
                <div className="input-group">
                  <label className="input-label">Date of Birth *</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Nationality</label>
                  <select value={nationality} onChange={(e) => setNationality(e.target.value)}>
                    <option value="Malaysian">Malaysian</option>
                    <option value="Non-Malaysian">Non-Malaysian</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasOku} onChange={(e) => setHasOku(e.target.checked)} className="accent-accent" />
                  <span className="text-sm font-bold">Register as OKU (Optional)</span>
                </label>
                {hasOku && (
                  <select value={okuCategory} onChange={(e) => setOkuCategory(e.target.value)} className="mt-2">
                    <option value="">Select Category</option>
                    <option value="Visual">Visual</option>
                    <option value="Hearing">Hearing</option>
                    <option value="Physical">Physical</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {user.role === 'student' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="input-group">
                      <label className="input-label">Matric Number *</label>
                      <input type="text" value={matric} onChange={(e) => setMatric(e.target.value.toUpperCase())} placeholder="B03..." />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Faculty *</label>
                      <select value={faculty} onChange={(e) => { setFaculty(e.target.value); setProgramme(''); }}>
                        <option value="">Select</option>
                        {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="input-group sm:col-span-2">
                      <label className="input-label">Programme *</label>
                      <select value={programme} onChange={(e) => setProgramme(e.target.value)} disabled={!faculty}>
                        <option value="">Select</option>
                        {faculty && faculties[faculty].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Technical Skills</label>
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-3 flex items-start gap-3">
                      <Icons.IconSparkle size={16} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-text mb-1">Skip the manual entry?</p>
                        <p className="text-xs text-text-mute leading-relaxed">
                          You can upload your resume in the <span className="font-bold text-accent">CV Analyzing</span> tab later to automatically extract your skills and boost your matches!
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map(s => <span key={s} className="skill-chip skill-pos">{s} <button onClick={() => removeSkill(s)} className="ml-1"><Icons.IconX size={10} /></button></span>)}
                    </div>
                    <div className="relative">
                      <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitSkill(skillInput)} placeholder="Add skill..." />
                      {showSuggestions && skillSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border rounded-xl shadow-xl z-10">
                          {skillSuggestions.map(s => <button key={s} onMouseDown={() => commitSkill(s)} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-3">{s}</button>)}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="input-group">
                    <label className="input-label">Staff ID *</label>
                    <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Faculty *</label>
                    <select value={faculty} onChange={(e) => setFaculty(e.target.value)}>
                      <option value="">Select</option>
                      {Object.keys(faculties).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-pos-soft/20 text-pos rounded-full flex items-center justify-center mx-auto">
                <Icons.IconCheck size={40} />
              </div>
              <h2 className="text-3xl font-bold">You're all set!</h2>
              <p className="text-text-mute">Your profile is 100% complete. We've generated your initial internship matches.</p>
              <button onClick={() => { onNavigate?.('matches'); onClose(); }} className="btn btn-primary btn-lg w-full justify-center">View my matches <Icons.IconArrowRight size={16} /></button>
            </div>
          )}
        </div>

        {step !== 4 && (
          <div className="p-6 border-t border-border bg-surface-2 flex justify-between">
            <button onClick={onClose} className="btn btn-ghost">Skip</button>
            <div className="flex gap-2">
              {step > 2 && <button onClick={() => setStep(step - 1)} className="btn btn-ghost border-border">Back</button>}
              <button onClick={step === 3 ? wrapUpComplete : handleNext} disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : (step === 3 ? 'Finish' : 'Next')}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
