import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabase';
import BrandLogo from '../../components/BrandLogo';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  success: '#1A7F3C', successBg: '#F0FAF4', successBorder: '#A3D9B3',
  error: '#C0392B', errorBg: '#FCEBEB', errorBorder: '#F0B5B5',
};

const strengthColors = ['', '#C0392B', '#D4780A', '#C9A020', '#1A7F3C'];
const strengthLabels = ['', 'Too short', 'Weak', 'Good', 'Strong'];

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');
  const [validLink, setValidLink] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) setValidLink(false);
  }, []);

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : password.length > 0 ? 1 : 0;

  const handleReset = async () => {
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => navigate('/signin'), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '13px 44px 13px 44px',
    borderRadius: 11, border: `1px solid ${CL.border}`, background: CL.bg,
    color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.18s',
  };

  /* Invalid link */
  if (!validLink) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: 22, background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertCircle size={32} color={CL.error} strokeWidth={1.7} />
        </div>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Link Invalid or Expired</div>
        <div style={{ color: CL.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
          This reset link has expired or is invalid.<br />Please request a new one.
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/forgot-password')}
          style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: CL.text, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Request New Link
        </motion.button>
      </motion.div>
    </div>
  );

  /* Success */
  if (done) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: CL.successBg, border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
        </div>
        <div style={{ color: CL.success, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Password Reset!</div>
        <div style={{ color: CL.muted, fontSize: 14, marginBottom: 6 }}>Your password has been updated successfully.</div>
        <div style={{ color: CL.muted, fontSize: 13 }}>Redirecting you to sign in…</div>
      </motion.div>
    </div>
  );

  /* Form */
  return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <BrandLogo height={52} onLight />
        </div>

        {/* Icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: CL.goldSoft, border: `1.5px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <KeyRound size={28} color={CL.gold} strokeWidth={1.8} />
          </div>
          <div style={{ color: CL.text, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Set New Password</div>
          <div style={{ color: CL.muted, fontSize: 13 }}>Choose a strong password for your account</div>
        </div>

        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 20, padding: 28 }}>

          {/* New password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={CL.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" style={inputStyle}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
              <button onClick={() => setShowPw(s => !s)} type="button"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={16} color={CL.muted} /> : <Eye size={16} color={CL.muted} />}
              </button>
            </div>
          </div>

          {/* Strength bar */}
          {password && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : CL.border, transition: 'all 0.2s' }} />
                ))}
              </div>
              <div style={{ color: strengthColors[strength], fontSize: 11, fontWeight: 600 }}>{strengthLabels[strength]}</div>
            </div>
          )}

          {/* Confirm password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7 }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color={CL.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input type={showCf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ ...inputStyle, borderColor: confirm && confirm !== password ? CL.errorBorder : CL.border }}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? CL.errorBorder : CL.border} />
              <button onClick={() => setShowCf(s => !s)} type="button"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                {showCf ? <EyeOff size={16} color={CL.muted} /> : <Eye size={16} color={CL.muted} />}
              </button>
            </div>
            {confirm && confirm !== password && (
              <div style={{ color: CL.error, fontSize: 11, marginTop: 5 }}>Passwords do not match</div>
            )}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
              <AlertCircle size={14} color={CL.error} />
              <span style={{ color: CL.error, fontSize: 13 }}>{error}</span>
            </div>
          )}

          <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.4)' }}
            onClick={handleReset} disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? CL.border : CL.text, color: loading ? CL.muted : '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 10px 28px rgba(10,22,40,0.25)' }}>
            <CheckCircle2 size={16} />
            {loading ? 'Updating…' : 'Reset Password'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
