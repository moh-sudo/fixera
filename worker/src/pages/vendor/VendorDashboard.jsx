import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import VerificationBanner from '../../components/VerificationBanner';
import { setOpen as persistOpen, FULFILLMENT_STEPS } from '../../services/vendorService';
import { Bell, Settings, CheckCircle2, TrendingUp, User, Phone, CalendarDays, Clock, Inbox } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', red: '#EF4444', navy: '#0A1628',
};

const BUSINESS_TYPE_LABEL = {
  laundry:      'Laundry Shop 👕',
  carpet_wash:  'Carpet Washing 🪣',
  sofa_clean:   'Sofa & Upholstery 🛋️',
  office_clean: 'Office Cleaning 🏢',
  curtain:      'Curtain Cleaning 🪟',
};

export default function VendorDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('new');
  const [isOpen, setIsOpen]   = useState(profile?.is_open !== false);

  useEffect(() => { fetchOrders(); }, [profile]);
  useEffect(() => { if (profile) setIsOpen(profile.is_open !== false); }, [profile?.is_open]);

  async function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (user) { try { await persistOpen(user.id, next); } catch (e) { console.warn(e); } }
  }

  async function fetchOrders() {
    if (!profile) return;
    setLoading(true);
    const serviceMatch = profile.business_type === 'laundry' ? 'Laundry'
                       : profile.business_type === 'carpet_wash' ? 'Carpet Washing'
                       : profile.business_type === 'sofa_clean' ? 'Sofa'
                       : profile.business_type === 'office_clean' ? 'Office' : '';
    const { data } = await supabase.from('bookings')
      .select('*, profiles:user_id(full_name, phone)')
      .ilike('sub_service', `%${serviceMatch}%`)
      .order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }

  const filtered = orders.filter(o =>
    tab === 'new' ? o.status === 'pending'
    : tab === 'active' ? ['confirmed','active'].includes(o.status)
    : o.status === 'completed'
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o=>o.status==='pending').length,
    active: orders.filter(o=>['confirmed','active'].includes(o.status)).length,
    completed: orders.filter(o=>o.status==='completed').length,
    revenue: orders.filter(o=>o.status==='completed').length * 2500,
  };

  return (
    <div style={{ padding:'20px 16px 32px', maxWidth:600, margin:'0 auto', background:CL.bg, minHeight:'100vh' }}>

      <VerificationBanner />

      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom:20 }}>
        <div style={{ color:CL.text, fontSize:22, fontWeight:900 }}>
          {profile?.business_name || 'My Business'}
        </div>
        <div style={{ color:CL.blue, fontSize:13, marginTop:4, fontWeight:600 }}>
          {BUSINESS_TYPE_LABEL[profile?.business_type] || 'Vendor Dashboard'}
        </div>
      </motion.div>

      {/* Open/Closed toggle */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" onClick={toggleOpen} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:CL.surface, border:`1px solid ${isOpen?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`,
        borderRadius:14, padding:'14px 16px', marginBottom:20, cursor:'pointer',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:isOpen?CL.green:CL.red }} />
          <span style={{ color:isOpen?CL.green:CL.red, fontSize:14, fontWeight:700 }}>{isOpen ? 'Open for Business' : 'Closed'}</span>
        </div>
        <span style={{ color:CL.muted, fontSize:12 }}>Tap to toggle</span>
      </motion.div>

      {/* Stats — 2x2 grid */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        {[
          { label:'New Orders',  val:stats.pending,   color:CL.blue,   Icon:Bell },
          { label:'In Progress', val:stats.active,    color:'#F59E0B', Icon:Settings },
          { label:'Completed',   val:stats.completed, color:CL.green,  Icon:CheckCircle2 },
          { label:'Revenue',     val:`KSh ${stats.revenue.toLocaleString()}`, color:CL.gold, Icon:TrendingUp },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{
            background:CL.surface, border:`1px solid ${CL.border}`,
            borderRadius:16, padding:'16px',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <div style={{ color:color, fontSize:10, fontWeight:800, letterSpacing:1, textTransform:'uppercase' }}>{label}</div>
            </div>
            <div style={{ color:CL.text, fontSize:26, fontWeight:900 }}>{val}</div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto' }}>
        {[
          { id:'new', label:`New (${stats.pending})` },
          { id:'active', label:`Active (${stats.active})` },
          { id:'completed', label:'Done' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'10px 18px', borderRadius:24, fontSize:13, fontWeight:700, cursor:'pointer',
            background:tab===t.id?`${CL.blue}15`:'transparent',
            border:`1.5px solid ${tab===t.id?CL.blue:CL.border}`,
            color:tab===t.id?CL.blue:CL.muted,
            whiteSpace:'nowrap', fontFamily:'inherit',
          }}>{t.label}</button>
        ))}
      </motion.div>

      {/* Orders */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div style={{ width:40, height:40, border:`3px solid ${CL.blue}30`, borderTopColor:CL.blue, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign:'center', padding:'48px 16px' }}>
          <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Inbox size={28} color={CL.muted} strokeWidth={1.5} />
          </div>
          <div style={{ color:CL.text, fontSize:16, fontWeight:700 }}>No {tab} orders</div>
          <div style={{ color:CL.muted, fontSize:13, marginTop:6 }}>
            {tab === 'new' ? 'New customer orders will appear here.' : `Your ${tab} orders will show here.`}
          </div>
        </motion.div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((order, i) => {
            const stageMeta = FULFILLMENT_STEPS.find(s => s.id === order.fulfillment_stage);
            return (
              <motion.div key={order.id} custom={4 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" onClick={() => navigate(`/vendor/order/${order.id}`)} style={{
                background:CL.surface, border:`1px solid ${CL.border}`,
                borderRadius:16, padding:'16px', borderLeft:`3px solid ${CL.blue}`, cursor:'pointer',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ color:CL.text, fontSize:15, fontWeight:800 }}>{order.sub_service}</div>
                  {stageMeta && (
                    <span style={{ background:`${CL.blue}15`, color:CL.blue, fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:999, whiteSpace:'nowrap' }}>
                      {stageMeta.label}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:CL.muted, fontSize:12, marginBottom:3 }}>
                  <User size={12} strokeWidth={2} />{order.profiles?.full_name || 'Customer'}
                  <span style={{ margin:'0 2px' }}>·</span>
                  <Phone size={12} strokeWidth={2} />{order.profiles?.phone || '—'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, color:CL.muted, fontSize:12, marginBottom:3 }}>
                  <CalendarDays size={12} strokeWidth={2} />{order.booking_date}
                  <span style={{ margin:'0 2px' }}>·</span>
                  <Clock size={12} strokeWidth={2} />{order.booking_time}
                </div>
                {order.notes && <div style={{ color:CL.muted, fontSize:11, fontStyle:'italic', marginTop:4, padding:'6px 10px', background:CL.bg, borderRadius:8 }}>"{order.notes}"</div>}
                <div style={{ color:CL.blue, fontSize:12, fontWeight:700, marginTop:10, textAlign:'right' }}>
                  {tab === 'new' ? 'Tap to accept →' : 'Manage order →'}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
