import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';
import { supabase } from '../lib/supabase';
import { checkAndNotifyMatchChanges } from '../lib/notificationService';

/* ─── Tech colour map ─────────────────────────────────────────────── */
const TECH_COLORS = {
  react:      { dot: '#61DAFB', bg: 'rgba(97,218,251,0.10)',  border: 'rgba(97,218,251,0.28)'  },
  nextjs:     { dot: '#ffffff', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.18)' },
  'next.js':  { dot: '#ffffff', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.18)' },
  vue:        { dot: '#42b883', bg: 'rgba(66,184,131,0.10)',  border: 'rgba(66,184,131,0.28)'  },
  angular:    { dot: '#dd0031', bg: 'rgba(221,0,49,0.10)',    border: 'rgba(221,0,49,0.25)'    },
  svelte:     { dot: '#ff3e00', bg: 'rgba(255,62,0,0.10)',    border: 'rgba(255,62,0,0.25)'    },
  typescript: { dot: '#3178c6', bg: 'rgba(49,120,198,0.12)',  border: 'rgba(49,120,198,0.32)'  },
  javascript: { dot: '#f7df1e', bg: 'rgba(247,223,30,0.10)',  border: 'rgba(247,223,30,0.25)'  },
  tailwind:   { dot: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.25)'  },
  css:        { dot: '#264de4', bg: 'rgba(38,77,228,0.10)',   border: 'rgba(38,77,228,0.25)'   },
  html:       { dot: '#e34c26', bg: 'rgba(227,76,38,0.10)',   border: 'rgba(227,76,38,0.25)'   },
  python:     { dot: '#ffd43b', bg: 'rgba(255,212,59,0.10)',  border: 'rgba(255,212,59,0.25)'  },
  nodejs:     { dot: '#68a063', bg: 'rgba(104,160,99,0.10)',  border: 'rgba(104,160,99,0.25)'  },
  'node.js':  { dot: '#68a063', bg: 'rgba(104,160,99,0.10)',  border: 'rgba(104,160,99,0.25)'  },
  java:       { dot: '#f89820', bg: 'rgba(248,152,32,0.10)',  border: 'rgba(248,152,32,0.25)'  },
  go:         { dot: '#00aed9', bg: 'rgba(0,174,217,0.10)',   border: 'rgba(0,174,217,0.25)'   },
  rust:       { dot: '#f74c00', bg: 'rgba(247,76,0,0.10)',    border: 'rgba(247,76,0,0.25)'    },
  php:        { dot: '#8892be', bg: 'rgba(136,146,190,0.10)', border: 'rgba(136,146,190,0.25)' },
  django:     { dot: '#6ead3a', bg: 'rgba(110,173,58,0.10)',  border: 'rgba(110,173,58,0.25)'  },
  fastapi:    { dot: '#009688', bg: 'rgba(0,150,136,0.10)',   border: 'rgba(0,150,136,0.25)'   },
  sql:        { dot: '#e38c00', bg: 'rgba(227,140,0,0.10)',   border: 'rgba(227,140,0,0.25)'   },
  postgresql: { dot: '#336791', bg: 'rgba(51,103,145,0.12)',  border: 'rgba(51,103,145,0.30)'  },
  mysql:      { dot: '#00618a', bg: 'rgba(0,97,138,0.10)',    border: 'rgba(0,97,138,0.25)'    },
  mongodb:    { dot: '#47a248', bg: 'rgba(71,162,72,0.10)',   border: 'rgba(71,162,72,0.25)'   },
  redis:      { dot: '#d82c20', bg: 'rgba(216,44,32,0.10)',   border: 'rgba(216,44,32,0.25)'   },
  tensorflow: { dot: '#ff6f00', bg: 'rgba(255,111,0,0.10)',   border: 'rgba(255,111,0,0.25)'   },
  pytorch:    { dot: '#ee4c2c', bg: 'rgba(238,76,44,0.10)',   border: 'rgba(238,76,44,0.25)'   },
  aws:        { dot: '#ff9900', bg: 'rgba(255,153,0,0.10)',   border: 'rgba(255,153,0,0.25)'   },
  docker:     { dot: '#2496ed', bg: 'rgba(36,150,237,0.10)',  border: 'rgba(36,150,237,0.25)'  },
  kubernetes: { dot: '#326ce5', bg: 'rgba(50,108,229,0.10)',  border: 'rgba(50,108,229,0.25)'  },
  git:        { dot: '#f05032', bg: 'rgba(240,80,50,0.10)',   border: 'rgba(240,80,50,0.25)'   },
  linux:      { dot: '#fcc624', bg: 'rgba(252,198,36,0.10)',  border: 'rgba(252,198,36,0.25)'  },
  azure:      { dot: '#0078d4', bg: 'rgba(0,120,212,0.10)',   border: 'rgba(0,120,212,0.25)'   },
  gcp:        { dot: '#4285f4', bg: 'rgba(66,133,244,0.10)',  border: 'rgba(66,133,244,0.25)'  },
  figma:      { dot: '#f24e1e', bg: 'rgba(242,78,30,0.10)',   border: 'rgba(242,78,30,0.25)'   },
  flutter:    { dot: '#54c5f8', bg: 'rgba(84,197,248,0.10)',  border: 'rgba(84,197,248,0.25)'  },
  kotlin:     { dot: '#7f52ff', bg: 'rgba(127,82,255,0.10)',  border: 'rgba(127,82,255,0.25)'  },
  swift:      { dot: '#fa7343', bg: 'rgba(250,115,67,0.10)',  border: 'rgba(250,115,67,0.25)'  },
};
const DEFAULT_TC = { dot: 'var(--accent)', bg: 'var(--accent-soft)', border: 'rgba(79,124,255,0.28)' };

function getTechColor(skill) {
  const k = skill.toLowerCase().replace(/[\s\-.]/g, '');
  if (TECH_COLORS[k]) return TECH_COLORS[k];
  for (const [key, val] of Object.entries(TECH_COLORS)) {
    const nk = key.replace(/[\s\-.]/g, '');
    if (k.includes(nk) || nk.includes(k)) return val;
  }
  return DEFAULT_TC;
}

/* ─── Category detection ──────────────────────────────────────────── */
const CATS = {
  Frontend:  ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'javascript', 'typescript', 'next', 'nuxt', 'tailwind', 'redux', 'sass', 'vite', 'webpack'],
  Backend:   ['python', 'node', 'java', 'go', 'rust', 'php', 'django', 'fastapi', 'express', 'spring', 'laravel', 'flask', 'rails', 'graphql', 'api'],
  Data:      ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'sklearn', 'machine', 'learning', 'nlp', 'tableau', 'powerbi', 'looker'],
  DevOps:    ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'linux', 'nginx', 'git', 'terraform', 'jenkins', 'cicd', 'ci/cd'],
};
const CAT_COLORS = { Frontend: '#61DAFB', Backend: '#ffd43b', Data: '#a855f7', DevOps: '#ff9900' };

function getCategories(skills) {
  const c = { Frontend: 0, Backend: 0, Data: 0, DevOps: 0 };
  skills.forEach(s => {
    const sl = s.toLowerCase();
    Object.entries(CATS).forEach(([cat, keys]) => {
      if (keys.some(k => sl.includes(k))) c[cat]++;
    });
  });
  return c;
}

/* ─── Loading skeleton ────────────────────────────────────────────── */
const Sk = ({ w = 'w-full', h = 'h-4', r = 'rounded-lg' }) => (
  <div className={`${w} ${h} ${r} animate-pulse`} style={{ background: 'var(--surface-3)' }} />
);

const LoadingSkeleton = () => (
  <div className="space-y-5">
    <Sk h="h-44" r="rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <Sk h="h-[76px]" r="rounded-2xl" />
        <div className="card space-y-4">
          <div className="flex justify-between"><Sk w="w-28" h="h-4" /><Sk w="w-16" h="h-5" r="rounded-full" /></div>
          <div className="flex flex-wrap gap-2">
            {[80, 64, 96, 72, 56, 88, 64, 76].map((w, i) => (
              <div key={i} className="h-8 rounded-full animate-pulse" style={{ width: w, background: 'var(--surface-3)' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <Sk key={i} h="h-[88px]" r="rounded-xl" />)}
      </div>
    </div>
  </div>
);

/* ─── Skill chip ──────────────────────────────────────────────────── */
const SkillChip = ({ skill, onRemove }) => {
  const c = getTechColor(skill);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.72, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.65, x: -12, transition: { duration: 0.13 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      whileHover={{ y: -2, boxShadow: `0 6px 20px -6px ${c.dot}60` }}
      className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold select-none cursor-default"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: c.dot, boxShadow: `0 0 6px 1px ${c.dot}80` }}
      />
      <span style={{ color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.01em' }}>{skill}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(skill); }}
        className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/15"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        title={`Remove ${skill}`}
      >
        <Icons.IconX size={9} />
      </button>
    </motion.div>
  );
};

/* ─── Gap skill card ──────────────────────────────────────────────── */
const GapCard = ({ gap, rank, maxCount, onQuickAdd }) => {
  const isTop = rank < 3;
  const bar = Math.max(8, Math.round((gap.count / maxCount) * 100));
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={() => onQuickAdd(gap.name)}
      className="relative p-4 rounded-xl cursor-pointer"
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${isTop ? 'rgba(79,124,255,0.28)' : 'var(--border)'}`,
        boxShadow: isTop ? '0 0 0 1px rgba(79,124,255,0.08) inset' : 'none',
      }}
    >
      {/* High-impact badge */}
      {isTop && (
        <div
          className="absolute top-3 right-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(79,124,255,0.14)', color: 'var(--accent)' }}
        >
          High Impact
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--text)' }}>
            {gap.name}
          </div>
          <div className="text-[10px] uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-dim)' }}>
            {gap.count} role{gap.count !== 1 ? 's' : ''} need this
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isTop
                  ? 'linear-gradient(90deg, var(--accent), var(--accent-2))'
                  : 'var(--text-dim)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${bar}%` }}
              transition={{ delay: 0.25 + rank * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.18, rotate: 90 }}
          whileTap={{ scale: 0.88 }}
          className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Icons.IconPlus size={14} />
        </motion.div>
      </div>
    </motion.div>
  );
};

/* ─── Passport stats pill ─────────────────────────────────────────── */
const StatPill = ({ label, value, color }) => (
  <div
    className="flex flex-col items-center px-4 py-3 rounded-xl min-w-[72px]"
    style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
  >
    <span
      className="text-xl font-bold leading-none tracking-tight"
      style={{ fontFamily: "'Space Grotesk', sans-serif", color: color || 'var(--text)' }}
    >
      {value}
    </span>
    <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>
      {label}
    </span>
  </div>
);

/* ─── Spinner ─────────────────────────────────────────────────────── */
const Spinner = () => (
  <motion.span
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.65, ease: 'linear' }}
    className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
    style={{ border: '2px solid var(--accent-text)', borderTopColor: 'transparent' }}
  />
);

/* ─── Main component ──────────────────────────────────────────────── */
const SkillProfileTab = ({ user, onUserUpdate, onMatchesUpdate, skillGaps = [] }) => {
  const [skillInput, setSkillInput]   = useState('');
  const [isAdding, setIsAdding]       = useState(false);
  const [currentSkills, setCurrentSkills] = useState(user?.skills || []);
  const [userId, setUserId]           = useState(user?.id || null);
  const [loading, setLoading]         = useState(!user);
  const [focused, setFocused]         = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      if (user.skills) {
        setCurrentSkills(user.skills);
      }
      setLoading(false);
    }
  }, [user]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillInput.trim() || isAdding || !userId) return;
    const newSkill = skillInput.trim();
    setIsAdding(true);
    try {
      const { data: skillId, error: rpcErr } = await supabase.rpc('get_or_create_skill', { p_name: newSkill });
      if (rpcErr) throw rpcErr;
      const { data: realSkill } = await supabase.from('skills').select('name').eq('id', skillId).single();
      const canonical = realSkill.name;
      if (!currentSkills.includes(canonical)) {
        // Fetch old matches BEFORE inserting skill and regenerating
        const { data: oldMatches } = await supabase
          .from('matching_results')
          .select('internship_id, match_score')
          .eq('student_id', userId);

        await supabase.from('user_skills').insert({ user_id: userId, skill_id: skillId });
        const updated = [...currentSkills, canonical];
        setCurrentSkills(updated);

        await supabase.rpc('generate_internship_matches', { p_student_id: userId });
        await checkAndNotifyMatchChanges(userId, oldMatches);

        if (onUserUpdate) await onUserUpdate();
        if (onMatchesUpdate) await onMatchesUpdate();
      }
      setSkillInput('');
    } catch (err) {
      console.error('Error adding skill:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const removeSkill = async (skillToRemove) => {
    if (!userId) return;
    try {
      const { data: sd } = await supabase.from('skills').select('id').eq('name', skillToRemove).single();
      if (sd) {
        // Fetch old matches BEFORE deleting skill and regenerating
        const { data: oldMatches } = await supabase
          .from('matching_results')
          .select('internship_id, match_score')
          .eq('student_id', userId);

        await supabase.from('user_skills').delete().eq('user_id', userId).eq('skill_id', sd.id);
        const updated = currentSkills.filter(s => s !== skillToRemove);
        setCurrentSkills(updated);

        await supabase.rpc('generate_internship_matches', { p_student_id: userId });
        await checkAndNotifyMatchChanges(userId, oldMatches);

        if (onUserUpdate) await onUserUpdate();
        if (onMatchesUpdate) await onMatchesUpdate();
      }
    } catch (err) {
      console.error('Error removing skill:', err);
    }
  };

  const handleQuickAdd = (name) => {
    setSkillInput(name);
    inputRef.current?.focus();
  };

  if (loading) return <LoadingSkeleton />;

  /* ── Computed values ─────────────────────────────── */
  const profileStrength = Math.min(100, Math.round((currentSkills.length / 15) * 100));
  const strengthLabel   = profileStrength >= 90 ? 'Expert' : profileStrength >= 60 ? 'Proficient' : profileStrength >= 30 ? 'Developing' : 'Getting Started';
  const strengthColor   = profileStrength >= 90 ? 'var(--pos)' : profileStrength >= 60 ? 'var(--accent)' : profileStrength >= 30 ? 'var(--warn)' : 'var(--text-dim)';

  const sortedGaps = [...skillGaps].sort((a, b) => b.count - a.count);
  const maxCount   = sortedGaps[0]?.count || 1;

  const categories    = getCategories(currentSkills);
  const topCat        = Object.entries(categories).sort((a, b) => b[1] - a[1]).find(([, v]) => v > 0);
  const catEntries    = Object.entries(categories).filter(([, v]) => v > 0);

  /* ────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ══ Engineering Passport ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 0 0 1px var(--border), 0 20px 48px -16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full"
               style={{ background: 'var(--accent)', filter: 'blur(72px)', opacity: 0.08 }} />
          <div className="absolute -left-16 bottom-0 w-56 h-56 rounded-full"
               style={{ background: 'var(--hero-glow-b)', filter: 'blur(60px)', opacity: 0.12 }} />
          <div className="absolute inset-0 opacity-[0.18]"
               style={{
                 backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent)',
               }} />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  boxShadow: '0 8px 24px -8px var(--accent)',
                }}
              >
                <Icons.IconChip size={24} color="var(--accent-text)" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    Engineering Passport
                  </span>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: 'var(--pos-soft)', color: 'var(--pos)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--pos)', animation: 'pulse 2s infinite' }} />
                    Live
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.022em' }}>
                  Your Tech Identity
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>
                  AI-indexed · Matched against live internship listings
                </p>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatPill label="Total Skills" value={currentSkills.length} color="var(--accent)" />
              <StatPill label="Strength"     value={strengthLabel}        color={strengthColor}  />
              <StatPill label="Gaps Found"   value={skillGaps.length}                            />
            </div>

            {/* Progress */}
            <div className="min-w-[176px] max-w-[220px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-mute)' }}>Profile completeness</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: strengthColor }}>{profileStrength}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${profileStrength}%` }}
                  transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-dim)' }}>
                Target: 15+ skills for best matches
              </p>
            </div>
          </div>

          {/* Category row */}
          {catEntries.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Skill distribution
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {catEntries.map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[cat] || 'var(--accent)' }} />
                    <span style={{ color: 'var(--text)' }} className="font-bold">{count}</span>
                    <span style={{ color: 'var(--text-mute)' }}>{cat}</span>
                  </div>
                ))}
                {topCat && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'var(--accent-soft)', border: '1px solid rgba(79,124,255,0.22)', color: 'var(--accent)' }}
                  >
                    <Icons.IconBolt size={11} />
                    Primary: {topCat[0]}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══ Two-column grid ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: input + chip cloud ───────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Input card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="card"
          >
            <div className="card-head mb-5">
              <div>
                <div className="card-kicker mb-1"><Icons.IconBolt size={11} /> Tech Stack</div>
                <h3 className="card-title">Add your core competencies</h3>
              </div>
              <div
                className="text-[11px] px-2.5 py-1 rounded-lg font-medium hidden sm:block"
                style={{ background: 'var(--surface-2)', color: 'var(--text-mute)', border: '1px solid var(--border)' }}
              >
                ↵ enter to add
              </div>
            </div>

            <form onSubmit={handleAddSkill}>
              <div className="relative">
                {/* Focus glow ring */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: focused ? 1 : 0,
                    boxShadow: '0 0 0 3px var(--accent-soft), 0 0 18px -4px var(--accent)',
                    borderRadius: 12,
                  }}
                />
                <div
                  className="relative flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'var(--surface-2)',
                    border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Icons.IconSearch
                    size={15}
                    style={{ color: focused ? 'var(--accent)' : 'var(--text-dim)', transition: 'color 0.2s', flexShrink: 0 }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Python, React, AWS, Docker, SQL..."
                    className="flex-1 bg-transparent outline-none text-sm sp-input"
                    style={{ color: 'var(--text)', caretColor: 'var(--accent)' }}
                  />
                  <AnimatePresence>
                    {skillInput && (
                      <motion.button
                        type="button"
                        onClick={() => setSkillInput('')}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface-3)', color: 'var(--text-dim)' }}
                      >
                        <Icons.IconX size={10} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="submit"
                    disabled={isAdding || !skillInput.trim()}
                    whileHover={{ scale: skillInput.trim() ? 1.04 : 1 }}
                    whileTap={{ scale: skillInput.trim() ? 0.95 : 1 }}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold shrink-0 flex items-center gap-1.5"
                    style={{
                      background: skillInput.trim() ? 'var(--accent)' : 'var(--surface-3)',
                      color: skillInput.trim() ? 'var(--accent-text)' : 'var(--text-dim)',
                      transition: 'background 0.2s, color 0.2s',
                      cursor: !skillInput.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAdding ? <><Spinner /> Adding</> : 'Add Skill'}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Skill chip cloud */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="card flex-1"
          >
            <div className="card-head mb-5">
              <div>
                <div className="card-kicker mb-1"><Icons.IconCheck size={11} /> Verified Skills</div>
                <h3 className="card-title">Your tech stack</h3>
              </div>
              <motion.div
                layout
                className="text-xs px-2.5 py-1 rounded-full font-semibold tabular-nums"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,0.2)' }}
              >
                {currentSkills.length} indexed
              </motion.div>
            </div>

            {currentSkills.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-14 rounded-xl border-2 border-dashed"
                style={{ borderColor: 'var(--border)' }}
              >
                <Icons.IconBolt size={30} style={{ color: 'var(--text-dim)', opacity: 0.2, marginBottom: 10 }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-mute)' }}>No skills added yet</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>Type a skill above and press ↵</p>
              </motion.div>
            ) : (
              <motion.div layout className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {currentSkills.map(skill => (
                    <SkillChip key={skill} skill={skill} onRemove={removeSkill} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ── Right: AI Market Radar ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card"
          style={{ height: 'fit-content' }}
        >
          {/* Header */}
          <div className="card-head mb-1">
            <div>
              <div className="card-kicker mb-1"><Icons.IconTarget size={11} /> AI Market Radar</div>
              <h3 className="card-title">Skill gaps detected</h3>
            </div>
            <div
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: 'rgba(79,124,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,0.2)' }}
            >
              AI
            </div>
          </div>
          <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-mute)' }}>
            Skills frequently demanded by roles you almost match. Click any to fill the gap.
          </p>

          {sortedGaps.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-10 rounded-xl border-2 border-dashed"
              style={{ borderColor: 'var(--border)' }}
            >
              <Icons.IconCheck size={28} style={{ color: 'var(--pos)', opacity: 0.3, marginBottom: 8 }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-mute)' }}>Perfect coverage</p>
              <p className="text-xs mt-1 text-center px-4" style={{ color: 'var(--text-dim)' }}>
                No gaps detected. Keep your stack updated.
              </p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-2.5">
                {sortedGaps.map((gap, i) => (
                  <GapCard
                    key={gap.name}
                    gap={gap}
                    rank={i}
                    maxCount={maxCount}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>

              {/* Footer estimate */}
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(79,124,255,0.18)' }}
                >
                  <Icons.IconSparkle size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-mute)' }}>
                    Adding the top{' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      {Math.min(3, sortedGaps.length)}
                    </span>{' '}
                    skills could unlock{' '}
                    <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                      ~{sortedGaps.slice(0, 3).reduce((a, g) => a + g.count, 0)}
                    </span>{' '}
                    more matched roles.
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SkillProfileTab;
