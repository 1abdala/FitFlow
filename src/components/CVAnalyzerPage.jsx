import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as Icons from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const CVAnalyzerPage = ({ user, onUserUpdate }) => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('cv_analyses')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });
      if (!err && data) {
        setHistory(data);
        if (data.length > 0 && !analysis) {
          setAnalysis(data[0]); // Load most recent
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setFile(null);
      } else {
        setError('');
        setFile(selected);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_id', user.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // In production, point this to your actual deployed FastAPI URL via VITE_API_BASE_URL
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/analyze-cv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis failed');
      }

      const data = await res.json();
      
      // Simulate refreshing history
      await fetchHistory();
      setAnalysis({
        cv_score: data.cv_score,
        extracted_skills: data.extracted_skills,
        skill_gaps: data.skill_gaps,
        improvements: data.improvements,
      });
      setFile(null);
      
      if (onUserUpdate) {
        await onUserUpdate();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreColor = analysis?.cv_score >= 70 ? '#34d399' : analysis?.cv_score >= 50 ? '#facc15' : '#f87171';
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', padding: '24px 32px' }}>
      
      {/* 1. Hero Analysis Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(79,124,255,0.05) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 24, padding: '40px',
        display: 'flex', gap: 40, alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 400px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>CV Analyzer & Match Booster</h1>
          <p style={{ fontSize: 15, color: 'var(--text-mute)', lineHeight: 1.6, maxWidth: 500, marginBottom: 24 }}>
            Upload your resume and receive an instant ATS score, automatic skills extraction, critical gap analysis, and tailored internship recommendations.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
             <span style={{ fontSize: 12, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 999, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>✓ ATS Score</span>
             <span style={{ fontSize: 12, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 999, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>✓ Skills Extraction</span>
             <span style={{ fontSize: 12, background: 'var(--surface-2)', padding: '6px 12px', borderRadius: 999, color: 'var(--text-dim)', border: '1px solid var(--border)' }}>✓ Gap Analysis</span>
          </div>
          {error && <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '12px 16px', borderRadius: 8, marginTop: 24, fontSize: 13, border: '1px solid rgba(248,113,113,0.2)' }}>{error}</div>}
        </div>
        
        {/* Upload Zone */}
        <div style={{
          width: 320, background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
          padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
          position: 'relative', flexShrink: 0
        }}>
           {/* Subtle glow behind the box */}
           <div style={{ position: 'absolute', inset: -10, background: 'var(--accent)', opacity: 0.05, filter: 'blur(20px)', borderRadius: 30, zIndex: -1 }} />
           
           <input type="file" id="cv-upload" style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />
           <label htmlFor="cv-upload" style={{
             border: `2px dashed ${file ? 'var(--accent)' : 'var(--border-strong)'}`,
             background: file ? 'rgba(79,124,255,0.05)' : 'transparent',
             borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
             transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center'
           }}>
             <Icons.IconFileText size={32} style={{ color: file ? 'var(--accent)' : 'var(--text-dim)', marginBottom: 12 }} />
             {file ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all' }}>{file.name}</span>
             ) : (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Click to upload PDF</span>
                  <span style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>Max 5MB</span>
                </>
             )}
           </label>

           <button 
             className="btn btn-primary" 
             onClick={handleAnalyze} 
             disabled={!file || isAnalyzing}
             style={{ width: '100%', fontSize: 14, padding: '12px 0' }}
           >
             {isAnalyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Analyzing...
                </span>
             ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <Icons.IconZap size={16} /> Scan & Optimize Matches
                </span>
             )}
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Results Grid (Left Side) */}
        <div style={{ flex: 1, minWidth: 400 }}>
          {!analysis ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface-1)', border: '1px dashed var(--border)', borderRadius: 16 }}>
               <Icons.IconBriefcase size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 16px' }} />
               <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>No CV Analyzed Yet</h3>
               <p style={{ fontSize: 14, color: 'var(--text-mute)', maxWidth: 400, margin: '0 auto' }}>
                 Upload your resume to instantly extract your technical stack, discover skill gaps, and significantly improve your internship matching accuracy.
               </p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants} initial="hidden" animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}
            >
              {/* ATS Score Ring Focus */}
              <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: scoreColor }} />
                 <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 24 }}>ATS Score</h3>
                 
                 <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 16 }}>
                   <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                     <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                     <motion.circle 
                       cx="60" cy="60" r="50" fill="none" 
                       stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                       initial={{ strokeDasharray: '314 314', strokeDashoffset: 314 }}
                       animate={{ strokeDashoffset: 314 - (314 * analysis.cv_score) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                     />
                   </svg>
                   <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>{analysis.cv_score}<span style={{ fontSize: 16, color: 'var(--text-dim)' }}>%</span></span>
                   </div>
                 </div>
                 
                 <span style={{ fontSize: 16, fontWeight: 600, color: scoreColor }}>
                   {analysis.cv_score >= 70 ? 'Excellent Match' : analysis.cv_score >= 50 ? 'Needs Optimization' : 'Poor Match'}
                 </span>
              </motion.div>

              {/* Skills Extracted */}
              <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.IconCheckCircle size={16} style={{ color: 'var(--accent)' }} /> Skills Detected
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.extracted_skills?.length > 0 ? analysis.extracted_skills.map((skill, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05, y: -2 }}
                      style={{ 
                        padding: '6px 12px', background: 'rgba(79,124,255,0.1)', color: 'var(--accent)', 
                        border: '1px solid rgba(79,124,255,0.2)', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'default', boxShadow: '0 4px 12px rgba(79,124,255,0.05)'
                      }}
                    >
                      {skill}
                    </motion.div>
                  )) : (
                    <p style={{ fontSize: 13, color: 'var(--text-mute)' }}>No clear technical skills found.</p>
                  )}
                </div>
              </motion.div>

              {/* Top Missing Skills */}
              <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.IconAlertCircle size={16} style={{ color: '#f87171' }} /> Top Missing Skills
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analysis.skill_gaps?.length > 0 ? analysis.skill_gaps.map((gap, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ x: 4, background: 'rgba(248,113,113,0.05)' }}
                      style={{ 
                        padding: '12px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease'
                      }}
                    >
                      <Icons.IconAlertCircle size={16} style={{ color: '#f87171' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{gap}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>Missing from profile matching</span>
                      </div>
                    </motion.div>
                  )) : (
                    <p style={{ fontSize: 13, color: 'var(--text-mute)' }}>No critical skill gaps identified!</p>
                  )}
                </div>
              </motion.div>

              {/* AI Career Coach */}
              <motion.div variants={itemVariants} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.IconZap size={16} style={{ color: '#facc15' }} /> AI Career Coach
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  {analysis.improvements?.length > 0 ? analysis.improvements.map((imp, i) => {
                    const isHigh = imp.priority === 'High';
                    return (
                      <div key={i} style={{ 
                        borderLeft: `2px solid ${isHigh ? '#f87171' : '#facc15'}`, paddingLeft: 12,
                        display: 'flex', flexDirection: 'column', gap: 6
                      }}>
                        <span style={{ 
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 4, width: 'fit-content',
                          background: isHigh ? 'rgba(248,113,113,0.1)' : 'rgba(250,204,21,0.1)',
                          color: isHigh ? '#f87171' : '#facc15'
                        }}>
                          {imp.priority} Priority
                        </span>
                        <p style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.5 }}>
                          {imp.tip}
                        </p>
                      </div>
                    );
                  }) : (
                    <p style={{ fontSize: 13, color: 'var(--text-mute)' }}>Your CV looks solid!</p>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 24, border: '1px solid var(--border)' }}>Improve CV</button>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* History Sidebar (Right Side) */}
        {history.length > 0 && (
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Recent Analyses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.slice(0, 5).map((h, i) => (
                  <div 
                    key={i} 
                    onClick={() => setAnalysis(h)}
                    style={{ 
                      padding: 12, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'border-color 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Click to view results</span>
                    </div>
                    <div style={{ 
                      fontSize: 14, fontWeight: 700, 
                      color: h.cv_score >= 70 ? '#34d399' : h.cv_score >= 50 ? '#facc15' : '#f87171' 
                    }}>
                      {h.cv_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
