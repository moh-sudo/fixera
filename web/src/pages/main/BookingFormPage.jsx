import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Tag, FileText, CalendarDays, User, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { SERVICES, formatPrice } from '../../data/services';
import { getCategories, getServicesForCategory } from '../../services/catalogService';
import LocationPickerMap from '../../components/LocationPickerMap';
import { useUserLocation } from '../../hooks/useUserLocation';
import { supabase } from '../../supabase';
import { validateServiceArea } from '../../services/serviceAreaService';

import { useCL } from '../../hooks/useCL';

// Maps serviceId → workers.service column value
// Must match WORKER_SERVICES in worker/src/pages/auth/RegisterPage.jsx exactly —
// that's what gets written to workers.service at registration (plain text, no emoji).
const SERVICE_LABEL = {
  plumbing:   'Plumbing',
  electrical: 'Electrical',
  cleaning:   'Cleaning',
  painting:   'Painting',
};

const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const today = new Date();
const DAYS_DATA = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return {
    day:     DAY_NAMES[d.getDay()],
    date:    d.getDate(),
    isToday: i === 0,
    full:    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
});

const TIME_SLOTS = [
  { label:'08:00 - 09:00', period:'Morning' },
  { label:'09:00 - 10:00', period:'Morning' },
  { label:'10:00 - 11:00', period:'Morning' },
  { label:'12:00 - 13:00', period:'Afternoon' },
  { label:'13:00 - 14:00', period:'Afternoon' },
  { label:'14:00 - 15:00', period:'Afternoon' },
  { label:'16:00 - 17:00', period:'Evening' },
  { label:'17:00 - 18:00', period:'Evening' },
];

const STEPS = ['Service Details', 'Choose Professional', 'Date & Time', 'Confirm'];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

export default function BookingFormPage() {
  const CL = useCL();
  const { serviceId, categoryId, subServiceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep]                   = useState(0);
  const [address, setAddress]             = useState('');
  const [notes, setNotes]                 = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedDate, setSelectedDate]   = useState(0);
  const [selectedTime, setSelectedTime]   = useState(null);
  const [areaError, setAreaError]         = useState('');
  const [workers, setWorkers]             = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const userLocation = useUserLocation();

  // DB-driven service lookup with hardcoded fallback
  const [dbSvc, setDbSvc] = useState(null);
  const [dbSub, setDbSub] = useState(null);
  useEffect(() => {
    getCategories().then(cats => {
      const match = cats.find(c => c.slug === serviceId);
      if (match) {
        setDbSvc({ id: match.slug, name: match.name, icon: match.icon, color: match.color });
        getServicesForCategory(match.id).then(svcs => {
          const sub = svcs.find(s => s.slug === subServiceId);
          if (sub) setDbSub({ id: sub.slug, name: sub.name, priceMin: sub.price_min, priceMax: sub.price_max, duration: sub.duration_est, pricingType: sub.is_quotation ? 'Quotation' : 'Fixed' });
        });
      }
    }).catch(() => {});
  }, [serviceId, subServiceId]);

  const hardcodedSvc = SERVICES.find(s => s.id === serviceId);
  const hardcodedCat = hardcodedSvc?.categories?.find(c => c.id === categoryId);
  const hardcodedSub = hardcodedCat?.services?.find(s => s.id === subServiceId);

  const svc = dbSvc || hardcodedSvc;
  const cat = hardcodedCat;
  const sub = dbSub || hardcodedSub;

  // Pre-fill address from detected location
  useEffect(() => {
    if (userLocation && !address) setAddress(userLocation.full);
  }, [userLocation]);

  // Fetch real workers when entering step 1
  useEffect(() => {
    if (step !== 1) return;
    setWorkersLoading(true);
    const label = SERVICE_LABEL[serviceId];
    supabase
      .from('workers')
      .select('id, full_name, service, status, rating, total_jobs')
      .eq('service', label)
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[BookingFormPage] worker fetch failed:', error.message);
        if (!error && data) setWorkers(data);
        setWorkersLoading(false);
      });
  }, [step, serviceId]);

  const canNext = () => {
    if (step === 0) return address.trim().length > 5;
    if (step === 1) return selectedWorker !== null;
    if (step === 2) return selectedTime !== null;
    return true;
  };

  const goNext = async () => {
    if (step === 0) {
      setAreaError('');
      try { await validateServiceArea(address); }
      catch (err) { setAreaError(err.message); return; }
    }
    if (step < 3) setStep(s => s + 1);
    else navigate(`/confirm/${serviceId}/${categoryId}/${subServiceId}`, {
      state: {
        address,
        notes,
        workerName:  worker?.full_name || '',
        workerId:    selectedWorker,
        date:        selectedDate !== null ? DAYS_DATA[selectedDate].full : '',
        time:        selectedTime || '',
        serviceName: sub?.name || '',
        category:    cat?.name || '',
        serviceIcon: svc?.icon || '🔧',
      }
    });
  };

  const worker = workers.find(w => w.id === selectedWorker);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`
        .bk-worker:hover { border-color: ${CL.gold}60 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(10,22,40,0.10) !important; }
        .bk-slot:hover   { border-color: ${CL.gold}60 !important; background: ${CL.goldSoft} !important; }
        .bk-day:hover    { border-color: ${CL.gold}60 !important; }
        .bk-quick:hover  { background: ${CL.goldSoft} !important; border-color: ${CL.gold}50 !important; color: ${CL.gold} !important; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @media (min-width: 720px) { .bk-grid { display: grid; grid-template-columns: 1fr 290px; gap: 18px; align-items: start; } }
      `}</style>

      {/* ── Sticky header ── */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub?.name || 'Book Service'}</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 18px 13px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? CL.gold : CL.border, transition: 'background 0.3s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {STEPS.map((s, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: i === step ? 700 : 400, color: i === step ? CL.gold : CL.light }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 18px 100px' }}>

        {/* ── Step 0: Service Details ── */}
        {step === 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bk-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Service summary card */}
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 13 }}>Service Selected</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {svc?.icon || '🔧'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>{sub?.name || 'Service'}</div>
                    <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{cat?.name} · {svc?.name}</div>
                    <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 20, padding: '3px 9px' }}>
                        <Clock size={10} color={CL.muted} />
                        <span style={{ color: CL.muted, fontSize: 10 }}>{sub?.duration || '1–2 hrs'}</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 20, padding: '3px 9px' }}>
                        <Tag size={10} color={CL.gold} />
                        <span style={{ color: CL.gold, fontSize: 10, fontWeight: 700 }}>{formatPrice(sub)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address card */}
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 13 }}>Service Address</div>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <MapPin size={15} color={CL.gold} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={address}
                    onChange={e => { setAddress(e.target.value); setAreaError(''); }}
                    placeholder="Enter your full address"
                    style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border}
                  />
                </div>

                <LocationPickerMap
                  onLocationSelect={(addr) => setAddress(addr)}
                  initialLat={userLocation?.lat}
                  initialLng={userLocation?.lng}
                  initialAddress={userLocation?.full}
                />

                <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                  {['Home', 'Work', "Partner's Place"].map(q => (
                    <button key={q} className="bk-quick"
                      onClick={() => { setAddress(q + ' Address'); setAreaError(''); }}
                      style={{ padding: '6px 13px', borderRadius: 20, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      {q}
                    </button>
                  ))}
                </div>

                {areaError && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', border: '1px solid #F0C0C0', color: CL.error, fontSize: 13 }}>
                    ⚠️ {areaError}
                  </div>
                )}
              </div>

              {/* Notes card */}
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 13 }}>Special Instructions</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions for the professional? (optional)"
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border}
                />
              </div>
            </div>

            {/* How it works sidebar (desktop) */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <FileText size={15} color={CL.gold} />
                <span style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>How it works</span>
              </div>
              {['Enter your address & notes', 'Pick your preferred professional', 'Choose date & time', 'Confirm and we handle the rest!'].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 16 : 0, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 9,
                    background: i === step ? CL.navy : CL.bg,
                    border: `1px solid ${i === step ? CL.navy : CL.border}`,
                    color: i === step ? '#fff' : CL.light,
                    fontSize: 11, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ color: i === step ? CL.text : CL.light, fontSize: 12, lineHeight: 1.55, paddingTop: 3 }}>{t}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Choose Professional ── */}
        {step === 1 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 18 }}>Choose your preferred professional for this job</div>

            {workersLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
                <div style={{ width: 38, height: 38, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: CL.muted, fontSize: 13 }}>Finding available professionals…</div>
              </div>
            )}

            {!workersLoading && workers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: CL.surface, borderRadius: 18, border: `1px solid ${CL.border}` }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>😔</div>
                <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No professionals available</div>
                <div style={{ color: CL.muted, fontSize: 13 }}>All our experts are currently busy. Try again later or contact support.</div>
              </div>
            )}

            {!workersLoading && workers.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {workers.map(w => {
                  const isOnline   = w.status === 'online';
                  const isSelected = selectedWorker === w.id;
                  const rating     = w.rating ? parseFloat(w.rating).toFixed(1) : '—';
                  return (
                    <div key={w.id} className="bk-worker" onClick={() => setSelectedWorker(w.id)} style={{
                      background: isSelected ? CL.goldSoft : CL.surface,
                      border: isSelected ? `2px solid ${CL.gold}` : `1px solid ${CL.border}`,
                      borderRadius: 18, padding: 18, cursor: 'pointer',
                      transition: 'all 0.2s', position: 'relative',
                      boxShadow: isSelected ? `0 4px 18px rgba(201,160,32,0.15)` : '0 2px 8px rgba(10,22,40,0.05)',
                    }}>
                      {/* Online badge */}
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: isOnline ? '#E7F6EE' : CL.bg,
                        border: `1px solid ${isOnline ? '#9AE6B4' : CL.border}`,
                        borderRadius: 20, padding: '2px 8px' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: isOnline ? CL.success : CL.light }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: isOnline ? CL.success : CL.light }}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 11, right: 11 }}>
                          <BadgeCheck size={20} color={CL.gold} />
                        </div>
                      )}

                      {/* Avatar — initials only, no stock photo */}
                      <div style={{
                        width: 58, height: 58, borderRadius: '50%',
                        background: CL.navy,
                        border: `2px solid ${isSelected ? CL.gold : CL.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '28px auto 12px',
                      }}>
                        <User size={26} color="#fff" strokeWidth={1.6} />
                      </div>

                      <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, textAlign: 'center' }}>{w.full_name}</div>
                      <div style={{ color: CL.muted, fontSize: 11, textAlign: 'center', marginTop: 3 }}>
                        {(w.service || '').split(' ')[0]} Expert
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                        <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>★ {rating}</span>
                        <span style={{ color: CL.light, fontSize: 11 }}>· {w.total_jobs || 0} jobs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 2: Date & Time ── */}
        {step === 2 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bk-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Date picker */}
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <CalendarDays size={14} color={CL.gold} />
                  <span style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Select Date</span>
                </div>
                <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 }}>
                  {DAYS_DATA.map((d, i) => {
                    const isSel = selectedDate === i;
                    return (
                      <div key={i} className="bk-day" onClick={() => setSelectedDate(i)} style={{
                        textAlign: 'center', cursor: 'pointer', minWidth: 54, padding: '12px 8px',
                        borderRadius: 16, flexShrink: 0, transition: 'all 0.18s',
                        border: isSel ? `2px solid ${CL.gold}` : `1px solid ${CL.border}`,
                        background: isSel ? CL.navy : CL.bg,
                        boxShadow: isSel ? '0 4px 14px rgba(10,22,40,0.18)' : 'none',
                      }}>
                        <div style={{ color: isSel ? 'rgba(255,255,255,0.55)' : CL.light, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>{d.day}</div>
                        <div style={{ color: isSel ? '#fff' : CL.text, fontSize: 22, fontWeight: 900, marginTop: 5, lineHeight: 1 }}>{d.date}</div>
                        <div style={{ marginTop: 5, height: 5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {d.isToday && <div style={{ width: 5, height: 5, borderRadius: '50%', background: CL.gold }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time slots — list rows */}
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 18px 14px' }}>
                  <Clock size={14} color={CL.gold} />
                  <span style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Select Time</span>
                </div>
                {[
                  { period: 'Morning',   emoji: '☀️',  slots: TIME_SLOTS.filter(t => t.period === 'Morning') },
                  { period: 'Afternoon', emoji: '🌤️', slots: TIME_SLOTS.filter(t => t.period === 'Afternoon') },
                  { period: 'Evening',   emoji: '🌙',  slots: TIME_SLOTS.filter(t => t.period === 'Evening') },
                ].map(({ period, emoji, slots }) => (
                  <div key={period}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px 8px', background: CL.bg, borderTop: `1px solid ${CL.border}` }}>
                      <span style={{ fontSize: 13 }}>{emoji}</span>
                      <span style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{period}</span>
                    </div>
                    {slots.map((slot, i) => {
                      const isSel = selectedTime === slot.label;
                      return (
                        <div key={i} onClick={() => setSelectedTime(slot.label)} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px',
                          background: isSel ? CL.goldSoft : CL.surface,
                          borderTop: `1px solid ${CL.border}40`,
                          borderLeft: isSel ? `3px solid ${CL.gold}` : '3px solid transparent',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isSel ? CL.gold : CL.border}`,
                            background: isSel ? CL.gold : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}>
                            {isSel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: isSel ? CL.gold : CL.text, fontSize: 14, fontWeight: isSel ? 700 : 500 }}>{slot.label}</div>
                            <div style={{ color: CL.light, fontSize: 11, marginTop: 1 }}>Available</div>
                          </div>
                          {isSel && <BadgeCheck size={18} color={CL.gold} />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary sidebar */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Your Booking</div>
              {[
                { label: 'Service',      val: sub?.name || 'Service' },
                { label: 'Professional', val: worker?.full_name || '—' },
                { label: 'Date',         val: selectedDate !== null ? DAYS_DATA[selectedDate].full : '—' },
                { label: 'Time',         val: selectedTime || '—' },
                { label: 'Address',      val: address || '—' },
              ].map((row, i, arr) => (
                <div key={row.label}>
                  <div style={{ paddingBottom: 10 }}>
                    <div style={{ color: CL.light, fontSize: 10, marginBottom: 3 }}>{row.label}</div>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{row.val}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: CL.border, marginBottom: 10 }} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 24 }}>
              <CheckCircle2 size={56} color={CL.success} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 16px' }} />
              <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>All Set!</div>
              <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>
                Review your booking details below and confirm to get matched with your professional.
              </div>
            </div>
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 20, textAlign: 'left', marginBottom: 20 }}>
              {[
                ['Service',      sub?.name || 'Service'],
                ['Professional', worker?.full_name || '—'],
                ['Date',         selectedDate !== null ? DAYS_DATA[selectedDate].full : '—'],
                ['Time',         selectedTime || '—'],
                ['Address',      address],
                ['Price',        formatPrice(sub)],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>{label}</span>
                  <span style={{ color: CL.text, fontSize: 13, fontWeight: 700, maxWidth: '58%', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Continue / Confirm button ── */}
        <div style={{ marginTop: 24 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={goNext} disabled={!canNext()}
            style={{
              width: '100%', maxWidth: 480, padding: '16px', borderRadius: 14, border: 'none',
              background: canNext() ? CL.navy : CL.border,
              color: canNext() ? '#fff' : CL.light,
              fontSize: 15, fontWeight: 800, cursor: canNext() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', display: 'block', margin: '0 auto',
              boxShadow: canNext() ? '0 4px 18px rgba(10,22,40,0.22)' : 'none',
              transition: 'all 0.2s',
            }}>
            {step === 3 ? 'Confirm Booking' : step === 2 ? 'Review Booking →' : 'Continue →'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
