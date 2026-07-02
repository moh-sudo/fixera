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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      if (!data.user) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // Check if user is admin in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        setError('Admin profile not found');
        setLoading(false);
        return;
      }

      if (!profile.is_admin) {
        setError('You do not have admin access. Contact support.');
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
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
          </div>

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
