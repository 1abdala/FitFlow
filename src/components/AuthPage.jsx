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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordRulesStatus = (pass) => {
    return {
      minLength: pass.length >= 8,
      hasUppercase: /[A-Z]/.test(pass),
      hasLowercase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[^A-Za-z0-9]/.test(pass)
    };
  };

  const getPasswordScore = (rulesStatus) => {
    return Object.values(rulesStatus).filter(Boolean).length;
  };

  const getStrengthInfo = (pass) => {
    if (!pass) {
      return {
        label: 'None',
        segments: 0,
        color: 'var(--text-dim)',
        bgColor: 'transparent',
        borderColor: 'var(--border)'
      };
    }
    const rules = getPasswordRulesStatus(pass);
    const score = getPasswordScore(rules);
    if (score <= 2) {
      return {
        label: 'Weak',
        segments: 1,
        color: 'var(--danger)',
        bgColor: 'var(--danger-soft)',
        borderColor: 'rgba(248, 113, 113, 0.2)'
      };
    } else if (score === 3) {
      return {
        label: 'Fair',
        segments: 2,
        color: 'var(--warn)',
        bgColor: 'var(--warn-soft)',
        borderColor: 'rgba(251, 191, 36, 0.2)'
      };
    } else if (score === 4) {
      return {
        label: 'Good',
        segments: 3,
        color: 'var(--accent-2)',
        bgColor: 'var(--accent-soft)',
        borderColor: 'rgba(122, 166, 255, 0.2)'
      };
    } else {
      return {
        label: 'Strong',
        segments: 4,
        color: 'var(--pos)',
        bgColor: 'var(--pos-soft)',
        borderColor: 'rgba(52, 211, 153, 0.2)'
      };
    }
  };

  useEffect(() => {
    const handleOAuthSession = async (session) => {
      try {
        setLoading(true);
        const userEmail = session.user.email;
        const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
        let { data: existingUser } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        
        if (!existingUser) {
          existingUser = {
            id: session.user.id,
            role: 'student',
            full_name: userName
          };
          await supabase.from('profiles').insert([existingUser]);
        }

        const subTable = 'student_profiles';
        const { data: subProfile } = await supabase.from(subTable).select('id').eq('id', session.user.id).maybeSingle();
        if (!subProfile) {
          await supabase.from(subTable).insert([{ id: session.user.id }]);
        }
        
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
      // Profile creation and navigation is handled by onAuthStateChange
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;
        // Navigation and profile checks are handled by onAuthStateChange
      } else {
        const rules = getPasswordRulesStatus(password);
        const isPasswordValid = rules.minLength && rules.hasUppercase && rules.hasLowercase && rules.hasNumber && rules.hasSpecial;
        const score = getPasswordScore(rules);
        
        if (score <= 2) {
          throw new Error('Password strength is Weak. Please select a stronger password.');
        }
        if (!isPasswordValid) {
          throw new Error('Please satisfy all password rules.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        const { data: signUpData, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role: role } } });
        if (error) throw error;
        
        if (signUpData?.session) {
          // Auto-logged in (no verification needed) -> handled by onAuthStateChange
        } else {
          setIsVerifying(true);
        }
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const rulesStatus = getPasswordRulesStatus(password);
  const isPasswordValid = rulesStatus.minLength && rulesStatus.hasUppercase && rulesStatus.hasLowercase && rulesStatus.hasNumber && rulesStatus.hasSpecial;
  const score = getPasswordScore(rulesStatus);
  const strengthInfo = getStrengthInfo(password);

  const checklist = [
    { key: 'minLength', text: 'At least 8 characters', satisfied: rulesStatus.minLength },
    { key: 'hasUppercase', text: 'Contains an uppercase letter', satisfied: rulesStatus.hasUppercase },
    { key: 'hasLowercase', text: 'Contains a lowercase letter', satisfied: rulesStatus.hasLowercase },
    { key: 'hasNumber', text: 'Contains a number', satisfied: rulesStatus.hasNumber },
    { key: 'hasSpecial', text: 'Contains a special character', satisfied: rulesStatus.hasSpecial }
  ];

  const isSubmitDisabled = loading || (!isLogin && (
    score <= 2 ||
    password !== confirmPassword ||
    !isPasswordValid ||
    !password ||
    !confirmPassword
  ));

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
                {error && <div className="auth-err"><Icons.IconAlertCircle size={14} /> {error}</div>}
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



              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="auth-err"><Icons.IconAlertCircle size={14} /> {error}</div>}
                
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
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      className="input-icon"
                    >
                      {showPassword ? <Icons.IconEyeOff size={16} /> : <Icons.IconEye size={16} />}
                    </button>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {!isLogin && password && (
                    <div style={{ marginTop: '12px' }}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-mute)' }}>Password Strength</span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            color: strengthInfo.color,
                            backgroundColor: strengthInfo.bgColor,
                            borderColor: strengthInfo.borderColor,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {strengthInfo.label}
                        </motion.span>
                      </div>

                      {/* Divided Progress Bar */}
                      <div className="flex gap-1.5 h-1.5 mb-4">
                        {[1, 2, 3, 4].map((seg) => {
                          const isActive = seg <= strengthInfo.segments;
                          return (
                            <div
                              key={seg}
                              className="flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor: isActive ? strengthInfo.color : 'var(--surface-3)',
                                boxShadow: isActive ? `0 0 8px ${strengthInfo.color}44` : 'none'
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Live Password Rules Checklist */}
                      <div className="space-y-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        {checklist.map((item) => (
                          <div key={item.key} className="flex items-center gap-2.5 text-xs font-medium" style={{ color: item.satisfied ? 'var(--text)' : 'var(--text-dim)' }}>
                            <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {item.satisfied ? (
                                  <motion.div
                                    key="checked"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{ color: 'var(--pos)' }}
                                  >
                                    <Icons.IconCheckCircle size={14} />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="unchecked"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 0.6 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      border: '1.5px solid var(--text-dim)',
                                    }}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className="transition-colors duration-250">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                {!isLogin && (
                  <div className="input-group">
                    <label className="input-label">Confirm Password</label>
                    <div className="input-wrap">
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        className="input-icon"
                      >
                        {showConfirmPassword ? <Icons.IconEyeOff size={16} /> : <Icons.IconEye size={16} />}
                      </button>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••" 
                        style={{ paddingRight: '44px' }}
                        required 
                      />
                      {confirmPassword && (
                        <div className="absolute right-4 flex items-center justify-center pointer-events-none">
                          <AnimatePresence mode="wait">
                            {password === confirmPassword ? (
                              <motion.div
                                key="match"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                style={{ color: 'var(--pos)' }}
                              >
                                <Icons.IconCheckCircle size={16} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="mismatch"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Icons.IconAlertCircle size={16} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    {/* Live Validation Messages */}
                    {confirmPassword && (
                      <div className="text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                        {password === confirmPassword ? (
                          <span style={{ color: 'var(--pos)' }}>Passwords match</span>
                        ) : (
                          <span style={{ color: 'var(--danger)' }}>Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isSubmitDisabled} className="btn btn-primary w-full justify-center">
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
