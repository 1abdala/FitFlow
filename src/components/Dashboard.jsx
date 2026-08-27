import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingModal from './OnboardingModal';
import InternshipDetailsModal from './InternshipDetailsModal';
import SkillProfileTab from './SkillProfileTab';
import LearningHubTab from './LearningHubTab';
import * as Icons from './Icons';
import { CVAnalyzerPage } from './CVAnalyzerPage';
import { SettingsTab } from './SettingsTab';
import ApplicationsTab from './ApplicationsTab';
import InterviewTab from './InterviewTab';
import { Toaster, toast } from 'react-hot-toast';
import { useApplications } from '../hooks/useApplications';
import { useUpdateApplication } from '../hooks/useUpdateApplication';
import { fetchFullProfile } from '../lib/profileHelpers';
import { getRelativeTimeString } from '../lib/dateUtils';

const CAREER_INTERESTS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Developer',
  'Data Scientist',
  'Data Analyst',
  'AI / Machine Learning',
  'Cybersecurity',
  'DevOps Engineer',
  'Cloud Computing',
  'Networking',
  'UI / UX Designer',
  'QA Tester',
  'Business Analyst'
];

const DashLogo = () => (
  <div className="ff-logo ff-logo-dash">
    <span className="ff-logo-mark"><Icons.IconLogo size={16} /></span>
    <span className="ff-logo-text">Fit<b>Flow</b></span>
  </div>
);

const NavItem = ({ icon, label, active, badge, onClick }) => (
  <button className={`nav-item ${active ? "nav-active" : ""}`} onClick={onClick}>
    <span className="nav-icon">{icon}</span>
    <span className="nav-label">{label}</span>
    {badge && <span className="nav-badge">{badge}</span>}
  </button>
);

const Sidebar = ({ active, setActive, user, onLogout, onBack, isOpen, onClose }) => {
  const items = [
    { id: "overview", icon: <Icons.IconGrid size={18} />, label: "Overview" },
    { id: "matches", icon: <Icons.IconTarget size={18} />, label: "My Matches", badge: null }, // Badge will be updated via props if needed
    { id: "applications", icon: <Icons.IconBriefcase size={18} />, label: "Applications" },
    { id: "interview", icon: <Icons.IconUsers size={18} />, label: "Interview Prep" },
    { id: "skills", icon: <Icons.IconCap size={18} />, label: "Skill Profile" },
    { id: "learning", icon: <Icons.IconBook size={18} />, label: "Learning Hub" },
  ];
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-head-row">
        <DashLogo />
        <button className="sidebar-close-btn" onClick={onClose} title="Close menu">
          <Icons.IconX size={18} />
        </button>
      </div>
      <nav className="nav">
        {items.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} onClick={() => { setActive(it.id); onClose(); }} />
        ))}
      </nav>
      <div className="nav-spacer" />
      <div className="sidebar-card">
        <div className="sb-card-head">
          <Icons.IconBolt size={14} />
          <span>Pro tips</span>
        </div>
        <div className="sb-card-body">Add 2 React projects to bump 8 more matches.</div>
        <button className="sb-card-cta" onClick={() => { setActive('skills'); onClose(); }}>Show me <Icons.IconArrowRight size={12} /></button>
      </div>
      <div className="sidebar-foot">
        <NavItem icon={<Icons.IconGear size={18} />} label="Settings" onClick={() => { setActive('settings'); onClose(); }} active={active === 'settings'} />
        <div className="user-row">
          <div 
            className="user-ava" 
            style={{ 
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              overflow: 'hidden', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2.5px solid rgba(79, 124, 255, 0.3)',
              boxShadow: '0 0 10px rgba(79, 124, 255, 0.25), 0 0 20px rgba(79, 124, 255, 0.15)',
              background: 'rgba(12, 18, 40, 0.8)',
              flexShrink: 0
            }}
          >
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name || 'User'} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span style={{ display: user?.avatar_url ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', color: 'var(--accent)' }}>
              {user?.full_name?.slice(0, 2).toUpperCase() || user?.name?.slice(0, 2).toUpperCase() || 'FF'}
            </span>
          </div>

          <div className="user-meta">
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role capitalize">{user?.role} · {user?.course || 'Student'}</div>
          </div>
          <button className="user-logout" title="Log out" onClick={onLogout}><Icons.IconLogout size={16} /></button>
        </div>
      </div>
    </aside>
  );
};

const getNotificationRelativeTime = (dateValue) => {
  if (!dateValue) return 'Just now';
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  
  return getRelativeTimeString(dateValue);
};

const getNotificationDetails = (notification) => {
  const type = notification.type;
  const priority = notification.priority || 'low';
  
  let icon = Icons.IconBell;
  let color = 'text-text-mute';
  let borderColor = 'transparent';

  if (type === 'match' || type === 'match_score_improved') {
    icon = Icons.IconSparkle;
    color = 'text-accent';
  } else if (type === 'internship') {
    icon = Icons.IconBriefcase;
    color = 'text-emerald-400';
  } else if (type === 'application') {
    icon = Icons.IconTarget;
    color = 'text-amber-400';
  } else if (type === 'cv') {
    icon = Icons.IconDoc;
    color = 'text-accent-2';
  } else {
    icon = Icons.IconGear;
    color = 'text-text-mute';
  }

  if (priority === 'high') {
    borderColor = '#f87171';
  } else if (priority === 'medium') {
    borderColor = '#facc15';
  } else if (priority === 'low') {
    borderColor = '#4f7cff';
  }

  return { icon, color, borderColor };
};

const Topbar = ({ 
  onToggleSidebar, 
  notifications = [], 
  unreadCount = 0, 
  showDropdown = false, 
  setShowDropdown, 
  onNotificationClick, 
  onClearAll,
  searchQuery = '',
  setSearchQuery,
  activeTab,
  setActiveTab
}) => (
  <div className="topbar">
    <div className="topbar-left">
      <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title="Open menu">
        <Icons.IconMenu size={20} />
      </button>
      <div className="crumb select-none">
        <span className="crumb-mute">FitFlow</span>
        <span className="crumb-sep">/</span>
        <span>Dashboard</span>
      </div>
    </div>
    <div className="topbar-right">
      <div className="search select-none">
        <Icons.IconSearch size={16} />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => {
            if (setSearchQuery) {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() && activeTab !== 'matches' && activeTab !== 'overview') {
                setActiveTab('matches');
              }
            }
          }}
          placeholder="Search internships, skills, companies…" 
        />
        {searchQuery ? (
          <button 
            onClick={() => setSearchQuery && setSearchQuery('')}
            className="text-text-mute hover:text-text text-xs ml-1 focus:outline-none"
            title="Clear search"
          >
            ✕
          </button>
        ) : (
          <span className="kbd">⌘K</span>
        )}
      </div>
      
      <div className="relative">
        <button 
          className={`icon-btn ${showDropdown ? 'bg-white/10 text-text' : 'text-text-mute hover:text-text'} transition-colors relative`}
          onClick={() => setShowDropdown(!showDropdown)} 
          title="Notifications"
        >
          <Icons.IconBell size={16} />
          {unreadCount > 0 && (
            <span className="icon-dot absolute -top-0.5 -right-0.5 bg-accent w-2 h-2 rounded-full ring-2 ring-[#0B1220] flex items-center justify-center text-[8px] font-bold text-white p-1 select-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        
        <AnimatePresence>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-[190]" onClick={() => setShowDropdown(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl z-[200] overflow-hidden"
                style={{
                  background: 'rgba(11, 18, 32, 0.95)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(79, 124, 255, 0.1)'
                }}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 select-none">
                    <Icons.IconBell size={14} className="text-accent" />
                    <span className="font-bold text-sm text-text" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={onClearAll}
                      className="text-[10px] font-bold text-accent hover:text-accent-2 transition-colors focus:outline-none"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center select-none">
                      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-text-mute mb-3">
                        <Icons.IconBell size={24} />
                      </div>
                      <span className="font-bold text-xs text-text">You're all caught up</span>
                      <span className="text-[10px] text-text-mute mt-1">No new notifications are available.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notif) => {
                        const details = getNotificationDetails(notif);
                        const Icon = details.icon;
                        
                        return (
                          <div 
                            key={notif.id}
                            onClick={() => onNotificationClick(notif)}
                            className={`p-4 flex gap-3.5 hover:bg-white/4 cursor-pointer transition-all duration-200 group relative ${!notif.is_read ? 'bg-accent/2' : ''}`}
                            style={{
                              borderLeft: `3px solid ${details.borderColor}`
                            }}
                          >
                            <div className={`p-2 rounded-xl bg-white/3 border border-white/5 shrink-0 flex items-center justify-center w-8 h-8 group-hover:scale-105 transition-transform ${details.color}`}>
                              <Icon size={14} />
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="text-[11px] font-bold text-text group-hover:text-accent transition-colors leading-normal pr-4">
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-text-mute mt-1.5 font-medium flex items-center gap-1.5 select-none">
                                <Icons.IconClock size={10} />
                                {notif.timeString || 'Just now'}
                              </span>
                            </div>
                            
                            {!notif.is_read && (
                              <span className="absolute right-4 top-[50%] -translate-y-[50%] w-1.5 h-1.5 rounded-full bg-accent" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);

const WelcomeCard = ({ user, skillGaps, onContinueSetup, onRefresh, refreshing }) => {
  const isComplete = user.profile_completed || Number(user.completion_percentage) === 100;
  
  const getMissingCategories = () => {
    const missing = user.requiredMissingFields || user.missingFields || [];
    const categories = [
      { name: 'Personal Information', fields: ['full_name', 'phone', 'dob', 'nationality', 'gender'] },
      { name: 'Academic Information', fields: ['matric', 'faculty', 'programme', 'year_of_study', 'semester', 'preferred_location', 'preferred_industry'] },
      { name: 'Career Interests', fields: ['preferred_roles'] },
      { name: 'Skills Profile', fields: ['skills'] }
    ];
    return categories
      .filter(cat => cat.fields.some(field => missing.includes(field)))
      .map(cat => cat.name);
  };

  const missingCats = getMissingCategories();

  return (
    <div className="welcome">
      <div className="welcome-bg" aria-hidden="true">
        <svg viewBox="0 0 600 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wg" x1="0" x2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--accent-2)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d="M0,120 C150,60 300,170 600,80 L600,200 L0,200 Z" fill="url(#wg)" opacity="0.4" />
          <path d="M0,140 C200,90 350,180 600,110 L600,200 L0,200 Z" fill="url(#wg)" opacity="0.6" />
        </svg>
      </div>
      <div className="welcome-inner flex flex-col md:flex-row md:items-center justify-between gap-6 w-full relative z-10">
        <div className="flex-1">
          <div className="welcome-kicker"><Icons.IconWave size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h2 className="welcome-title">
            Welcome back, <span className="welcome-name">{user?.name?.split(' ')[0]}</span>.
          </h2>
          <p className="welcome-sub mt-2">
            {isComplete 
              ? `Your profile is missing ${skillGaps.length > 0 ? `about ${skillGaps.length} key skills` : 'no key skills'} for your top matches. Close the gap and unlock more roles.`
              : `Complete your setup to calibrate the AI match engine and unlock personalized recommendations.`}
          </p>
          <div className="welcome-cta mt-6">
            {!isComplete && (
              <button className="btn btn-primary btn-sm" onClick={onContinueSetup}>Continue Setup <Icons.IconArrowRight size={14} /></button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={refreshing} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {refreshing ? 'Refreshing...' : 'Refresh matches'}
            </button>
          </div>
        </div>

        {/* Completion Card Widget */}
        <div className="welcome-completion-card p-4 rounded-2xl border backdrop-blur-md flex flex-col gap-2.5 min-w-[260px] max-w-[320px] w-full shrink-0"
             style={{ 
               background: 'rgba(255, 255, 255, 0.02)', 
               borderColor: isComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)' 
             }}>
          {isComplete ? (
            <>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Icons.IconCheckCircle size={16} />
                <span>Profile Complete</span>
              </div>
              <p className="text-[11px] text-text-mute leading-normal">
                All required information has been provided.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-xs text-text">Profile {user.completion_percentage || 0}% Complete</span>
                <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">Incomplete</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${user.completion_percentage || 0}%` }} />
              </div>
              {missingCats.length > 0 && (
                <div className="text-[10px] leading-normal mt-0.5">
                  <span className="text-text-mute font-medium block">Missing:</span>
                  <div className="text-red-400 font-bold mt-0.5 flex flex-col gap-0.5">
                    {missingCats.map(cat => (
                      <span key={cat}>• {cat}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, delta, deltaTone, sub, sparkline }) => (
  <div className="kpi">
    <div className="kpi-head">
      <span className="kpi-icon">{icon}</span>
      <span className="kpi-label">{label}</span>
    </div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-foot">
      {delta && <span className={`kpi-delta kpi-delta-${deltaTone || "up"}`}>{delta}</span>}
      <span className="kpi-sub">{sub}</span>
    </div>
    {sparkline && (
      <svg className="kpi-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path d={sparkline} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={sparkline + " L100 30 L0 30 Z"} fill="currentColor" opacity="0.08" />
      </svg>
    )}
  </div>
);

const MatchRow = ({ job, onSelect, animDelay = 0 }) => {
  const score = Math.round(job.match_score);
  const gaps = job.skill_gaps ?? [];
  const srcInfo = Icons.getSourceInfo ? Icons.getSourceInfo(job.internships?.source, job.internships?.apply_url) : null;
  return (
    <motion.div
      className={`match-row ${score >= 85 ? "match-hi" : ""}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animDelay, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 4 }}
      onClick={() => onSelect(job)}
    >
      <div className="match-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {job.internships?.company_logo_url ? (
          <img 
            src={job.internships.company_logo_url} 
            alt={job.internships.company_name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <Icons.IconBriefcase size={16} style={{ display: job.internships?.company_logo_url ? 'none' : 'block' }} />
      </div>
      <div className="match-meta">
        <div className="match-role">{job.internships?.title}</div>
        <div className="match-co" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {job.internships?.company_name}
          {srcInfo && (
            <span
              title={srcInfo.tooltip}
              style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', flexShrink: 0 }}
            >
              {srcInfo.type === 'linkedin' ? <Icons.IconLinkedIn size={14} /> : <Icons.IconJobStreet size={14} />}
            </span>
          )}
        </div>
      </div>
      <div className="match-skills">
        {gaps.slice(0, 2).map((sg, i) => <span key={i} className="skill-chip skill-miss">{sg.skills?.name}</span>)}
        {gaps.length > 2 && <span className="skill-chip">+{gaps.length - 2}</span>}
      </div>
      <div className="match-pct">
        <div className="pct-ring">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" className="ring-track" />
            <motion.circle
              cx="18" cy="18" r="15"
              className="ring-fill"
              initial={{ strokeDasharray: '0, 94.25' }}
              animate={{ strokeDasharray: `${(score / 100) * 94.25}, 94.25` }}
              transition={{ delay: animDelay + 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="pct-label">{score}<i>%</i></span>
        </div>
      </div>
      <button className="match-cta"><Icons.IconArrowUpRight size={14} /></button>
    </motion.div>
  );
};

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

const TRACKER_STATUS_BADGE = {
  saved:     { label: 'Saved',     bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  applied:   { label: 'Applied',   bg: 'rgba(79,124,255,0.12)',  text: '#4f7cff', border: 'rgba(79,124,255,0.3)' },
  interview: { label: 'Interview', bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  offer:     { label: 'Offer',     bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.3)' },
  rejected:  { label: 'Rejected',  bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
};

const MatchCard = ({ job, onSelect, onToggleSave, animDelay = 0, trackerStatus }) => {
  const score  = Math.round(job.match_score);
  const gaps   = job.skill_gaps ?? [];
  const co     = job.internships?.company_name || "Company";
  const loc    = job.internships?.location || "Kuala Lumpur";
  const tier   = score >= 90 ? "tier1" : score >= 75 ? "tier2" : "tier3";
  const isSaved = job.applications && job.applications.length > 0;
  const srcInfo = Icons.getSourceInfo ? Icons.getSourceInfo(job.internships?.source, job.internships?.apply_url) : null;

  const cardRef = useRef(null);
  const glowRef = useRef(null);

  /* Glow intensity by tier */
  const glowAlpha = tier === 'tier1' ? 0.13 : tier === 'tier2' ? 0.09 : 0.06;

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    glowRef.current.style.background =
      `radial-gradient(300px circle at ${x}% ${y}%, rgba(79,124,255,${glowAlpha}), transparent 68%)`;
  };
  const showGlow = () => { if (glowRef.current) glowRef.current.style.opacity = '1'; };
  const hideGlow = () => { if (glowRef.current) glowRef.current.style.opacity = '0'; };

  return (
    <motion.div
      ref={cardRef}
      className={`m-card m-card-${tier}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      style={{ willChange: 'transform' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={showGlow}
      onMouseLeave={hideGlow}
      onClick={() => onSelect(job)}
    >
      {/* Mouse-follow ambient glow — no React re-renders, direct DOM */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          opacity: 0,
          transition: 'opacity 0.28s ease',
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 0,
        }}
      />

      <div className="m-card-stripe" />
      <div className="m-card-logo" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {job.internships?.company_logo_url ? (
          <img 
            src={job.internships.company_logo_url} 
            alt={co} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span style={{ display: job.internships?.company_logo_url ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {(co || "Co").split(" ").slice(0, 2).map(w => w ? w[0] : "").join("")}
        </span>
      </div>
      <div className="m-card-body">
        <div className="m-card-row1">
          <h3 className="m-card-role">{job.internships?.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {trackerStatus && TRACKER_STATUS_BADGE[trackerStatus] && (
              <span style={{
                padding: '3px 8px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                background: TRACKER_STATUS_BADGE[trackerStatus].bg,
                color: TRACKER_STATUS_BADGE[trackerStatus].text,
                border: `1px solid ${TRACKER_STATUS_BADGE[trackerStatus].border}`,
                textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
              }}>
                {TRACKER_STATUS_BADGE[trackerStatus].label}
              </span>
            )}
            <button
              className={`m-save ${isSaved ? 'm-save-active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleSave(job.internships?.id, isSaved); }}
            >
              {isSaved ? <Icons.IconStar size={15} fill="currentColor" /> : <Icons.IconStar size={15} />}
            </button>
          </div>
        </div>
        <div className="m-card-meta">
          <span className="m-card-co" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {co}
            {srcInfo && (
              <span
                title={srcInfo.tooltip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  verticalAlign: 'middle',
                  cursor: 'help',
                  flexShrink: 0
                }}
              >
                {srcInfo.type === 'linkedin' ? (
                  <Icons.IconLinkedIn size={15} />
                ) : (
                  <Icons.IconJobStreet size={15} />
                )}
              </span>
            )}
          </span>
          <span className="m-card-dot">·</span>
          <span>{loc}</span>
          <span className="m-card-dot">·</span>
          <span className="mono">RM 1,500 - 2,500/mo</span>
          <span className="m-card-dot">·</span>
          <span className="m-card-posted">
            <Icons.IconClock size={11} /> {getRelativeTimeString(job.internships?.created_at || job.internships?.last_seen_at)}
          </span>
        </div>
        <div className="m-card-skills">
          <span className="m-card-skills-label">Missing</span>
          {gaps.slice(0, 3).map((sg, i) => (
            <span key={i} className="skill-chip skill-miss">{sg.skills?.name}</span>
          ))}
          {gaps.length > 3 && <span className="skill-chip skill-miss">+{gaps.length - 3}</span>}
        </div>
      </div>
      <div className="m-card-score">
        <div className="pct-ring pct-ring-lg">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" className="ring-track" />
            <motion.circle
              cx="18" cy="18" r="15"
              className="ring-fill"
              initial={{ strokeDasharray: '0, 94.25' }}
              animate={{ strokeDasharray: `${(score / 100) * 94.25}, 94.25` }}
              transition={{ delay: animDelay + 0.28, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="pct-label pct-label-lg">{score}<i>%</i></span>
        </div>
        <div className="m-card-score-label">match</div>
      </div>
      <div className="m-card-actions" onClick={(e) => e.stopPropagation()}>
        <a href={job.internships?.apply_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
          Apply <Icons.IconArrowUpRight size={12} />
        </a>
        <button className="btn btn-ghost btn-sm" onClick={() => onSelect(job)}>Details</button>
      </div>
      <div className="m-card-hint">Click for details →</div>
    </motion.div>
  );
};

const LocationFilterPopover = ({ selectedLocation, setSelectedLocation, availableLocations = [], matches = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const popularStates = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Kedah', 'Perak', 'Melaka', 'Sarawak', 'Sabah'];

  const locationCounts = useMemo(() => {
    const counts = { All: matches.length };
    (matches || []).forEach(m => {
      const itemLoc = m.internships?.location || '';
      if (!itemLoc) return;

      popularStates.forEach(st => {
        if (itemLoc.toLowerCase().includes(st.toLowerCase())) {
          counts[st] = (counts[st] || 0) + 1;
        }
      });

      availableLocations.forEach(loc => {
        if (itemLoc.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(itemLoc.toLowerCase())) {
          counts[loc] = (counts[loc] || 0) + 1;
        }
      });
    });
    return counts;
  }, [matches, availableLocations]);

  const filteredLocations = availableLocations.filter(loc => 
    loc.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStates = popularStates.filter(st =>
    st.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <span className="m-sort-lbl">Location</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="location-filter-btn flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        >
          <span className="flex items-center gap-1.5 truncate max-w-[140px]">
            <Icons.IconMapPin size={13} className="text-accent shrink-0" />
            {selectedLocation === 'All' ? 'All Locations' : selectedLocation}
          </span>
          <Icons.IconChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-64 rounded-xl border border-white/10 shadow-2xl z-[300] overflow-hidden"
            style={{
              background: '#0B1220',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(79, 124, 255, 0.2)'
            }}
          >
            {/* Search Input Box inside location popover */}
            <div className="p-2.5 border-b border-white/10 bg-[#0F172A]">
              <div className="relative flex items-center">
                <Icons.IconSearch size={14} className="absolute left-2.5 text-text-mute pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search location..."
                  className="w-full bg-[#1E293B] text-white text-xs font-medium pl-8 pr-7 py-1.5 rounded-md border border-white/10 focus:border-accent focus:outline-none placeholder:text-text-mute"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 text-text-mute hover:text-white text-xs focus:outline-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Location Items List */}
            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation('All');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${
                  selectedLocation === 'All' ? 'bg-accent/20 text-accent font-bold' : 'text-slate-100 hover:bg-white/5'
                }`}
              >
                <span>🌐 All Locations</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedLocation === 'All' ? 'bg-accent text-dark' : 'bg-white/10 text-slate-300'
                  }`}>
                    {matches.length}
                  </span>
                  {selectedLocation === 'All' && <Icons.IconCheck size={14} className="text-accent" />}
                </div>
              </button>

              {filteredStates.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-accent-2 uppercase">
                    Popular Regions
                  </div>
                  {filteredStates.map(state => {
                    const count = locationCounts[state] || 0;
                    return (
                      <button
                        key={state}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(state);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${
                          selectedLocation === state ? 'bg-accent/20 text-accent font-bold' : 'text-slate-100 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">📍 {state}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedLocation === state ? 'bg-accent text-dark' : 'bg-white/10 text-slate-300'
                          }`}>
                            {count}
                          </span>
                          {selectedLocation === state && <Icons.IconCheck size={14} className="text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredLocations.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-text-mute uppercase">
                    Specific Postings ({filteredLocations.length})
                  </div>
                  {filteredLocations.map(loc => {
                    const count = locationCounts[loc] || 0;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${
                          selectedLocation === loc ? 'bg-accent/20 text-accent font-bold' : 'text-slate-100 hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate pr-1">{loc}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedLocation === loc ? 'bg-accent text-dark' : 'bg-white/10 text-slate-300'
                          }`}>
                            {count}
                          </span>
                          {selectedLocation === loc && <Icons.IconCheck size={14} className="shrink-0 text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredStates.length === 0 && filteredLocations.length === 0 && (
                <div className="py-6 text-center text-text-mute text-xs">
                  No locations matching "{search}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryFilterPopover = ({ selectedCategory, setSelectedCategory, categories = CAREER_INTERESTS, matches = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  const categoryCounts = useMemo(() => {
    const counts = {};
    matches.forEach((m) => {
      const rawCat = (m.internships?.category || '').toLowerCase().trim();
      const title = (m.internships?.title || '').toLowerCase().trim();

      categories.forEach((cat) => {
        const catLower = cat.toLowerCase().trim();
        const mainKeyword = catLower.split('/')[0].split('(')[0].trim();

        if (
          (rawCat && (rawCat === catLower || rawCat.includes(mainKeyword))) ||
          (title && title.includes(mainKeyword))
        ) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
    });
    return counts;
  }, [matches, categories]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = selectedCategory === 'All'
    ? matches.length
    : (categoryCounts[selectedCategory] || 0);

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <span className="m-sort-lbl">Category</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="location-filter-btn flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        >
          <span className="flex items-center gap-1.5 truncate max-w-[170px]">
            <Icons.IconBriefcase size={13} className="text-accent shrink-0" />
            {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent">
              {selectedCount}
            </span>
            <Icons.IconChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-72 rounded-xl border border-white/10 shadow-2xl z-[300] overflow-hidden"
            style={{
              background: '#0B1220',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(79, 124, 255, 0.2)'
            }}
          >
            {/* Search Input Box inside Category Popover */}
            <div className="p-2.5 border-b border-white/10 bg-[#0F172A]">
              <div className="relative flex items-center">
                <Icons.IconSearch size={14} className="absolute left-2.5 text-text-mute pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category..."
                  className="w-full bg-[#1E293B] text-white text-xs font-medium pl-8 pr-7 py-1.5 rounded-md border border-white/10 focus:border-accent focus:outline-none placeholder:text-text-mute"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 text-text-mute hover:text-white text-xs focus:outline-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Options List */}
            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${
                  selectedCategory === 'All' ? 'bg-accent/20 text-accent font-bold' : 'text-slate-100 hover:bg-white/5'
                }`}
              >
                <span>🚀 All Categories</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCategory === 'All' ? 'bg-accent text-dark' : 'bg-white/10 text-slate-300'
                  }`}>
                    {matches.length}
                  </span>
                  {selectedCategory === 'All' && <Icons.IconCheck size={14} className="text-accent" />}
                </div>
              </button>

              <div className="mt-1">
                {filteredCategories.map(cat => {
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${
                        selectedCategory === cat ? 'bg-accent/20 text-accent font-bold' : 'text-slate-100 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate pr-1">{cat}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedCategory === cat ? 'bg-accent text-dark' : 'bg-white/10 text-slate-300'
                        }`}>
                          {count}
                        </span>
                        {selectedCategory === cat && <Icons.IconCheck size={14} className="shrink-0 text-accent" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="py-6 text-center text-text-mute text-xs">
                  No categories matching "{search}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [matches, setMatches] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [filter, setFilter] = useState('All');
  const [matchFilter, setMatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Best match');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [showPreferredOnly, setShowPreferredOnly] = useState(false);
  const prevPreferredRolesRef = useRef();

  useEffect(() => {
    const currentRoles = user?.preferred_roles || [];
    if (JSON.stringify(prevPreferredRolesRef.current) !== JSON.stringify(currentRoles)) {
      if (currentRoles.length > 0) {
        setShowPreferredOnly(true);
      } else {
        setShowPreferredOnly(false);
      }
      prevPreferredRolesRef.current = currentRoles;
    }
  }, [user?.preferred_roles]);

  const { applications: trackerApps } = useApplications();
  const { createApplication: createTrackerApp, deleteApplication: deleteTrackerApp } = useUpdateApplication();

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        navigate('/auth');
        return;
      }
      
      const fullProfile = await fetchFullProfile(session.user.id);
      setUser(fullProfile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    const isProfileComplete = user && (user.profile_completed || Number(user.completion_percentage) === 100);
    if (user && !isProfileComplete && user.role === 'student' && !hasAutoOpened) {
      setShowOnboarding(true);
      setHasAutoOpened(true);
    }
  }, [user, hasAutoOpened]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;

      setLoadingNotif(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('student_id', session.user.id)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const internshipIds = data.map(n => n.action_target).filter(id => {
          return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        });
        
        let internshipsMap = {};
        if (internshipIds.length > 0) {
          const { data: internshipsData, error: intErr } = await supabase
            .from('internships')
            .select('id, title, company_name, company_logo_url')
            .in('id', internshipIds);

          if (!intErr && internshipsData) {
            internshipsMap = internshipsData.reduce((acc, item) => {
              acc[item.id] = item;
              return acc;
            }, {});
          }
        }

        const enriched = data.map(n => {
          const internship = n.action_target ? internshipsMap[n.action_target] : null;
          return {
            ...n,
            internship,
            timeString: getNotificationRelativeTime(n.sent_at)
          };
        });

        setNotifications(enriched);
        setUnreadCount(enriched.filter(n => !n.is_read).length);
        
        if (enriched.length === 0) {
          await seedInitialNotifications(session.user.id);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  const seedInitialNotifications = async (userId) => {
    try {
      const { data } = await supabase.from('notifications').select('id').eq('student_id', userId).limit(1);
      if (data && data.length > 0) return;

      await supabase.from('notifications').insert({
        student_id: userId,
        type: 'system',
        title: 'Welcome to FitFlow! Start exploring internship matches.',
        priority: 'low',
        is_read: false
      });

      await supabase.from('notifications').insert({
        student_id: userId,
        type: 'system',
        title: 'Complete your Skill Profile to improve matching accuracy.',
        priority: 'low',
        action_type: 'open_skill_profile',
        is_read: false
      });

      const { data: freshData } = await supabase
        .from('notifications')
        .select('*')
        .eq('student_id', userId)
        .order('sent_at', { ascending: false });
      
      if (freshData) {
        const enriched = freshData.map(n => ({
          ...n,
          timeString: getNotificationRelativeTime(n.sent_at)
        }));
        setNotifications(enriched);
        setUnreadCount(enriched.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to seed initial notifications:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Immediately remove from UI state
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setUnreadCount(prev => Math.max(0, prev - (notif.is_read ? 0 : 1)));

    try {
      // Delete notification from database immediately on click
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notif.id);
      
      setShowNotifDropdown(false);

      if (notif.action_type === 'open_internship' && notif.action_target) {
        const { data: job, error } = await supabase
          .from('internships')
          .select(`
            id,
            title,
            company_name,
            location,
            apply_url,
            description,
            created_at,
            last_seen_at,
            company_logo_url,
            internship_skills ( skills ( name ) )
          `)
          .eq('id', notif.action_target)
          .single();
        
        if (!error && job) {
          setSelectedJob(job);
        }
      } else if (notif.action_type === 'open_applications') {
        setActiveTab('applications');
      } else if (notif.action_type === 'open_skill_profile') {
        setActiveTab('skills');
      }
    } catch (err) {
      console.error("Failed to delete notification on click:", err);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .delete()
        .eq('student_id', user.id);
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  useEffect(() => {
    let channel;
    
    const setupNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;

      await fetchNotifications();

      const channelName = `notifications-user-${session.user.id}`;
      const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      channel = supabase.channel(channelName);

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `student_id=eq.${session.user.id}`
        },
        async (payload) => {
          const newNotif = payload.new;
          let internship = null;

          if (newNotif.action_target && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newNotif.action_target)) {
            const { data } = await supabase
              .from('internships')
              .select('id, title, company_name, company_logo_url')
              .eq('id', newNotif.action_target)
              .single();
            if (data) internship = data;
          }

          const enrichedNotif = {
            ...newNotif,
            internship,
            timeString: 'Just now'
          };

          setNotifications(prev => [enrichedNotif, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);

          let toastIcon = '🔔';
          if (newNotif.type === 'match' || newNotif.type === 'match_score_improved') toastIcon = '🎯';
          else if (newNotif.type === 'internship') toastIcon = '💼';
          else if (newNotif.type === 'application') toastIcon = '📊';
          else if (newNotif.type === 'cv') toastIcon = '📄';

          toast(newNotif.title, {
            icon: toastIcon,
            duration: 5000,
            id: newNotif.id
          });
        }
      );

      channel.subscribe();
    };

    setupNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const fetchMatches = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setMatches([{ id: 'error-auth', match_score: 0, internships: { title: "Auth Error", company_name: "No valid session found. Please logout and login again." } }]);
        return;
      }
      
      // 1. Fetch matches
      const { data: matchesData, error: matchesErr } = await supabase
        .from('matching_results')
        .select(`
          id,
          match_score,
          internships ( id, title, company_name, location, apply_url, description, created_at, last_seen_at, company_logo_url, category, source, internship_skills ( skills ( name ) ) ),
          skill_gaps ( skills ( name ) )
        `)
        .eq('student_id', authUser.id)
        .order('match_score', { ascending: false })
        .limit(1000);

      if (matchesErr) {
        setMatches([{ id: 'error', match_score: 0, internships: { title: "Error", company_name: matchesErr.message } }]);
        return;
      }

      // 2. Fetch saved applications
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select('internship_id, status')
        .eq('student_id', authUser.id);

      if (appsErr) throw appsErr;

      if (matchesData) {
        // Merge applications into matches
        const enrichedMatches = matchesData.map(m => ({
          ...m,
          applications: appsData?.filter(a => a.internship_id === m.internships?.id) || []
        }));

        setMatches(enrichedMatches);
        
        if (enrichedMatches.length > 0) {
          const sum = enrichedMatches.reduce((acc, curr) => acc + Number(curr.match_score), 0);
          setAvgScore(Math.round(sum / enrichedMatches.length));
          
          const counts = {};
          enrichedMatches.forEach(m => {
            m.skill_gaps?.forEach(sg => {
              const name = sg.skills?.name;
              if (name) counts[name] = (counts[name] || 0) + 1;
            });
          });
          
          setSkillGaps(Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count })));
        }
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchMatches();
    } else if (user) {
      setLoadingMatches(false);
    }
  }, [user]);

  const toggleSave = async (internshipId, isSaved) => {
    setMatches(prev => prev.map(m =>
      m.internships?.id === internshipId
        ? { ...m, applications: isSaved ? [] : [{ status: 'interested' }] }
        : m
    ));

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const match = matches.find(m => m.internships?.id === internshipId);
      const internship = match?.internships;
      const company = internship?.company_name?.toLowerCase().trim();
      const title = internship?.title?.toLowerCase().trim();

      if (isSaved) {
        await supabase.from('applications')
          .delete()
          .eq('student_id', authUser.id)
          .eq('internship_id', internshipId);

        // Remove tracker entry only if still in 'saved' stage (preserve applied/interview/offer)
        const trackerEntry = trackerApps.find(a =>
          a.company_name?.toLowerCase().trim() === company &&
          a.role_title?.toLowerCase().trim() === title &&
          a.stage === 'saved'
        );
        if (trackerEntry) await deleteTrackerApp(trackerEntry.id);
      } else {
        await supabase.from('applications').upsert({
          student_id: authUser.id,
          internship_id: internshipId,
          status: 'interested',
        });

        // Mirror into tracker_applications if not already tracked
        const alreadyTracked = trackerApps.find(a =>
          a.company_name?.toLowerCase().trim() === company &&
          a.role_title?.toLowerCase().trim() === title
        );
        if (!alreadyTracked && internship) {
          const allSkills = internship.internship_skills?.map(s => s.skills?.name).filter(Boolean) || [];
          const missing = match?.skill_gaps?.map(g => g.skills?.name).filter(Boolean) || [];
          const matched = allSkills.filter(s => !missing.includes(s));
          await createTrackerApp({
            company_name:   internship.company_name || 'Unknown',
            role_title:     internship.title || 'Unknown',
            role_category:  detectCategory(internship.title),
            job_source:     detectSource(internship.apply_url),
            source_url:     internship.apply_url || null,
            match_score:    Math.round(match?.match_score || 0),
            matched_skills: matched,
            missing_skills: missing,
            stage:          'saved',
          });
        }
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      fetchMatches();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('fitflow_user');
    await supabase.auth.signOut();
    navigate('/');
  };

  const getApplicationStatus = useCallback((match) => {
    const company = match.internships?.company_name?.toLowerCase().trim();
    const title = match.internships?.title?.toLowerCase().trim();
    const found = trackerApps.find(a =>
      a.company_name?.toLowerCase().trim() === company &&
      a.role_title?.toLowerCase().trim() === title
    );
    return found?.stage || null;
  }, [trackerApps]);

  const availableLocations = useMemo(() => {
    const locs = new Set();
    matches.forEach(m => {
      const l = m.internships?.location;
      if (l) locs.add(l.trim());
    });
    return Array.from(locs).sort();
  }, [matches]);

  const processedMatches = useMemo(() => {
    let result = matches.filter(m => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = m.internships?.title?.toLowerCase() || '';
        const company = m.internships?.company_name?.toLowerCase() || '';
        const location = m.internships?.location?.toLowerCase() || '';
        const category = m.internships?.category?.toLowerCase() || '';
        const skills = m.internships?.internship_skills?.map(s => s.skills?.name?.toLowerCase()).join(' ') || '';

        const matchesSearch = title.includes(q) || company.includes(q) || location.includes(q) || category.includes(q) || skills.includes(q);
        if (!matchesSearch) return false;
      }

      // Location Filter
      if (selectedLocation !== 'All') {
        const loc = m.internships?.location?.toLowerCase() || '';
        const target = selectedLocation.toLowerCase();
        if (!loc.includes(target)) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategory !== 'All') {
        const jobCat = m.internships?.category;
        if (!jobCat || jobCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      
      // Preferred Roles Filter
      if (showPreferredOnly && user?.preferred_roles && user.preferred_roles.length > 0) {
        const title = m.internships?.title?.toLowerCase() || '';
        const category = m.internships?.category?.toLowerCase() || '';
        const matchesPref = user.preferred_roles.some(role => {
          const r = role.toLowerCase();
          return title.includes(r) || category === r;
        });
        if (!matchesPref) {
          return false;
        }
      }
      
      // Status Filter
      const s = getApplicationStatus(m);
      if (matchFilter === 'all') return true;
      if (matchFilter === 'not_applied') return !s || s === 'saved';
      if (matchFilter === 'applied') return s === 'applied';
      if (matchFilter === 'interviewing') return s === 'interview';
      if (matchFilter === 'offers') return s === 'offer';
      return true;
    });

    // Apply Sorting
    if (sortBy === 'Best match') {
      result = [...result].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    } else if (sortBy === 'Newest') {
      result = [...result].sort((a, b) => new Date(b.internships?.created_at || 0) - new Date(a.internships?.created_at || 0));
    } else if (sortBy === 'Stipend') {
      const extractStipend = (desc) => {
        if (!desc) return 0;
        const match = desc.match(/RM\s*([\d,]+)/i) || desc.match(/\$\s*([\d,]+)/i);
        return match ? (parseFloat(match[1].replace(/,/g, '')) || 0) : 0;
      };
      result = [...result].sort((a, b) => extractStipend(b.internships?.description) - extractStipend(a.internships?.description));
    }
    return result;
  }, [matches, searchQuery, selectedLocation, selectedCategory, matchFilter, sortBy, getApplicationStatus, showPreferredOnly, user?.preferred_roles]);

  const processedAvgScore = useMemo(() => {
    if (processedMatches.length === 0) return 0;
    const sum = processedMatches.reduce((acc, curr) => acc + Number(curr.match_score), 0);
    return Math.round(sum / processedMatches.length);
  }, [processedMatches]);

  const countByFilter = (f) => {
    return matches.filter(m => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = m.internships?.title?.toLowerCase() || '';
        const company = m.internships?.company_name?.toLowerCase() || '';
        const location = m.internships?.location?.toLowerCase() || '';
        const category = m.internships?.category?.toLowerCase() || '';
        const skills = m.internships?.internship_skills?.map(s => s.skills?.name?.toLowerCase()).join(' ') || '';

        const matchesSearch = title.includes(q) || company.includes(q) || location.includes(q) || category.includes(q) || skills.includes(q);
        if (!matchesSearch) return false;
      }

      // Location Filter
      if (selectedLocation !== 'All') {
        const loc = m.internships?.location?.toLowerCase() || '';
        const target = selectedLocation.toLowerCase();
        if (!loc.includes(target)) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategory !== 'All') {
        const jobCat = m.internships?.category;
        if (!jobCat || jobCat.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Preferred Roles Filter
      if (showPreferredOnly && user?.preferred_roles && user.preferred_roles.length > 0) {
        const title = m.internships?.title?.toLowerCase() || '';
        const category = m.internships?.category?.toLowerCase() || '';
        const matchesPref = user.preferred_roles.some(role => {
          const r = role.toLowerCase();
          return title.includes(r) || category === r;
        });
        if (!matchesPref) {
          return false;
        }
      }
      
      const s = getApplicationStatus(m);
      if (f === 'all') return true;
      if (f === 'not_applied') return !s || s === 'saved';
      if (f === 'applied') return s === 'applied';
      if (f === 'interviewing') return s === 'interview';
      if (f === 'offers') return s === 'offer';
      return true;
    }).length;
  };

  const savedRolesCount = trackerApps.length;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newSavedThisWeek = trackerApps.filter(app => new Date(app.created_at) >= oneWeekAgo).length;
  const savedDelta = newSavedThisWeek > 0 ? `▲ ${newSavedThisWeek} new` : null;
  const savedDeltaTone = newSavedThisWeek > 0 ? 'up' : 'neutral';

  if (!user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-[9999]" style={{ background: 'var(--bg)' }}>
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-accent-soft animate-pulse" style={{ borderTopColor: 'var(--accent)' }} />
          <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: 'var(--accent)', animationDuration: '0.8s' }} />
        </div>
        <h3 className="text-sm font-semibold tracking-wide animate-pulse" style={{ color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
          Loading your FitFlow workspace...
        </h3>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            fontSize: 13,
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#07090f' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#07090f' } },
        }}
      />
      <Sidebar active={activeTab} setActive={setActiveTab} user={user} onLogout={handleLogout} onBack={() => navigate('/')} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <main className="main">
        <Topbar 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
          notifications={notifications}
          unreadCount={unreadCount}
          showDropdown={showNotifDropdown}
          setShowDropdown={setShowNotifDropdown}
          onNotificationClick={handleNotificationClick}
          onClearAll={handleClearAll}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div className="main-scroll custom-scrollbar">
          
          <div className="page-head">
            <div>
              <h1 className="page-title">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'matches' && 'My Matches'}
                {activeTab === 'skills' && 'Skill Profile'}
                {activeTab === 'applications' && 'Applications'}
                {activeTab === 'cv' && 'CV Analyzing'}
                {activeTab === 'learning' && 'Learning Hub'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="page-sub">
                {activeTab === 'overview' && 'Track your internship matches and skill progression.'}
                {activeTab === 'matches' && 'All internships ranked by compatibility with your skill profile.'}
                {activeTab === 'applications' && 'Track every application you submit — on any platform.'}
              </p>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid-top">
                <WelcomeCard user={user} skillGaps={skillGaps} onContinueSetup={() => setShowOnboarding(true)} onRefresh={fetchMatches} refreshing={loadingMatches} />
                <KpiCard
                  icon={<Icons.IconStar size={14} />}
                  label="Avg match score"
                  value={loadingMatches ? '...' : `${avgScore}%`}
                  delta={null}
                  deltaTone="neutral"
                  sub={null}
                  sparkline="M0 22 L14 18 L28 20 L42 12 L56 14 L70 8 L84 10 L100 4"
                />
                <KpiCard
                  icon={<Icons.IconBriefcase size={14} />}
                  label="Saved roles"
                  value={savedRolesCount.toString()}
                  delta={savedDelta}
                  deltaTone={savedDeltaTone}
                  sub={savedDelta ? "this week" : null}
                  sparkline="M0 24 L14 22 L28 16 L42 18 L56 12 L70 10 L84 14 L100 6"
                />
              </div>

              <div className="grid-mid">
                {/* Matches List Widget */}
                <div className="card matches-card">
                  <div className="card-head">
                    <div>
                      <div className="card-kicker"><Icons.IconTarget size={12} /> Highest match potential</div>
                      <h3 className="card-title">Roles ranked for you</h3>
                    </div>
                    <div className="card-head-right">
                      <button className="link-btn" onClick={() => setActiveTab('matches')}>See all <Icons.IconArrowRight size={12} /></button>
                    </div>
                  </div>
                  <div className="matches-list">
                    {loadingMatches ? (
                      <p className="text-sm text-text-mute">Analyzing internship compatibility...</p>
                    ) : matches.length === 0 ? (
                      <p className="text-sm text-text-mute">No matches found. Check your skills profile!</p>
                    ) : (
                      matches.slice(0, 5).map((job, idx) => (
                        <MatchRow key={idx} job={job} onSelect={setSelectedJob} animDelay={idx * 0.06} />
                      ))
                    )}
                  </div>
                </div>

                {/* Skill Gap Widget */}
                <div className="card skill-gap">
                  <div className="card-head">
                    <div>
                      <div className="card-kicker"><Icons.IconBolt size={12} /> Gap to top tier</div>
                      <h3 className="card-title">Master these to unlock more roles</h3>
                    </div>
                  </div>
                  <div className="gap-list">
                    {loadingMatches ? (
                      <p className="text-sm text-text-mute">Generating skill matrix...</p>
                    ) : skillGaps.length === 0 ? (
                      <p className="text-sm text-text-mute">Amazing! Your skills perfectly cover the required internships!</p>
                    ) : (
                      skillGaps.slice(0, 4).map((gap, idx) => (
                        <div key={idx} className={`gap-row ${idx === 0 ? "gap-urgent" : ""}`}>
                          <div className="gap-row-head">
                            <span className="gap-name">{gap.name}</span>
                            {idx === 0 && <span className="badge badge-urgent">High priority</span>}
                            <span className="gap-pct">{gap.count}<i> matched roles</i></span>
                          </div>
                          <div className="gap-bar">
                            <div className="gap-bar-target" style={{ width: '100%' }} />
                            <div className={`gap-bar-fill ${idx === 0 ? "gap-bar-urgent" : ""}`} style={{ width: `${(gap.count / (matches.length || 1)) * 100}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="grid-bot">
                {/* Activity Card */}
                <div className="card activity">
                  <div className="card-head">
                    <div>
                      <div className="card-kicker"><Icons.IconClock size={12} /> Recent</div>
                      <h3 className="card-title">Application activity</h3>
                    </div>
                  </div>
                  <ul className="activity-list">
                    {[
                      { t: "Interview scheduled", who: "Experian · Wed 11:00", tone: "ok", icon: <Icons.IconCheck size={12} /> },
                      { t: "CV viewed", who: "foodpanda · 2h ago", tone: "info", icon: <Icons.IconUsers size={12} /> },
                      { t: "Awaiting reply", who: "SEEK · 4d", tone: "wait", icon: <Icons.IconClock size={12} /> },
                    ].map((a, i) => (
                      <li key={i} className={`act-item act-${a.tone}`}>
                        <span className="act-icon">{a.icon}</span>
                        <span className="act-text">{a.t}</span>
                        <span className="act-who">{a.who}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Learning Hub Widget */}
                <div className="card learn-card">
                  <div className="card-head">
                    <div>
                      <div className="card-kicker"><Icons.IconBook size={12} /> Recommended</div>
                      <h3 className="card-title">Close your top gap</h3>
                    </div>
                  </div>
                  <div className="learn-row">
                    <div className="learn-thumb"><Icons.IconChip size={20} /></div>
                    <div className="learn-meta">
                      <div className="learn-title">{skillGaps.length > 0 ? `Master ${skillGaps[0].name}` : "Level up your tech stack"}</div>
                      <div className="learn-tags">
                        <span className="skill-chip"><Icons.IconClock size={10} style={{marginRight: 4}} /> 2h 30m</span>
                        <span className="skill-chip skill-pos">Unlocks {skillGaps.length > 0 ? skillGaps[0].count : 10} roles</span>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('learning')}>Start <Icons.IconArrowRight size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="matches-view">
              <div className="m-stats">
                <div className="m-stat">
                  <div className="m-stat-num">{processedMatches.length}</div>
                  <div className="m-stat-lbl">Total Matches</div>
                </div>
                <div className="m-stat-sep" />
                <div className="m-stat">
                  <div className="m-stat-num">{processedAvgScore}<i>%</i></div>
                  <div className="m-stat-lbl">Avg Score</div>
                </div>
                <div className="m-stat-sep" />
                <div className="m-stat">
                  <div className="m-stat-num">{processedMatches.filter(m => m.match_score >= 85).length}</div>
                  <div className="m-stat-lbl">High Potential</div>
                </div>
                <div className="m-stat-sep" />
                <div className="m-stat">
                  <div className="m-stat-num">{processedMatches.filter(m => m.applications && m.applications.length > 0).length}</div>
                  <div className="m-stat-lbl">Saved</div>
                </div>
              </div>

              <div className="m-toolbar">
                <div className="m-filters items-center flex-wrap">
                  {user?.preferred_roles && user.preferred_roles.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowPreferredOnly(true)}
                        className={`m-filter ${showPreferredOnly ? 'm-filter-on' : ''}`}
                      >
                        🎯 Preferred Roles
                      </button>
                      <button
                        onClick={() => setShowPreferredOnly(false)}
                        className={`m-filter ${!showPreferredOnly ? 'm-filter-on' : ''}`}
                      >
                        All Matches
                      </button>
                      <div className="w-[1px] h-5 bg-white/10 mx-2 self-center" />
                    </>
                  )}

                  {[
                    { id: 'all',         label: user?.preferred_roles && user.preferred_roles.length > 0 ? 'All' : 'All Matches' },
                    { id: 'not_applied', label: 'Not Applied' },
                    { id: 'applied',     label: 'Applied' },
                    { id: 'interviewing',label: 'Interviewing' },
                    { id: 'offers',      label: 'Offers' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setMatchFilter(id)}
                      className={`m-filter ${matchFilter === id ? 'm-filter-on' : ''}`}
                    >
                      {label}
                      <span className="m-filter-count">{countByFilter(id)}</span>
                    </button>
                  ))}
                </div>
                
                <div className="m-sort flex items-center gap-4 flex-wrap">
                  <LocationFilterPopover 
                    selectedLocation={selectedLocation} 
                    setSelectedLocation={setSelectedLocation} 
                    availableLocations={availableLocations} 
                    matches={matches}
                  />

                  <CategoryFilterPopover 
                    selectedCategory={selectedCategory} 
                    setSelectedCategory={setSelectedCategory} 
                    matches={matches}
                  />

                  <div className="flex items-center gap-2">
                    <span className="m-sort-lbl">Sort by</span>
                    <div className="sort-btns">
                      {['Best match', 'Stipend', 'Newest'].map(s => (
                        <button key={s} onClick={() => setSortBy(s)} className={`sort-btn ${sortBy === s ? 'active' : ''}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {loadingMatches ? (
                <div className="m-list">
                  {[1, 2, 3].map(i => <div key={i} className="m-card animate-pulse" style={{ height: '120px' }} />)}
                </div>
              ) : matches.length === 0 ? (
                <div className="card text-center py-24">
                  <Icons.IconTarget size={48} className="mx-auto mb-4 text-text-dim" />
                  <h3 className="text-xl font-bold">No matches yet</h3>
                  <p className="text-text-mute">Complete your profile to generate matches.</p>
                </div>
              ) : processedMatches.length === 0 ? (
                <div className="card text-center py-24">
                  <Icons.IconTarget size={48} className="mx-auto mb-4 text-text-dim" />
                  <h3 className="text-xl font-bold">No results found</h3>
                  <p className="text-text-mute">Try adjusting your filters or category selection.</p>
                </div>
              ) : (
                <div className="m-list">
                  {processedMatches.map((job, idx) => (
                    <MatchCard
                      key={idx}
                      job={job}
                      onSelect={setSelectedJob}
                      onToggleSave={toggleSave}
                      animDelay={idx * 0.045}
                      trackerStatus={getApplicationStatus(job)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <ApplicationsTab />
          )}

          {activeTab === 'cv' && (
            <CVAnalyzerPage user={user} onUserUpdate={fetchUserProfile} />
          )}

          {activeTab === 'skills' && (
            <SkillProfileTab 
              user={user} 
              onUserUpdate={fetchUserProfile} 
              onMatchesUpdate={fetchMatches}
              skillGaps={skillGaps} 
            />
          )}

          {activeTab === 'learning' && (
            <LearningHubTab skillGaps={skillGaps} />
          )}

          {activeTab === 'interview' && (
            <InterviewTab user={user} onNavigate={setActiveTab} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab user={user} onUserUpdate={fetchUserProfile} />
          )}

        </div>
      </main>

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            user={user}
            onClose={() => setShowOnboarding(false)}
            onNavigate={(tab) => setActiveTab(tab)}
            onComplete={async (updatedUser, shouldClose = true) => {
              await fetchUserProfile();
              if (shouldClose) setShowOnboarding(false);
            }}
          />
        )}

        {selectedJob && (
          <InternshipDetailsModal
            job={selectedJob}
            user={user}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
