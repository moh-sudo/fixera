import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Plus } from 'lucide-react';

import { useCL } from '../../hooks/useCL';

const ACTIVE_REQUESTS = [
  { id: 'INS-48291', category: { icon: '💧', label: 'Plumbing', color: '#2F7FD1' }, issue: 'Kitchen sink leaking under the cabinet with water pooling on the floor.', urgency: { label: 'Moderate', color: '#E07B2A' }, status: 'quotation_ready', submitted: 'Today, 10:32 AM', photos: 3 },
];

const PAST_REQUESTS = [
  { id: 'INS-39102', category: { icon: '⚡', label: 'Electrical', color: '#C9A020' }, issue: 'Lights flickering in the living room, circuit breaker trips occasionally.', urgency: { label: 'Emergency', color: '#E24B4A' }, status: 'completed', submitted: 'May 10, 2026', photos: 2, finalCost: 3200 },
  { id: 'INS-31045', category: { icon: '🎨', label: 'Painting', color: '#E07B2A' }, issue: 'Peeling paint on the exterior walls, need full repaint estimate.', urgency: { label: 'Not Urgent', color: '#1E9E5A' }, status: 'declined', submitted: 'Apr 28, 2026', photos: 5 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' } }),
};

function RequestCard({ req, navigate }) {
  const CL = useCL();
  const STATUS_CONFIG = {
    quotation_ready: { label: 'Quotation Ready', color: CL.gold,    bg: CL.goldSoft,   border: CL.gold + '40'    },
    under_review:    { label: 'Under Review',    color: CL.info,    bg: CL.infoBg,     border: CL.info + '40'    },
    completed:       { label: 'Completed',       color: CL.success, bg: CL.successBg,  border: CL.success + '40' },
    declined:        { label: 'Declined',        color: CL.error,   bg: CL.errorBg,    border: CL.error + '40'   },
  };
  const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.under_review;
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show"
      onClick={() => req.status === 'quotation_ready' && navigate('/quotation/demo')}
      style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', cursor: req.status === 'quotation_ready' ? 'pointer' : 'default', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}
      whileHover={req.status === 'quotation_ready' ? { y: -2, boxShadow: '0 8px 24px rgba(10,22,40,0.10)' } : {}}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: req.category.color + '15', border: `1px solid ${req.category.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {req.category.icon}
          </div>
          <div>
            <div style={{ color: req.category.color, fontSize: 12, fontWeight: 700 }}>{req.category.label}</div>
            <div style={{ color: CL.light, fontSize: 11, marginTop: 2 }}>#{req.id} · {req.submitted}</div>
          </div>
        </div>
        <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '4px 12px' }}>
          <span style={{ color: st.color, fontSize: 11, fontWeight: 700 }}>{st.label}</span>
        </div>
      </div>

      <div style={{ color: CL.text, fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
        {req.issue.length > 100 ? req.issue.slice(0, 100) + '…' : req.issue}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ color: req.urgency.color, fontSize: 12, fontWeight: 600 }}>⚠ {req.urgency.label}</span>
          <span style={{ color: CL.light, fontSize: 12 }}>📷 {req.photos} photos</span>
          {req.finalCost && <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>KSh {req.finalCost.toLocaleString()}</span>}
        </div>
        {req.status === 'quotation_ready' && (
          <div style={{ background: CL.navy, color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20 }}>
            View Quotation →
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function InspectionDashboardPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');

  const stats = [
    { val: '1', label: 'Active',           color: CL.info    },
    { val: '1', label: 'Awaiting Approval', color: CL.gold    },
    { val: '1', label: 'Completed',        color: CL.success },
    { val: '3', label: 'Total Requests',   color: CL.muted   },
  ];

  const HOW_IT_WORKS = [
    { icon: '📝', label: 'Describe Problem', sub: 'Use your own words' },
    { icon: '📷', label: 'Upload Photos',    sub: 'Show us the issue' },
    { icon: '🔍', label: 'Fixera Reviews',   sub: 'Within 1–2 hours'  },
    { icon: '💰', label: 'Get Quotation',    sub: 'Fixed price'        },
    { icon: '✅', label: 'Approve & Fix',    sub: 'Pro dispatched'     },
  ];

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/profile')} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Inspections & Quotes</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Get a fixed quote before any work starts</div>
          </div>
        </div>
        <button onClick={() => navigate('/inspection')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> New
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '18px 18px 80px' }}>

        {/* Stats strip */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, display: 'flex', overflow: 'hidden', marginBottom: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '16px 8px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${CL.border}` : 'none' }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 900, marginBottom: 3 }}>{s.val}</div>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', marginBottom: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
          <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>How It Works</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                {i < 4 && <div style={{ position: 'absolute', top: 18, left: '60%', right: '-40%', height: 2, background: `linear-gradient(90deg, ${CL.gold}40, ${CL.gold}10)`, zIndex: 0 }} />}
                <div style={{ position: 'relative', zIndex: 1, width: 38, height: 38, borderRadius: '50%', background: CL.goldSoft, border: `1.5px solid ${CL.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, margin: '0 auto 8px' }}>
                  {s.icon}
                </div>
                <div style={{ color: CL.text, fontSize: 10, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: CL.light, fontSize: 9, lineHeight: 1.4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          style={{ display: 'flex', gap: 4, marginBottom: 16, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 5, width: 'fit-content' }}>
          {[
            { id: 'active', label: '🔍 Active', count: ACTIVE_REQUESTS.length },
            { id: 'past',   label: '📋 Past',   count: PAST_REQUESTS.length   },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500, transition: 'all 0.15s',
              background: tab === t.id ? CL.navy : 'transparent',
              color: tab === t.id ? '#fff' : CL.muted,
            }}>
              {t.label}
              <span style={{ marginLeft: 6, background: tab === t.id ? 'rgba(255,255,255,0.15)' : CL.bg, borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {t.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Active */}
        {tab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACTIVE_REQUESTS.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '56px 24px', background: CL.surface, borderRadius: 18, border: `1px solid ${CL.border}` }}>
                <Search size={48} color={CL.border} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 14px' }} />
                <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No active requests</div>
                <div style={{ color: CL.muted, fontSize: 13, marginBottom: 22 }}>Not sure what's wrong? Let us take a look.</div>
                <button onClick={() => navigate('/inspection')} style={{ padding: '13px 26px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Request an Inspection
                </button>
              </motion.div>
            ) : (
              ACTIVE_REQUESTS.map(req => <RequestCard key={req.id} req={req} navigate={navigate} />)
            )}
          </div>
        )}

        {/* Past */}
        {tab === 'past' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PAST_REQUESTS.map(req => <RequestCard key={req.id} req={req} navigate={navigate} />)}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
          style={{ marginTop: 24, background: CL.navy, borderRadius: 18, padding: '22px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 5 }}>🤔 Not sure what's wrong?</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6 }}>Upload photos and get a professional quote in under 2 hours.</div>
          </div>
          <button onClick={() => navigate('/inspection')} style={{ padding: '11px 18px', borderRadius: 12, background: CL.gold, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Start →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
