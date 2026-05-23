import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, Target, Award, 
  Search, Clock, CheckCircle, ArrowRight,
  Briefcase, Zap, Brain
} from 'lucide-react';

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans']">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#8B2342] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#0F172A]">FitFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#475569] hover:text-[#2563EB] transition">Features</a>
            <a href="#how-it-works" className="text-[#475569] hover:text-[#2563EB] transition">How It Works</a>
            <a href="#about" className="text-[#475569] hover:text-[#2563EB] transition">About</a>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="/login" className="text-[#475569] hover:text-[#2563EB] transition font-medium">
              Sign In
            </a>
            <a 
              href="/signup"
              className="px-6 py-2.5 bg-[#2563EB] text-white rounded-full font-semibold hover:bg-[#1d4ed8] transition shadow-lg shadow-blue-500/30"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-[#2563EB] text-sm font-semibold mb-6"
              >
                <Zap className="w-4 h-4" />
                AI-Powered Matching for UTeM Students
              </motion.div>

              <h1 className="text-6xl lg:text-7xl font-extrabold text-[#0F172A] leading-tight mb-6">
                FitFlow:
                <br />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#8B2342] bg-clip-text text-transparent">
                  Your Internship,
                  <br />
                  Perfected
                </span>
              </h1>

              <p className="text-xl text-[#475569] mb-8 leading-relaxed">
                Stop browsing 10 different job sites. Let AI find the perfect internship match for your skills. 
                Automated scraping, intelligent matching, and skill gap analysis—all in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a
                  href="/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-[#2563EB] text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </motion.a>

                <motion.a
                  href="#demo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-[#2563EB] text-[#2563EB] rounded-full font-bold text-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
                >
                  Watch Demo
                </motion.a>
              </div>

              <div className="flex items-center gap-6 mt-12">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                  ))}
                </div>
                <div>
                  <p className="text-sm text-[#475569]">
                    <span className="font-bold text-[#0F172A]">500+ students</span> already matched
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Main Card */}
              <div className="relative bg-white rounded-[32px] p-8 shadow-2xl border border-neutral-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#0F172A]">Your Perfect Match</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Live
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { title: 'Software Engineer Intern', company: 'TechCorp', match: 92 },
                      { title: 'Data Analyst Intern', company: 'DataFlow', match: 88 },
                      { title: 'Frontend Developer Intern', company: 'WebStudio', match: 85 }
                    ].map((job, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[#0F172A]">{job.title}</p>
                            <p className="text-sm text-[#475569]">{job.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#2563EB]">{job.match}%</p>
                            <p className="text-xs text-[#475569]">Match</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Icons */}
              <FloatingIcon delay={0} className="absolute -top-6 -right-6">
                <Brain className="w-6 h-6 text-[#2563EB]" />
              </FloatingIcon>

              <FloatingIcon delay={0.5} className="absolute -bottom-6 -left-6">
                <Target className="w-6 h-6 text-[#8B2342]" />
              </FloatingIcon>

              <FloatingIcon delay={1} className="absolute top-1/2 -right-12">
                <Sparkles className="w-6 h-6 text-[#2563EB]" />
              </FloatingIcon>
            </motion.div>
          </div>
        </div>

        {/* Background Gradient Blur */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-200 rounded-full blur-3xl opacity-20 -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-200 rounded-full blur-3xl opacity-20 -z-10" />
      </section>

      {/* Problem Section */}
      <ScrollRevealSection>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-extrabold text-[#0F172A] mb-6">
                Tired of Browsing <span className="text-[#8B2342]">10 Different</span> Job Sites?
              </h2>
              <p className="text-xl text-[#475569] mb-8 leading-relaxed">
                JobStreet. LinkedIn. Ricebowl. Maukerja. Hiredly.
                <br />
                <br />
                You waste <strong>hours every week</strong> jumping between platforms, 
                manually filtering irrelevant jobs, and missing opportunities because you 
                checked the wrong site.
              </p>

              <div className="space-y-4">
                {[
                  'Fragmented job searches across 5+ platforms',
                  'No intelligent skill matching',
                  'Miss deadlines from scattered postings',
                  'Can\'t track applications effectively'
                ].map((problem, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                    <p className="text-[#475569]">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-[48px] bg-gradient-to-br from-red-50 to-orange-50 p-8 border border-red-100">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {['JobStreet', 'LinkedIn', 'Ricebowl', 'Maukerja'].map((site, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-2xl p-6 flex items-center justify-center shadow-lg border border-neutral-200"
                    >
                      <p className="font-bold text-[#0F172A]">{site}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* Solution Section - Data Aggregation */}
      <ScrollRevealSection>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual First */}
            <div className="relative lg:order-1 order-2">
              <div className="relative">
                {/* Organic Portal Shape */}
                <div 
                  className="relative w-full aspect-square bg-gradient-to-br from-[#2563EB] to-[#8B2342] p-1"
                  style={{
                    borderRadius: '60px 40px 60px 40px',
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                  }}
                >
                  <div className="w-full h-full bg-white rounded-[48px] p-8 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-6xl font-bold text-[#0F172A] mb-4">1,000+</p>
                      <p className="text-xl text-[#475569]">Jobs Aggregated Daily</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <FloatingBadge className="absolute -top-8 -right-8">
                  <div className="w-32 h-32 rounded-full bg-[#8B2342] flex items-center justify-center text-white">
                    <div className="text-center">
                      <p className="text-3xl font-bold">100k+</p>
                      <p className="text-xs">Scraped</p>
                    </div>
                  </div>
                </FloatingBadge>
              </div>
            </div>

            {/* Text */}
            <div className="lg:order-2 order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-[#2563EB] text-sm font-semibold mb-6">
                <Search className="w-4 h-4" />
                Automated Data Pipeline
              </div>

              <h2 className="text-5xl font-extrabold text-[#0F172A] mb-6">
                <span className="text-[#2563EB]">1,000+</span> Internships.
                <br />
                Aggregated Daily.
              </h2>

              <p className="text-xl text-[#475569] mb-8 leading-relaxed">
                FitFlow's intelligent scraper automatically scans JobStreet, Ricebowl, 
                Maukerja, and LinkedIn every single day. You get one unified feed of 
                <strong> all available internships in Malaysia</strong>, updated in real-time.
              </p>

              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: 'Real-time updates from 4+ major platforms' },
                  { icon: Clock, text: 'Automated daily scraping at 2 AM' },
                  { icon: CheckCircle, text: 'Duplicate removal and data cleaning' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <p className="text-[#475569] text-lg pt-1.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* AI Intelligence Section */}
      <ScrollRevealSection>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-[#8B2342] text-sm font-semibold mb-6">
              <Brain className="w-4 h-4" />
              Natural Language Processing
            </div>

            <h2 className="text-5xl font-extrabold text-[#0F172A] mb-6">
              AI That Actually <span className="text-[#2563EB]">Understands</span> Your Skills
            </h2>

            <p className="text-xl text-[#475569] max-w-3xl mx-auto">
              Upload your CV once. Our NLP engine extracts your skills, education, and experience—then 
              lets you verify and edit before matching begins.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload CV',
                description: 'Drop your PDF or DOCX resume',
                icon: '📄'
              },
              {
                step: '02',
                title: 'AI Extraction',
                description: 'NLP identifies your technical and soft skills',
                icon: '🤖'
              },
              {
                step: '03',
                title: 'Verify & Match',
                description: 'Review, edit, then get personalized matches',
                icon: '✨'
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-white rounded-[32px] p-8 shadow-xl border border-neutral-200"
              >
                <div className="text-6xl mb-4">{step.icon}</div>
                <div className="text-sm font-bold text-[#2563EB] mb-2">STEP {step.step}</div>
                <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{step.title}</h3>
                <p className="text-[#475569]">{step.description}</p>

                {/* Skill Pills for step 2 */}
                {i === 1 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {['Python', 'React', 'SQL', 'Git'].map((skill, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1 + idx * 0.1 }}
                        className="px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-sm font-semibold"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollRevealSection>

      {/* Matching Success Section */}
      <ScrollRevealSection>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-sm font-semibold mb-6">
                <Award className="w-4 h-4" />
                Proven Results
              </div>

              <h2 className="text-5xl font-extrabold text-[#0F172A] mb-6">
                <span className="text-[#2563EB]">75%</span> of Students Find Their Perfect Match
              </h2>

              <p className="text-xl text-[#475569] mb-8 leading-relaxed">
                Our TF-IDF matching algorithm compares your verified skills against 
                job requirements, giving you a precise match score for every opportunity.
              </p>

              <CounterCard />
            </div>

            <div className="relative">
              {/* Organic Portal with Student Image Placeholder */}
              <div 
                className="relative w-full aspect-square bg-gradient-to-br from-[#2563EB] to-[#8B2342] p-1"
                style={{
                  borderRadius: '40px 60px 40px 60px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-[38px] flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Briefcase className="w-16 h-16 text-[#2563EB]" />
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A]">Student Success Story</p>
                    <p className="text-[#475569] mt-2">Image placeholder</p>
                  </div>
                </div>
              </div>

              {/* Floating Match Score Badge */}
              <FloatingBadge className="absolute -bottom-8 -right-8">
                <div className="w-40 h-40 rounded-full bg-[#8B2342] flex items-center justify-center text-white shadow-2xl">
                  <div className="text-center">
                    <p className="text-5xl font-bold">85%</p>
                    <p className="text-sm">Match Score</p>
                  </div>
                </div>
              </FloatingBadge>
            </div>
          </div>
        </div>
      </ScrollRevealSection>

      {/* Journey CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#2563EB] to-[#8B2342] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl lg:text-6xl font-extrabold mb-6">
              Your Journey to the Real World
              <br />
              Starts Here
            </h2>

            <p className="text-xl mb-12 opacity-90">
              Join 500+ UTeM students who've already found their perfect internship match.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white text-[#2563EB] rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transition flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </motion.a>

              <motion.a
                href="#demo"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition"
              >
                See How It Works
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border-2 border-white rounded-full" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#8B2342] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">FitFlow</span>
              </div>
              <p className="text-neutral-400">
                AI-powered internship matching for UTeM students.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800 text-center text-neutral-400">
            <p>© 2026 FitFlow - Universiti Teknikal Malaysia Melaka. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function ScrollRevealSection({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function FloatingIcon({ children, delay, className }) {
  return (
    <motion.div
      className={`${className} bg-white rounded-2xl p-4 shadow-xl border border-neutral-200`}
      animate={{
        y: [0, -15, 0],
        rotate: [0, 5, 0, -5, 0]
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

function FloatingBadge({ children, className }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

function CounterCard() {
  const [count, setCount] = useState(0);
  const target = 75;

  useEffect(() => {
    const increment = target / 100;
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return Math.min(prev + increment, target);
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-[32px] p-8 border border-blue-100">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-[#2563EB] mb-2">
          {Math.round(count)}%
        </p>
        <p className="text-xl text-[#0F172A] font-semibold">Match Success Rate</p>
        <p className="text-[#475569] mt-2">Based on 500+ student placements</p>
      </div>
    </div>
  );
}
