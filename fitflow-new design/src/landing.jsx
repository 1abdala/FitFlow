// Landing page — dark redesign
const { IconSparkle, IconArrowRight, IconArrowUpRight, IconChip, IconTarget, IconBriefcase, IconLogo, IconBolt, IconShield, IconUsers, IconCheck, IconStar } = window.FFIcons;

const FFLogo = () => (
  <div className="ff-logo">
    <span className="ff-logo-mark"><IconLogo size={18} /></span>
    <span className="ff-logo-text">Fit<b>Flow</b></span>
  </div>
);

const Pill = ({ children }) => (
  <div className="ff-pill">
    <span className="ff-pill-dot"><IconSparkle size={12} /></span>
    {children}
  </div>
);

const StatTile = ({ value, label, tone }) => (
  <div className={`stat-tile ${tone || ""}`}>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, body, kicker, big }) => (
  <div className={`feat-card ${big ? "feat-big" : ""}`}>
    <div className="feat-icon">{icon}</div>
    {kicker && <div className="feat-kicker">{kicker}</div>}
    <div className="feat-title">{title}</div>
    <div className="feat-body">{body}</div>
  </div>
);

// Mock match preview that lives inside the hero
const MatchPreview = () => (
  <div className="match-preview">
    <div className="mp-head">
      <div className="mp-head-left">
        <div className="mp-dot mp-dot-live" />
        <span className="mp-mono">live_matching.ai</span>
      </div>
      <div className="mp-head-right">
        <span className="mp-chip">3 new</span>
      </div>
    </div>
    <div className="mp-rows">
      {[
        { co: "Experian", role: "Software Eng. Intern (AI)", pct: 92, tags: ["Python", "SQL", "+2"], hi: true },
        { co: "foodpanda", role: "Internship Program — Jul'26", pct: 87, tags: ["React", "TS"] },
        { co: "SEEK", role: "Product Analytics Intern", pct: 81, tags: ["SQL", "Looker"] },
      ].map((r, i) => (
        <div key={i} className={`mp-row ${r.hi ? "mp-row-hi" : ""}`}>
          <div className="mp-co">
            <div className="mp-avatar">{r.co.slice(0, 2)}</div>
            <div className="mp-meta">
              <div className="mp-co-name">{r.co}</div>
              <div className="mp-role">{r.role}</div>
            </div>
          </div>
          <div className="mp-tags">
            {r.tags.map((t, j) => <span key={j} className="mp-tag">{t}</span>)}
          </div>
          <div className="mp-score">
            <div className="mp-score-bar"><span style={{ width: `${r.pct}%` }} /></div>
            <div className="mp-score-pct">{r.pct}%</div>
          </div>
        </div>
      ))}
    </div>
    <div className="mp-foot">
      <div className="mp-foot-left">
        <span className="mp-mono">embedding · cosine_sim</span>
      </div>
      <div className="mp-foot-right">
        <span className="mp-chip mp-chip-ghost">12 saved</span>
        <span className="mp-chip mp-chip-ghost">48 explored</span>
      </div>
    </div>
  </div>
);

const Landing = ({ onEnterDashboard }) => (
  <div className="landing">
    {/* Top nav */}
    <header className="ff-top">
      <FFLogo />
      <nav className="ff-nav">
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#partners">Partners</a>
      </nav>
      <div className="ff-top-right">
        <div className="utem-badge">
          <div className="utem-mark">UTeM</div>
          <div className="utem-sub">Universiti Teknikal<br/>Malaysia Melaka</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onEnterDashboard}>
          Open dashboard <IconArrowRight size={14} />
        </button>
      </div>
    </header>

    {/* Hero */}
    <section className="hero">
      <div className="hero-bg" aria-hidden>
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
      </div>

      <div className="hero-inner">
        <div className="hero-left">
          <Pill>AI-Powered Matching · Built for UTeM</Pill>
          <h1 className="hero-title">
            Your internship,
            <br />
            <span className="hero-accent">
              perfected
              <svg className="hero-underline" viewBox="0 0 380 14" preserveAspectRatio="none">
                <path d="M2 9 C 80 2, 200 14, 378 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>
          <p className="hero-sub">
            Stop scrolling fragmented job boards. <b>FitFlow</b> reads your CV, scores every opening
            against your real skills, and tells you exactly what to learn next.
          </p>

          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onEnterDashboard}>
              Get started <IconArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" onClick={onEnterDashboard}>
              Explore dashboard
            </button>
          </div>

          <div className="hero-meta">
            <div className="hm-item">
              <div className="hm-num">2,840</div>
              <div className="hm-label">Open roles indexed</div>
            </div>
            <div className="hm-divider" />
            <div className="hm-item">
              <div className="hm-num">96%</div>
              <div className="hm-label">CV parse accuracy</div>
            </div>
            <div className="hm-divider" />
            <div className="hm-item">
              <div className="hm-num">4.8<span className="hm-star"><IconStar size={12} fill="currentColor" stroke="none" /></span></div>
              <div className="hm-label">Student rating</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <MatchPreview />
        </div>
      </div>
    </section>

    {/* Logo strip */}
    <section className="logo-strip">
      <div className="logo-strip-label">Roles sourced from</div>
      <div className="logo-strip-row">
        {["Experian", "foodpanda", "SEEK", "Maybank", "Petronas", "AirAsia", "Grab"].map((n) => (
          <div key={n} className="logo-chip">{n}</div>
        ))}
      </div>
    </section>

    {/* Features bento */}
    <section className="features" id="features">
      <div className="section-head">
        <Pill>Features</Pill>
        <h2 className="section-title">Built like a co-pilot, <span className="muted">not a job board.</span></h2>
      </div>

      <div className="bento">
        <FeatureCard
          big
          kicker="01 — Match"
          icon={<IconTarget size={22} />}
          title="Skill-graph matching"
          body="Every role is embedded in the same skill space as your CV, so a 92% match means 92% of the requirements are already in your pocket."
        />
        <FeatureCard
          kicker="02 — Read"
          icon={<IconChip size={22} />}
          title="CV analyzer"
          body="Drop your PDF. Get a parsed, taggable skill profile in 8 seconds."
        />
        <FeatureCard
          kicker="03 — Apply"
          icon={<IconBriefcase size={22} />}
          title="One-tap apply"
          body="Tracks status, replies, and follow-ups in a single timeline."
        />
        <FeatureCard
          kicker="04 — Grow"
          icon={<IconBolt size={22} />}
          title="Gap to next match"
          body="See exactly which 2-3 skills would unlock 5 more matches this week."
        />
        <FeatureCard
          kicker="05 — Trust"
          icon={<IconShield size={22} />}
          title="UTeM-verified"
          body="Listings vetted with the FTMK industrial training office. No scams, no ghost roles."
        />
      </div>
    </section>

    {/* How it works */}
    <section className="how" id="how">
      <div className="section-head">
        <Pill>How it works</Pill>
        <h2 className="section-title">From PDF to first interview <span className="muted">in three moves.</span></h2>
      </div>
      <div className="steps">
        {[
          { n: "01", t: "Drop your CV", d: "We parse skills, projects, coursework, and turn them into a vector you control.", icon: <IconSparkle size={18} /> },
          { n: "02", t: "Browse ranked matches", d: "Every internship gets a real percentage match — and the missing skills are right there.", icon: <IconTarget size={18} /> },
          { n: "03", t: "Close the gap, apply", d: "Curated micro-courses for the missing skills. Apply in one tap when you're ready.", icon: <IconBolt size={18} /> },
        ].map((s) => (
          <div key={s.n} className="step">
            <div className="step-num">{s.n}</div>
            <div className="step-icon">{s.icon}</div>
            <div className="step-title">{s.t}</div>
            <div className="step-body">{s.d}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Final CTA */}
    <section className="cta-band">
      <div className="cta-band-inner">
        <div className="cta-left">
          <h3>Ready to stop guessing<br/>which role fits?</h3>
          <p>Open the dashboard — your matches are already waiting.</p>
        </div>
        <div className="cta-right">
          <button className="btn btn-primary btn-lg" onClick={onEnterDashboard}>
            Launch dashboard <IconArrowUpRight size={16} />
          </button>
          <div className="cta-note">
            <IconCheck size={14} /> Free for UTeM students
          </div>
        </div>
      </div>
    </section>

    <footer className="ff-foot">
      <FFLogo />
      <div className="ff-foot-meta">
        <span>© 2026 FitFlow</span>
        <span>·</span>
        <span>Built with FTMK · UTeM</span>
      </div>
    </footer>
  </div>
);

window.Landing = Landing;
