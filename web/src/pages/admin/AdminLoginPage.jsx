import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { C } from '../../theme';
import { Btn, Input } from '../../components/UI';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleForgot = async () => {
    if (!email.trim()) { setError('Enter your admin email first, then tap "Forgot password".'); return; }
    setResetting(true); setError(''); setNotice('');
    try {
      const { error: rErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (rErr) throw rErr;
      setNotice(`Password reset link sent to ${email.trim()}. Check your inbox (and spam).`);
    } catch (err) {
      setError(err.message || 'Could not send reset link. Try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    // Race any promise against a timeout so a stalled request can't spin forever
    const withTimeout = (p, ms, label) => Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — check your connection and try again.`)), ms)),
    ]);

    try {
      // 1. Authenticate with Supabase
      console.log('[admin-login] 1/4 signing in…');
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() }),
        15000, 'Sign-in',
      );
      console.log('[admin-login] 2/4 sign-in returned', { user: data?.user?.id, err: authError?.message });

      if (authError) throw authError;
      if (!data.user) { setError('Login failed. Please try again.'); return; }

      // 2. Confirm admin status
      console.log('[admin-login] 3/4 loading profile…');
      const { data: profile, error: profileError } = await withTimeout(
        supabase.from('profiles').select('is_admin, full_name').eq('id', data.user.id).single(),
        15000, 'Profile lookup',
      );
      console.log('[admin-login] 4/4 profile returned', { profile, err: profileError?.message });

      if (profileError || !profile) { setError('Admin profile not found'); return; }
      if (!profile.is_admin) { setError('You do not have admin access. Contact support.'); return; }

      // 3. Success
      console.log('[admin-login] ✓ navigating to /admin');
      navigate('/admin');
    } catch (err) {
      console.error('[admin-login] ✗ error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="fade-in">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ color: C.textPrimary, fontSize: 28, fontWeight: 800 }}>Admin Login</div>
          <div style={{ color: C.textSec, fontSize: 14, marginTop: 6 }}>
            Fixera Administration Portal
          </div>
        </div>

        {/* Login Form */}
        <div style={{ background: C.navyLight, border: `1px solid ${C.navyBorder}`, borderRadius: 20, padding: 28 }}>

          {/* Email */}
          <Input
            label="Admin Email"
            icon="📧"
            placeholder="admin@fixera.africa"
            value={email}
            onChange={setEmail}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />

          {/* Password */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', color: C.textSec, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              🔑 Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: C.navyMid,
                border: `1px solid ${C.navyBorder}`,
                borderRadius: 12,
                color: C.textPrimary,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = C.gold}
              onBlur={e => e.target.style.borderColor = C.navyBorder}
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button
                type="button"
                onClick={handleForgot}
                disabled={resetting}
                style={{ background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 600, cursor: resetting ? 'default' : 'pointer', padding: 0, fontFamily: 'inherit', opacity: resetting ? 0.6 : 1 }}
              >
                {resetting ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>
          </div>

          {/* Success notice */}
          {notice && (
            <div style={{
              background: 'rgba(72,187,120,0.1)',
              border: '1px solid rgba(72,187,120,0.35)',
              borderRadius: 10,
              padding: '10px 14px',
              marginTop: 16,
              color: '#48BB78',
              fontSize: 13,
            }}>
              ✅ {notice}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(252,129,129,0.1)',
              border: '1px solid rgba(252,129,129,0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              marginTop: 16,
              color: '#FC8181',
              fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login Button */}
          <Btn
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 20,
              background: 'linear-gradient(135deg, #C9A020, #D4B033)',
            }}
          >
            {loading ? '⏳ Logging in...' : '🔓 Admin Login'}
          </Btn>
        </div>

        {/* Info Box */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: 'rgba(201,160,32,0.1)',
          border: '1px solid rgba(201,160,32,0.3)',
          borderRadius: 12,
          color: C.textSec,
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          <strong style={{ color: C.gold }}>👤 Admin Only</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            This portal is restricted to Fixera administrators only. If you don't have admin access, please contact support.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a
            href="/"
            style={{
              color: C.textSec,
              fontSize: 13,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.target.style.color = C.gold}
            onMouseLeave={e => e.target.style.color = C.textSec}
          >
            ← Back to Fixera
          </a>
        </div>
      </div>
    </div>
  );
}
