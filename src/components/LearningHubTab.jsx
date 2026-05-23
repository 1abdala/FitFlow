import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from './Icons';

/* ─── Resource database ────────────────────────────────────────────── */
const RESOURCE_DATABASE = {
  "Docker":     { title: "Docker Fundamentals",               type: "Containerization", duration: "10m – 5h",  provider: "Multiple Platforms", category: "DevOps"    },
  "React":      { title: "React Ecosystem Mastery",           type: "Frontend",         duration: "2h – 20h",  provider: "Multiple Platforms", category: "Frontend"  },
  "Python":     { title: "Python Programming",                type: "Backend",          duration: "4h – 30h",  provider: "Multiple Platforms", category: "Backend"   },
  "AWS":        { title: "AWS Cloud Architect",               type: "Cloud",            duration: "14h – 40h", provider: "Multiple Platforms", category: "DevOps"    },
  "SQL":        { title: "Relational Databases & SQL",        type: "Database",         duration: "4h – 15h",  provider: "Multiple Platforms", category: "Database"  },
  "Git":        { title: "Version Control with Git",          type: "DevOps",           duration: "1h – 4h",   provider: "Multiple Platforms", category: "DevOps"    },
  "JavaScript": { title: "Advanced JavaScript",               type: "Frontend",         duration: "12h – 30h", provider: "Multiple Platforms", category: "Frontend"  },
  "Java":       { title: "Java Enterprise Development",       type: "Backend",          duration: "8h – 40h",  provider: "Multiple Platforms", category: "Backend"   },
  "CI/CD":      { title: "Continuous Integration & Delivery", type: "DevOps",           duration: "2h – 10h",  provider: "Multiple Platforms", category: "DevOps"    },
  "TypeScript": { title: "TypeScript Crash Course",           type: "Frontend",         duration: "1h – 8h",   provider: "Multiple Platforms", category: "Frontend"  },
  "Node.js":    { title: "Backend with Node.js",              type: "Backend",          duration: "3h – 15h",  provider: "Multiple Platforms", category: "Backend"   },
  "default":    { title: "Mastering Tech Skills",             type: "Engineering",      duration: "Varies",    provider: "Multiple Platforms", category: "Backend"   },
};

/* ─── Category definitions ─────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'All',           Icon: Icons.IconGrid,     color: 'var(--accent)',  glow: 'rgba(79,124,255,0.35)'   },
  { id: 'Frontend', label: 'Frontend',      Icon: Icons.IconWave,     color: '#61DAFB',        glow: 'rgba(97,218,251,0.35)'   },
  { id: 'Backend',  label: 'Backend',       Icon: Icons.IconChip,     color: '#ffd43b',        glow: 'rgba(255,212,59,0.35)'   },
  { id: 'Database', label: 'Database',      Icon: Icons.IconDoc,      color: '#e38c00',        glow: 'rgba(227,140,0,0.35)'    },
  { id: 'DevOps',   label: 'DevOps / Cloud',Icon: Icons.IconShield,   color: '#ff9900',        glow: 'rgba(255,153,0,0.35)'    },
  { id: 'AI/ML',    label: 'AI / ML',       Icon: Icons.IconBolt,     color: '#a855f7',        glow: 'rgba(168,85,247,0.35)'   },
];

/* ─── Category inference for unknown skills ────────────────────────── */
const CATEGORY_KEYWORDS = {
  Frontend: ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'javascript', 'typescript', 'next', 'nuxt', 'tailwind', 'redux', 'sass', 'vite', 'webpack', 'frontend', 'ui', 'ux'],
  Backend:  ['python', 'node', 'java', 'go', 'rust', 'php', 'django', 'fastapi', 'express', 'spring', 'laravel', 'flask', 'rails', 'graphql', 'api', 'backend', 'server'],
  Database: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'database', 'firebase', 'supabase', 'prisma', 'dynamodb', 'elasticsearch'],
  DevOps:   ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'linux', 'nginx', 'git', 'terraform', 'jenkins', 'cicd', 'ci/cd', 'cloud', 'k8s', 'ansible', 'bash'],
  'AI/ML':  ['tensorflow', 'pytorch', 'sklearn', 'pandas', 'numpy', 'machine', 'learning', 'ml', 'ai', 'deep', 'nlp', 'llm', 'data', 'tableau', 'powerbi', 'looker', 'openai'],
};

function inferCategory(skill) {
  const sl = skill.toLowerCase().replace(/[\s\-.]/g, '');
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some(k => sl.includes(k.replace(/[\s\-.]/g, '')))) return cat;
  }
  return 'Backend';
}

/* ─── Stat pill ────────────────────────────────────────────────────── */
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

/* ─── Category filter chip ─────────────────────────────────────────── */
const FilterChip = ({ cat, count, active, onClick }) => (
  <motion.button
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className="m-filter"
    style={active ? {
      background: `${cat.color}18`,
      borderColor: `${cat.color}60`,
      color: cat.color,
      boxShadow: `0 0 16px -6px ${cat.glow}`,
    } : {}}
  >
    <cat.Icon size={12} />
    {cat.label}
    <span
      className="m-filter-count"
      style={active ? { background: cat.color, color: '#fff' } : {}}
    >
      {count}
    </span>
  </motion.button>
);

/* ─── Platform link ────────────────────────────────────────────────── */
const PlatformLink = ({ href, icon: Ic, label, sub, accentColor, glowColor, onClick }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = accentColor;
      e.currentTarget.style.boxShadow = `0 0 24px -8px ${glowColor}`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
      style={{ background: `${accentColor}18`, color: accentColor }}
    >
      <Ic size={20} />
    </div>
    <div className="flex-1">
      <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{label}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>{sub}</div>
    </div>
    <Icons.IconExternalLink size={15} style={{ color: 'var(--text-dim)' }} />
  </a>
);

/* ─── Main component ───────────────────────────────────────────────── */
const LearningHubTab = ({ skillGaps }) => {
  const [selectedRec, setSelectedRec] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const maxImpact = Math.max(1, ...skillGaps.map(g => g.count));

  /* Enrich each gap with category */
  const recommendations = skillGaps
    .map(gap => {
      const resource = RESOURCE_DATABASE[gap.name] || {
        ...RESOURCE_DATABASE["default"],
        title: `Complete Guide to ${gap.name}`,
        category: inferCategory(gap.name),
      };
      return { skill: gap.name, impact: gap.count, ...resource };
    })
    .sort((a, b) => b.impact - a.impact);

  /* Count per category (excluding 'all') */
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'all'
      ? recommendations.length
      : recommendations.filter(r => r.category === cat.id).length;
    return acc;
  }, {});

  /* Only show categories that have at least one recommendation */
  const visibleCategories = CATEGORIES.filter(cat =>
    cat.id === 'all' ? recommendations.length > 0 : categoryCounts[cat.id] > 0
  );

  const filtered = activeFilter === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === activeFilter);

  const activeCat = CATEGORIES.find(c => c.id === activeFilter) || CATEGORIES[0];
  const isTopPick = (rec) => rec.impact >= maxImpact * 0.7;

  return (
    <div className="space-y-6">

      {/* ══ Header Banner ════════════════════════════════════════════ */}
      <motion.div
        className="relative overflow-hidden rounded-2xl"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 0 0 1px var(--border), 0 20px 48px -16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full"
               style={{ background: 'var(--accent)', filter: 'blur(72px)', opacity: 0.07 }} />
          <div className="absolute -left-16 bottom-0 w-56 h-56 rounded-full"
               style={{ background: 'var(--hero-glow-b)', filter: 'blur(60px)', opacity: 0.10 }} />
          <div className="absolute inset-0 opacity-[0.15]"
               style={{
                 backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent)',
               }} />
          <div className="absolute right-6 top-1/2 opacity-[0.05]"
               style={{ transform: 'scale(4.5) translateY(-15%)', transformOrigin: 'right center' }}>
            <Icons.IconBook size={72} />
          </div>
        </div>

        <div className="relative z-10 p-6 md:p-8">
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
                <Icons.IconBook size={24} color="var(--accent-text)" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                    Learning Hub
                  </span>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,0.2)' }}
                  >
                    <Icons.IconSparkle size={9} /> AI Curated
                  </span>
                </div>
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.022em' }}
                >
                  Bridge the Gap. Land the Job.
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>
                  Tailored modules ranked by market impact · Click any to start learning
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatPill label="Gaps"  value={skillGaps.length}                            color="var(--danger)" />
              <StatPill label="Roles" value={skillGaps.reduce((a, g) => a + g.count, 0)} color="var(--pos)"    />
            </div>
          </div>

          {/* AI insight strip */}
          {skillGaps.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: 'var(--accent-soft)', border: '1px solid rgba(79,124,255,0.18)' }}
              >
                <Icons.IconSparkle size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-mute)' }}>
                  Completing the top{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Math.min(3, skillGaps.length)}</span>{' '}
                  recommended courses could unlock approximately{' '}
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>
                    ~{recommendations.slice(0, 3).reduce((a, g) => a + g.impact, 0)} more matched roles
                  </span>.
                  Prioritized by live market demand.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══ Recommendations Grid ═════════════════════════════════════ */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.015em' }}
          >
            <Icons.IconTarget size={16} style={{ color: 'var(--accent)' }} />
            Top Recommendations
          </h3>
          <AnimatePresence mode="wait">
            <motion.span
              key={activeFilter}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="text-sm"
              style={{ color: 'var(--text-mute)' }}
            >
              {activeFilter === 'all'
                ? `${filtered.length} courses · by market demand`
                : `${filtered.length} ${activeCat.label} course${filtered.length !== 1 ? 's' : ''}`}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* ── Category filter bar ───────────────────────────────────── */}
        {visibleCategories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            {visibleCategories.map(cat => (
              <FilterChip
                key={cat.id}
                cat={cat}
                count={categoryCounts[cat.id]}
                active={activeFilter === cat.id}
                onClick={() => setActiveFilter(cat.id)}
              />
            ))}
          </motion.div>
        )}

        {/* ── Cards ────────────────────────────────────────────────── */}
        {recommendations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--pos-soft)', color: 'var(--pos)' }}
            >
              <Icons.IconCheckCircle size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              You're fully equipped!
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-mute)' }}>
              Your skills perfectly match the top internships. Keep applying!
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          /* Empty filter state */
          <motion.div
            key={`empty-${activeFilter}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: `${activeCat.color}18`, color: activeCat.color }}
            >
              <activeCat.Icon size={22} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
              No {activeCat.label} gaps detected
            </p>
            <p className="text-xs" style={{ color: 'var(--text-mute)' }}>
              Your {activeCat.label.toLowerCase()} skills are well covered.
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-4 text-xs font-bold flex items-center gap-1"
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Icons.IconArrowRight size={12} /> View all recommendations
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={activeFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.map((rec, i) => {
              const top = isTopPick(rec);
              const barPct = Math.max(8, Math.round((rec.impact / maxImpact) * 100));
              const catDef = CATEGORIES.find(c => c.id === rec.category) || CATEGORIES[0];

              return (
                <motion.div
                  key={rec.skill}
                  layout
                  onClick={() => setSelectedRec(rec)}
                  className="relative overflow-hidden cursor-pointer group flex flex-col"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: top
                      ? 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)'
                      : 'var(--surface)',
                    border: top
                      ? '1px solid color-mix(in srgb, var(--accent) 28%, var(--border))'
                      : '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 22,
                    boxShadow: top ? 'inset 0 0 0 1px rgba(79,124,255,0.06)' : 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.22s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${catDef.color}55`;
                    e.currentTarget.style.boxShadow =
                      `0 20px 56px -16px rgba(0,0,0,0.5), 0 0 0 1px ${catDef.color}22, 0 0 40px -20px ${catDef.color}40`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = top
                      ? 'color-mix(in srgb, var(--accent) 28%, var(--border))'
                      : 'var(--border)';
                    e.currentTarget.style.boxShadow = top
                      ? 'inset 0 0 0 1px rgba(79,124,255,0.06)'
                      : 'none';
                  }}
                >
                  {/* Left accent stripe — category color */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
                    style={{
                      background: top
                        ? `linear-gradient(180deg, ${catDef.color}, ${catDef.color}88)`
                        : catDef.color,
                      opacity: top ? 1 : 0.45,
                    }}
                  />

                  {/* Radial hover glow (category-tinted) */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 0% 0%, ${catDef.color}0e, transparent 70%)`,
                      borderRadius: 16,
                    }}
                  />

                  {/* Top row */}
                  <div className="relative flex items-start justify-between mb-4">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ background: `${catDef.color}16`, border: `1px solid ${catDef.color}28` }}
                    >
                      <catDef.Icon size={18} style={{ color: catDef.color }} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {top && (
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: `${catDef.color}1a`, color: catDef.color }}
                        >
                          Top Pick
                        </span>
                      )}
                      <span
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px]"
                        style={{
                          background: 'var(--surface-2)',
                          color: 'var(--text-mute)',
                          border: '1px solid var(--border)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <Icons.IconClock size={9} /> {rec.duration}
                      </span>
                    </div>
                  </div>

                  {/* Title & meta */}
                  <div className="relative flex-1">
                    <h4
                      className="font-bold text-base mb-0.5 leading-tight"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.015em', color: 'var(--text)' }}
                    >
                      {rec.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-xs" style={{ color: 'var(--text-mute)' }}>
                        {rec.provider} · {rec.type}
                      </span>
                      {/* Category pill */}
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: `${catDef.color}18`, color: catDef.color }}
                      >
                        {rec.category}
                      </span>
                    </div>

                    {/* Impact bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-dim)' }}>
                          Market Demand
                        </span>
                        <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: top ? 'var(--danger)' : 'var(--text-mute)' }}>
                          <Icons.IconBriefcase size={9} /> {rec.impact} roles
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: top
                              ? `linear-gradient(90deg, ${catDef.color}, ${catDef.color}aa)`
                              : catDef.color,
                            opacity: top ? 1 : 0.5,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="relative pt-3 flex items-center justify-between mt-auto"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <span className="skill-chip skill-miss">{rec.skill}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ color: catDef.color }}
                    >
                      Learn <Icons.IconArrowRight size={11} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ══ Platform Modal ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedRec && (() => {
          const modalCat = CATEGORIES.find(c => c.id === selectedRec.category) || CATEGORIES[0];
          return (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'color-mix(in srgb, var(--bg) 78%, transparent)', backdropFilter: 'blur(10px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRec(null)}
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
                          <modalCat.Icon size={10} /> {modalCat.label}
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
                        Master {selectedRec.skill}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>
                        Unlock{' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          {selectedRec.impact} roles
                        </span>{' '}
                        by completing this skill
                      </p>
                    </div>
                    <button className="icon-btn shrink-0" onClick={() => setSelectedRec(null)}>
                      <Icons.IconX size={18} />
                    </button>
                  </div>
                </div>

                {/* Platform options */}
                <div
                  className="relative p-6 space-y-3"
                  style={{ background: 'color-mix(in srgb, var(--surface-2) 35%, transparent)' }}
                >
                  <PlatformLink
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedRec.skill + ' full course tutorial')}`}
                    icon={Icons.IconZap}
                    label="YouTube"
                    sub="Free crash courses & tutorials"
                    accentColor="#ef4444"
                    glowColor="rgba(239,68,68,0.35)"
                    onClick={() => setSelectedRec(null)}
                  />
                  <PlatformLink
                    href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedRec.skill)}`}
                    icon={Icons.IconChip}
                    label="Udemy"
                    sub="Comprehensive structured courses"
                    accentColor="#A435F0"
                    glowColor="rgba(164,53,240,0.35)"
                    onClick={() => setSelectedRec(null)}
                  />
                  <PlatformLink
                    href={`https://www.coursera.org/search?query=${encodeURIComponent(selectedRec.skill)}`}
                    icon={Icons.IconCap}
                    label="Coursera"
                    sub="Professional certificates & degrees"
                    accentColor="#0056D2"
                    glowColor="rgba(0,86,210,0.35)"
                    onClick={() => setSelectedRec(null)}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default LearningHubTab;
