import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import BrandLogo from '../../components/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import { requestUserLocation } from '../../hooks/useUserLocation';
import { supabase } from '../../supabase';
import { GoogleIcon, FacebookIcon, AppleIcon, SocialRow } from '../../components/SocialButtons';
import { useCL } from '../../hooks/useCL';
import { TERMS_VERSION, PRIVACY_VERSION } from '../../data/legalVersions';

export default function SignUpPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const { signUp, markGuestConverted } = useAuth();

  const prefill = navState?.prefill || null;
  const returnTo = navState?.returnTo || null;

  const [form, setForm] = useState({
    name: prefill?.name || '', phone: prefill?.phone || '', email: prefill?.email || '', password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignUp = async () => {
    setError('');
    if (!form.name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (!agreedTerms || !agreedPrivacy) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return; }
    setLoading(true);
    try {
      const user = await signUp({ email: form.email.trim(), password: form.password, fullName: form.name.trim(), phone: form.phone.trim() });
      if (user?.id) {
        const now = new Date().toISOString();
        supabase.from('profiles').update({ terms_version: TERMS_VERSION, terms_accepted_at: now, privacy_version: PRIVACY_VERSION, privacy_accepted_at: now }).eq('id', user.id).then(() => {});
      }
      requestUserLocation();
      if (prefill?.phone) markGuestConverted(prefill.phone);
      if (returnTo?.path) navigate(returnTo.path, { state: returnTo.state });
      else navigate('/home');
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) setError('An account with this email already exists. Try logging in.');
      else if (msg.includes('invalid email')) setError('Please enter a valid email address.');
      else if (msg.includes('password')) setError('Password is too weak. Use at least 6 characters.');
      else setError(err.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOAuth = async (provider) => {
    setError('');
    try {
      const { error: oErr } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/home' } });
      if (oErr) setError(`${provider[0].toUpperCase() + provider.slice(1)} sign-up is not available yet. Please use email.`);
    } catch { setError('Social sign-up is not available yet. Please use email.'); }
  };

  const fieldStyle = { width: '100%', padding: '15px 16px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 };

  return (
    <AuthLayout>
      <style>{`.auth-input:focus{ border-color:${CL.gold} !important; box-shadow:0 0 0 3px rgba(201,160,32,0.16); }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo (mobile only — desktop shows it on the photo panel) */}
        <div className="auth-form-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <BrandLogo height={64} onLight />
        </div>

        {/* Toggle: Sign Up | Log In */}
        <div style={{ display: 'flex', background: CL.border, borderRadius: 14, padding: 4, marginBottom: 24, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 11, background: CL.black, color: '#fff', fontSize: 14, fontWeight: 700 }}>Sign Up</div>
          <button onClick={() => navigate('/login')} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 11, background: 'transparent', color: CL.muted, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Log In</button>
        </div>

        <h1 style={{ margin: '0 0 22px', fontSize: 28, fontWeight: 800, color: CL.text, letterSpacing: -0.5, textAlign: 'center' }}>
          {prefill ? 'Almost done!' : 'Create your account'}
        </h1>

        {/* Full name */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Full name</label>
          <input className="auth-input" style={fieldStyle} placeholder="Enter your full name" value={form.name} onChange={update('name')} />
        </div>

        {/* Phone + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Phone number</label>
            <input className="auth-input" style={fieldStyle} placeholder="+254 7XX XXX XXX" value={form.phone} onChange={update('phone')} />
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <input className="auth-input" style={fieldStyle} type="email" placeholder="you@email.com" value={form.email} onChange={update('email')} />
          </div>
        </div>

        {/* Password + Confirm */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="auth-input" style={{ ...fieldStyle, paddingRight: 42 }} type={showPw ? 'text' : 'password'} placeholder="Min. 6 chars" value={form.password} onChange={update('password')} />
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label="Toggle password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm</label>
            <div style={{ position: 'relative' }}>
              <input className="auth-input" style={{ ...fieldStyle, paddingRight: 42 }} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm} onChange={update('confirm')} />
              <button type="button" onClick={() => setShowConfirm(s => !s)} aria-label="Toggle confirm password" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: CL.muted, display: 'flex', alignItems: 'center' }}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F0B5B5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#B3261E', fontSize: 13 }}>⚠️ {error}</div>
        )}

        {/* Consent checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, padding: '14px 16px', background: 'rgba(201,160,32,0.04)', border: `1px solid rgba(201,160,32,0.15)`, borderRadius: 12 }}>
          {[
            { key: 'terms',   val: agreedTerms,   set: setAgreedTerms,   label: 'I agree to the', link: 'Terms of Service', path: '/terms' },
            { key: 'privacy', val: agreedPrivacy, set: setAgreedPrivacy, label: 'I agree to the', link: 'Privacy Policy',   path: '/privacy' },
          ].map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: CL.gold, cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ color: CL.muted, fontSize: 13, lineHeight: 1.5 }}>
                {c.label}{' '}
                <span onClick={e => { e.preventDefault(); navigate(c.path); }} style={{ color: CL.gold, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>{c.link}</span>
                <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
              </span>
            </label>
          ))}
          <div style={{ color: CL.light, fontSize: 11, marginTop: 4 }}>
            The{' '}
            <span onClick={() => navigate('/ai-policy')} style={{ color: CL.muted, cursor: 'pointer', textDecoration: 'underline' }}>AI Policy</span>
            {' '}also applies to your use of this platform.
          </div>
        </div>

        {/* Black create button */}
        <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.45)' }} onClick={handleSignUp} disabled={loading || !agreedTerms || !agreedPrivacy}
          style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: CL.black, border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: (loading || !agreedTerms || !agreedPrivacy) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (loading || !agreedTerms || !agreedPrivacy) ? 0.5 : 1, boxShadow: '0 12px 28px rgba(10,22,40,0.30)', transition: 'all 0.2s' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
          <div style={{ flex: 1, height: 1, background: CL.border }} />
          <span style={{ color: CL.muted, fontSize: 12 }}>or sign up with</span>
          <div style={{ flex: 1, height: 1, background: CL.border }} />
        </div>

        <SocialRow>
          <button onClick={() => handleOAuth('google')} aria-label="Sign up with Google" className="social-btn"><GoogleIcon /></button>
          <button onClick={() => handleOAuth('facebook')} aria-label="Sign up with Facebook" className="social-btn"><FacebookIcon /></button>
          <button onClick={() => handleOAuth('apple')} aria-label="Sign up with Apple" className="social-btn"><AppleIcon /></button>
        </SocialRow>
      </motion.div>
    </AuthLayout>
  );
}
