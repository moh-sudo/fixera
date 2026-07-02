import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import PartnerAuthLayout from '../../components/PartnerAuthLayout';
import BrandLogo from '../../components/BrandLogo';
import { GoogleIcon, FacebookIcon, AppleIcon, SocialRow } from '../../components/SocialButtons';

const ROLE_HOME = {
  worker: '/dashboard', vendor: '/vendor/dashboard',
  rider: '/rider/dashboard', supplier: '/supplier/dashboard',
  mover: '/mover/dashboard', water_carrier: '/water/dashboard',
};

const ROLE_LABELS = {
  worker: 'Service Worker', rider: 'Rider / Courier', vendor: 'Business / Vendor',
  supplier: 'Supplier', mover: 'Mover', water_carrier: 'Water Carrier',
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  error: '#C0392B', errorBg: '#FCEBEB', errorBorder: '#F0B5B5',
};

const fieldStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: `1px solid ${CL.border}`, background: CL.surface,
  fontSize: 15, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 };
const btnStyle = {
  width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
  background: CL.text, color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 10px 28px rgba(10,22,40,0.25)', transition: 'box-shadow 0.2s',
};

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: CL.border }} />
      <span style={{ color: CL.muted, fontSize: 12 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: CL.border }} />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { role = 'worker' } = useParams();
  const { signIn } = useAuth();

  const [tab, setTab] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const updateLogin = k => e => setLoginForm(f => ({ ...f, [k]: e.target.value }));

  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const updateSignup = k => e => setSignupForm(f => ({ ...f, [k]: e.target.value }));

  const handleOAuth = async (provider) => {
    setError('');
    try {
      const { error: oErr } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + (ROLE_HOME[role] || '/dashboard') } });
      if (oErr) setError(`${provider[0].toUpperCase() + provider.slice(1)} sign-in is not available yet. Please use email.`);
    } catch { setError('Social sign-in is not available yet. Please use email.'); }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    if (!loginForm.email || !loginForm.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const data = await signIn(loginForm.email, loginForm.password);
      const { data: profile } = await supabase.from('workers').select('partner_role').eq('id', data.user.id).maybeSingle();
      const detectedRole = profile?.partner_role || role;
      navigate(ROLE_HOME[detectedRole] || '/dashboard');
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credentials')) setError('Incorrect email or password. Please try again.');
      else if (msg.includes('email not confirmed')) setError('Please check your email and click the confirmation link first.');
      else if (msg.includes('rate') || msg.includes('too many')) setError('Too many attempts. Please wait a moment.');
      else setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSignUp = (e) => {
    e?.preventDefault();
    setError('');
    if (!signupForm.fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!signupForm.email.trim()) { setError('Please enter your email address.'); return; }
    if (signupForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (signupForm.password !== signupForm.confirm) { setError('Passwords do not match.'); return; }
    navigate('/register', { state: { prefillRole: role, prefillEmail: signupForm.email, prefillName: signupForm.fullName, prefillPhone: signupForm.phone } });
  };

  return (
    <PartnerAuthLayout role={role}>
      <style>{`
        .p-input:focus { border-color: ${CL.gold} !important; box-shadow: 0 0 0 3px rgba(201,160,32,0.14); }
        .partner-logo-mobile { display: none; }
        @media (max-width: 860px) { .partner-logo-mobile { display: flex; justify-content: center; margin-bottom: 20px; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo — mobile only */}
        <div className="partner-logo-mobile">
          <BrandLogo height={52} onLight />
        </div>

        {/* Role badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>{ROLE_LABELS[role] || 'Partner'} Portal</span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: CL.border, borderRadius: 14, padding: 4, marginBottom: 26 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t ? CL.text : 'transparent',
                color: tab === t ? '#fff' : CL.muted }}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: CL.text }}>Welcome back</h1>
            <p style={{ margin: '0 0 22px', color: CL.muted, fontSize: 14 }}>Sign in to your partner account</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input className="p-input" style={fieldStyle} type="email" placeholder="you@email.com"
                  value={loginForm.email} onChange={updateLogin('email')}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="p-input" style={{ ...fieldStyle, paddingRight: 52 }} type={showPw ? 'text' : 'password'} placeholder="Enter password"
                    value={loginForm.password} onChange={updateLogin('password')}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  <button type="button" onClick={() => setShowPw(s => !s)} aria-label="Toggle password"
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: CL.muted }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: CL.gold, cursor: 'pointer' }} />
                  Remember me
                </label>
                <button type="button" onClick={() => navigate('/forgot-password')}
                  style={{ color: CL.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
                  Forgot password?
                </button>
              </div>

              {error && (
                <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 10, padding: '11px 14px', color: CL.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <motion.button type="submit" disabled={loading}
                whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.4)' }}
                style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </motion.button>
            </form>

            <Divider label="or continue with" />
            <SocialRow>
              <button onClick={() => handleOAuth('google')} aria-label="Sign in with Google" className="social-btn"><GoogleIcon /></button>
              <button onClick={() => handleOAuth('facebook')} aria-label="Sign in with Facebook" className="social-btn"><FacebookIcon /></button>
              <button onClick={() => handleOAuth('apple')} aria-label="Sign in with Apple" className="social-btn"><AppleIcon /></button>
            </SocialRow>

            <p style={{ textAlign: 'center', marginTop: 20, color: CL.muted, fontSize: 13 }}>
              Wrong portal?{' '}
              <span onClick={() => navigate('/signin')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer' }}>Change role</span>
            </p>
          </motion.div>
        )}

        {/* ── SIGN UP FORM ── */}
        {tab === 'signup' && (
          <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: CL.text }}>Create account</h1>
            <p style={{ margin: '0 0 22px', color: CL.muted, fontSize: 14 }}>Join as a {ROLE_LABELS[role]} partner</p>

            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input className="p-input" style={fieldStyle} placeholder="John Mwangi"
                  value={signupForm.fullName} onChange={updateSignup('fullName')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input className="p-input" style={fieldStyle} type="email" placeholder="you@email.com"
                    value={signupForm.email} onChange={updateSignup('email')} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input className="p-input" style={fieldStyle} type="tel" placeholder="0712 345 678"
                    value={signupForm.phone} onChange={updateSignup('phone')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="p-input" style={{ ...fieldStyle, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Min. 6 chars"
                      value={signupForm.password} onChange={updateSignup('password')} />
                    <button type="button" onClick={() => setShowPw(s => !s)} aria-label="Toggle password"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm</label>
                  <div style={{ position: 'relative' }}>
                    <input className="p-input" style={{ ...fieldStyle, paddingRight: 44 }} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                      value={signupForm.confirm} onChange={updateSignup('confirm')} />
                    <button type="button" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ color: CL.muted, fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <span onClick={() => navigate('/terms')} style={{ color: CL.gold, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span>{' '}&amp;{' '}
                <span onClick={() => navigate('/privacy')} style={{ color: CL.gold, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
              </div>

              {error && (
                <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 10, padding: '11px 14px', color: CL.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <motion.button type="submit" disabled={loading}
                whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(201,160,32,0.35)' }}
                style={{ ...btnStyle, background: CL.gold, color: '#0A1628', boxShadow: '0 10px 28px rgba(201,160,32,0.28)', opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Setting up…' : 'Continue to Full Registration'}
              </motion.button>
            </form>

            <Divider label="or sign up with" />
            <SocialRow>
              <button onClick={() => handleOAuth('google')} aria-label="Sign up with Google" className="social-btn"><GoogleIcon /></button>
              <button onClick={() => handleOAuth('facebook')} aria-label="Sign up with Facebook" className="social-btn"><FacebookIcon /></button>
              <button onClick={() => handleOAuth('apple')} aria-label="Sign up with Apple" className="social-btn"><AppleIcon /></button>
            </SocialRow>

            <p style={{ textAlign: 'center', marginTop: 16, color: CL.muted, fontSize: 13 }}>
              Wrong portal?{' '}
              <span onClick={() => navigate('/signin')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer' }}>Change role</span>
            </p>
          </motion.div>
        )}
      </div>
    </PartnerAuthLayout>
  );
}
