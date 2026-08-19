import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import InternshipDetailsModal from './InternshipDetailsModal';

const CATEGORY_KEYWORDS = {
  Frontend: ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'javascript', 'typescript', 'next', 'nuxt', 'tailwind', 'redux', 'sass', 'vite', 'webpack', 'frontend', 'ui', 'ux'],
  Backend:  ['python', 'node', 'java', 'go', 'rust', 'php', 'django', 'fastapi', 'express', 'spring', 'laravel', 'flask', 'rails', 'graphql', 'api', 'backend', 'server'],
  Database: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'database', 'firebase', 'supabase', 'prisma', 'dynamodb', 'elasticsearch'],
  DevOps:   ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'linux', 'nginx', 'git', 'terraform', 'jenkins', 'cicd', 'ci/cd', 'cloud', 'k8s', 'ansible', 'bash'],
  'AI/ML':  ['tensorflow', 'pytorch', 'sklearn', 'pandas', 'numpy', 'machine', 'learning', 'ml', 'ai', 'deep', 'nlp', 'llm', 'data', 'tableau', 'powerbi', 'looker', 'openai'],
};

const inferCategory = (skill) => {
  if (!skill) return 'Backend';
  const sl = skill.toLowerCase().replace(/[\s\-.]/g, '');
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some(k => sl.includes(k.replace(/[\s\-.]/g, '')))) return cat;
  }
  return 'Backend';
};

const CATEGORIES = {
  Frontend: { label: 'Frontend', Icon: Icons.IconWave, color: '#61DAFB' },
  Backend:  { label: 'Backend', Icon: Icons.IconChip, color: '#ffd43b' },
  Database: { label: 'Database', Icon: Icons.IconDoc, color: '#e38c00' },
  DevOps:   { label: 'DevOps / Cloud', Icon: Icons.IconShield, color: '#ff9900' },
  'AI/ML':  { label: 'AI / ML', Icon: Icons.IconBolt, color: '#a855f7' },
};

const getFeedbackField = (result, field) => {
  if (!result || !result.feedback_json) return '';
  let obj = result.feedback_json;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return '';
    }
  }
  return obj[field] || '';
};

const CategoryScoreCard = ({ label, value, weight, reasoning, evidence, color, icon }) => {
  const [expanded, setExpanded] = useState(false);

  const formatReasoning = (text) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return (
        <ul className="space-y-1 list-disc list-inside">
          {lines.map((line, i) => {
            const cleanLine = line.replace(/^[\*\-\u2022]\s*/, '');
            return <li key={i}>{cleanLine}</li>;
          })}
        </ul>
      );
    }
    return <p>{text}</p>;
  };

  return (
    <div className="p-4 rounded-xl border transition-all duration-150 space-y-2 animate-fade-in" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-xs text-text">{label}</span>
          <span className="text-[10px] text-text-mute">({weight})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs" style={{ color: color }}>{Math.round(value)}/100</span>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ 
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'var(--text-mute)'
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--surface-3)' }}>
        <div 
          className="h-1.5 rounded-full transition-all duration-300" 
          style={{ 
            background: color, 
            width: `${value}%` 
          }} 
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-2 border-t space-y-3 text-[11px]" style={{ borderColor: 'var(--border)' }}>
              {reasoning && (
                <div className="space-y-1">
                  <div className="font-bold text-text-mute uppercase tracking-wider text-[9px]">Reasoning</div>
                  <div className="text-text leading-relaxed font-normal">
                    {formatReasoning(reasoning)}
                  </div>
                </div>
              )}
              {evidence && (
                <div className="space-y-1">
                  <div className="font-bold text-text-mute uppercase tracking-wider text-[9px]">Evidence & Examples</div>
                  <div className="p-2 rounded-lg italic border text-text-mute leading-relaxed" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    "{evidence}"
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InterviewTab = ({ user, onNavigate }) => {
  const [view, setView] = useState('dashboard'); // dashboard | setup | room | results
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState({ average_readiness: 0, history: [], common_weaknesses: [] });
  
  // Setup Config State
  const [selectedJobId, setSelectedJobId] = useState('');
  const [interviewType, setInterviewType] = useState('mixed');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [customRole, setCustomRole] = useState('general');
  const [numQuestions, setNumQuestions] = useState(3);
  const [maxQuestions, setMaxQuestions] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Live Interview State
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [messages, setMessages] = useState([]); // [{role, content}]
  const [questionCount, setQuestionCount] = useState(1);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Selected Result State
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedInternshipForModal, setSelectedInternshipForModal] = useState(null);
  const [selectedSkillForModal, setSelectedSkillForModal] = useState(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    if (SpeechRecognition) {
      rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCandidateAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
          return; // Ignore silence timeout
        }
        if (event.error === 'aborted') {
          return; // Ignore aborts
        }
        toast.error(`Speech error: ${event.error}`);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }

    return () => {
      if (rec) {
        rec.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      // Simple interruption: stop TTS if active
      if (isTTSPlaying) {
        stopTTS();
      }
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // 1. Fetch History & Analytics
  const fetchHistoryAndAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch history
      const historyResp = await fetch(`${apiBase}/api/interviews/sessions`, { headers });
      if (historyResp.ok) {
        const histData = await historyResp.json();
        setSessions(histData || []);
      }

      // Fetch analytics
      const analyticsResp = await fetch(`${apiBase}/api/interviews/analytics`, { headers });
      if (analyticsResp.ok) {
        const analData = await analyticsResp.json();
        setAnalytics(analData || { average_readiness: 0, history: [], common_weaknesses: [] });
      }
    } catch (err) {
      console.error("Error loading interview history:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Load initial data
  useEffect(() => {
    fetchHistoryAndAnalytics();
    
    // Fetch all scraped positions for the start screen selection
    const fetchAllInternships = async () => {
      try {
        const { data } = await supabase
          .from('internships')
          .select('id, title, company_name')
          .order('title', { ascending: true })
          .limit(500);
        if (data) {
          const seen = new Set();
          const unique = [];
          for (const job of data) {
            if (!job.title) continue;
            const key = `${job.title.toLowerCase().trim()}@${(job.company_name || '').toLowerCase().trim()}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(job);
            }
          }
          setRecommendedJobs(unique);
        }
      } catch (err) {
        console.error("Error loading internships:", err);
      }
    };
    if (user?.id) fetchAllInternships();
  }, [user?.id, fetchHistoryAndAnalytics]);

  // 2. Start Interview Session
  const handleStartInterview = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${apiBase}/api/interviews/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          internship_id: selectedJobId || null,
          custom_role: selectedJobId ? null : customRole,
          max_questions: numQuestions,
          interview_type: interviewType,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.detail || errData.message || `Failed to start session (${response.status})`;
        throw new Error(errMsg);
      }
      const data = await response.json();
      
      setMaxQuestions(numQuestions);
      setActiveSessionId(data.session_id);
      setCurrentQuestion(data.first_question);
      setMessages([{ role: 'interviewer', content: data.first_question }]);
      setQuestionCount(1);
      setCandidateAnswer('');
      setView('room');

      // Trigger automatic TTS for first question
      speakText(data.first_question);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Candidate Answer
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || loading) return;
    setLoading(true);
    
    // Stop recording if active
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
    
    // Append candidate's answer locally
    const updatedMessages = [...messages, { role: 'candidate', content: candidateAnswer }];
    setMessages(updatedMessages);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${apiBase}/api/interviews/session/${activeSessionId}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answer: candidateAnswer
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to submit response");
      }
      const data = await response.json();

      if (data.completed) {
        // Automatically evaluate
        handleEvaluateSession();
      } else {
        // Append interviewer's next question
        setMessages(prev => [...prev, { role: 'interviewer', content: data.next_question }]);
        setCurrentQuestion(data.next_question);
        setQuestionCount(prev => prev + 1);
        setCandidateAnswer('');
        
        // Speak the next question
        speakText(data.next_question);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error submitting answer.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Trigger Post-Interview Evaluation
  const handleEvaluateSession = async (sessId = activeSessionId) => {
    setIsEvaluating(true);
    setView('room');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${apiBase}/api/interviews/session/${sessId}/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to evaluate session");
      }
      const resultsData = await response.json();
      
      setSelectedResult(resultsData);
      setView('results');
      fetchHistoryAndAnalytics();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Evaluation failed. Navigating back to dashboard.");
      setView('dashboard');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleViewInternshipDetails = async (internshipId) => {
    if (!internshipId) return;
    const loadingToast = toast.loading("Fetching position details...");
    try {
      const { data: matchData, error: matchErr } = await supabase
        .from('matching_results')
        .select(`
          id,
          match_score,
          internships ( 
            id, title, company_name, location, apply_url, description, 
            created_at, last_seen_at, company_logo_url, category, 
            internship_skills ( skills ( name ) ) 
          ),
          skill_gaps ( skills ( name ) )
        `)
        .eq('student_id', user.id)
        .eq('internship_id', internshipId)
        .maybeSingle();

      if (matchErr) throw matchErr;

      if (matchData) {
        setSelectedInternshipForModal(matchData);
      } else {
        const { data: jobData, error: jobErr } = await supabase
          .from('internships')
          .select(`
            id, title, company_name, location, apply_url, description, 
            created_at, last_seen_at, company_logo_url, category, 
            internship_skills ( skills ( name ) )
          `)
          .eq('id', internshipId)
          .single();

        if (jobErr) throw jobErr;

        if (jobData) {
          setSelectedInternshipForModal({
            internships: jobData,
            match_score: 0,
            skill_gaps: []
          });
        } else {
          throw new Error("Internship details not found");
        }
      }
    } catch (err) {
      console.error("Error fetching internship details:", err);
      toast.error(err.message || "Failed to load internship details.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleOpenPlatformModal = async (skillName) => {
    setSelectedSkillForModal({ name: skillName, count: 12 });
    try {
      const { data: matchesData } = await supabase
        .from('matching_results')
        .select(`
          id,
          skill_gaps ( skills ( name ) )
        `)
        .eq('student_id', user.id);

      if (matchesData) {
        const counts = {};
        matchesData.forEach(m => {
          m.skill_gaps?.forEach(sg => {
            const name = sg.skills?.name;
            if (name) counts[name] = (counts[name] || 0) + 1;
          });
        });
        const dynamicCount = counts[skillName] || 12;
        setSelectedSkillForModal({ name: skillName, count: dynamicCount });
      }
    } catch (err) {
      console.error("Error fetching matching skill gaps count:", err);
    }
  };

  // Browser Text-To-Speech Player
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop playing previous voice
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    
    // Attempt to pick a premium English voice
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google'));
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsTTSPlaying(true);
    utterance.onend = () => setIsTTSPlaying(false);
    utterance.onerror = () => setIsTTSPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopTTS = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsTTSPlaying(false);
  };

  // Helper for difficulty tier badges
  const getDifficultyBadge = (diff) => {
    const styles = {
      beginner: { color: 'var(--pos)', bg: 'var(--pos-soft)', border: 'rgba(52, 211, 153, 0.2)' },
      intermediate: { color: 'var(--warn)', bg: 'var(--warn-soft)', border: 'rgba(251, 191, 36, 0.2)' },
      advanced: { color: 'var(--danger)', bg: 'var(--danger-soft)', border: 'rgba(248, 113, 113, 0.2)' }
    };
    const c = styles[diff] || styles.intermediate;
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold border capitalize" style={{ color: c.color, backgroundColor: c.bg, borderColor: c.border }}>
        {diff}
      </span>
    );
  };

  // Helper to get score tier styles
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--pos)';
    if (score >= 60) return 'var(--accent-2)';
    if (score >= 40) return 'var(--warn)';
    return 'var(--danger)';
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700 }}>AI Interview Prep</h2>
          <p style={{ color: 'var(--text-mute)', fontSize: '13px' }}>Practice realistic internship interview simulations powered by Gemini.</p>
        </div>
        {view !== 'dashboard' && (
          <button 
            onClick={() => { stopTTS(); setView('dashboard'); }} 
            className="btn btn-ghost btn-sm"
          >
            <Icons.IconArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: DASHBOARD */}
        {view === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Analytics & Launch Banner */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Promo Launch Card */}
              <div className="card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-2) 100%)', border: '1px solid var(--border-strong)' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'var(--accent-soft)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
                
                <div style={{ position: 'relative', zIndex: 1 }} className="space-y-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    Feature Beta
                  </span>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, marginTop: '8px' }}>Test your interview readiness</h3>
                  <p style={{ color: 'var(--text-mute)', fontSize: '14px', maxWidth: '450px', lineHeight: 1.5 }}>
                    Practice a mock interview session tailored to your profile major, preferred roles, and matching skills. Complete the interview to receive a readiness report with identified skill gaps.
                  </p>
                  <button onClick={() => setView('setup')} className="btn btn-primary">
                    Start Simulation <Icons.IconArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Past Sessions List */}
              <div className="card p-6 space-y-4">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', fontWeight: 600 }}>Interview History</h3>
                
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />)}
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'var(--text-dim)' }}>
                    <Icons.IconUsers size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No interviews completed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((sess) => {
                      const result = sess.interview_results?.[0];
                      
                      const firstMsg = sess.interview_messages?.find(m => m.turn_id === 1);
                      let customRoleName = '';
                      if (firstMsg?.metadata_json) {
                        const meta = typeof firstMsg.metadata_json === 'string' ? JSON.parse(firstMsg.metadata_json) : firstMsg.metadata_json;
                        customRoleName = meta.custom_role;
                      }
                      const jobTitle = sess.internships?.title || (customRoleName && customRoleName !== 'general' ? customRoleName : 'General Internship Practice');
                      
                      const formattedDate = new Date(sess.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div 
                          key={sess.id} 
                          className="flex items-center justify-between p-4 rounded-xl transition-all duration-150 hover:translate-x-0.5" 
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">{jobTitle}</div>
                            <div className="flex items-center gap-2 text-xs text-text-mute">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="capitalize">{sess.interview_type}</span>
                              <span>•</span>
                              {getDifficultyBadge(sess.difficulty)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {result ? (
                              <div className="text-right">
                                <div className="text-xs text-text-mute">Score</div>
                                <div className="font-bold text-sm" style={{ color: getScoreColor(result.overall_readiness_score) }}>
                                  {Math.round(result.overall_readiness_score)}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-text-dim">Incomplete</span>
                            )}
                            
                            <button 
                              onClick={() => {
                                if (result) {
                                  setSelectedResult({
                                    ...result,
                                    session_id: sess.id,
                                    internship_id: sess.internship_id,
                                    internship: sess.internships,
                                    skill_gaps: sess.interview_skill_gaps
                                  });
                                  setView('results');
                                } else {
                                  // Resume or evaluate
                                  handleEvaluateSession(sess.id);
                                }
                              }} 
                              className="btn btn-ghost btn-sm"
                            >
                              View Report
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Analytics Sidebar */}
            <div className="space-y-6">
              
              {/* Readiness Score Card */}
              <div className="card p-6 text-center space-y-4">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Average Readiness
                </h3>
                
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="6" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="none" 
                      stroke={getScoreColor(analytics.average_readiness)} 
                      strokeWidth="6" 
                      strokeDasharray={`${(analytics.average_readiness / 100) * 263.89} 263.89`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '8px' }}>
                    <span className="text-3xl font-extrabold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {analytics.average_readiness}%
                    </span>
                    <span className="text-[10px] text-text-mute uppercase tracking-widest mt-0.5">Ready</span>
                  </div>
                </div>

                <div className="text-xs text-text-mute px-2">
                  Based on your completed session transcripts and evaluation metrics.
                </div>
              </div>

              {/* Common Weaknesses */}
              <div className="card p-6 space-y-4">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', fontWeight: 600 }}>Frequent Gaps</h3>
                
                {analytics.common_weaknesses.length === 0 ? (
                  <p className="text-xs text-text-dim text-center py-4">Finish interviews to identify skill gaps.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.common_weaknesses.map((w, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{w.skill_name}</span>
                          <span style={{ color: 'var(--accent)' }}>{w.count} {w.count === 1 ? 'time' : 'times'} flagged</span>
                        </div>
                        <div className="h-1 rounded-full w-full" style={{ background: 'var(--surface-3)' }}>
                          <div 
                            className="h-1 rounded-full" 
                            style={{ 
                              background: 'var(--accent)', 
                              width: `${Math.min(100, (w.count / Math.max(1, sessions.length)) * 100)}%` 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* VIEW 2: SETUP CONFIGURATION */}
        {view === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-8 max-w-xl mx-auto space-y-6">
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700 }} className="mb-4">Configure Interview Session</h3>
            
            {/* 1. Job Role Selection */}
            <div className="space-y-2 relative">
              <label className="input-label">Practice Position Context</label>
              <div className="relative">
                {/* Trigger Button */}
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between cursor-pointer transition-all hover:border-[var(--accent)]"
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                  }}
                >
                  <span className="truncate text-sm">
                    {selectedJobId 
                      ? (() => {
                          const job = recommendedJobs.find(j => j.id === selectedJobId);
                          return job ? `${job.title} at ${job.company_name}` : "General Internship Role (Mixed Topics)";
                        })()
                      : "General Internship Role (Mixed Topics)"
                    }
                  </span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    style={{ 
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.2s ease',
                      stroke: 'var(--text-mute)',
                      strokeWidth: 2
                    }}
                  >
                    <path d="M2 4L6 8L10 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Dropdown Options Popup */}
                {isDropdownOpen && (
                  <>
                    {/* Invisible overlay to close on click outside */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    
                    <div 
                      className="absolute left-0 right-0 mt-2 z-20 rounded-xl border p-3 space-y-3 shadow-2xl backdrop-blur-md"
                      style={{
                        background: 'rgba(23, 27, 38, 0.98)',
                        borderColor: 'var(--border)',
                        maxHeight: '320px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Search Input Box */}
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Type to search positions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking input
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text)',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                          className="hover:border-[var(--accent)] focus:border-[var(--accent)] transition-all"
                        />
                      </div>

                      {/* Scrollable list */}
                      <div 
                        className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar"
                        style={{
                          maxHeight: '220px'
                        }}
                      >
                        <div 
                          onClick={() => {
                            setSelectedJobId("");
                            setSearchTerm("");
                            setIsDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-lg text-xs cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.05)]"
                          style={{
                            backgroundColor: !selectedJobId ? 'var(--accent-soft)' : 'transparent',
                            color: !selectedJobId ? 'var(--accent)' : 'var(--text-mute)',
                            fontWeight: !selectedJobId ? '600' : 'normal'
                          }}
                        >
                          General Internship Role (Mixed Topics)
                        </div>

                        {recommendedJobs
                          .filter(job => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (
                              job.title.toLowerCase().includes(term) || 
                              (job.company_name || '').toLowerCase().includes(term)
                            );
                          })
                          .map(job => {
                            const isSelected = selectedJobId === job.id;
                            return (
                              <div 
                                key={job.id}
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setSearchTerm("");
                                  setIsDropdownOpen(false);
                                }}
                                className="p-2.5 rounded-lg text-xs cursor-pointer transition-all hover:bg-[rgba(255,255,255,0.05)]"
                                style={{
                                  backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                                  fontWeight: isSelected ? '600' : 'normal',
                                  border: isSelected ? '1px solid var(--accent-soft)' : '1px solid transparent'
                                }}
                              >
                                <div className="font-semibold text-xs text-[var(--text)]">{job.title}</div>
                                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-mute)' }}>{job.company_name}</div>
                              </div>
                            );
                          })
                        }
                        
                        {recommendedJobs.filter(job => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            job.title.toLowerCase().includes(term) || 
                            (job.company_name || '').toLowerCase().includes(term)
                          );
                        }).length === 0 && (
                          <div className="text-center text-xs text-text-mute py-6">
                            No positions found matching "{searchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[11px] text-text-dim">Select any scraped internship position to focus the interview simulation on that specific job description.</p>
            </div>

            {/* 1b. Custom target role context selection */}
            {!selectedJobId && (
              <div className="space-y-2">
                <label className="input-label">Practice Role Context</label>
                <div className="input-wrap">
                  <select 
                    value={customRole} 
                    onChange={(e) => setCustomRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      appearance: 'auto'
                    }}
                  >
                    <option value="general">General Practice (Mixed Topics)</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Cybersecurity">Cybersecurity Analyst</option>
                  </select>
                </div>
                <p className="text-[11px] text-text-dim">Choose a specific industry role to focus the technical and behavioral questions.</p>
              </div>
            )}

            {/* 1c. Configurable number of questions */}
            <div className="space-y-2">
              <label className="input-label">Number of Questions</label>
              <div className="input-wrap">
                <select 
                  value={numQuestions} 
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                    appearance: 'auto'
                  }}
                >
                  <option value={3}>3 Questions (Quick Practice)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Thorough Simulation)</option>
                </select>
              </div>
            </div>

            {/* 2. Interview Type */}
            <div className="space-y-2">
              <label className="input-label">Focus Area</label>
              <div className="grid grid-cols-2 gap-3">
                {['mixed', 'technical', 'behavioral', 'hr'].map(t => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => setInterviewType(t)}
                    className="p-3 rounded-lg text-xs font-semibold capitalize border transition-all"
                    style={{
                      borderColor: interviewType === t ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: interviewType === t ? 'var(--accent-soft)' : 'var(--surface)',
                      color: interviewType === t ? 'var(--text)' : 'var(--text-mute)',
                      boxShadow: interviewType === t ? '0 0 12px rgba(79, 124, 255, 0.25)' : 'none'
                    }}
                  >
                    {t === 'mixed' ? 'Mixed Topics' : `${t} focus`}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Difficulty */}
            <div className="space-y-2">
              <label className="input-label">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'advanced'].map(d => (
                  <button 
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="p-3 rounded-lg text-xs font-semibold capitalize border transition-all"
                    style={{
                      borderColor: difficulty === d ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: difficulty === d ? 'var(--accent-soft)' : 'var(--surface)',
                      color: difficulty === d ? 'var(--text)' : 'var(--text-mute)',
                      boxShadow: difficulty === d ? '0 0 12px rgba(79, 124, 255, 0.25)' : 'none'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setView('dashboard')} 
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleStartInterview} 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Initializing...' : 'Launch Simulation'} <Icons.IconArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: LIVE INTERVIEW ROOM */}
        {view === 'room' && (
          <motion.div key="room" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto space-y-6">
            
            {isEvaluating ? (
              <div className="card p-12 text-center space-y-6">
                <div style={{
                  width: 48,
                  height: 48,
                  border: '3px solid var(--accent-soft)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} className="mx-auto" />
                
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700 }}>AI is evaluating your interview...</h3>
                <p style={{ color: 'var(--text-mute)', fontSize: '14px', maxWidth: '400px', lineHeight: 1.5 }} className="mx-auto">
                  Gemini is analyzing your responses for technical knowledge, structure, communication tone, and confidence. Please wait.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual Interactivity Pulse */}
                <div className="card p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: (isTTSPlaying || isRecording) ? [1, 1.25, 1] : [1, 1.05, 1], 
                        opacity: (isTTSPlaying || isRecording) ? [0.15, 0.4, 0.15] : [0.1, 0.2, 0.1] 
                      }}
                      transition={{ duration: isRecording ? 1 : 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full"
                      style={{ 
                        background: isRecording ? 'var(--danger)' : isTTSPlaying ? 'var(--accent)' : 'var(--pos)' 
                      }}
                    />
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center relative z-10" 
                      style={{ 
                        background: isRecording ? 'var(--danger)' : isTTSPlaying ? 'var(--accent)' : 'var(--pos)' 
                      }}
                    >
                      {isRecording ? (
                        <Icons.IconMic size={20} className="text-white" />
                      ) : isTTSPlaying ? (
                        <Icons.IconVolume2 size={20} className="text-white" />
                      ) : (
                        <Icons.IconTarget size={20} className="text-white" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-text-mute tracking-wider uppercase">
                      {isRecording 
                        ? 'Recording your answer...' 
                        : isTTSPlaying 
                          ? 'AI Interviewer is speaking...' 
                          : 'Interviewer is listening (Click "Speak Answer")'}
                    </div>
                    <div className="text-[10px] text-text-dim">
                      Question {questionCount} of {maxQuestions}
                    </div>
                  </div>
                </div>

                {/* Interviewer Dialog Bubble */}
                <div className="card p-6" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                      <Icons.IconUser size={14} className="text-accent" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="text-[10px] font-bold text-accent uppercase tracking-wider">Interviewer</div>
                      <p className="text-base font-medium leading-relaxed">{currentQuestion}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => speakText(currentQuestion)} 
                          className="btn btn-ghost btn-sm text-xs py-1 px-3"
                          style={{ height: 'auto' }}
                        >
                          <Icons.IconBriefcase size={12} /> Listen Again
                        </button>
                        {isTTSPlaying && (
                          <button 
                            onClick={stopTTS} 
                            className="btn btn-ghost btn-sm text-xs py-1 px-3"
                            style={{ height: 'auto', color: 'var(--danger)' }}
                          >
                            <Icons.IconX size={12} /> Stop Audio
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Answer Box */}
                <div className="card p-6 space-y-4">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                      <Icons.IconCap size={14} className="text-pos" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-[10px] font-bold text-pos uppercase tracking-wider">Candidate (You)</div>
                      <textarea
                        value={candidateAnswer}
                        onChange={(e) => setCandidateAnswer(e.target.value)}
                        placeholder="Type your professional response here... (Try to use the STAR method: Situation, Task, Action, Result)"
                        rows={5}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          resize: 'none',
                          marginTop: '6px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to exit? You will lose this session's progress.")) {
                          stopTTS();
                          if (recognition && isRecording) recognition.stop();
                          setView('dashboard');
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Exit Session
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`btn ${isRecording ? 'btn-danger' : 'btn-ghost'} btn-sm flex items-center gap-2`}
                        style={isRecording ? { backgroundColor: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' } : {}}
                      >
                        <Icons.IconMic size={14} className={isRecording ? 'animate-pulse' : ''} />
                        {isRecording ? 'Listening...' : 'Speak Answer'}
                      </button>

                      <button 
                        onClick={handleSubmitAnswer}
                        disabled={loading || !candidateAnswer.trim()}
                        className="btn btn-primary"
                      >
                        {loading ? 'Submitting...' : 'Submit Answer'} <Icons.IconArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 4: EVALUATION RESULTS */}
        {view === 'results' && selectedResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Main circular ring & feedback text */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Readiness Score circular badge */}
              <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
                
                <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      fill="none" 
                      stroke={getScoreColor(selectedResult.overall_readiness_score)} 
                      strokeWidth="8" 
                      strokeDasharray={`${(selectedResult.overall_readiness_score / 100) * 263.89} 263.89`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '8px' }}>
                    <span className="text-3xl font-extrabold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {Math.round(selectedResult.overall_readiness_score)}%
                    </span>
                    <span className="text-[9px] text-text-mute uppercase tracking-widest">Score</span>
                  </div>
                </div>

                <div className="space-y-2 text-center md:text-left">
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                    Interview Performance Summary
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-mute)', lineHeight: 1.5 }}>
                    Your overall readiness is evaluated at <b>{
                      selectedResult.overall_readiness_score >= 90 ? "Highly Ready" : 
                      selectedResult.overall_readiness_score >= 80 ? "Ready" : 
                      selectedResult.overall_readiness_score >= 60 ? "Moderate" : 
                      selectedResult.overall_readiness_score >= 40 ? "Beginner" : 
                      selectedResult.overall_readiness_score >= 25 ? "Not Ready" : "Very Low Readiness"
                    }</b>. Check the score breakdown and suggestions below to address your core gaps.
                  </p>
                </div>
              </div>

              {/* Feedbacks detail card */}
              <div className="card p-6 space-y-6">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', fontWeight: 600 }}>Performance Assessment</h3>
                
                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Strengths */}
                  <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--pos)' }}>
                      <Icons.IconCheckCircle size={16} /> Strengths
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: 'var(--text-mute)', paddingLeft: '4px' }}>
                      {selectedResult.feedback_json?.strengths?.map((s, i) => (
                        <li key={i} className="flex gap-1.5 leading-normal">
                          <span className="text-emerald-500">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                      {(!selectedResult.feedback_json?.strengths || selectedResult.feedback_json.strengths.length === 0) && (
                        <li style={{ color: 'var(--text-dim)' }}>No specific strengths highlighted.</li>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--danger)' }}>
                      <Icons.IconAlertCircle size={16} /> Weaknesses
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: 'var(--text-mute)', paddingLeft: '4px' }}>
                      {selectedResult.feedback_json?.weaknesses?.map((w, i) => (
                        <li key={i} className="flex gap-1.5 leading-normal">
                          <span className="text-red-400">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                      {(!selectedResult.feedback_json?.weaknesses || selectedResult.feedback_json.weaknesses.length === 0) && (
                        <li style={{ color: 'var(--text-dim)' }}>No critical weaknesses highlighted.</li>
                      )}
                    </ul>
                  </div>

                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <div className="font-semibold text-sm">Actionable Suggestions</div>
                  <ul className="space-y-2.5 text-xs" style={{ color: 'var(--text-mute)' }}>
                    {selectedResult.feedback_json?.suggestions?.map((s, i) => (
                      <li key={i} className="flex gap-2 items-start leading-relaxed">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                    {(!selectedResult.feedback_json?.suggestions || selectedResult.feedback_json.suggestions.length === 0) && (
                      <li style={{ color: 'var(--text-dim)' }}>No suggestion feedback available.</li>
                    )}
                  </ul>
                </div>

              </div>

            </div>

            {/* Right Col: Score categories and skill gaps */}
            <div className="space-y-6">
              
              {/* Target Internship Card */}
              {selectedResult.internship && (
                <div 
                  className="card p-5 space-y-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleViewInternshipDetails(selectedResult.internship_id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-accent uppercase tracking-widest font-bold">Interview Target Position</span>
                    <span className="text-[10px] text-text-mute flex items-center gap-1">
                      Click to view details <Icons.IconExternalLink size={10} />
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-4 pt-1">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: 'var(--surface-3)', 
                        border: '1px solid var(--border)',
                        overflow: 'hidden'
                      }}
                    >
                      {selectedResult.internship.company_logo_url ? (
                        <img 
                          src={selectedResult.internship.company_logo_url} 
                          alt={selectedResult.internship.company_name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <Icons.IconBriefcase 
                        size={18} 
                        style={{ display: selectedResult.internship.company_logo_url ? 'none' : 'block', color: 'var(--text-mute)' }} 
                      />
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-sm leading-snug hover:text-accent transition-colors">
                        {selectedResult.internship.title}
                      </h4>
                      <p className="text-xs text-text-mute font-medium">
                        {selectedResult.internship.company_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Scores */}
              <div className="card p-6 space-y-4">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', fontWeight: 600 }}>Category Analysis</h3>
                
                <div className="space-y-3">
                  {[
                    { 
                      label: 'Technical Knowledge', 
                      value: selectedResult.technical_score, 
                      weight: '40%',
                      reasoning: getFeedbackField(selectedResult, 'technical_reasoning'),
                      evidence: getFeedbackField(selectedResult, 'technical_evidence'),
                      color: 'var(--accent)',
                      icon: <Icons.IconChip size={14} className="text-accent" />
                    },
                    { 
                      label: 'Communication Skills', 
                      value: selectedResult.communication_score, 
                      weight: '25%',
                      reasoning: getFeedbackField(selectedResult, 'communication_reasoning'),
                      evidence: getFeedbackField(selectedResult, 'communication_evidence'),
                      color: 'var(--pos)',
                      icon: <Icons.IconUsers size={14} className="text-pos" />
                    },
                    { 
                      label: 'Behavioral Performance', 
                      value: selectedResult.behavioral_score, 
                      weight: '20%',
                      reasoning: getFeedbackField(selectedResult, 'behavioral_reasoning'),
                      evidence: getFeedbackField(selectedResult, 'behavioral_evidence'),
                      color: 'var(--warn)',
                      icon: <Icons.IconTarget size={14} className="text-warn" />
                    },
                    { 
                      label: 'Confidence & Flow', 
                      value: selectedResult.confidence_score, 
                      weight: '15%',
                      reasoning: getFeedbackField(selectedResult, 'confidence_reasoning'),
                      evidence: getFeedbackField(selectedResult, 'confidence_evidence'),
                      color: 'var(--danger)',
                      icon: <Icons.IconWave size={14} className="text-danger" />
                    }
                  ].map((cat, idx) => (
                    <CategoryScoreCard 
                      key={idx}
                      label={cat.label}
                      value={cat.value}
                      weight={cat.weight}
                      reasoning={cat.reasoning}
                      evidence={cat.evidence}
                      color={cat.color}
                      icon={cat.icon}
                    />
                  ))}
                </div>
              </div>

              {/* Identified Skill Gaps and Routing */}
              <div className="card p-6 space-y-4">
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '15px', fontWeight: 600 }}>Identified Skill Gaps</h3>
                
                {(!selectedResult.skill_gaps || selectedResult.skill_gaps.length === 0) ? (
                  <p className="text-xs text-text-dim text-center py-4">No skill gaps identified in this session. Great job!</p>
                ) : (
                  <div className="space-y-3">
                    {selectedResult.skill_gaps.map((gap, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg border space-y-1.5" 
                        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-text">{gap.skill_name}</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border"
                            style={
                              gap.severity === 'critical' 
                                ? { color: 'var(--danger)', bg: 'var(--danger-soft)', borderColor: 'rgba(248,113,113,0.2)' }
                                : { color: 'var(--warn)', bg: 'var(--warn-soft)', borderColor: 'rgba(251,191,36,0.2)' }
                            }
                          >
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-mute leading-normal">{gap.recommendation}</p>
                        
                        {/* Open platform chooser modal */}
                        <button 
                          onClick={() => handleOpenPlatformModal(gap.skill_name)}
                          className="btn btn-ghost btn-sm text-[10px] w-full justify-center gap-1 mt-1 py-1"
                          style={{ height: 'auto' }}
                        >
                          Find Courses <Icons.IconExternalLink size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </motion.div>
        )}

        {selectedInternshipForModal && (
          <InternshipDetailsModal
            job={selectedInternshipForModal}
            user={user}
            onClose={() => setSelectedInternshipForModal(null)}
          />
        )}

        {selectedSkillForModal && (() => {
          const catKey = inferCategory(selectedSkillForModal.name);
          const modalCat = CATEGORIES[catKey] || CATEGORIES.Backend;
          const SkillIcon = modalCat.Icon;
          return (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'color-mix(in srgb, var(--bg) 78%, transparent)', backdropFilter: 'blur(10px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSkillForModal(null)}
            >
              <motion.div
                className="relative overflow-hidden w-full max-w-md"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 20,
                  boxShadow: '0 40px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px var(--border), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                onClick={e => e.stopPropagation()}
              >
                {/* Category-tinted glow orb */}
                <div
                  className="absolute -right-16 -top-16 w-44 h-44 rounded-full pointer-events-none"
                  style={{ background: modalCat.color, filter: 'blur(64px)', opacity: 0.1 }}
                />

                {/* Header */}
                <div className="relative p-6" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: `${modalCat.color}18`, color: modalCat.color }}
                        >
                          <SkillIcon size={10} /> {modalCat.label}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                        >
                          <Icons.IconTarget size={10} /> Choose Platform
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}
                      >
                        Master {selectedSkillForModal.name}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>
                        Unlock{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          {selectedSkillForModal.count} roles
                        </span>{' '}
                        by completing this skill
                      </p>
                    </div>
                    <button className="icon-btn shrink-0" onClick={() => setSelectedSkillForModal(null)}>
                      <Icons.IconX size={18} />
                    </button>
                  </div>
                </div>

                {/* Platform options */}
                <div
                  className="relative p-6 space-y-3"
                  style={{ background: 'color-mix(in srgb, var(--surface-2) 35%, transparent)' }}
                >
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedSkillForModal.name + ' full course tutorial')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedSkillForModal(null)}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#ef4444';
                      e.currentTarget.style.boxShadow = '0 0 24px -8px rgba(239,68,68,0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ background: '#ef444418', color: '#ef4444' }}
                    >
                      <Icons.IconZap size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>YouTube</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>Free crash courses & tutorials</div>
                    </div>
                    <Icons.IconExternalLink size={15} style={{ color: 'var(--text-dim)' }} />
                  </a>

                  <a
                    href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedSkillForModal.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedSkillForModal(null)}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#A435F0';
                      e.currentTarget.style.boxShadow = '0 0 24px -8px rgba(164,53,240,0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ background: '#A435F018', color: '#A435F0' }}
                    >
                      <Icons.IconChip size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Udemy</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>Comprehensive structured courses</div>
                    </div>
                    <Icons.IconExternalLink size={15} style={{ color: 'var(--text-dim)' }} />
                  </a>

                  <a
                    href={`https://www.coursera.org/search?query=${encodeURIComponent(selectedSkillForModal.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedSkillForModal(null)}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#0056D2';
                      e.currentTarget.style.boxShadow = '0 0 24px -8px rgba(0,86,210,0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ background: '#0056D218', color: '#0056D2' }}
                    >
                      <Icons.IconCap size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Coursera</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>Professional certificates & degrees</div>
                    </div>
                    <Icons.IconExternalLink size={15} style={{ color: 'var(--text-dim)' }} />
                  </a>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default InterviewTab;
