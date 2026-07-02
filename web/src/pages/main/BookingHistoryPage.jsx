import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, User, MapPin, FileText, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserBookings } from '../../services/bookingService';

import { useCL } from '../../hooks/useCL';

const TABS = ['All', 'upcoming', 'completed', 'cancelled'];
const TAB_LABELS = { All: 'All', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function BookingHistoryPage() {
  const CL = useCL();
  const STATUS_STYLE = {
    upcoming:  { bg: CL.goldSoft,   color: '#8a6d12'  },
    completed: { bg: CL.successBg,  color: CL.success  },
    cancelled: { bg: CL.errorBg,    color: CL.error    },
    pending:   { bg: CL.infoBg,     color: CL.info     },
  };
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserBookings(user.id).then(setBookings).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const list = tab === 'All' ? bookings : bookings.filter(b => b.status === tab);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
      <style>{`.bk-card:hover{ box-shadow:0 12px 28px rgba(10,22,40,0.08); }`}</style>

      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate('/profile')} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>My Bookings</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Your service history</div>
        </div>
      </div>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '16px 18px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 18px', borderRadius: 999, whiteSpace: 'nowrap',
            border: `1px solid ${tab === t ? CL.navy : CL.border}`,
            background: tab === t ? CL.navy : CL.surface,
            color: tab === t ? '#fff' : CL.muted,
            fontWeight: tab === t ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{TAB_LABELS[t]}</button>
        ))}
      </motion.div>

      <div style={{ padding: '16px 18px 0' }}>
        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 20, height: 96 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="sk" style={{ width: 48, height: 48, borderRadius: 14 }} />
                  <div style={{ flex: 1 }}>
                    <div className="sk" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
                    <div className="sk" style={{ height: 12, width: '40%', borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            ))}
            <style>{`@keyframes shim{0%{background-position:-300px 0}100%{background-position:300px 0}} .sk{background:linear-gradient(90deg,#eceef1 25%,#f5f6f8 50%,#eceef1 75%);background-size:600px 100%;animation:shim 1.3s infinite linear}`}</style>
          </div>
        )}

        {/* Empty */}
        {!loading && list.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '60px 20px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: CL.text }}>No bookings yet</div>
            <div style={{ fontSize: 14, color: CL.muted, marginBottom: 18 }}>
              {!user ? 'Sign in to see and manage your bookings.' : tab === 'All' ? "You haven't made any bookings yet." : `No ${TAB_LABELS[tab].toLowerCase()} bookings.`}
            </div>
            <button onClick={() => navigate(user ? '/home' : '/login')} style={{ background: CL.navy, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 26px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {user ? 'Book a service' : 'Log in / Sign up'}
            </button>
          </motion.div>
        )}

        {/* List */}
        {!loading && list.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map((b, i) => {
              const st = STATUS_STYLE[b.status] || { bg: '#EEF0F2', color: CL.muted };
              return (
                <motion.div key={b.id} className="bk-card" custom={i} variants={fadeUp} initial="hidden" animate="show"
                  style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 18, transition: 'box-shadow 0.25s', boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{b.service_icon || '🔧'}</div>
                      <div>
                        <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>{b.service_name}</div>
                        <div style={{ color: CL.muted, fontSize: 13, marginTop: 2 }}>{b.category}</div>
                      </div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8 }}>{TAB_LABELS[b.status] || b.status}</span>
                  </div>

                  <div style={{ height: 1, background: CL.border, marginBottom: 14 }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: CL.muted, fontSize: 13 }}><Calendar size={14} /> {b.scheduled_date} · {b.scheduled_time}</span>
                      {b.worker_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: CL.muted, fontSize: 13 }}><User size={14} /> {b.worker_name}</span>}
                      {b.address && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: CL.muted, fontSize: 13 }}><MapPin size={14} /> {b.address}</span>}
                    </div>
                    {b.status === 'completed' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => navigate(`/receipt/${b.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: CL.successBg, border: `1px solid ${CL.success}40`, color: CL.success, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><FileText size={14} /> Receipt</button>
                        <button onClick={() => navigate(`/review/${b.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: CL.goldSoft, border: `1px solid ${CL.gold}55`, color: '#8a6d12', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Star size={14} /> Review</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
