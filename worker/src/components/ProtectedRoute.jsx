import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AGREEMENT_VERSION } from '../data/partnerAgreements';

// Role → home dashboard
export const ROLE_HOME = {
  worker:        '/dashboard',
  vendor:        '/vendor/dashboard',
  rider:         '/rider/dashboard',
  supplier:      '/supplier/dashboard',
  mover:         '/mover/dashboard',
  water_carrier: '/water/dashboard',
};

const Spinner = () => (
  <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(201,160,32,0.2)', borderTopColor:'#C9A020', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
      <div style={{ color:'#C9A020', fontSize:13, fontWeight:600 }}>Loading...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  </div>
);

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading)   return <Spinner />;
  if (!user)     return <Navigate to="/login" replace />;
  if (!profile)  return <Navigate to="/login?error=profile_not_found" replace />;

  // Onboarding gate — ALL partner roles must complete onboarding before accessing dashboard
  if (profile.onboarding_complete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // Terms & Conditions gate — ALL 6 partner types must accept the CURRENT
  // agreement version before reaching any dashboard. Fires on first login
  // AND again whenever AGREEMENT_VERSION is bumped (updated terms).
  if (profile.agreement_version !== AGREEMENT_VERSION && location.pathname !== '/agreement') {
    return <Navigate to="/agreement" replace />;
  }

  // Role-based access — redirect to own home if wrong role
  if (allowedRoles && !allowedRoles.includes(profile.partner_role || 'worker')) {
    const home = ROLE_HOME[profile.partner_role] || '/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
}
