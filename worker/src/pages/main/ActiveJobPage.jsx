import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import JobMap from '../../components/JobMap';
import MaterialsEstimateModal from '../../components/MaterialsEstimateModal';
import { getEstimateForJob } from '../../services/materialsEstimateService';
import { generateAndUploadReceipt } from '../../utils/receiptPDF';
import { CheckCircle2, Navigation, MapPin, Wrench, PartyPopper, ArrowLeft, Inbox, Palette, Clock, Package } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  navy: '#0A1628',
};

const ESTIMATE_STATUS = {
  estimate:         { label: 'Awaiting customer confirmation',        color: CL.amber,  Icon: Clock },
  pending:          { label: 'Customer confirmed — supplier notified', color: CL.blue,  Icon: CheckCircle2 },
  confirmed:        { label: 'Supplier preparing',                    color: CL.blue,   Icon: Package },
  packing:          { label: 'Supplier packing',                      color: CL.blue,   Icon: Package },
  ready:            { label: 'Ready — rider dispatched',              color: '#9F7AEA', Icon: Navigation },
  out_for_delivery: { label: 'Materials on the way',                  color: '#9F7AEA', Icon: Navigation },
  delivered:        { label: 'Materials delivered to site',           color: CL.green,  Icon: CheckCircle2 },
};

const STEPS = [
  { key: 'confirmed',   label: 'Job Accepted',   Icon: CheckCircle2, desc: 'Ready to go — head to customer' },
  { key: 'on_way',      label: 'On My Way',       Icon: Navigation,   desc: 'Heading to customer location' },
  { key: 'arrived',     label: 'I Have Arrived',  Icon: MapPin,       desc: 'Enter arrival code from customer' },
  { key: 'in_progress', label: 'Job In Progress', Icon: Wrench,       desc: 'Working on it' },
  { key: 'completed',   label: 'Job Complete',    Icon: PartyPopper,  desc: 'Show completion code to customer' },
];

function stepIndex(key) { return STEPS.findIndex(s => s.key === key); }

export default function ActiveJobPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [job, setJob]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);

  const [showEstimate, setShowEstimate] = useState(false);
  const [estimate, setEstimate]         = useState(null);

  const [otpInput,  setOtpInput]  = useState('');
  const [otpError,  setOtpError]  = useState('');
  const [verifying, setVerifying] = useState(false);

  const inputRefs  = useRef([]);
  const channelRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!id || id === 'current') { setLoading(false); return; }

    supabase.from('bookings').select('*').eq('id', id).single()
      .then(({ data }) => { setJob(data); setLoading(false); });

    getEstimateForJob(id).then(setEstimate).catch(() => {});

    channelRef.current = supabase
      .channel(`worker-job-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}`,
      }, ({ new: updated }) => setJob(prev => ({ ...prev, ...updated })))
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [id]);

  useEffect(() => {
    if (!job || !user?.id) return;
    const shouldTrack = job.status === 'on_way';
    if (shouldTrack && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const { latitude: current_lat, longitude: current_lng } = coords;
          supabase.from('workers').update({
            current_lat, current_lng,
            location_updated_at: new Date().toISOString(),
          }).eq('id', user.id).then(() => {});
        },
        (err) => console.warn('GPS error:', err.message),
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
      );
    } else {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        supabase.from('workers').update({ current_lat: null, current_lng: null }).eq('id', user.id).then(() => {});
      }
    }
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [job?.status, user?.id]);

  const advanceStep = async () => {
    if (!job) return;
    const idx = stepIndex(job.status);
    if (idx >= STEPS.length - 1) return;
    const next = STEPS[idx + 1];

    if (next.key === 'arrived') {
      await supabase.from('bookings').update({ status: 'arrived' }).eq('id', job.id);
      setJob(j => ({ ...j, status: 'arrived' }));
      return;
    }

    setUpdating(true);
    const updates = { status: next.key };

    if (next.key === 'completed') {
      const newTotal    = (profile?.total_jobs || 0) + 1;
      const newEarnings = (profile?.earnings   || 0) + 1500;
      await supabase.from('workers').update({ total_jobs: newTotal, earnings: newEarnings }).eq('id', user.id);

      const receiptNo = `FIX-${job.id.slice(0, 8).toUpperCase()}`;
      const receiptData = {
        booking_id:   job.id,
        customer_id:  job.user_id,
        worker_id:    user.id,
        receipt_no:   receiptNo,
        service:      job.service,
        sub_service:  job.sub_service,
        worker_name:  profile?.full_name,
        address:      job.address,
        booking_date: job.booking_date,
        booking_time: job.booking_time,
        amount:       Number(job.price || job.amount || 0),
        generated_at: new Date().toISOString(),
      };

      const pdfUrl = await generateAndUploadReceipt(receiptData);
      if (pdfUrl) receiptData.pdf_url = pdfUrl;

      let customerEmail = null;
      if (job.user_id) {
        const { data: customerProfile } = await supabase.from('profiles').select('email').eq('id', job.user_id).single();
        customerEmail = customerProfile?.email || null;
        if (customerEmail) receiptData.customer_email = customerEmail;
      }

      // A DB trigger already inserts a receipts row keyed by booking_id
      // when the payment for this booking turns 'paid' — update that
      // row with completion details instead of inserting a second one.
      const { data: existingReceipt } = await supabase
        .from('receipts').select('id').eq('booking_id', job.id).maybeSingle();

      if (existingReceipt) {
        await supabase.from('receipts').update(receiptData).eq('id', existingReceipt.id);
      } else {
        await supabase.from('receipts').insert(receiptData);
      }

      if (customerEmail) {
        supabase.functions.invoke('send-receipt', {
          body: { receipt: receiptData, customerEmail, pdfUrl },
        }).catch(err => console.warn('Email send failed:', err.message));
      }
    }

    await supabase.from('bookings').update(updates).eq('id', job.id);
    setJob(j => ({ ...j, ...updates }));
    setUpdating(false);
  };

  const verifyArrival = async () => {
    if (otpInput.length !== 4) { setOtpError('Enter the 4-digit code'); return; }
    setVerifying(true); setOtpError('');
    if (otpInput !== job.arrival_otp) {
      setOtpError('Wrong code — ask customer to show their arrival code');
      setVerifying(false); return;
    }
    await supabase.from('bookings').update({
      status: 'in_progress', arrived_at: new Date().toISOString(),
    }).eq('id', job.id);
    setJob(j => ({ ...j, status: 'in_progress', arrived_at: new Date().toISOString() }));
    setOtpInput('');
    setVerifying(false);
  };

  const handleOTPKey = (i, e) => {
    if (e.key === 'Backspace') {
      const n = otpInput.slice(0, i) + '' + otpInput.slice(i + 1);
      setOtpInput(n); setOtpError('');
      if (i > 0) inputRefs.current[i - 1]?.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const n = otpInput.slice(0, i) + e.key + otpInput.slice(i + 1);
    setOtpInput(n.slice(0, 4)); setOtpError('');
    if (i < 3) inputRefs.current[i + 1]?.focus();
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${CL.gold}30`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!job) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, background: CL.bg, minHeight: '100vh' }}>
      <div style={{ width:64, height:64, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Inbox size={30} color={CL.muted} strokeWidth={1.5} />
      </div>
      <div style={{ color: CL.muted, fontSize: 16 }}>No active job found</div>
      <button onClick={() => navigate('/dashboard')} style={{ display:'flex', alignItems:'center', gap:6, color: CL.gold, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>
    </div>
  );

  const currentIdx   = stepIndex(job.status);
  const step         = STEPS[currentIdx] || STEPS[0];
  const nextStep     = STEPS[currentIdx + 1];
  const isCompleted  = job.status === 'completed';
  const isArrived    = job.status === 'arrived';
  const isInProgress = job.status === 'in_progress';

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <button onClick={() => navigate('/dashboard')} style={{ color: CL.muted, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
          <ArrowLeft size={15} /> Dashboard
        </button>

        <div style={{ color: CL.text, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Active Job</div>
        <div style={{ color: CL.muted, fontSize: 13, marginBottom: 24 }}>{job.sub_service || job.service} · {job.address}</div>
      </motion.div>

      {/* Status hero */}
      {(() => {
        const heroColor = isCompleted ? CL.green : CL.gold;
        const HeroIcon = step.Icon;
        return (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{
            background: isCompleted ? CL.greenSoft : isArrived ? CL.goldSoft : `${CL.gold}0A`,
            border: `1px solid ${isCompleted ? CL.greenBorder : CL.goldBorder}`,
            borderRadius: 20, padding: '24px', textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ width:64, height:64, borderRadius:20, background:`${heroColor}18`, border:`1px solid ${heroColor}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <HeroIcon size={30} color={heroColor} strokeWidth={1.8} />
            </div>
            <div style={{ color: heroColor, fontSize: 18, fontWeight: 800 }}>{step.label}</div>
            <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>{step.desc}</div>
          </motion.div>
        );
      })()}

      {/* Arrival OTP */}
      {isArrived && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            <MapPin size={17} color={CL.gold} strokeWidth={2} /> Enter Arrival Code
          </div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 18 }}>
            Ask the customer to show their 4-digit arrival code and type it below
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                value={otpInput[i] || ''}
                onKeyDown={e => handleOTPKey(i, e)}
                onChange={() => {}}
                maxLength={1}
                autoFocus={i === 0}
                style={{
                  width: 58, height: 68, borderRadius: 12, textAlign: 'center',
                  fontSize: 30, fontWeight: 900, color: CL.text,
                  background: CL.bg, border: `2px solid ${otpInput[i] ? CL.gold : CL.border}`,
                  outline: 'none',
                  boxShadow: otpInput[i] ? `0 0 12px ${CL.gold}40` : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
          {otpError && (
            <div style={{ color: CL.red, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{otpError}</div>
          )}
          <button
            onClick={verifyArrival}
            disabled={otpInput.length < 4 || verifying}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
              background: otpInput.length === 4 && !verifying ? CL.gold : CL.bg,
              color: otpInput.length === 4 && !verifying ? CL.navy : CL.muted,
              fontSize: 14, fontWeight: 800,
              cursor: otpInput.length === 4 && !verifying ? 'pointer' : 'not-allowed',
            }}>
            {verifying ? 'Verifying...' : '✓ Confirm Arrival'}
          </button>
        </motion.div>
      )}

      {/* Completion code */}
      {isInProgress && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.greenBorder}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            <CheckCircle2 size={17} color={CL.green} strokeWidth={2} /> Your Completion Code
          </div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16 }}>
            When you finish the job, show this code to the customer. They will enter it on their app to approve.
          </div>
          <div style={{ background: CL.greenSoft, border: `1px dashed ${CL.greenBorder}`, borderRadius: 14, padding: '20px', textAlign: 'center' }}>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Completion Code</div>
            <div style={{ color: CL.green, fontSize: 48, fontWeight: 900, letterSpacing: 16 }}>{job.completion_otp}</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 8 }}>Customer enters this to approve the job</div>
          </div>
        </motion.div>
      )}

      {/* Materials Estimate */}
      {isInProgress && (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            <Palette size={17} color={CL.gold} strokeWidth={2} /> Materials Needed?
          </div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
            If this job needs paint or supplies, estimate the amount. The customer confirms and a supplier delivers it to site.
          </div>
          {!estimate ? (
            <button onClick={() => setShowEstimate(true)} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: CL.text, border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Add Materials Estimate</button>
          ) : (
            <div style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: 14 }}>
              {(() => { const m = ESTIMATE_STATUS[estimate.status] || ESTIMATE_STATUS.estimate; const MI = m.Icon; return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MI size={15} color={m.color} strokeWidth={2} />
                  <span style={{ color: m.color, fontSize: 13, fontWeight: 700 }}>{m.label}</span>
                </div>
              ); })()}
              {Array.isArray(estimate.items) && estimate.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: CL.muted, fontSize: 12 }}>
                  <span>{it.name} × {it.qty}</span>
                  <span>KSh {(it.price * it.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 6, borderTop: `1px solid ${CL.border}`, color: CL.gold, fontWeight: 800, fontSize: 14 }}>
                <span>Total</span><span>KSh {Number(estimate.total || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {showEstimate && (
        <MaterialsEstimateModal
          workerId={user.id}
          booking={job}
          onClose={() => setShowEstimate(false)}
          onSubmitted={async () => {
            setShowEstimate(false);
            const e = await getEstimateForJob(id).catch(() => null);
            setEstimate(e);
          }}
        />
      )}

      {/* Progress Steps */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Job Progress</div>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i < currentIdx ? CL.green : i === currentIdx ? CL.amberSoft : CL.bg,
                border: `2px solid ${i < currentIdx ? CL.green : i === currentIdx ? CL.gold : CL.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i < currentIdx ? '#fff' : i === currentIdx ? CL.gold : CL.muted,
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 2, height: 20, background: i < currentIdx ? CL.green : CL.border, margin: '3px 0' }} />}
            </div>
            <div style={{ paddingBottom: 16 }}>
              <div style={{ color: i <= currentIdx ? CL.text : CL.muted, fontSize: 13, fontWeight: i === currentIdx ? 700 : 500 }}>{s.label}</div>
              {i === currentIdx && <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>{s.desc}</div>}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Map */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 240, position: 'relative' }}>
          <JobMap address={job.address} />
          {job.status === 'on_way' && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 1000,
              background: `${CL.green}EE`, borderRadius: 20,
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
              pointerEvents: 'none',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>GPS ON</span>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ color: CL.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Customer Location</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color: CL.text, fontSize: 13 }}>
              <MapPin size={13} color={CL.muted} strokeWidth={2} />{job.address || 'Nairobi'}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address || 'Nairobi')}&travelmode=driving`}
            target="_blank" rel="noreferrer"
            style={{
              flexShrink: 0, padding: '9px 16px', borderRadius: 10,
              background: CL.text, color: '#fff', fontSize: 12, fontWeight: 800,
              textDecoration: 'none', whiteSpace: 'nowrap',
            display:'flex', alignItems:'center', gap:6,
            }}>
            <Navigation size={13} strokeWidth={2} /> Navigate
          </a>
        </div>
      </motion.div>

      {/* Main action */}
      {!isCompleted && !isArrived && !isInProgress && nextStep && (
        <motion.button custom={6} variants={fadeUp} initial="hidden" animate="show" onClick={advanceStep} disabled={updating} style={{
          width: '100%', padding: '18px', borderRadius: 16, fontSize: 15, fontWeight: 800,
          background: CL.text, border: 'none', color: '#fff',
          cursor: updating ? 'not-allowed' : 'pointer',
          opacity: updating ? 0.7 : 1,
        }}>
          {updating ? 'Updating...' : `Mark as "${nextStep.label}"`}
        </motion.button>
      )}

      {/* Completed */}
      {isCompleted && (
        <div>
          <div style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, borderRadius: 16, padding: 22, textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
            <div style={{ color: CL.green, fontSize: 18, fontWeight: 800 }}>Job Completed!</div>
            <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>Great work! Earnings have been updated.</div>
          </div>
          <button
            onClick={() => navigate(`/receipt/${job.id}`)}
            style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 800, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, color: CL.green, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}>
            📄 View Job Summary
          </button>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 800,
            background: CL.text, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>← Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}
