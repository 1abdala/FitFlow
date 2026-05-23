// Dashboard — dark redesign
const { IconSparkle, IconArrowRight, IconArrowUpRight, IconChip, IconTarget, IconBriefcase, IconGrid, IconDoc, IconCap, IconBook, IconGear, IconBell, IconSearch, IconStar, IconWave, IconLogout, IconLogo, IconBolt, IconCheck, IconClock, IconUsers } = window.FFIcons;

const DashLogo = () => (
  <div className="ff-logo ff-logo-dash">
    <span className="ff-logo-mark"><IconLogo size={16} /></span>
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

const Sidebar = ({ active, setActive }) => {
  const items = [
    { id: "overview", icon: <IconGrid size={18} />, label: "Overview" },
    { id: "matches", icon: <IconTarget size={18} />, label: "My Matches", badge: "12" },
    { id: "apps", icon: <IconBriefcase size={18} />, label: "Applications" },
    { id: "cv", icon: <IconDoc size={18} />, label: "CV Analyzing" },
    { id: "skill", icon: <IconCap size={18} />, label: "Skill Profile" },
    { id: "learn", icon: <IconBook size={18} />, label: "Learning Hub" },
  ];
  return (
    <aside className="sidebar">
      <DashLogo />
      <nav className="nav">
        {items.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} onClick={() => setActive(it.id)} />
        ))}
      </nav>
      <div className="nav-spacer" />
      <div className="sidebar-card">
        <div className="sb-card-head">
          <IconBolt size={14} />
          <span>Pro tips</span>
        </div>
        <div className="sb-card-body">Add 2 React projects to bump 8 more matches.</div>
        <button className="sb-card-cta">Show me <IconArrowRight size={12} /></button>
      </div>
      <div className="sidebar-foot">
        <NavItem icon={<IconGear size={18} />} label="Settings" />
        <div className="user-row">
          <div className="user-ava">AH</div>
          <div className="user-meta">
            <div className="user-name">Abdalla H.</div>
            <div className="user-role">Student · BITS</div>
          </div>
          <button className="user-logout" title="Log out"><IconLogout size={16} /></button>
        </div>
      </div>
    </aside>
  );
};

const Topbar = () => (
  <div className="topbar">
    <div className="topbar-left">
      <div className="crumb">
        <span className="crumb-mute">FitFlow</span>
        <span className="crumb-sep">/</span>
        <span>Dashboard</span>
      </div>
    </div>
    <div className="topbar-right">
      <div className="search">
        <IconSearch size={16} />
        <input placeholder="Search internships, skills, companies…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="icon-btn icon-btn-ring" title="Notifications">
        <IconBell size={16} />
        <span className="icon-dot" />
      </button>
    </div>
  </div>
);

const WelcomeCard = () => (
  <div className="welcome">
    <div className="welcome-bg" aria-hidden>
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
    <div className="welcome-inner">
      <div className="welcome-kicker"><IconWave size={14} /> Tuesday, May 8</div>
      <h2 className="welcome-title">
        Welcome back, <span className="welcome-name">Abdalla</span>.
      </h2>
      <p className="welcome-sub">
        Your profile is missing <b>3 key skills</b> for Top-Tier Tech roles.
        Close the gap and unlock <b>+8 matches</b> this week.
      </p>
      <div className="welcome-cta">
        <button className="btn btn-primary btn-sm">View recommendations <IconArrowRight size={14} /></button>
        <button className="btn btn-ghost btn-sm">Refresh matches</button>
      </div>
    </div>
  </div>
);

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

const MatchRow = ({ co, role, pct, missing, hi, logo }) => (
  <div className={`match-row ${hi ? "match-hi" : ""}`}>
    <div className="match-logo">{logo || co.slice(0, 2)}</div>
    <div className="match-meta">
      <div className="match-role">{role}</div>
      <div className="match-co">{co}</div>
    </div>
    <div className="match-skills">
      {missing.map((m, i) => <span key={i} className="skill-chip skill-miss">{m}</span>)}
    </div>
    <div className="match-pct">
      <div className="pct-ring">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" className="ring-track" />
          <circle cx="18" cy="18" r="15" className="ring-fill" strokeDasharray={`${(pct / 100) * 94.25}, 94.25`} />
        </svg>
        <span className="pct-label">{pct}<i>%</i></span>
      </div>
    </div>
    <button className="match-cta"><IconArrowUpRight size={14} /></button>
  </div>
);

const MatchesList = () => {
  const rows = [
    { co: "Experian Marketing Services", role: "Software Engineering Intern (AI)", pct: 92, missing: ["Spring Boot", "+2"], hi: true },
    { co: "foodpanda Malaysia", role: "Internship Program — Jul 2026", pct: 87, missing: ["SQL", "+3"] },
    { co: "SEEK", role: "Product Analytics Intern", pct: 81, missing: ["Looker", "+1"] },
    { co: "Maybank", role: "Data Science Intern", pct: 74, missing: ["PySpark"] },
    { co: "Petronas Digital", role: "Cloud Eng Intern", pct: 68, missing: ["AWS", "Docker"] },
  ];
  return (
    <div className="matches-card card">
      <div className="card-head">
        <div>
          <div className="card-kicker"><IconTarget size={12} /> Highest match potential</div>
          <h3 className="card-title">Roles ranked for you</h3>
        </div>
        <div className="card-head-right">
          <div className="seg">
            <button className="seg-on">All</button>
            <button>Tech</button>
            <button>Data</button>
            <button>Design</button>
          </div>
          <button className="link-btn">See all <IconArrowRight size={12} /></button>
        </div>
      </div>
      <div className="matches-list">
        {rows.map((r, i) => <MatchRow key={i} {...r} />)}
      </div>
    </div>
  );
};

const SkillGap = () => {
  const skills = [
    { name: "SQL", level: 78, target: 90, hi: true },
    { name: "React", level: 84, target: 85 },
    { name: "Spring Boot", level: 12, target: 70, urgent: true },
    { name: "Docker", level: 45, target: 75 },
    { name: "Cloud (AWS)", level: 30, target: 70, urgent: true },
  ];
  return (
    <div className="card skill-gap">
      <div className="card-head">
        <div>
          <div className="card-kicker"><IconBolt size={12} /> Gap to top tier</div>
          <h3 className="card-title">Master these to unlock more roles</h3>
        </div>
      </div>
      <div className="gap-list">
        {skills.map((s, i) => (
          <div key={i} className={`gap-row ${s.urgent ? "gap-urgent" : ""}`}>
            <div className="gap-row-head">
              <span className="gap-name">{s.name}</span>
              {s.urgent && <span className="badge badge-urgent">High priority</span>}
              <span className="gap-pct">{s.level}<i>/{s.target}</i></span>
            </div>
            <div className="gap-bar">
              <div className="gap-bar-target" style={{ width: `${s.target}%` }} />
              <div className={`gap-bar-fill ${s.urgent ? "gap-bar-urgent" : ""}`} style={{ width: `${s.level}%` }} />
            </div>
            <div className="gap-meta">
              <span className="muted">Needed by {Math.floor(Math.random() * 30) + 10} matched roles</span>
              <button className="link-btn">Learn <IconArrowRight size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityCard = () => (
  <div className="card activity">
    <div className="card-head">
      <div>
        <div className="card-kicker"><IconClock size={12} /> Recent</div>
        <h3 className="card-title">Application activity</h3>
      </div>
    </div>
    <ul className="activity-list">
      {[
        { t: "Interview scheduled", who: "Experian · Wed 11:00", tone: "ok", icon: <IconCheck size={12} /> },
        { t: "CV viewed", who: "foodpanda · 2h ago", tone: "info", icon: <IconUsers size={12} /> },
        { t: "Awaiting reply", who: "SEEK · 4d", tone: "wait", icon: <IconClock size={12} /> },
        { t: "Saved role", who: "Maybank Data · today", tone: "info", icon: <IconStar size={12} /> },
      ].map((a, i) => (
        <li key={i} className={`act-item act-${a.tone}`}>
          <span className="act-icon">{a.icon}</span>
          <span className="act-text">{a.t}</span>
          <span className="act-who">{a.who}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ─── My Matches page ──────────────────────────────────────────────────
const MATCHES_DATA = [
  { co: "Experian Marketing Services", role: "Software Engineering Intern (AI-Enabled Development)", pct: 92, missing: ["Spring Boot", "Artificial Intelligence", "Project Management"], loc: "Cyberjaya", stipend: "RM 1,800/mo", posted: "2d ago", saved: true, tier: "tier1" },
  { co: "foodpanda Malaysia", role: "Internship Program (July 2026 Intake)", pct: 87, missing: ["SQL", "Problem Solving", "Communication"], loc: "Kuala Lumpur", stipend: "RM 1,500/mo", posted: "5d ago", saved: false, tier: "tier1" },
  { co: "SEEK", role: "Product Analytics Intern", pct: 81, missing: ["SQL", "Power BI", "Problem Solving"], loc: "Kuala Lumpur", stipend: "RM 1,600/mo", posted: "1w ago", saved: true, tier: "tier1" },
  { co: "Teleperformance Malaysia", role: "AI Intern — Penang or KL", pct: 74, missing: ["ITIL", "Microsoft Office", "VMware"], loc: "Penang / KL", stipend: "RM 1,200/mo", posted: "3d ago", saved: false, tier: "tier2" },
  { co: "Maybank", role: "Data Science Intern", pct: 68, missing: ["PySpark", "Tableau"], loc: "Kuala Lumpur", stipend: "RM 1,800/mo", posted: "1w ago", saved: false, tier: "tier2" },
  { co: "Petronas Digital", role: "Cloud Engineering Intern", pct: 61, missing: ["AWS", "Docker", "Terraform"], loc: "KLCC", stipend: "RM 2,000/mo", posted: "2w ago", saved: false, tier: "tier2" },
  { co: "AirAsia", role: "Mobile Engineering Intern (Flutter)", pct: 54, missing: ["Flutter", "Dart", "Firebase"], loc: "Sepang", stipend: "RM 1,400/mo", posted: "3d ago", saved: false, tier: "tier3" },
  { co: "Grab", role: "Backend Intern", pct: 48, missing: ["Go", "Kafka", "gRPC", "+2"], loc: "Petaling Jaya", stipend: "RM 1,700/mo", posted: "5d ago", saved: false, tier: "tier3" },
];

const FILTERS = ["All", "Tech", "Data", "Cloud", "Design", "Saved"];

const MatchCard = ({ m, onOpen }) => (
  <div className={`m-card m-card-${m.tier}`} onClick={() => onOpen && onOpen(m)} role="button" tabIndex={0}
       onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen && onOpen(m); } }}>
    <div className="m-card-stripe" />
    <div className="m-card-logo">{m.co.split(" ").slice(0, 2).map(w => w[0]).join("")}</div>
    <div className="m-card-body">
      <div className="m-card-row1">
        <h3 className="m-card-role">{m.role}</h3>
        <button className={`m-save ${m.saved ? "m-saved" : ""}`} title={m.saved ? "Saved" : "Save"}
                onClick={(e) => e.stopPropagation()}>
          <IconStar size={15} fill={m.saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="m-card-meta">
        <span className="m-card-co">{m.co}</span>
        <span className="m-card-dot">·</span>
        <span>{m.loc}</span>
        <span className="m-card-dot">·</span>
        <span className="mono">{m.stipend}</span>
        <span className="m-card-dot">·</span>
        <span className="m-card-posted"><IconClock size={11} /> {m.posted}</span>
      </div>
      <div className="m-card-skills">
        <span className="m-card-skills-label">Missing</span>
        {m.missing.map((s, i) => <span key={i} className="skill-chip skill-miss">{s}</span>)}
      </div>
    </div>
    <div className="m-card-score">
      <div className="pct-ring pct-ring-lg">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" className="ring-track" />
          <circle cx="18" cy="18" r="15" className="ring-fill" strokeDasharray={`${(m.pct / 100) * 94.25}, 94.25`} />
        </svg>
        <span className="pct-label pct-label-lg">{m.pct}<i>%</i></span>
      </div>
      <div className="m-card-score-label">match</div>
    </div>
    <div className="m-card-actions" onClick={(e) => e.stopPropagation()}>
      <button className="btn btn-primary btn-sm">Apply <IconArrowUpRight size={12} /></button>
      <button className="btn btn-ghost btn-sm" onClick={() => onOpen && onOpen(m)}>Details</button>
    </div>
    <div className="m-card-hint" aria-hidden>Click for details →</div>
  </div>
);

// ─── Internship Details Modal ─────────────────────────────────────────
const InternshipDetailsModal = ({ m, onClose }) => {
  if (!m) return null;
  const verified = ["React", "AWS", "Java", "Git"];
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="idm-backdrop" onClick={onClose}>
      <div className="idm" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="idm-head">
          <div className="idm-head-left">
            <div className="idm-logo"><IconBriefcase size={22} /></div>
            <div>
              <div className="idm-kicker">
                <span className="idm-tag idm-tag-live"><span className="idm-dot" /> Open · accepting applications</span>
              </div>
              <h2 className="idm-title">{m.role}</h2>
              <div className="idm-sub">
                <b>{m.co}</b>
                <span className="m-card-dot">·</span>
                <span>{m.loc}</span>
                <span className="m-card-dot">·</span>
                <span className="mono">{m.stipend}</span>
              </div>
            </div>
          </div>
          <button className="idm-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-6 12"/></svg>
          </button>
        </header>

        <div className="idm-body">
          {/* Top row: Match score + Apply CTA */}
          <div className="idm-row idm-top">
            <div className="idm-score-card">
              <div className="idm-score-ring">
                <svg viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="var(--surface-3)" strokeWidth="5" />
                  <circle cx="30" cy="30" r="26" fill="none" stroke="url(#idm-grad)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(m.pct / 100) * 163.36} 163.36`} transform="rotate(-90 30 30)" />
                  <defs>
                    <linearGradient id="idm-grad" x1="0" x2="1">
                      <stop offset="0" stopColor="var(--accent)" />
                      <stop offset="1" stopColor="var(--accent-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="idm-score-num">{m.pct}<i>%</i></div>
              </div>
              <div className="idm-score-meta">
                <div className="idm-score-label">Match score</div>
                <div className="idm-score-tier">
                  {m.pct >= 85 ? "Top-tier fit" : m.pct >= 70 ? "Strong fit" : m.pct >= 55 ? "Stretch fit" : "Long shot"}
                </div>
              </div>
            </div>

            <div className="idm-ai">
              <div className="idm-ai-head">
                <span className="idm-ai-icon"><IconSparkle size={14} /></span>
                <span>AI Smart Summary</span>
              </div>
              <p className="idm-ai-body">A 3-point breakdown — strengths for this role, gaps to address, and tailored interview tips.</p>
              <button className="btn btn-primary btn-sm idm-ai-btn">Generate with Gemini <IconArrowRight size={12} /></button>
            </div>

            <div className="idm-apply">
              <div className="idm-apply-pre">You're in the top <b>{Math.max(5, 100 - m.pct + 8)}%</b> of applicants by skill match.</div>
              <button className="btn btn-primary btn-lg idm-apply-btn">Apply now <IconArrowUpRight size={14} /></button>
              <button className="idm-save-btn">
                <IconStar size={13} fill={m.saved ? "currentColor" : "none"} /> {m.saved ? "Saved" : "Save for later"}
              </button>
            </div>
          </div>

          {/* Skill matrix */}
          <section className="idm-section">
            <div className="idm-section-head"><IconTarget size={14} /> Skill Matrix</div>
            <div className="idm-skills-grid">
              <div className="idm-skill-card idm-skill-pos">
                <div className="idm-skill-head">
                  <span className="idm-skill-icon"><IconCheck size={13} /></span>
                  <span>Verified skills</span>
                  <span className="idm-skill-count">{verified.length}</span>
                </div>
                <div className="idm-chip-row">
                  {verified.map((s, i) => <span key={i} className="skill-chip skill-pos">{s}</span>)}
                </div>
              </div>
              <div className="idm-skill-card idm-skill-gap">
                <div className="idm-skill-head">
                  <span className="idm-skill-icon idm-skill-icon-warn"><IconBolt size={13} /></span>
                  <span>Skill gaps</span>
                  <span className="idm-skill-count">{m.missing.length}</span>
                </div>
                <div className="idm-chip-row">
                  {m.missing.map((s, i) => <span key={i} className="skill-chip skill-miss">{s}</span>)}
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="idm-section">
            <div className="idm-section-head"><IconDoc size={14} /> Description</div>
            <div className="idm-desc">
              <h4>About the role</h4>
              <p>We're looking for a Software Engineering Intern eager to build strong fundamentals while gaining exposure to AI-enabled development practices. You'll work alongside experienced engineers, contribute to real production code, and learn how modern teams use Java, Spring Boot, and AI tooling.</p>
              <h4>What you'll be doing</h4>
              <ul>
                <li>Contribute to backend services and APIs using Java and Spring Boot.</li>
                <li>Support the full software development lifecycle — implementation, testing, deployment.</li>
                <li>Collaborate with senior engineers on AI-assisted developer workflows.</li>
              </ul>
            </div>
          </section>

          {/* Footer meta */}
          <div className="idm-foot">
            <div className="idm-foot-item"><span>Posted</span><b>{m.posted}</b></div>
            <div className="idm-foot-item"><span>Duration</span><b>6 months</b></div>
            <div className="idm-foot-item"><span>Mode</span><b>Hybrid</b></div>
            <div className="idm-foot-item"><span>Start</span><b>Jul 2026</b></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchesPage = ({ onBackToLanding }) => {
  const [filter, setFilter] = React.useState("All");
  const [sort, setSort] = React.useState("match");
  const [openMatch, setOpenMatch] = React.useState(null);

  const filtered = MATCHES_DATA.filter(m => filter === "All" ? true : filter === "Saved" ? m.saved : true);
  const sorted = [...filtered].sort((a, b) =>
    sort === "match" ? b.pct - a.pct :
    sort === "stipend" ? parseInt(b.stipend.replace(/\D/g, "")) - parseInt(a.stipend.replace(/\D/g, "")) :
    0
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">My matches</h1>
          <p className="page-sub">All internships ranked by compatibility with your skill profile.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBackToLanding}>← Back to landing</button>
      </div>

      <div className="m-stats">
        <div className="m-stat">
          <div className="m-stat-num">{MATCHES_DATA.length}</div>
          <div className="m-stat-lbl">Total matches</div>
        </div>
        <div className="m-stat-sep" />
        <div className="m-stat">
          <div className="m-stat-num">{Math.round(MATCHES_DATA.reduce((s, m) => s + m.pct, 0) / MATCHES_DATA.length)}<i>%</i></div>
          <div className="m-stat-lbl">Avg score</div>
        </div>
        <div className="m-stat-sep" />
        <div className="m-stat">
          <div className="m-stat-num">{MATCHES_DATA.filter(m => m.tier === "tier1").length}</div>
          <div className="m-stat-lbl">High potential</div>
        </div>
        <div className="m-stat-sep" />
        <div className="m-stat">
          <div className="m-stat-num">{MATCHES_DATA.filter(m => m.saved).length}</div>
          <div className="m-stat-lbl">Saved</div>
        </div>
      </div>

      <div className="m-toolbar">
        <div className="m-filters">
          {FILTERS.map(f => (
            <button key={f} className={`m-filter ${filter === f ? "m-filter-on" : ""}`} onClick={() => setFilter(f)}>
              {f}
              {f === "Saved" && <span className="m-filter-count">{MATCHES_DATA.filter(m => m.saved).length}</span>}
            </button>
          ))}
        </div>
        <div className="m-sort">
          <span className="m-sort-lbl">Sort by</span>
          <div className="seg">
            <button className={sort === "match" ? "seg-on" : ""} onClick={() => setSort("match")}>Best match</button>
            <button className={sort === "stipend" ? "seg-on" : ""} onClick={() => setSort("stipend")}>Stipend</button>
            <button className={sort === "newest" ? "seg-on" : ""} onClick={() => setSort("newest")}>Newest</button>
          </div>
        </div>
      </div>

      <div className="m-list">
        {sorted.map((m, i) => <MatchCard key={i} m={m} onOpen={setOpenMatch} />)}
      </div>

      <InternshipDetailsModal m={openMatch} onClose={() => setOpenMatch(null)} />
    </>
  );
};

const OverviewPage = ({ onBackToLanding }) => (
  <>
    <div className="page-head">
      <div>
        <h1 className="page-title">Dashboard overview</h1>
        <p className="page-sub">Track your internship matches and skill progression.</p>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onBackToLanding}>
        ← Back to landing
      </button>
    </div>
    <div className="grid-top">
            <WelcomeCard />
            <KpiCard
              icon={<IconStar size={14} />}
              label="Avg match score"
              value="73%"
              delta="▲ 6 pts"
              deltaTone="up"
              sub="vs last week"
              sparkline="M0 22 L14 18 L28 20 L42 12 L56 14 L70 8 L84 10 L100 4"
            />
            <KpiCard
              icon={<IconBriefcase size={14} />}
              label="Saved roles"
              value="12"
              delta="▲ 4 new"
              deltaTone="up"
              sub="this week"
              sparkline="M0 24 L14 22 L28 16 L42 18 L56 12 L70 10 L84 14 L100 6"
            />
          </div>

          <div className="grid-mid">
            <MatchesList />
            <SkillGap />
          </div>

          <div className="grid-bot">
            <ActivityCard />
            <div className="card learn-card">
              <div className="card-head">
                <div>
                  <div className="card-kicker"><IconBook size={12} /> Recommended</div>
                  <h3 className="card-title">Close your top gap</h3>
                </div>
              </div>
              <div className="learn-row">
                <div className="learn-thumb"><IconChip size={20} /></div>
                <div className="learn-meta">
                  <div className="learn-title">Spring Boot for Java devs</div>
                  <div className="learn-tags">
                    <span className="skill-chip">4h 20m</span>
                    <span className="skill-chip">Beginner</span>
                    <span className="skill-chip skill-pos">Unlocks 30 roles</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">Start <IconArrowRight size={12} /></button>
              </div>
              <div className="learn-row">
                <div className="learn-thumb"><IconBolt size={20} /></div>
                <div className="learn-meta">
                  <div className="learn-title">AWS in 90 minutes</div>
                  <div className="learn-tags">
                    <span className="skill-chip">1h 30m</span>
                    <span className="skill-chip">Intermediate</span>
                    <span className="skill-chip skill-pos">Unlocks 18 roles</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm">View</button>
              </div>
            </div>
          </div>
  </>
);

const Dashboard = ({ onBackToLanding }) => {
  const [active, setActive] = React.useState("overview");
  return (
    <div className="dashboard">
      <Sidebar active={active} setActive={setActive} />
      <main className="main">
        <Topbar />
        <div className="main-scroll">
          {active === "matches"
            ? <MatchesPage onBackToLanding={onBackToLanding} />
            : <OverviewPage onBackToLanding={onBackToLanding} />}
        </div>
      </main>
    </div>
  );
};

window.Dashboard = Dashboard;
