import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { listOpenOrders, listMyDeliveries } from '../../services/waterCarrierService';
import VerificationBanner from '../../components/VerificationBanner';
import { motion } from 'framer-motion';
import { Droplets, CheckCircle2, History, Inbox, MapPin, Package, TrendingUp, Clock } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', red: '#EF4444', navy: '#0A1628',
};

const WATER_BLUE = '#00B5D8';

const STATUS_META = {
  pending:    { label: 'New', color: '#F59E0B' },
  confirmed:  { label: 'Confirmed', color: '#3B82F6' },
  loading:    { label: 'Loading', color: CL.gold },
  on_the_way: { label: 'On the way', color: CL.green },
  arrived:    { label: 'Arrived', color: CL.green },
  delivered:  { label: 'Awaiting OK', color: '#8B5CF6' },
  completed:  { label: 'Done', color: CL.green },
  cancelled:  { label: 'Cancelled', color: CL.red },
};

export default function WaterCarrierDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('open');
  const [openOrders, setOpen] = useState([]);
  const [myDeliveries, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, m] = await Promise.all([
        listOpenOrders(),
        user ? listMyDeliveries(user.id) : Promise.resolve([]),
      ]);
      setOpen(o);
      setMine(m);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load orders. Run create_water_delivery_module.sql in Supabase first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const active = myDeliveries.filter(d => ['confirmed','loading','on_the_way','arrived','delivered'].includes(d.status));
  const past   = myDeliveries.filter(d => ['completed','cancelled'].includes(d.status));

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <VerificationBanner />

      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>
          {profile?.business_name || 'Water Carrier'}
        </div>
        <div style={{ color: WATER_BLUE, fontSize: 13, marginTop: 4, fontWeight: 600 }}>Water Carrier Dashboard</div>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <Stat value={openOrders.length} label="Open Orders" color="#F59E0B" />
        <Stat value={active.length}     label="In Progress" color={WATER_BLUE} />
        <Stat value={past.length}       label="History"     color={CL.green} />
      </motion.div>

      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 4, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[
          { id: 'open',    label: `Open (${openOrders.length})` },
          { id: 'active',  label: `My Jobs (${active.length})` },
          { id: 'history', label: 'History' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8,
            background: tab === t.id ? WATER_BLUE : 'transparent',
            color: tab === t.id ? '#fff' : CL.muted,
            border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </motion.div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, color: CL.red, fontSize: 13, marginBottom: 14 }}>{error}</div>
      )}

      {loading && <div style={{ textAlign: 'center', color: CL.muted, padding: 32 }}>Loading…</div>}

      {!loading && tab === 'open' && (
        openOrders.length === 0
          ? <Empty Icon={Inbox} title="No open orders" sub="New water orders will appear here." />
          : openOrders.map((o, i) => (
            <OrderCard key={o.id} order={o} index={i} badge="Accept" badgeColor={WATER_BLUE} onClick={() => navigate(`/water/delivery/${o.id}`)} />
          ))
      )}

      {!loading && tab === 'active' && (
        active.length === 0
          ? <Empty Icon={CheckCircle2} title="No active jobs" sub="Accepted orders appear here while in progress." />
          : active.map((o, i) => {
            const meta = STATUS_META[o.status] || STATUS_META.confirmed;
            return <OrderCard key={o.id} order={o} index={i} badge={meta.label} badgeColor={meta.color} onClick={() => navigate(`/water/delivery/${o.id}`)} />;
          })
      )}

      {!loading && tab === 'history' && (
        past.length === 0
          ? <Empty Icon={History} title="No history yet" sub="Completed orders will show up here." />
          : past.map((o, i) => {
            const meta = STATUS_META[o.status] || STATUS_META.completed;
            return <OrderCard key={o.id} order={o} index={i} badge={meta.label} badgeColor={meta.color} onClick={() => navigate(`/water/delivery/${o.id}`)} />;
          })
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

function OrderCard({ order, badge, badgeColor, onClick, index = 0 }) {
  return (
    <motion.div custom={3 + index * 0.4} variants={fadeUp} initial="hidden" animate="show" onClick={onClick} style={{
      background: '#FFFFFF', border: '1px solid #E8ECF0',
      borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color: '#0A1628', fontSize: 14, fontWeight: 700 }}>
          <Droplets size={15} color="#00B5D8" strokeWidth={2} />
          {order.sub_service || 'Water Delivery'}
        </div>
        <span style={{
          background: `${badgeColor}20`, color: badgeColor,
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
        }}>{badge}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, color: '#6B7A8F', fontSize: 12, marginBottom: 6 }}>
        <MapPin size={12} strokeWidth={2} />{order.address}
      </div>
      <div style={{ display: 'flex', gap: 12, color: '#6B7A8F', fontSize: 11, alignItems:'center' }}>
        {order.quantity && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Package size={12} strokeWidth={2} />×{order.quantity}</span>}
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><TrendingUp size={12} strokeWidth={2} />KSh {Number(order.price || 0).toLocaleString()}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={12} strokeWidth={2} />{new Date(order.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </motion.div>
  );
}
