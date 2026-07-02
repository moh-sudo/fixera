import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import BrandLogo from '../../components/BrandLogo';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  success: '#1A7F3C', successBg: '#F0FAF4', successBorder: '#A3D9B3',
  error: '#C0392B', errorBg: '#FCEBEB', errorBorder: '#F0B5B5',
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const fieldStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${CL.border}`, background: CL.surface,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s',
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <style>{`.fp-input:focus { border-color: ${CL.gold} !important; box-shadow: 0 0 0 3px rgba(201,160,32,0.14); }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <BrandLogo height={52} onLight />
        </div>

        {/* Back button */}
        <button onClick={() => navigate('/signin')}
          style={{ color: CL.muted, fontSize: 14, cursor: 'pointer', marginBottom: 24, background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <ArrowLeft size={16} /> Back to sign in
        </button>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 18, padding: 32, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <MailCheck size={48} color={CL.success} />
            </div>
            <div style={{ color: CL.success, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Check your email</div>
            <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              We sent a password reset link to<br />
              <strong style={{ color: CL.text }}>{email}</strong>
            </div>
            <button onClick={() => setSent(false)}
              style={{ color: CL.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
              Resend email
            </button>
          </motion.div>
        ) : (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: CL.text }}>Forgot password?</h1>
            <p style={{ margin: '0 0 24px', color: CL.muted, fontSize: 14 }}>Enter your email and we'll send you a reset link.</p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 }}>Email address</label>
              <input className="fp-input" style={fieldStyle} type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()} />
            </div>

            {error && (
              <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16, color: CL.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.4)' }}
              onClick={handleSend} disabled={loading}
              style={{ width: '100%', padding: '15px 0', borderRadius: 12, background: CL.text, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 10px 28px rgba(10,22,40,0.25)', transition: 'box-shadow 0.2s' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </motion.button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button onClick={() => navigate('/signin')}
            style={{ color: CL.muted, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
            Remember your password?{' '}
            <span style={{ color: CL.gold, fontWeight: 700 }}>Sign in</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
