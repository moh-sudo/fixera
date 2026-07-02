import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MailCheck } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import BrandLogo from '../../components/BrandLogo';
import { supabase } from '../../supabase';
import { useCL } from '../../hooks/useCL';

export default function ForgotPasswordPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const fieldStyle = { width: '100%', padding: '15px 16px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s' };

  return (
    <AuthLayout>
      <style>{`.auth-input:focus{ border-color:${CL.gold} !important; box-shadow:0 0 0 3px rgba(201,160,32,0.16); }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ width: '100%', maxWidth: 400 }}>

        <div className="auth-form-logo" style={{ marginBottom: 24 }}>
          <BrandLogo height={46} onLight />
        </div>

        <button onClick={() => navigate('/login')} style={{ color: CL.muted, fontSize: 14, cursor: 'pointer', marginBottom: 22, background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to sign in
        </button>

        {sent ? (
          <div style={{ background: CL.successBg, border: `1px solid ${CL.success}40`, borderRadius: 18, padding: 32, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><MailCheck size={48} color={CL.success} /></div>
            <div style={{ color: CL.success, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Check your email</div>
            <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              We sent a password reset link to<br /><strong style={{ color: CL.text }}>{email}</strong>
            </div>
            <button onClick={() => setSent(false)} style={{ color: CL.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}>Resend email</button>
          </div>
        ) : (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 800, color: CL.text, letterSpacing: -0.5 }}>Forgot password?</h1>
            <p style={{ margin: '0 0 24px', color: CL.muted, fontSize: 14 }}>Enter your email and we&apos;ll send you a reset link.</p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 }}>Email address</label>
              <input className="auth-input" style={fieldStyle} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            </div>

            {error && <div style={{ background: '#FCEBEB', border: '1px solid #F0B5B5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#B3261E', fontSize: 13 }}>⚠️ {error}</div>}

            <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.45)' }} onClick={handleSend} disabled={loading}
              style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: CL.black, border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: '0 12px 28px rgba(10,22,40,0.30)', transition: 'box-shadow 0.2s' }}>
              {loading ? 'Sending...' : 'Send reset link'}
            </motion.button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('/login')} style={{ color: CL.muted, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none' }}>
            Remember your password? <span style={{ color: CL.gold, fontWeight: 700 }}>Sign in</span>
          </button>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
