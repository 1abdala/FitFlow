import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from './Icons';
import { supabase } from '../lib/supabase';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const getStrengthMeta = (score) => {
    if (score === 0) return { label: '', color: '' };
    if (score === 1) return { label: 'Weak', color: 'var(--danger)' };
    if (score === 2) return { label: 'Fair', color: 'var(--warn)' };
    if (score === 3) return { label: 'Good', color: 'var(--accent)' };
    return { label: 'Strong', color: 'var(--pos)' };
  };

  useEffect(() => {
    const handleOAuthSession = async (session) => {
      try {
        setLoading(true);
        const userEmail = session.user.email;
        const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
        let { data: existingUser } = await supabase.from('users').select('*').eq('email', userEmail).single();
        
        if (!existingUser) {
          // Auto-create user record if it doesn't exist for OAuth
          existingUser = {
            id: session.user.id,
            email: userEmail,
            name: userName,
            role: 'student',
            profile_completed: false,
            completion_percentage: 20
          };
          // Try to insert it so it persists
          await supabase.from('users').insert([existingUser]);
        }
        
        localStorage.setItem('fitflow_user', JSON.stringify(existingUser));
        navigate('/dashboard');
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) handleOAuthSession(session);
    });
    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` }
      });
      if (error) throw error;
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const token = otp.join('');
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: isForgotPassword ? 'recovery' : 'signup' });
      if (error) throw error;
      if (isForgotPassword) { setIsVerifying(false); setForgotStep(3); setOtp(['', '', '', '', '', '', '', '']); return; }
      const { data: userData, error: insertError } = await supabase.from('users').insert([{ id: data.user.id, name, email, password_hash: password, role }]).select().single();
      localStorage.setItem('fitflow_user', JSON.stringify(userData || data.user));
      navigate('/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;
        
        let { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        
        // Fallback if user record in table is missing but auth succeeded
        if (!data) {
          data = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.full_name || email.split('@')[0],
            role: authData.user.user_metadata?.role || 'student',
            profile_completed: false,
            completion_percentage: 20
          };
        }
        
        localStorage.setItem('fitflow_user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role: role } } });
        if (error) throw error;
        setIsVerifying(true);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="auth-side-bg">
          <svg viewBox="0 0 800 800">
            <defs>
              <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="400" cy="400" r="300" fill="url(#g1)" />
            <path d="M0,400 Q200,200 400,400 T800,400" stroke="var(--accent)" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M0,500 Q200,300 400,500 T800,500" stroke="var(--accent-2)" strokeWidth="0.5" fill="none" opacity="0.2" />
          </svg>
        </div>
        
        <div className="auth-side-content">
          <Link to="/" className="ff-logo" style={{ fontSize: '24px' }}>
            <span className="ff-logo-mark"><Icons.IconLogo size={20} /></span>
            <span className="ff-logo-text">Fit<b>Flow</b></span>
          </Link>
          
          <div style={{ marginTop: '120px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>
              Scale your <br/> <span style={{ color: 'var(--accent)' }}>Career</span> faster.
            </h2>
            <p style={{ marginTop: '24px', color: 'var(--text-mute)', fontSize: '18px', maxWidth: '400px', lineHeight: 1.6 }}>
              Join the most advanced internship ecosystem in UTeM. AI-powered matching, skill analysis, and career growth all in one place.
            </p>
          </div>
        </div>
        
        <div className="auth-side-foot">
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>2k+</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Students</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>500+</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Companies</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <Link to="/" className="auth-back">
            <Icons.IconArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to landing
          </Link>

          {isVerifying ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="auth-head">
                <h1 className="auth-title">Check your email</h1>
                <p className="auth-sub">We've sent a 8-digit verification code to <br/> <b>{email}</b></p>
              </div>
              <form onSubmit={handleVerifyOtp}>
                <div className="otp-group">
                  {otp.map((d, i) => (
                    <input key={i} id={`otp-${i}`} type="text" maxLength="1" value={d} onChange={(e) => {
                      const val = e.target.value;
                      if (!/^\d*$/.test(val)) return;
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);
                      if (val && i < 7) document.getElementById(`otp-${i+1}`).focus();
                    }} onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`).focus();
                    }} className="otp-input" />
                  ))}
                </div>
                {error && <div className="auth-err"><Icons.IconAlert size={14} /> {error}</div>}
                <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
                  {loading ? 'Verifying...' : 'Verify account'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="auth-head">
                <div className="auth-badge">
                  <Icons.IconSparkle size={10} /> {isLogin ? 'Welcome back' : 'New account'}
                </div>
                <h1 className="auth-title">{isLogin ? 'Sign in to FitFlow' : 'Create your account'}</h1>
                <p className="auth-sub">{isLogin ? 'Access your dashboard and matches.' : 'Join the smarter way to find internships.'}</p>
              </div>

              {!isLogin && (
                <div className="role-sel">
                  <button onClick={() => setRole('student')} className={`role-btn ${role === 'student' ? 'role-active' : ''}`}>
                    <Icons.IconTarget size={14} /> Student
                  </button>
                  <button onClick={() => setRole('coordinator')} className={`role-btn ${role === 'coordinator' ? 'role-active' : ''}`}>
                    <Icons.IconBriefcase size={14} /> Coordinator
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="auth-err"><Icons.IconAlert size={14} /> {error}</div>}
                
                {!isLogin && (
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <div className="input-wrap">
                      <Icons.IconUsers size={16} className="input-icon" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmad Ali" required />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-wrap">
                    <Icons.IconDoc size={16} className="input-icon" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" required />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrap">
                    <Icons.IconGear size={16} className="input-icon" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                  </div>
                  {!isLogin && password && (
                    <div className="pass-strength">
                      <div className="strength-bar">
                        {[1, 2, 3, 4].map(l => <div key={l} className={`strength-bit ${l <= getPasswordStrength(password) ? 'bit-active' : ''}`} />)}
                      </div>
                      <div className="strength-label" style={{ color: getStrengthMeta(getPasswordStrength(password)).color }}>
                        {getStrengthMeta(getPasswordStrength(password)).label}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                  <Icons.IconArrowRight size={14} />
                </button>
              </form>

              <div className="auth-sep"><span>Or continue with</span></div>

              <button onClick={handleGoogleLogin} className="btn btn-ghost w-full justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-mute)' }}>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>{' '}
                <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
