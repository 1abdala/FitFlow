import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import * as Icons from './Icons';

/* Observes an element and adds 'reveal-in' when it enters the viewport.
   Uses direct DOM classList to avoid React re-renders on scroll. */
const useReveal = (delay = 0) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => el.classList.add('reveal-in'), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -56px 0px' }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [delay]);
  return ref;
};

const FFLogo = () => (
  <div className="ff-logo">
    <span className="ff-logo-mark"><Icons.IconLogo size={18} /></span>
    <span className="ff-logo-text">Fit<b>Flow</b></span>
  </div>
);

const Pill = ({ children }) => (
  <div className="ff-pill">
    <span className="ff-pill-dot"><Icons.IconSparkle size={12} /></span>
    {children}
  </div>
);

const FeatureCard = ({ icon, title, body, kicker, big, delay = 0 }) => {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className={`feat-card reveal${big ? ' feat-big' : ''}`}>
      <div className="feat-icon">{icon}</div>
      {kicker && <div className="feat-kicker">{kicker}</div>}
      <div className="feat-title">{title}</div>
      <div className="feat-body">{body}</div>
    </div>
  );
};

const StepCard = ({ n, t, d, icon, delay = 0 }) => {
  const ref = useReveal(delay);
  return (
    <div ref={ref} className="step reveal">
      <div className="step-num">{n}</div>
      <div className="step-icon">{icon}</div>
      <div className="step-title">{t}</div>
      <div className="step-body">{d}</div>
    </div>
  );
};



const HeroVisual = () => {
  return (
    <div 
      className="hero-visual-container"
      style={{ perspective: 1200 }}
    >
      <motion.div 
        className="hero-character-wrapper"
        style={{
          transformStyle: "preserve-3d"
        }}
      >
        <motion.div
          style={{ width: "100%", height: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center" }}
          animate={{
            y: [-12, 12, -12],
            rotate: [-1.2, 1.2, -1.2]
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img src="/utem-student-3d.png" alt="FitFlow AI Guide" className="hero-character-img" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  /* Mouse spotlight */
  const spotEl = useRef(null);
  const pos = useRef({ x: -800, y: -800 });
  const target = useRef({ x: -800, y: -800 });
  const raf = useRef(null);

  useEffect(() => {
    const onMove = (e) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.07;
      pos.current.y += (target.current.y - pos.current.y) * 0.07;
      if (spotEl.current) {
        spotEl.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);

  /* Scroll-reveal refs for below-fold sections */
  const stripRef    = useReveal(0);
  const featHeadRef = useReveal(0);
  const howHeadRef  = useReveal(0);
  const ctaRef      = useReveal(0);
  const footRef     = useReveal(0);

  return (
    <div className="landing">
      <div ref={spotEl} className="mouse-spotlight" aria-hidden="true" />

      {/* Top nav — slides down on load */}
      <header className="ff-top lp-nav-enter">
        <FFLogo />
        <nav className="ff-nav hidden md:flex">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#partners">Partners</a>
        </nav>
        <div className="ff-top-right">
          <div className="utem-badge hidden sm:flex">
            <div className="utem-mark">UTeM</div>
            <div className="utem-sub">Universiti Teknikal<br/>Malaysia Melaka</div>
          </div>
          <Link to="/auth" className="btn btn-primary btn-sm">
            Open dashboard <Icons.IconArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero — staggered CSS animations, no observer needed */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-a" />
          <div className="hero-glow hero-glow-b" />
        </div>

        <div className="hero-inner">
          <div className="hero-left">
            <div className="lp-rise lp-d1"><Pill>AI-Powered Matching · Built for UTeM</Pill></div>
            <h1 className="hero-title lp-rise lp-d2">
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
            <p className="hero-sub lp-rise lp-d3">
              Stop scrolling fragmented job boards. <b>FitFlow</b> maps your skill profile, scores every opening
              against real requirements, and tells you exactly what to learn next.
            </p>

            <div className="hero-cta lp-rise lp-d4">
              <Link to="/auth" className="btn btn-primary">
                Get started <Icons.IconArrowRight size={16} />
              </Link>
              <Link to="/auth" className="btn btn-ghost">
                Explore dashboard
              </Link>
            </div>

            <div className="hero-meta lp-rise lp-d5">
              <div className="hm-item">
                <div className="hm-num">Real-Time</div>
                <div className="hm-label">Skill Match Engine</div>
              </div>
              <div className="hm-divider" />
              <div className="hm-item">
                <div className="hm-num">1:1</div>
                <div className="hm-label">Skill Gap Breakdown</div>
              </div>
              <div className="hm-divider" />
              <div className="hm-item">
                <div className="hm-num">100%</div>
                <div className="hm-label">Free for Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Right side - Positioned absolutely, filling 50% width, 100% height of the screen/section */}
        <div className="hero-right hidden lg:block lp-slide-right">
          <HeroVisual />
        </div>
      </section>

      {/* Logo strip */}
      <section ref={stripRef} className="logo-strip reveal">
        <div className="logo-strip-label">Roles sourced from</div>
        <div className="logo-strip-row">
          {["Experian", "foodpanda", "SEEK", "Maybank", "Petronas", "AirAsia", "Grab"].map((n, i) => (
            <div key={n} className="logo-chip" style={{ transitionDelay: `${i * 55}ms` }}>{n}</div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="features" id="features">
        <div ref={featHeadRef} className="section-head text-center sm:text-left reveal">
          <Pill>Features</Pill>
          <h2 className="section-title">Built like a co-pilot, <span className="muted">not a job board.</span></h2>
        </div>

        <div className="bento">
          <FeatureCard delay={0}   big kicker="01 — Match"  icon={<Icons.IconTarget size={22} />}   title="Skill-graph matching"  body="Every role is evaluated against your technical skill profile, so a 92% match means 92% of the requirements are already in your pocket." />
          <FeatureCard delay={80}      kicker="02 — Profile" icon={<Icons.IconChip size={22} />}     title="Skill profiler"        body="Tag your technical stack, frameworks, and tools. Your matches update dynamically as you learn." />
          <FeatureCard delay={160}     kicker="03 — Apply"  icon={<Icons.IconBriefcase size={22} />} title="One-tap apply"         body="Tracks status, replies, and follow-ups in a single timeline." />
          <FeatureCard delay={80}      kicker="04 — Grow"   icon={<Icons.IconBolt size={22} />}     title="Gap to next match"     body="See exactly which 2-3 skills would unlock 5 more matches this week." />
          <FeatureCard delay={160}     kicker="05 — Trust"  icon={<Icons.IconShield size={22} />}   title="Curated for UTeM"      body="Curated for computing and engineering disciplines with transparent requirements. No scams, no ghost roles." />
        </div>
      </section>

      {/* How it works */}
      <section className="how" id="how">
        <div ref={howHeadRef} className="section-head text-center sm:text-left reveal">
          <Pill>How it works</Pill>
          <h2 className="section-title">From profile setup to first interview <span className="muted">in three moves.</span></h2>
        </div>
        <div className="steps grid grid-cols-1 md:grid-cols-3">
          <StepCard delay={0}   n="01" t="Build your skill profile" d="Tag your programming languages, frameworks, and tools in a structured profile you control." icon={<Icons.IconSparkle size={18} />} />
          <StepCard delay={100} n="02" t="Browse ranked matches"  d="Every internship gets a real percentage match — and the missing skills are right there."     icon={<Icons.IconTarget size={18} />} />
          <StepCard delay={200} n="03" t="Close the gap, apply"   d="Curated micro-courses for the missing skills. Apply in one tap when you're ready."           icon={<Icons.IconBolt size={18} />} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-band">
        <div ref={ctaRef} className="cta-band-inner flex-col sm:flex-row text-center sm:text-left reveal lp-reveal-scale">
          <div className="cta-left">
            <h3>Ready to stop guessing<br className="hidden sm:block"/>which role fits?</h3>
            <p>Open the dashboard — your matches are already waiting.</p>
          </div>
          <div className="cta-right items-center sm:items-end">
            <Link to="/auth" className="btn btn-primary btn-lg">
              Launch dashboard <Icons.IconArrowUpRight size={16} />
            </Link>
            <div className="cta-note">
              <Icons.IconCheck size={14} /> Free for UTeM students
            </div>
          </div>
        </div>
      </section>

      <footer ref={footRef} className="ff-foot flex-col sm:flex-row gap-4 reveal">
        <FFLogo />
        <div className="ff-foot-meta">
          <span>© 2026 FitFlow</span>
          <span>·</span>
          <span>Built with FTMK · UTeM</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
