import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { Btn, Input } from '../../components/UI';
import { supabase } from '../../supabase';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">

        <button onClick={() => navigate('/login')} style={{ color: C.textSec, fontSize: 14, cursor: 'pointer', marginBottom: 24, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to Login
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <div style={{ color: C.textPrimary, fontSize: 28, fontWeight: 800 }}>Forgot Password?</div>
          <div style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>
            Enter your email and we'll send you a reset link
          </div>
        </div>

        {/* Sent success state */}
        {sent ? (
          <div style={{ background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.3)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
            <div style={{ color: '#48BB78', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Check Your Email!</div>
            <div style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              We sent a password reset link to<br />
              <strong style={{ color: C.textPrimary }}>{email}</strong>
            </div>
            <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 24 }}>
              Didn't get it? Check your spam folder or try again.
            </div>
            <button
              onClick={() => setSent(false)}
              style={{ color: C.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
            >
              Resend email
            </button>
          </div>
        ) : (
          <div style={{ background: C.navyLight, border: `1px solid ${C.navyBorder}`, borderRadius: 20, padding: 28 }}>
            <Input
              label="Email Address" icon="📧"
              placeholder="your@email.com"
              value={email}
              onChange={setEmail}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />

            {error && (
              <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#FC8181', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <Btn onClick={handleSend} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending...' : '📨 Send Reset Link'}
            </Btn>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => navigate('/login')} style={{ color: C.textSec, fontSize: 13, cursor: 'pointer', background: 'none', border: 'none' }}>
            Remember your password? <span style={{ color: C.gold, fontWeight: 700 }}>Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
