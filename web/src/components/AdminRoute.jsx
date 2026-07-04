import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 40, height: 40, border: '3px solid rgba(201,160,32,0.2)', borderTopColor: '#C9A020', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();

  // Still loading auth session
  if (loading) return <Spinner />;

  // Not logged in — send to the ADMIN login (not the customer login)
  if (!user) return <Navigate to="/admin/login" replace />;

  // Logged in but profile not yet fetched from DB — wait for it
  if (!profile) return <Spinner />;

  // Profile loaded but not admin
  if (!profile.is_admin) return <Navigate to="/home" replace />;

  return children;
}
