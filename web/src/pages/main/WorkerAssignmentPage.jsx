import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Star, Phone, MapPin, Calendar, Clock, Wrench, CreditCard, FileText, CheckCircle2, Headphones, ClipboardList, AlertCircle } from 'lucide-react';
import TrackingMap from '../../components/TrackingMap';
import PaymentPrompt from '../../components/PaymentPrompt';
import MaterialsEstimateCard from '../../components/MaterialsEstimateCard';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';

import { useCL } from '../../hooks/useCL';

const TIMELINE = [
  { key: 'upcoming',    label: 'Booking Confirmed', desc: 'Looking for a professional near you' },
  { key: 'confirmed',   label: 'Worker Assigned',   desc: 'Professional is getting ready' },
  { key: 'on_way',      label: 'On The Way',        desc: 'Your worker is heading to you' },
  { key: 'arrived',     label: 'Worker Arrived',    desc: 'Worker is at your location — verify with OTP' },
  { key: 'in_progress', label: 'Job In Progress',   desc: 'Work is underway' },
  { key: 'completed',   label: 'Job Completed',     desc: 'Enter completion OTP to approve & close job' },
];

function statusIndex(status) {
  return TIMELINE.findIndex(s => s.key === status);
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function WorkerAssignmentPage() {
  const CL = useCL();
  const navigate      = useNavigate();
  const { bookingId } = useParams();
  const { state }     = useLocation();
  const { user }      = useAuth();

  const [booking,  setBooking]  = useState(state?.booking || null);
  const [worker,   setWorker]   = useState(null);
  const [loading,  setLoading]  = useState(!state?.booking);

  const [otpInput,   setOtpInput]   = useState('');
  const [otpPhase,   setOtpPhase]   = useState(null);
  const [otpError,   setOtpError]   = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [verifying,  setVerifying]  = useState(false);

  const channelRef = useRef(null);

  useEffect(() => {
    if (booking) { setLoading(false); return; }
    if (!bookingId || bookingId === 'new') { setLoading(false); return; }
    supabase.from('bookings')
      .select('id,user_id,worker_id,worker_name,service,address,date,time,status,amount,method,notes,arrived_at,completed_at,created_at,booking_date,booking_time,sub_service,arrival_otp,price')
      .eq('id', bookingId).single()
      .then(({ data }) => { setBooking(data); setLoading(false); });
  }, [bookingId]);

  useEffect(() => {
    if (!booking?.worker_id) return;
    supabase.from('workers').select('*').eq('id', booking.worker_id).single()
      .then(({ data }) => setWorker(data));
  }, [booking?.worker_id]);

  useEffect(() => {
    if (!bookingId || bookingId === 'new') return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`booking-track-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        ({ new: updated }) => {
          setBooking(prev => ({ ...prev, ...updated }));
          if (updated.worker_id && !worker) {
            supabase.from('workers').select('*').eq('id', updated.worker_id).single()
              .then(({ data }) => setWorker(data));
          }
        })
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [bookingId]);

  useEffect(() => {
    if (!booking) return;
    const idx = statusIndex(booking.status);
    if (idx === statusIndex('arrived'))      setOtpPhase('arrival');
    else if (idx === statusIndex('in_progress')) setOtpPhase(null);
    else if (idx === statusIndex('completed'))   setOtpPhase('completion');
    else setOtpPhase(null);
  }, [booking?.status]);

  const verifyOTP = async () => {
    if (otpInput.length !== 4) { setOtpError('Enter the 4-digit code'); return; }
    setVerifying(true); setOtpError('');
    const isArrival = otpPhase === 'arrival';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ bookingId: booking.id, otp: otpInput, type: otpPhase }) }
      );
      const result = await res.json();
      if (!result.valid) { setOtpError('Wrong code — try again'); setVerifying(false); return; }
      setOtpSuccess(isArrival ? 'Arrival confirmed! Job has started.' : 'Job approved! Redirecting to review…');
      setOtpInput('');
      setVerifying(false);
      if (!isArrival) setTimeout(() => navigate('/review', { state: { booking, worker } }), 1800);
    } catch {
      setOtpError('Something went wrong. Try again.');
      setVerifying(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <div style={{ color: CL.muted, fontSize: 14 }}>Loading your booking…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <ClipboardList size={52} color={CL.border} strokeWidth={1.4} />
      <div style={{ color: CL.muted, fontSize: 16 }}>Booking not found</div>
      <button onClick={() => navigate('/history')} style={{ padding: '12px 24px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>View My Bookings</button>
    </div>
  );

  const currentIdx  = statusIndex(booking.status);
  const isCompleted = booking.status === 'completed';
  const workerName  = worker?.full_name || booking.worker_name || null;
  const hasWorker   = !!booking.worker_id;

  const STATUS_LABEL = {
    upcoming: 'Finding worker…', confirmed: 'Worker assigned',
    on_way: 'ETA ~10 min', arrived: 'Arrived!',
    in_progress: 'Working…', completed: 'Done!',
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`
        .assign-grid{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:start}
        @media(max-width:720px){.assign-grid{grid-template-columns:1fr}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/history')} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Track Your Job</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>{booking.sub_service || booking.service} · {booking.booking_date}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/support')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Headphones size={14} /> Support
          </button>
          <button onClick={() => navigate('/history')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <ClipboardList size={14} /> History
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '18px 18px 80px' }}>
        <div className="assign-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Worker card */}
            {hasWorker ? (
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
                style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: CL.goldSoft, border: `2px solid ${CL.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={24} color={CL.gold} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>{workerName || 'Loading…'}</div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{worker?.service || 'Professional'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <Star size={12} color={CL.gold} fill={CL.gold} />
                    <span style={{ color: CL.gold, fontWeight: 700, fontSize: 12 }}>{worker?.rating || '5.0'}</span>
                    <span style={{ color: CL.light, fontSize: 12 }}>· {worker?.total_jobs || 0} jobs</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: CL.successBg, border: `1px solid ${CL.success}30`, borderRadius: 20, padding: '4px 10px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: CL.success, animation: 'pulse 2s infinite' }} />
                    <span style={{ color: CL.success, fontSize: 10, fontWeight: 700 }}>LIVE</span>
                  </div>
                  <button style={{ width: 38, height: 38, borderRadius: '50%', background: CL.goldSoft, border: `1px solid ${CL.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Phone size={16} color={CL.gold} strokeWidth={1.8} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
                style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: CL.gold + '20', border: `2px solid ${CL.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite', flexShrink: 0 }}>
                  <User size={20} color={CL.gold} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Finding your professional…</div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 3 }}>A nearby worker will accept your job shortly</div>
                </div>
              </motion.div>
            )}

            {/* Live Map */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
              style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${CL.border}`, position: 'relative', height: 280, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <TrackingMap
                address={booking.address}
                workerStatus={booking.status}
                workerName={workerName || 'Your Worker'}
                workerId={booking.worker_id || null}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(10,22,40,0.82)', backdropFilter: 'blur(6px)', border: `1px solid ${CL.gold}40`, borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: CL.success, boxShadow: `0 0 6px ${CL.success}`, animation: 'pulse 2s infinite' }} />
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>LIVE TRACKING</span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'rgba(10,22,40,0.82)', backdropFilter: 'blur(6px)', border: `1px solid ${CL.border}`, borderRadius: 12, padding: '6px 13px', pointerEvents: 'none' }}>
                <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>{STATUS_LABEL[booking.status] || ''}</span>
              </div>
            </motion.div>

            {/* Arrival OTP */}
            {booking.status === 'arrived' && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
                style={{ background: CL.surface, border: `1.5px solid ${CL.gold}50`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} color={CL.gold} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>Worker Arrival Verification</div>
                    <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>Show this code to your worker to confirm they're at your location</div>
                  </div>
                </div>
                <div style={{ background: CL.goldSoft, border: `1px dashed ${CL.gold}60`, borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Your Arrival Code</div>
                  <div style={{ color: CL.gold, fontSize: 48, fontWeight: 900, letterSpacing: 16, fontVariantNumeric: 'tabular-nums' }}>{booking.arrival_otp}</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 10 }}>Worker types this code on their app to sign in</div>
                </div>
                {otpSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: CL.successBg, border: `1px solid ${CL.success}30`, borderRadius: 11, padding: '12px 14px', color: CL.success, fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle2 size={16} strokeWidth={2} /> {otpSuccess}
                  </div>
                )}
              </motion.div>
            )}

            {/* Completion OTP input */}
            {booking.status === 'in_progress' && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
                style={{ background: CL.surface, border: `1.5px solid ${CL.info}40`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: CL.infoBg, border: `1px solid ${CL.info}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={18} color={CL.info} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>Job In Progress</div>
                    <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>When work is done, worker will show you a completion code</div>
                  </div>
                </div>
                <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.65, marginBottom: 16 }}>
                  Once finished, your worker will display a 4-digit completion code on their phone. Enter it below to approve the job.
                </div>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Enter Completion Code</div>
                <OTPInput value={otpInput} onChange={setOtpInput} />
                {otpError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: CL.error, fontSize: 12, marginTop: 10 }}>
                    <AlertCircle size={13} strokeWidth={2} /> {otpError}
                  </div>
                )}
                <button onClick={verifyOTP} disabled={otpInput.length < 4 || verifying}
                  style={{ width: '100%', marginTop: 14, padding: '13px', borderRadius: 12, background: otpInput.length === 4 && !verifying ? CL.navy : CL.border, border: 'none', color: otpInput.length === 4 && !verifying ? '#fff' : CL.light, fontSize: 14, fontWeight: 800, cursor: otpInput.length === 4 && !verifying ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.15s' }}>
                  {verifying ? 'Verifying…' : 'Approve Job Completion'}
                </button>
              </motion.div>
            )}

            {/* Materials estimate */}
            <MaterialsEstimateCard bookingId={booking.id} />

            {/* Payment */}
            {isCompleted && (
              <PaymentPrompt
                refType="booking" refId={booking.id}
                payeeId={booking.worker_id} payeeRole="worker"
                purpose="service" amount={Number(booking.price || 0) || 0}
                label={booking.sub_service || booking.service || 'Service'}
              />
            )}

            {/* Completed banner */}
            {isCompleted && (
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
                style={{ background: CL.successBg, border: `1px solid ${CL.success}30`, borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: CL.success + '20', border: `1px solid ${CL.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={28} color={CL.success} strokeWidth={1.8} />
                </div>
                <div style={{ color: CL.success, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Job Completed!</div>
                <div style={{ color: CL.muted, fontSize: 13, marginBottom: 20 }}>
                  Completed on {booking.completed_at ? new Date(booking.completed_at).toLocaleString('en-KE') : 'today'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <button onClick={() => navigate('/review', { state: { booking, worker } })}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <Star size={15} fill="#fff" strokeWidth={0} /> Rate Your Experience →
                  </button>
                  <button onClick={() => navigate('/payment', { state: { booking } })}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: `1.5px solid ${CL.navy}`, color: CL.navy, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <CreditCard size={15} /> Proceed to Payment
                  </button>
                  <button onClick={() => navigate(`/receipt/${booking.id}`)}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <FileText size={15} /> Download Receipt
                  </button>
                </div>
              </motion.div>
            )}

            {/* Job details */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${CL.border}` }}>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Job Details</div>
              </div>
              {[
                { Icon: MapPin,     label: 'Location', val: booking.address || '—'           },
                { Icon: Calendar,   label: 'Date',     val: booking.booking_date || '—'       },
                { Icon: Clock,      label: 'Time',     val: booking.booking_time || '—'       },
                { Icon: Wrench,     label: 'Service',  val: booking.sub_service || booking.service || '—' },
                { Icon: CreditCard, label: 'Payment',  val: 'M-Pesa (after completion)'       },
              ].map(({ Icon, label, val }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '13px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={CL.muted} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: CL.light, fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{val}</div>
                  </div>
                </div>
              ))}
              {booking.notes && (
                <div style={{ margin: '0 20px 14px', padding: '11px 14px', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10 }}>
                  <div style={{ color: CL.light, fontSize: 10, fontWeight: 600, marginBottom: 4 }}>NOTES</div>
                  <div style={{ color: CL.muted, fontSize: 13, fontStyle: 'italic' }}>"{booking.notes}"</div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — Status timeline ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>Job Status</div>

              {TIMELINE.map((step, idx) => {
                const done    = idx < currentIdx;
                const current = idx === currentIdx;
                return (
                  <div key={step.key} style={{ display: 'flex', gap: 14, minHeight: 56 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: done ? CL.success : current ? CL.navy : CL.bg,
                        border: `2px solid ${done ? CL.success : current ? CL.navy : CL.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: current ? `0 0 0 4px ${CL.navy}18` : 'none',
                        transition: 'all 0.3s',
                      }}>
                        {done
                          ? <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                          : <span style={{ color: current ? '#fff' : CL.light, fontSize: 11, fontWeight: 800 }}>{idx + 1}</span>
                        }
                      </div>
                      {idx < TIMELINE.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: done ? CL.success : CL.border, margin: '4px 0', minHeight: 18, transition: 'background 0.3s' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ color: done ? CL.success : current ? CL.navy : CL.light, fontSize: 13, fontWeight: current || done ? 700 : 500 }}>
                        {step.label}
                      </div>
                      {current && <div style={{ color: CL.muted, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{step.desc}</div>}
                      {done && step.key === 'arrived' && booking.arrived_at && (
                        <div style={{ color: CL.light, fontSize: 10, marginTop: 2 }}>
                          {new Date(booking.arrived_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {done && step.key === 'completed' && booking.completed_at && (
                        <div style={{ color: CL.light, fontSize: 10, marginTop: 2 }}>
                          {new Date(booking.completed_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Booking reference */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '13px 16px' }}>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>Booking Reference</div>
              <div style={{ color: CL.muted, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                #{booking.id?.slice(0, 16).toUpperCase() || 'N/A'}
              </div>
            </motion.div>

            {/* Cancel button */}
            {['upcoming', 'confirmed'].includes(booking.status) && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
                <button onClick={async () => {
                  if (!window.confirm('Cancel this booking?')) return;
                  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
                  navigate('/history');
                }} style={{ width: '100%', padding: '12px', borderRadius: 12, background: CL.errorBg, border: `1px solid ${CL.error}30`, color: CL.error, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel Booking
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + '' + value.slice(i + 1);
      onChange(next);
      if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = value.slice(0, i) + e.key + value.slice(i + 1);
    onChange(next.slice(0, 4));
    if (i < 3) inputs.current[i + 1]?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {[0, 1, 2, 3].map(i => (
        <input key={i} ref={el => (inputs.current[i] = el)}
          value={value[i] || ''} onKeyDown={e => handleKey(i, e)} onChange={() => {}} maxLength={1}
          style={{ width: 56, height: 64, borderRadius: 14, textAlign: 'center', fontSize: 26, fontWeight: 900, color: CL.navy, background: value[i] ? CL.goldSoft : CL.bg, border: `2px solid ${value[i] ? CL.gold : CL.border}`, outline: 'none', cursor: 'text', transition: 'all 0.15s', boxShadow: value[i] ? `0 0 0 3px ${CL.gold}20` : 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = CL.gold}
          onBlur={e => e.target.style.borderColor = value[i] ? CL.gold : CL.border}
        />
      ))}
    </div>
  );
}
