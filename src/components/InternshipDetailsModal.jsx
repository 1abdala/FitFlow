import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as Icons from './Icons';
import LogApplicationModal from './LogApplicationModal';
import { useUpdateApplication } from '../hooks/useUpdateApplication';
import { supabase } from '../lib/supabase';
import { getRelativeTimeString } from '../lib/dateUtils';

const detectSource = (url) => {
  if (!url) return 'manual';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('jobstreet.com')) return 'jobstreet';
  return 'manual';
};

const detectCategory = (title) => {
  const t = (title || '').toLowerCase();
  if (t.includes('frontend') || t.includes('front-end') || t.includes('react') || t.includes('ui/ux')) return 'frontend';
  if (t.includes('backend') || t.includes('back-end') || t.includes('api')) return 'backend';
  if (t.includes('fullstack') || t.includes('full-stack') || t.includes('full stack')) return 'fullstack';
  if (t.includes('devops') || t.includes('cloud') || t.includes('infrastructure')) return 'devops';
  if (t.includes('data') || t.includes('machine learning') || t.includes('analyst')) return 'data';
  return 'other';
};

const InternshipDetailsModal = ({ job, onClose }) => {
  if (!job) return null;

  const { internships, match_score, skill_gaps } = job;
  const score = Math.round(match_score);

  const allSkills = internships?.internship_skills?.map(s => s.skills?.name) || [];
  const missingSkills = skill_gaps?.map(g => g.skills?.name) || [];
  const verified = allSkills.filter(s => !missingSkills.includes(s));

  const [summary, setSummary] = React.useState(null);
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [showLogModal, setShowLogModal] = React.useState(false);

  const { createApplication } = useUpdateApplication();
  const { applications: trackerApps } = useApplications();
  const [saving, setSaving] = React.useState(false);
  const cleanupRef = React.useRef(null);

  // Clean up the visibility listener if the modal unmounts before user returns
  React.useEffect(() => {
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, []);

  const handleApply = () => {
    if (internships?.apply_url) {
      window.open(internships.apply_url, '_blank', 'noopener,noreferrer');
    }

    let shown = false;

    const show = () => {
      if (shown) return;
      shown = true;
      setShowLogModal(true);
      cleanup(); // eslint-disable-line no-use-before-define
    };

    const onVisChange = () => {
      // Fires when user returns to this tab (document.hidden flips to false)
      if (!document.hidden) show();
    };

    // Fallback: if the new tab never opened (popup blocked) the tab stays
    // visible the whole time, so visibilitychange never fires. Show after 800ms.
    const fallback = setTimeout(() => {
      if (!document.hidden) show();
    }, 800);

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisChange);
      clearTimeout(fallback);
      cleanupRef.current = null;
    };

    cleanupRef.current = cleanup;
    document.addEventListener('visibilitychange', onVisChange);
  };

  const handleSaveInternship = async () => {
    const company = internships?.company_name;
    const title = internships?.title;
    const existing = trackerApps.find(a =>
      a.company_name?.toLowerCase().trim() === company?.toLowerCase().trim() &&
      a.role_title?.toLowerCase().trim() === title?.toLowerCase().trim()
    );
    if (existing) {
      const msgs = {
        applied:   "You've already applied to this role.",
        interview: "You already have an interview scheduled for this role.",
        offer:     "You've already received an offer for this role.",
        rejected:  "This role is marked as rejected in your tracker.",
        saved:     "Already saved to your tracker.",
      };
      toast(msgs[existing.stage] || "Already in your tracker.", { icon: existing.stage === 'saved' ? '★' : '✓' });
      return;
    }
    setSaving(true);
    try {
      await createApplication({
        company_name:   company || 'Unknown Company',
        role_title:     title || 'Unknown Role',
        role_category:  detectCategory(title),
        job_source:     detectSource(internships?.apply_url),
        source_url:     internships?.apply_url || null,
        match_score:    Math.round(match_score),
        matched_skills: verified.filter(Boolean),
        missing_skills: missingSkills.filter(Boolean),
        stage:          'saved',
      });
      toast.success('Saved to your Applications tracker!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLog = async () => {
    const jobSource = detectSource(internships?.apply_url);
    await createApplication({
      company_name:    internships?.company_name || 'Unknown Company',
      role_title:      internships?.title || 'Unknown Role',
      role_category:   detectCategory(internships?.title),
      job_source:      jobSource,
      source_url:      internships?.apply_url || null,
      match_score:     Math.round(match_score),
      matched_skills:  verified.filter(Boolean),
      missing_skills:  missingSkills.filter(Boolean),
      stage:           'applied',
    });
    toast.success('Application logged to your tracker!');
    setShowLogModal(false);
  };

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { 
      document.removeEventListener("keydown", onKey); 
      document.body.style.overflow = ""; 
    };
  }, [onClose]);

  const fetchAiSummary = async () => {
    if (loadingSummary) return;
    setLoadingSummary(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/internship/${internships.id}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      alert('Could not generate AI summary. Make sure the FitFlow AI service is running on port 8000.');
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <>
    <div className="idm-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, transform: "translateY(12px) scale(0.98)" }}
        animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
        exit={{ opacity: 0, transform: "translateY(12px) scale(0.98)" }}
        onClick={(e) => e.stopPropagation()}
        className="idm"
      >
        {/* Header */}
        <header className="idm-head">
          <div className="idm-head-left">
            <div className="idm-logo">
              <Icons.IconBriefcase size={22} />
            </div>
            <div>
              <div className="idm-kicker">
                <span className="idm-tag idm-tag-live">
                  <span className="idm-dot" /> Open · accepting applications
                </span>
              </div>
              <h2 className="idm-title">{internships?.title}</h2>
              <div className="idm-sub">
                <b>{internships?.company_name}</b>
                <span className="m-card-dot">·</span>
                <span>{internships?.location}</span>
                <span className="m-card-dot">·</span>
                <span className="mono">RM 1,800/mo</span>
              </div>
            </div>
          </div>
          <button className="idm-close" onClick={onClose} aria-label="Close">
            <Icons.IconX size={18} />
          </button>
        </header>

        <div className="idm-body custom-scrollbar">
          {/* Top row: Match score + AI + Apply */}
          <div className="idm-row idm-top">
            <div className="idm-score-card">
              <div className="idm-score-ring">
                <svg viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--surface-3)" strokeWidth="5" />
                  <circle cx="30" cy="30" r="26" fill="none" stroke="url(#idm-grad)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 163.36} 163.36`} transform="rotate(-90 30 30)" />
                  <defs>
                    <linearGradient id="idm-grad" x1="0" x2="1">
                      <stop offset="0" stopColor="var(--accent)" />
                      <stop offset="1" stopColor="var(--accent-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="idm-score-num">{score}<i>%</i></div>
              </div>
              <div className="idm-score-meta">
                <div className="idm-score-label">Match score</div>
                <div className="idm-score-tier">
                  {score >= 85 ? "Top-tier fit" : score >= 70 ? "Strong fit" : score >= 55 ? "Stretch fit" : "Long shot"}
                </div>
              </div>
            </div>

            <div className="idm-ai">
              <div className="idm-ai-head">
                <span className="idm-ai-icon"><Icons.IconSparkle size={14} /></span>
                <span>AI Smart Summary</span>
              </div>
              <p className="idm-ai-body">
                {summary ? summary : "A 3-point breakdown — strengths for this role, gaps to address, and tailored interview tips."}
              </p>
              {!summary && (
                <button 
                  onClick={fetchAiSummary}
                  disabled={loadingSummary}
                  className="btn btn-primary btn-sm idm-ai-btn"
                >
                  {loadingSummary ? 'Analyzing...' : 'Generate with Gemini'} <Icons.IconArrowRight size={12} />
                </button>
              )}
            </div>

            <div className="idm-apply">
              <div className="idm-apply-pre">You're in the top <b>{Math.max(5, 100 - score + 8)}%</b> of applicants by skill match.</div>
              <button
                onClick={handleApply}
                className="btn btn-primary btn-lg idm-apply-btn"
              >
                Apply now <Icons.IconArrowUpRight size={14} />
              </button>
              <button className="idm-save-btn" onClick={handleSaveInternship} disabled={saving}>
                {saving ? (
                  <span style={{
                    display: 'inline-block', width: 12, height: 12,
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                  }} />
                ) : (
                  <Icons.IconStar size={13} />
                )}
                {saving ? 'Saving...' : 'Save for later'}
              </button>
            </div>
          </div>

          {/* Skill matrix */}
          <section className="idm-section">
            <div className="idm-section-head"><Icons.IconTarget size={14} /> Skill Matrix</div>
            <div className="idm-skills-grid">
              <div className="idm-skill-card idm-skill-pos">
                <div className="idm-skill-head">
                  <span className="idm-skill-icon"><Icons.IconCheck size={13} /></span>
                  <span>Verified skills</span>
                  <span className="idm-skill-count">{verified.length}</span>
                </div>
                <div className="idm-chip-row">
                  {verified.map((s, i) => <span key={i} className="skill-chip skill-pos">{s}</span>)}
                </div>
              </div>
              <div className="idm-skill-card idm-skill-gap">
                <div className="idm-skill-head">
                  <span className="idm-skill-icon idm-skill-icon-warn"><Icons.IconBolt size={13} /></span>
                  <span>Skill gaps</span>
                  <span className="idm-skill-count">{missingSkills.length}</span>
                </div>
                <div className="idm-chip-row">
                  {missingSkills.map((s, i) => <span key={i} className="skill-chip skill-miss">{s}</span>)}
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="idm-section">
            <div className="idm-section-head"><Icons.IconDoc size={14} /> Description</div>
            <div className="idm-desc">
              <h4>About the role</h4>
              <p>{internships?.description || "No detailed description available."}</p>
              <h4>What you'll be doing</h4>
              <ul>
                <li>Contribute to backend services and APIs.</li>
                <li>Support the full software development lifecycle.</li>
                <li>Collaborate with senior engineers on developer workflows.</li>
              </ul>
            </div>
          </section>

          {/* Footer meta */}
          <div className="idm-foot">
            <div className="idm-foot-item">
              <span>Posted</span>
              <b>{getRelativeTimeString(internships?.created_at || internships?.last_seen_at)}</b>
            </div>
            <div className="idm-foot-item"><span>Duration</span><b>6 months</b></div>
            <div className="idm-foot-item"><span>Mode</span><b>Hybrid</b></div>
            <div className="idm-foot-item"><span>Start</span><b>Jul 2026</b></div>
          </div>
        </div>
      </motion.div>
    </div>

    <AnimatePresence>
      {showLogModal && (
        <LogApplicationModal
          internship={internships}
          matchScore={match_score}
          matchedSkills={verified}
          missingSkills={missingSkills}
          jobSource={detectSource(internships?.apply_url)}
          onLog={handleLog}
          onCancel={() => setShowLogModal(false)}
        />
      )}
    </AnimatePresence>
    </>
  );
};

export default InternshipDetailsModal;
