import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import { requestUserLocation } from '../../hooks/useUserLocation';
import GuestContactModal from '../../components/GuestContactModal';
import { supabase } from '../../supabase';
import { GoogleIcon, FacebookIcon, AppleIcon, SocialRow } from '../../components/SocialButtons';
import { useCL } from '../../hooks/useCL';

export default function LoginPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { signIn, continueAsGuest } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleGuestContinue = async (contact) => {
    await continueAsGuest(contact);
    requestUserLocation();
    navigate('/home');
  };

  const handleLogin = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      await signIn({ email: form.email, password: form.password });
      requestUserLocation();
      navigate('/home');
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('not found')) setError('Incorrect email or password. Please try again.');
      else if (msg.includes('rate') || msg.includes('too many')) setError('Too many attempts. Please wait a moment and try again.');
      else if (msg.includes('email not confirmed')) setError('Please check your email and click the confirmation link first.');
      else setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider) => {
    setError('');
    try {
      const { error: oErr } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/home' } });
      if (oErr) setError(`${provider[0].toUpperCase() + provider.slice(1)} sign-in is not available yet. Please use email.`);
    } catch { setError('Social sign-in is not available yet. Please use email.'); }
  };

  const fieldStyle = { width: '100%', padding: '15px 16px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s' };

  return (
    <AuthLayout>
      <style>{`.auth-input:focus{ border-color:${CL.gold} !important; box-shadow:0 0 0 3px rgba(201,160,32,0.16); } .auth-btn:active{ transform:scale(0.985); }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo (mobile only — desktop shows it on the photo panel) */}
        <div className="auth-form-logo" style={{ marginBottom: 28 }}>
          <BrandLogo height={64} onLight />
        </div>

        <h1 style={{ margin: '0 0 28px', fontSize: 32, fontWeight: 800, color: CL.text, letterSpacing: -0.5 }}>Sign in</h1>

        {/* Email */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 }}>Email address</label>
          <input className="auth-input" style={fieldStyle} type="email" placeholder="you@email.com"
            value={form.email} onChange={update('email')} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="auth-input" style={{ ...fieldStyle, paddingRight: 46 }} type={showPw ? 'text' : 'password'} placeholder="Enter password"
              value={form.password} onChange={update('password')} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={() => setShowPw(s => !s)} type="button" aria-label="Toggle password"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: CL.muted }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: CL.gold, cursor: 'pointer' }} />
            Remember me
          </label>
          <button onClick={() => navigate('/forgot-password')} style={{ color: CL.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>Forgot password?</button>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F0B5B5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#B3261E', fontSize: 13 }}>⚠️ {error}</div>
        )}

        {/* Black sign in button */}
        <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.45)' }} className="auth-btn" onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: CL.black, border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 12px 28px rgba(10,22,40,0.30)', transition: 'box-shadow 0.2s' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </motion.button>

        {/* Sign up + Forgot links */}
        <div style={{ textAlign: 'center', margin: '18px 0', color: CL.muted, fontSize: 14 }}>
          Don&apos;t have an account?{' '}
          <button onClick={() => navigate('/signup')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontSize: 14 }}>Sign up</button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: CL.border }} />
          <span style={{ color: CL.muted, fontSize: 12 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: CL.border }} />
        </div>

        {/* Social */}
        <SocialRow>
          <button onClick={() => handleOAuth('google')} aria-label="Sign in with Google" className="social-btn"><GoogleIcon /></button>
          <button onClick={() => handleOAuth('facebook')} aria-label="Sign in with Facebook" className="social-btn"><FacebookIcon /></button>
          <button onClick={() => handleOAuth('apple')} aria-label="Sign in with Apple" className="social-btn"><AppleIcon /></button>
        </SocialRow>

        {/* Guest */}
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button onClick={() => setShowGuestModal(true)} style={{ color: CL.muted, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
            Just browsing? Continue as guest
          </button>
        </div>

        {/* Legal footer */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Terms', path: '/terms' },
            { label: 'Privacy Policy', path: '/privacy' },
            { label: 'AI Policy', path: '/ai-policy' },
          ].map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ color: CL.light, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>

      {showGuestModal && <GuestContactModal onContinue={handleGuestContinue} onClose={() => setShowGuestModal(false)} />}
    </AuthLayout>
  );
}
