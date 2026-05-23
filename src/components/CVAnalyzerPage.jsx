import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as Icons from './Icons';

export const CVAnalyzerPage = ({ user }) => {
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

      // In production, point this to your actual deployed FastAPI URL
      const res = await fetch('/api/analyze-cv', {
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
      
      // Force update user in localStorage since skills might have changed
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (dbUser) {
        localStorage.setItem('fitflow_user', JSON.stringify(dbUser));
        window.dispatchEvent(new Event('storage')); // Trigger update across app
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">CV Analyzer & Match Booster</h1>
        <p className="text-text-mute">Upload your resume. Our AI will extract your skills, score your CV against industry standards, and instantly unlock better internship matches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Upload Resume</h3>
            </div>
            <div className="card-body">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${file ? 'border-accent bg-accent/5' : 'border-border'}`}
              >
                <input 
                  type="file" 
                  id="cv-upload" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center">
                  <Icons.IconFileText size={32} className={`mb-3 ${file ? 'text-accent' : 'text-text-dim'}`} />
                  {file ? (
                    <span className="font-medium text-sm text-accent truncate w-full">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-medium text-sm">Click to upload PDF</span>
                      <span className="text-xs text-text-mute mt-1">Max 5MB</span>
                    </>
                  )}
                </label>
              </div>

              {error && <div className="mt-3 text-sm text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}

              <button 
                className="btn btn-primary w-full mt-4" 
                onClick={handleAnalyze}
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Icons.IconTarget size={16} className="animate-spin" /> Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.IconZap size={16} /> Scan & Optimize Matches
                  </span>
                )}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Past Scans</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {history.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md bg-surface-1 border border-border text-sm cursor-pointer hover:border-accent transition-colors" onClick={() => setAnalysis(h)}>
                      <div className="flex items-center gap-2">
                        <Icons.IconClock size={14} className="text-text-mute" />
                        <span>{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`font-bold ${h.cv_score >= 80 ? 'text-green-500' : h.cv_score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {h.cv_score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2">
          {analysis ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Score Header */}
              <div className="card overflow-hidden">
                <div className="bg-gradient-to-r from-surface-1 to-accent/10 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">CV Analysis Complete</h2>
                    <p className="text-sm text-text-mute">Your profile has been automatically updated with new skills!</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="pct-ring pct-ring-lg">
                      <svg viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" className="ring-track" />
                        <circle 
                          cx="18" cy="18" r="15" 
                          className="ring-fill" 
                          stroke={analysis.cv_score >= 80 ? '#22c55e' : analysis.cv_score >= 60 ? '#eab308' : '#ef4444'}
                          strokeDasharray={`${(analysis.cv_score / 100) * 94.25}, 94.25`} 
                        />
                      </svg>
                      <span className="pct-label pct-label-lg font-bold">{analysis.cv_score}</span>
                    </div>
                    <span className="text-xs text-text-mute mt-1 font-medium">ATS SCORE</span>
                  </div>
                </div>
              </div>

              {/* Skills Extracted */}
              <div className="card">
                <div className="card-head">
                  <div className="flex items-center gap-2 text-accent">
                    <Icons.IconCheckCircle size={16} />
                    <h3 className="card-title">Skills Auto-Mapped to Profile</h3>
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex flex-wrap gap-2">
                    {analysis.extracted_skills?.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                    {(!analysis.extracted_skills || analysis.extracted_skills.length === 0) && (
                      <p className="text-sm text-text-mute">No clear technical skills found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Improvements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Skill Gaps */}
                <div className="card">
                  <div className="card-head">
                    <div className="flex items-center gap-2 text-red-500">
                      <Icons.IconAlertCircle size={16} />
                      <h3 className="card-title">Identified Gaps</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="text-sm text-text-mute mb-4">Adding these would boost your matches:</p>
                    <ul className="space-y-2">
                      {analysis.skill_gaps?.map((gap, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm bg-red-500/5 p-2 rounded text-red-500 border border-red-500/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="card">
                  <div className="card-head">
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Icons.IconZap size={16} />
                      <h3 className="card-title">AI Feedback</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <ul className="space-y-4">
                      {analysis.improvements?.map((imp, i) => (
                        <li key={i} className="text-sm border-l-2 pl-3 border-yellow-500/50">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm inline-block mb-1 ${imp.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {imp.priority} Priority
                          </span>
                          <p className="text-text">{imp.tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 card border-dashed border-2 border-border bg-surface-1/50 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mb-4 shadow-sm border border-border">
                <Icons.IconBriefcase size={24} className="text-text-dim" />
              </div>
              <h3 className="text-lg font-bold mb-2">No CV Analyzed Yet</h3>
              <p className="text-sm text-text-mute max-w-md">
                Upload your resume to instantly extract your technical stack, discover skill gaps, and significantly improve your internship matching accuracy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
