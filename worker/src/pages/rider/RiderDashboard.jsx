import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import VerificationBanner from '../../components/VerificationBanner';
import useLiveLocation from '../../hooks/useLiveLocation';
import { listRiderJobs, acceptLeg, advanceLeg, updateRiderLocation, declineLeg } from '../../services/dispatchService';
import { motion } from 'framer-motion';
import { Truck, Package, CheckCircle2, TrendingUp, MapPin, Navigation, Inbox } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  navy: '#0A1628',
};

const RIDER_GREEN = CL.green;

const VEHICLE_LABEL = { motorcycle: 'Motorcycle', 'tuk-tuk': 'Tuk-Tuk', car: 'Car', bicycle: 'Bicycle' };
const STATUS_STEPS  = ['pending', 'rider_assigned', 'picked_up', 'at_station', 'out_for_delivery', 'delivered'];
const STEP_LABELS   = ['Scheduled', 'Dispatched', 'Picked Up', 'At Station', 'Delivering', 'Delivered'];

export default function RiderDashboard() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState({ mine: [], available: [] });
  const [loading, setLoading]         = useState(true);
  const [isOnline, setIsOnline]       = useState(profile?.status === 'online');
  const [tab, setTab]                 = useState('available');
  const riderLocRef = useRef(null);

  useEffect(() => { fetchAssignments(); }, [user]);
  useEffect(() => { if (profile) setIsOnline(profile.status === 'online'); }, [profile?.status]);

  useEffect(() => {
    if (!isOnline || !user || !('geolocation' in navigator)) return;
    let timer;
    const push = () => navigator.geolocation.getCurrentPosition(
      pos => {
        riderLocRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        updateRiderLocation(user.id, pos.coords.latitude, pos.coords.longitude);
      },
      () => {}, { enableHighAccuracy: true, maximumAge: 20000, timeout: 15000 }
    );
    push();
    timer = setInterval(push, 25000);
    return () => clearInterval(timer);
  }, [isOnline, user]);

  async function fetchAssignments() {
    if (!user) return;
    setLoading(true);
    const [{ data: mine }, available] = await Promise.all([
      supabase.from('delivery_tracking').select('*, bookings(*)').eq('rider_id', user.id).order('created_at', { ascending: false }),
      listRiderJobs(user.id, riderLocRef.current).catch(() => []),
    ]);
    setAssignments({ mine: mine || [], available: available || [] });
    setLoading(false);
  }

  async function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    await supabase.from('workers').update({ status: next ? 'online' : 'offline' }).eq('id', user.id);
    fetchAssignments();
  }

  async function acceptDelivery(job) {
    try {
      await acceptLeg(job.id, user.id, job.booking_id, job.supplier_order_id, {
        name: profile?.full_name || 'Rider', phone: profile?.phone || null, vehicle: profile?.vehicle_type || null,
      });
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not accept — it may already be taken.');
      fetchAssignments();
    }
  }

  async function declineDelivery(job) {
    try { await declineLeg(job.id, user.id); fetchAssignments(); }
    catch (err) { console.error(err); fetchAssignments(); }
  }

  async function updateStatus(leg, status) {
    await advanceLeg(leg, status);
    fetchAssignments();
  }

  const myActive    = assignments.mine.filter(a => !['delivered', 'cancelled'].includes(a.status));
  const myCompleted = assignments.mine.filter(a => a.status === 'delivered');
  const available   = assignments.available;
  const earnings    = myCompleted.length * 300;
  const vehicleLabel = VEHICLE_LABEL[profile?.vehicle_type] || 'Rider';

  const inTransit = myActive.find(a => ['picked_up', 'out_for_delivery'].includes(a.status));
  useLiveLocation({
    userId: user?.id, bookingId: inTransit?.booking_id || null,
    supplierOrderId: inTransit?.supplier_order_id || null, active: !!inTransit,
  });

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 600, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <VerificationBanner />

      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 20 }}>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>Rider Dashboard</div>
        <div style={{ color: RIDER_GREEN, fontSize: 13, marginTop: 4, fontWeight: 600 }}>
          {vehicleLabel} · Fixera Partner
        </div>
      </motion.div>

      {/* Online toggle */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" onClick={toggleOnline} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: CL.surface,
        border: `1px solid ${isOnline ? `${RIDER_GREEN}40` : `${CL.red}30`}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 20, cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: isOnline ? RIDER_GREEN : CL.red }} />
          <span style={{ color: isOnline ? RIDER_GREEN : CL.red, fontSize: 14, fontWeight: 700 }}>
            {isOnline ? 'Online — Receiving Jobs' : 'Offline — Go Online'}
          </span>
        </div>
        <div style={{ width: 46, height: 24, borderRadius: 12, background: isOnline ? `${RIDER_GREEN}30` : CL.bg, border: `1px solid ${isOnline ? RIDER_GREEN : CL.border}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 3, left: isOnline ? 24 : 3, width: 16, height: 16, borderRadius: '50%', background: isOnline ? RIDER_GREEN : CL.muted, transition: 'left 0.2s' }} />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Runs', val: myActive.length,    color: CL.amber,    Icon: Truck },
          { label: 'Available',   val: available.length,   color: CL.blue,     Icon: Package },
          { label: 'Completed',   val: myCompleted.length, color: RIDER_GREEN, Icon: CheckCircle2 },
          { label: 'Earnings',    val: `KSh ${earnings.toLocaleString()}`, color: CL.gold, Icon: TrendingUp },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{
            background: CL.surface, border: `1px solid ${CL.border}`,
            borderRadius: 16, padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <div style={{ color, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
            </div>
            <div style={{ color: CL.text, fontSize: 26, fontWeight: 900 }}>{val}</div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 4, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[
          { id: 'available', label: `Available (${available.length})` },
          { id: 'active',    label: `Active (${myActive.length})` },
          { id: 'done',      label: `Done (${myCompleted.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8,
            background: tab === t.id ? RIDER_GREEN : 'transparent',
            color: tab === t.id ? '#fff' : CL.muted,
            border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${RIDER_GREEN}30`, borderTopColor: RIDER_GREEN, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {tab === 'available' && (
            available.length === 0 ? (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Inbox size={28} color={CL.muted} strokeWidth={1.5} />
                </div>
                <div style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>No pickups available</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 6 }}>{isOnline ? 'New jobs will appear here.' : 'Go online to see jobs.'}</div>
              </motion.div>
            ) : available.map((job, i) => {
              const isReturn = job.leg_type === 'return';
              const accentColor = job._reservedForMe ? CL.gold : RIDER_GREEN;
              return (
                <motion.div key={job.id} custom={4 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{
                  background: CL.surface, border: `1px solid ${accentColor}40`,
                  borderRadius: 16, padding: '16px', marginBottom: 12,
                  borderLeft: `3px solid ${accentColor}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ color: isReturn ? CL.blue : RIDER_GREEN, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
                      {isReturn ? 'RETURN DELIVERY' : 'NEW PICKUP'}
                    </div>
                    {job._reservedForMe && (
                      <span style={{ background: `${CL.gold}18`, color: CL.gold, fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
                        ⭐ OFFERED TO YOU{job._offerSecsLeft != null ? ` · ${job._offerSecsLeft}s` : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{job.bookings?.sub_service || 'Delivery'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color: CL.muted, fontSize: 12, marginBottom: 3 }}>
                    <MapPin size={12} color={RIDER_GREEN} strokeWidth={2} /> {job.pickup_address || 'Nairobi'}
                  </div>
                  {job.dropoff_address && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, color: CL.muted, fontSize: 12, marginBottom: 3 }}>
                      <MapPin size={12} color={CL.red} strokeWidth={2} /> {job.dropoff_address}
                    </div>
                  )}
                  {job._distanceKm != null && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, color: CL.muted, fontSize: 11, marginBottom: 8 }}>
                      <Navigation size={11} strokeWidth={2} /> {job._distanceKm.toFixed(1)} km away
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
                    <div style={{ color: CL.gold, fontSize: 15, fontWeight: 800 }}>Earn KSh {job.amount || 300}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {job._reservedForMe && (
                        <button onClick={() => declineDelivery(job)} style={{
                          padding: '10px 16px', borderRadius: 12, background: CL.bg,
                          border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Decline</button>
                      )}
                      <button onClick={() => acceptDelivery(job)} style={{
                        padding: '10px 20px', borderRadius: 12, background: RIDER_GREEN,
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}>Accept →</button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

          {tab === 'active' && (
            myActive.length === 0 ? (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Truck size={28} color={CL.muted} strokeWidth={1.5} />
                </div>
                <div style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>No active runs</div>
              </motion.div>
            ) : myActive.map((job, i) => {
              const si = STATUS_STEPS.indexOf(job.status);
              const nextStatus = STATUS_STEPS[si + 1];
              const nextLabel  = STEP_LABELS[si + 1];
              return (
                <motion.div key={job.id} custom={4 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{
                  background: CL.surface, border: `1px solid ${CL.amber}40`,
                  borderRadius: 16, padding: '16px', marginBottom: 12, borderLeft: `3px solid ${CL.amber}`,
                }}>
                  <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{job.bookings?.sub_service || 'Delivery'}</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {STEP_LABELS.map((s, i) => (
                      <div key={i} style={{
                        flex: 1, padding: '6px 2px', borderRadius: 6, textAlign: 'center',
                        background: i <= si ? CL.amberSoft : CL.bg,
                        border: `1px solid ${i <= si ? CL.amberBorder : CL.border}`,
                      }}>
                        <div style={{ color: i <= si ? CL.amber : CL.muted, fontSize: 8, fontWeight: 700, lineHeight: 1.2 }}>{s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.pickup_address || job.bookings?.address || 'Nairobi')}&travelmode=driving`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, background: CL.blueSoft, border: `1px solid ${CL.blue}30`, color: CL.blue, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      <Navigation size={14} strokeWidth={2} /> Navigate
                    </a>
                    {nextStatus && (
                      <button onClick={() => updateStatus(job, nextStatus)} style={{
                        flex: 1, padding: '11px', borderRadius: 12, background: CL.amber,
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                      }}>{nextLabel} →</button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}

          {tab === 'done' && (
            myCompleted.length === 0 ? (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <CheckCircle2 size={28} color={CL.muted} strokeWidth={1.5} />
                </div>
                <div style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>No completed runs yet</div>
              </motion.div>
            ) : myCompleted.map((job, i) => (
              <motion.div key={job.id} custom={4 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{
                background: CL.surface, border: `1px solid ${CL.border}`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{job.bookings?.sub_service || 'Delivery'}</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 3 }}>{job.bookings?.booking_date || '—'}</div>
                </div>
                <div style={{ color: RIDER_GREEN, fontSize: 15, fontWeight: 800 }}>+KSh 300</div>
              </motion.div>
            ))
          )}
        </>
      )}
    </div>
  );
}
