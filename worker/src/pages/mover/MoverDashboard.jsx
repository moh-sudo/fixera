import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { listOpenMovingRequests, listMyQuotes } from '../../services/moverService';
import VerificationBanner from '../../components/VerificationBanner';
import { motion } from 'framer-motion';
import { Truck, CheckCircle2, FileText, Inbox, MapPin, Calendar, Package } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', red: '#EF4444', blue: '#3B82F6',
  purple: '#8B5CF6', navy: '#0A1628',
};

const STATUS_META = {
  awaiting_quotes: { label: 'New', color: '#F59E0B' },
  quoted:          { label: 'You Quoted', color: CL.blue },
  accepted:        { label: 'Accepted', color: CL.green },
  in_progress:     { label: 'In Progress', color: CL.gold },
  delivered:       { label: 'Awaiting Sign-off', color: CL.purple },
  completed:       { label: 'Completed', color: CL.green },
  cancelled:       { label: 'Cancelled', color: CL.red },
};

export default function MoverDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('open');
  const [openRequests, setOpenRequests] = useState([]);
  const [myQuotes, setMyQuotes]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const open = await listOpenMovingRequests();
      setOpenRequests(open);
      if (user) {
        const mine = await listMyQuotes(user.id);
        setMyQuotes(mine);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load requests. Make sure the moving_requests table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const acceptedJobs = myQuotes.filter(q =>
    q.status === 'accepted' && q.moving_requests &&
    ['accepted', 'in_progress', 'delivered'].includes(q.moving_requests.status)
  );

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <VerificationBanner />
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>
          {profile?.business_name || 'My Moving Company'}
        </div>
        <div style={{ color: CL.purple, fontSize: 13, marginTop: 4, fontWeight: 600 }}>Mover Dashboard</div>
      </motion.div>

      {/* Stats */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <Stat value={openRequests.length} label="Open Requests" color="#F59E0B" />
        <Stat value={acceptedJobs.length} label="Accepted Jobs" color={CL.green} />
        <Stat value={myQuotes.length}     label="Total Quotes"  color={CL.blue} />
      </motion.div>

      {/* Tabs */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 4, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[
          { id: 'open',     label: `Open (${openRequests.length})` },
          { id: 'accepted', label: `My Jobs (${acceptedJobs.length})` },
          { id: 'history',  label: 'History' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8,
            background: tab === t.id ? CL.text : 'transparent',
            color: tab === t.id ? '#fff' : CL.muted,
            border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </motion.div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: 14, color: CL.red, fontSize: 13, marginBottom: 14,
        }}>{error}</div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: CL.muted, padding: 32 }}>Loading…</div>
      )}

      {!loading && tab === 'open' && (
        openRequests.length === 0 ? (
          <Empty Icon={Inbox} title="No open requests" sub="New moving requests will appear here." />
        ) : (
          openRequests.map((r, i) => {
            const alreadyQuoted = myQuotes.some(q => q.request_id === r.id);
            return (
              <RequestCard
                key={r.id} request={r} index={i}
                badge={alreadyQuoted ? 'You quoted' : 'Quote now'}
                badgeColor={alreadyQuoted ? CL.blue : CL.gold}
                onClick={() => navigate(`/mover/request/${r.id}`)}
              />
            );
          })
        )
      )}

      {!loading && tab === 'accepted' && (
        acceptedJobs.length === 0 ? (
          <Empty Icon={CheckCircle2} title="No accepted jobs" sub="When a customer accepts your quote, the job appears here so you can assign your team." />
        ) : (
          acceptedJobs.map((q, i) => (
            <RequestCard
              key={q.id} request={q.moving_requests} index={i}
              badge={STATUS_META[q.moving_requests.status]?.label || 'Active'}
              badgeColor={STATUS_META[q.moving_requests.status]?.color || CL.gold}
              onClick={() => navigate(`/mover/request/${q.request_id}`)}
            />
          ))
        )
      )}

      {!loading && tab === 'history' && (
        myQuotes.length === 0 ? (
          <Empty Icon={FileText} title="No history yet" sub="Past quotes and completed moves will appear here." />
        ) : (
          myQuotes.map((q, i) => (
            <RequestCard
              key={q.id} request={q.moving_requests || { id: q.request_id }} index={i}
              badge={`KSh ${Number(q.price).toLocaleString()} · ${q.status}`}
              badgeColor={q.status === 'accepted' ? CL.green : q.status === 'declined' ? CL.red : CL.blue}
              onClick={() => navigate(`/mover/request/${q.request_id}`)}
            />
          ))
        )
      )}
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8ECF0',
      borderRadius: 12, padding: '14px 10px', textAlign: 'center',
    }}>
      <div style={{ color, fontSize: 22, fontWeight: 900 }}>{value}</div>
      <div style={{ color: '#6B7A8F', fontSize: 10, marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Empty({ Icon, title, sub }) {
  return (
    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width:60, height:60, borderRadius:18, background:'#6B7A8F14', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
        <Icon size={28} color="#6B7A8F" strokeWidth={1.5} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#6B7A8F' }}>{sub}</div>
    </motion.div>
  );
}

function RequestCard({ request, badge, badgeColor, onClick, index = 0 }) {
  if (!request) return null;
  const inv = Array.isArray(request.inventory) ? request.inventory : [];
  const itemCount = inv.reduce((s, i) => s + (i.qty || 0), 0);

  return (
    <motion.div custom={3 + index * 0.4} variants={fadeUp} initial="hidden" animate="show" onClick={onClick} style={{
      background: '#FFFFFF', border: '1px solid #E8ECF0',
      borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color: '#0A1628', fontSize: 14, fontWeight: 700 }}>
          <Package size={15} color="#6B7A8F" strokeWidth={2} />
          {request.property_type ? request.property_type.toUpperCase() : 'MOVE'} Request
        </div>
        <span style={{
          background: `${badgeColor}20`, color: badgeColor,
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
        }}>{badge}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A020' }} />
          <div style={{ width: 2, height: 18, background: '#E8ECF0' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
        </div>
        <div style={{ flex: 1, fontSize: 12 }}>
          <div style={{ color: '#6B7A8F' }}>{request.pickup_location}</div>
          <div style={{ color: '#6B7A8F', marginTop: 14 }}>{request.destination}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, color: '#6B7A8F', fontSize: 11, alignItems:'center' }}>
        {request.vehicle_type && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Truck size={12} strokeWidth={2} />{request.vehicle_type}</span>}
        {itemCount > 0       && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Package size={12} strokeWidth={2} />{itemCount} items</span>}
        {request.moving_date && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={12} strokeWidth={2} />{request.moving_date}</span>}
      </div>
    </motion.div>
  );
}
