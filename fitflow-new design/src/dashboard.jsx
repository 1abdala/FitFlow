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

const Dashboard = ({ onBackToLanding }) => {
  const [active, setActive] = React.useState("overview");
  return (
    <div className="dashboard">
      <Sidebar active={active} setActive={setActive} />
      <main className="main">
        <Topbar />
        <div className="main-scroll">
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
        </div>
      </main>
    </div>
  );
};

window.Dashboard = Dashboard;
