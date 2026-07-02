import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  purple: '#8B5CF6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  navy: '#0A1628',
};

function getStatusColor(s) {
  return { upcoming: CL.gold, confirmed: CL.blue, in_progress: CL.green, completed: CL.green, cancelled: CL.red }[s] || CL.gold;
}
function getStatusEmoji(s) {
  return { upcoming: '⏳', confirmed: '✅', in_progress: '🔧', completed: '🎉', cancelled: '❌' }[s] || '❓';
}
function getStatusDesc(s) {
  return { upcoming: 'Waiting to be accepted', confirmed: 'Accepted — get ready to go', in_progress: 'Job is underway', completed: 'Job finished', cancelled: 'Job was cancelled' }[s] || '';
}

export default function JobDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supabase.from('bookings').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false); });
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    await supabase.from('bookings').update({ status, worker_id: user.id, worker_name: profile?.full_name }).eq('id', id);
    if (status === 'in_progress') navigate(`/active/${id}`);
    else setJob(j => ({ ...j, status }));
    setUpdating(false);
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${CL.gold}30`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!job) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', color: CL.muted }}>Job not found</div>
    </div>
  );

  const isMyJob  = job.worker_id === user?.id;
  const canAccept = !job.worker_id && job.status === 'upcoming';
  const sc = getStatusColor(job.status);

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 640, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <button onClick={() => navigate(-1)} style={{
        color: CL.muted, fontSize: 13, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
      }}>← Back</button>

      <div style={{ color: CL.text, fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Job Details</div>

      {/* Status Banner */}
      <div style={{
        background: `${sc}15`, border: `1px solid ${sc}40`,
        borderRadius: 14, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{getStatusEmoji(job.status)}</span>
        <div>
          <div style={{ color: sc, fontSize: 13, fontWeight: 800 }}>{job.status?.toUpperCase()}</div>
          <div style={{ color: CL.muted, fontSize: 12 }}>{getStatusDesc(job.status)}</div>
        </div>
      </div>

      {/* Job Info Card */}
      <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22, marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 14 }}>{job.sub_service || job.service}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '📍', label: 'Address',  val: job.address || 'Not specified' },
            { icon: '📅', label: 'Date',     val: job.booking_date },
            { icon: '🕐', label: 'Time',     val: job.booking_time },
            { icon: '💰', label: 'Payment',  val: 'M-Pesa (on completion)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{r.icon}</span>
              <div>
                <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600 }}>{r.label}</div>
                <div style={{ color: CL.text, fontSize: 14, marginTop: 1 }}>{r.val}</div>
              </div>
            </div>
          ))}
          {job.notes && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, width: 22 }}>📝</span>
              <div>
                <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600 }}>Customer Notes</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 1, fontStyle: 'italic' }}>"{job.notes}"</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Placeholder */}
      <div style={{
        background: CL.surface, border: `1px solid ${CL.border}`,
        borderRadius: 16, height: 160, marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 36 }}>🗺️</div>
        <div style={{ color: CL.muted, fontSize: 13 }}>Navigate to: {job.address || 'Customer Location'}</div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address || 'Nairobi')}`}
          target="_blank" rel="noreferrer"
          style={{
            padding: '8px 18px', borderRadius: 20,
            background: `${CL.gold}15`, border: `1px solid ${CL.gold}40`,
            color: CL.gold, fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
          Open in Google Maps →
        </a>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {canAccept && (
          <button onClick={() => updateStatus('confirmed')} disabled={updating} style={{
            padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
            background: CL.text, border: 'none', color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>✓ Accept This Job</button>
        )}
        {isMyJob && job.status === 'confirmed' && (
          <button onClick={() => updateStatus('in_progress')} disabled={updating} style={{
            padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
            background: CL.green, border: 'none', color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>🚀 Start Job</button>
        )}
        {isMyJob && job.status === 'in_progress' && (
          <button onClick={() => navigate(`/active/${id}`)} style={{
            padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
            background: CL.blue, border: 'none', color: '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>📍 View Active Job</button>
        )}
        {isMyJob && job.status === 'in_progress' && (
          <a
            href={`https://wa.me/${encodeURIComponent(job.customer_phone || '+254')}?text=${encodeURIComponent('Hi! I\'ve completed your Fixera job. What\'s your completion code so I can mark it as done in the app?')}`}
            target="_blank" rel="noreferrer"
            style={{
              padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 800,
              background: '#25D366', border: 'none', color: '#fff',
              cursor: 'pointer', textDecoration: 'none', display: 'block', textAlign: 'center',
              fontFamily: 'inherit',
            }}>
            💬 Request Completion Code via WhatsApp
          </a>
        )}
        {isMyJob && ['confirmed', 'in_progress'].includes(job.status) && (
          <button onClick={() => updateStatus('cancelled')} disabled={updating} style={{
            padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            background: CL.redSoft, border: `1px solid ${CL.red}40`, color: CL.red,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel Job</button>
        )}
      </div>
    </div>
  );
}
