import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CL = {
  muted: '#6B7A8F',
  text:  '#0A1628',
  red:   '#EF4444',
  amber: '#F59E0B',
};

const STATUS_META = {
  pending: {
    bg:    'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
    border:'rgba(245,158,11,0.40)',
    color: '#F59E0B',
    icon:  '⏳',
    title: 'Pending Fixera Verification',
    body:  "Your application is under review. You can register crew and fleet now, but you can't accept jobs until our team approves your account.",
  },
  rejected: {
    bg:    'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
    border:'rgba(239,68,68,0.40)',
    color: '#EF4444',
    icon:  '❌',
    title: 'Application Rejected',
    body:  "Your application was not approved. See reason below — you can re-submit once issues are resolved.",
  },
  suspended: {
    bg:    'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.04))',
    border:'rgba(239,68,68,0.40)',
    color: '#EF4444',
    icon:  '🚫',
    title: 'Account Suspended',
    body:  "Your Fixera account is currently suspended. Contact support to resolve.",
  },
};

export default function VerificationBanner() {
  const { profile } = useAuth();
  const navigate    = useNavigate();
  const status      = profile?.verification_status;

  if (!status || status === 'approved') return null;

  const meta = STATUS_META[status] || STATUS_META.pending;

  return (
    <div style={{
      background: meta.bg, border: `1px solid ${meta.border}`,
      borderRadius: 14, padding: '14px 16px', margin: '0 0 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ fontSize: 24, flexShrink: 0 }}>{meta.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: meta.color, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{meta.title}</div>
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.5 }}>{meta.body}</div>
        {status === 'rejected' && profile?.rejection_reason && (
          <div style={{
            marginTop: 8, padding: '8px 10px',
            background: `${meta.color}10`, borderRadius: 8,
            color: CL.text, fontSize: 12, lineHeight: 1.4,
            border: `1px solid ${meta.color}30`,
          }}>
            <strong style={{ color: meta.color }}>Reason:</strong> {profile.rejection_reason}
          </div>
        )}
        {status === 'suspended' && (
          <button onClick={() => navigate('/support')} style={{
            marginTop: 10, padding: '8px 16px', borderRadius: 8,
            background: meta.color, color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Contact Support →</button>
        )}
      </div>
    </div>
  );
}

export function isApproved(profile) {
  return profile?.verification_status === 'approved';
}
