import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>⚙️</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading Fixera...</div>
      </div>
    );
  }

  // Guests browse freely (Bolt model) — booking pages handle conversion
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
