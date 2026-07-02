import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Signal, Star, Zap, DollarSign, Car,
  CheckCircle2, Maximize2, Square, Package, FlaskConical,
  Wind, Factory, Loader, Clock, Truck, Home
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const MOCK_BUSINESSES = [
  { id: 'cw-1', name: 'CarpetMaster Pro',      initials: 'CM', color: '#4A90D9', area: 'Industrial Area', rating: 4.9, reviews: 287, distance: 1.8, turnaround: 'Same day', priceFrom: 1500, machines: 'Industrial steam + dry machines', speciality: 'All carpet types, antique rugs', open: true  },
  { id: 'cw-2', name: 'FreshRug Centre',        initials: 'FR', color: '#48BB78', area: 'Mlolongo',        rating: 4.7, reviews: 154, distance: 2.4, turnaround: '1–2 days', priceFrom: 1200, machines: 'Hot water extraction + UV sanitizer', speciality: 'Large carpets & office rugs', open: true  },
  { id: 'cw-3', name: 'CleanWeave Nairobi',     initials: 'CW', color: '#4FD1C5', area: 'Embakasi',        rating: 4.8, reviews: 201, distance: 3.1, turnaround: '1–2 days', priceFrom: 1300, machines: 'Rotary brush + foam cleaning', speciality: 'Stain removal experts', open: true  },
  { id: 'cw-4', name: 'Royal Carpet Cleaners',  initials: 'RC', color: '#9F7AEA', area: 'Westlands',       rating: 4.6, reviews: 98,  distance: 3.9, turnaround: '2–3 days', priceFrom: 2000, machines: 'Premium dry cleaning machines', speciality: 'Persian & antique rugs', open: false },
  { id: 'cw-5', name: 'SpeedClean Carpets',     initials: 'SP', color: '#FC8A4D', area: 'Ngara',           rating: 4.5, reviews: 67,  distance: 4.3, turnaround: 'Same day', priceFrom: 1000, machines: 'Standard wet + dry cleaning', speciality: 'Express budget cleaning', open: true  },
];

const CARPET_SIZES = [
  { id: 'small',  label: 'Small Carpet',   Icon: Square,    size: '≤ 4×6 ft',     price: 'From KSh 1,500', days: '1–2 days' },
  { id: 'medium', label: 'Medium Carpet',  Icon: Maximize2, size: '4×6 – 6×9 ft', price: 'From KSh 2,500', days: '1–2 days' },
  { id: 'large',  label: 'Large Carpet',   Icon: Package,   size: '6×9 ft+',      price: 'From KSh 4,000', days: '2–3 days' },
  { id: 'rug',    label: 'Persian / Rug',  Icon: Star,      size: 'Any size',      price: 'Quotation',      days: '2–3 days' },
];

const ADD_ONS = [
  { id: 'stain',   label: 'Stain Treatment',       Icon: FlaskConical, price: '+KSh 500'   },
  { id: 'odor',    label: 'Odor & Sanitization',   Icon: Wind,         price: '+KSh 500'   },
  { id: 'express', label: 'Express Same Day',       Icon: Zap,          price: '+KSh 1,000' },
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest First' },
  { value: 'rating',   label: 'Top Rated'     },
  { value: 'price',    label: 'Lowest Price'  },
  { value: 'speed',    label: 'Fastest'       },
];

const STEPS = ['Find Business', 'Carpet Details', 'Pickup Info', 'Confirm'];

export default function CarpetWashingPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user, guestContact } = useAuth();

  const [step, setStep]           = useState(0);
  const [locating, setLocating]   = useState(true);
  const [userArea, setUserArea]   = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [sortBy, setSortBy]       = useState('distance');
  const [selected, setSelected]   = useState(null);
  const [carpetSize, setCarpetSize] = useState('');
  const [addOns, setAddOns]       = useState([]);
  const [form, setForm]           = useState({ address: '', date: '', time: '', carpets: 1, notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          setUserArea(data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Nairobi');
        } catch { setUserArea('Nairobi'); }
        const shuffled = [...MOCK_BUSINESSES]
          .map(b => ({ ...b, distance: +(b.distance + (Math.random() * 0.5 - 0.25)).toFixed(1) }))
          .sort((a, b) => a.distance - b.distance);
        setBusinesses(shuffled);
        setLocating(false);
      },
      () => { setUserArea('Nairobi'); setBusinesses(MOCK_BUSINESSES); setLocating(false); },
      { timeout: 5000 }
    );
  }, []);

  const sorted = [...businesses].sort((a, b) => {
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'rating')   return b.rating - a.rating;
    if (sortBy === 'price')    return a.priceFrom - b.priceFrom;
    if (sortBy === 'speed')    return (a.turnaround.includes('Same') ? 0 : a.turnaround.includes('1') ? 1 : 2) - (b.turnaround.includes('Same') ? 0 : b.turnaround.includes('1') ? 1 : 2);
    return 0;
  });

  const selectedCarpet = CARPET_SIZES.find(c => c.id === carpetSize);
  const toggleAddOn = (id) => setAddOns(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  async function handleConfirm() {
    if (!user) {
      navigate('/signup', { state: { prefill: { name: guestContact?.name || '', phone: guestContact?.phone || '', email: guestContact?.email || '' } } });
      return;
    }
    setSubmitting(true);
    try {
      const addOnLabels = addOns.map(a => ADD_ONS.find(x => x.id === a)?.label).join(', ');
      await supabase.from('bookings').insert({
        user_id:      user.id,
        service:      'Cleaning',
        sub_service:  `Carpet Washing – ${selectedCarpet?.label}`,
        address:      form.address,
        booking_date: form.date,
        booking_time: form.time,
        notes:        `Carpets: ${form.carpets}. Business: ${selected.name} (${selected.area}). Add-ons: ${addOnLabels || 'None'}. ${form.notes}`,
        status:       'pending',
        service_mode: 'pickup-delivery',
      });
      setStep(4);
    } catch (err) { console.error(err); }
    setSubmitting(false);
  }

  /* ── BOOKED ── */
  if (step === 4) {
    const FLOW = [
      { Icon: CheckCircle2, label: 'Booking Confirmed',           done: true  },
      { Icon: Car,          label: 'Rider Dispatched to You',     done: false },
      { Icon: Package,      label: 'Carpet Picked Up',            done: false },
      { Icon: Factory,      label: `At ${selected?.name}`,        done: false },
      { Icon: Zap,          label: 'Machine Washing in Progress', done: false },
      { Icon: Truck,        label: 'Rider Returning Carpet',      done: false },
      { Icon: Home,         label: 'Carpet Delivered to You',     done: false },
    ];
    return (
      <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: CL.successBg, border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
          </div>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Pickup Scheduled!</div>
          <div style={{ color: CL.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            A rider will pick up your carpet on <strong>{form.date}</strong> at <strong>{form.time}</strong>.<br />
            Cleaned at <strong style={{ color: CL.text }}>{selected?.name}</strong> and returned in <strong>{selectedCarpet?.days}</strong>.
          </div>

          {/* Flow tracker */}
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 20, marginBottom: 16, textAlign: 'left' }}>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 14, letterSpacing: 0.8, textTransform: 'uppercase' }}>Delivery Flow</div>
            {FLOW.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < FLOW.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: s.done ? CL.successBg : CL.bg, border: `1px solid ${s.done ? CL.successBorder : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.Icon size={14} color={s.done ? CL.success : CL.muted} strokeWidth={1.8} />
                </div>
                <span style={{ flex: 1, color: s.done ? CL.text : CL.muted, fontSize: 12, fontWeight: s.done ? 700 : 400 }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.done ? CL.success : CL.muted }}>{s.done ? 'Done' : 'Pending'}</span>
              </div>
            ))}
          </div>

          {/* Business card */}
          <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${selected?.color}15`, border: `1px solid ${selected?.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: selected?.color, fontSize: 13, fontWeight: 900 }}>{selected?.initials}</span>
            </div>
            <div>
              <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{selected?.name}</div>
              <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{selected?.area} · {selected?.machines}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate('/history')}
              style={{ padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              View My Bookings
            </button>
            <button onClick={() => navigate('/home')}
              style={{ padding: '12px', borderRadius: 13, background: 'transparent', border: `1px solid ${CL.border}`, color: CL.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Header + stepper (shared) ── */
  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => step === 0 ? navigate('/service/cleaning') : setStep(s => s - 1)}
          style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={CL.text} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Carpet Washing</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
        </div>
      </div>

      {/* Step progress */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < step ? CL.gold : i === step ? CL.goldSoft : CL.bg,
                border: `2px solid ${i <= step ? CL.gold : CL.border}`,
                color: i < step ? CL.navy : i === step ? CL.gold : CL.muted,
                fontSize: 11, fontWeight: 800, marginBottom: 4,
              }}>
                {i < step ? <CheckCircle2 size={13} strokeWidth={2.5} /> : i + 1}
              </div>
              <div style={{ color: i === step ? CL.gold : CL.muted, fontSize: 9, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, background: i < step ? CL.gold : CL.border, marginBottom: 18 }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 18px', maxWidth: 760, margin: '0 auto' }}>

        {/* ── Step 0: Business Matching ── */}
        {step === 0 && (
          <div>
            <div style={{ background: locating ? '#EBF8FF' : CL.successBg, border: `1px solid ${locating ? '#BEE3F8' : CL.successBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              {locating ? <Signal size={20} color="#3182CE" /> : <MapPin size={20} color={CL.success} />}
              <div style={{ flex: 1 }}>
                <div style={{ color: locating ? '#2B6CB0' : CL.success, fontSize: 13, fontWeight: 700 }}>
                  {locating ? 'Finding nearest carpet washers…' : `Showing businesses near ${userArea}`}
                </div>
                <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
                  {locating ? 'Detecting your GPS location' : `${sorted.filter(b => b.open).length} open now · Machines ready`}
                </div>
              </div>
              {!locating && <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, color: CL.success, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>LIVE</div>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSortBy(opt.value)} style={{
                  background: sortBy === opt.value ? CL.goldSoft : CL.surface,
                  border: `1px solid ${sortBy === opt.value ? CL.goldBorder : CL.border}`,
                  color: sortBy === opt.value ? CL.gold : CL.muted,
                  fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                }}>{opt.label}</button>
              ))}
            </div>

            {locating ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, height: 120, opacity: 0.3 + i * 0.15 }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {sorted.map((biz, idx) => (
                  <motion.div key={biz.id}
                    initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: idx * 0.05 }}
                    onClick={() => { if (biz.open) { setSelected(biz); setStep(1); } }}
                    style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '18px 20px', cursor: biz.open ? 'pointer' : 'default', opacity: biz.open ? 1 : 0.5, position: 'relative', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (biz.open) e.currentTarget.style.borderColor = CL.goldBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; }}
                  >
                    {idx === 0 && biz.open && (
                      <div style={{ position: 'absolute', top: -1, left: 18, background: CL.gold, color: CL.navy, fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: 0.5 }}>
                        TOP PICK
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: idx === 0 && biz.open ? 8 : 0 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${biz.color}15`, border: `1px solid ${biz.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: biz.color, fontSize: 14, fontWeight: 900 }}>{biz.initials}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>{biz.name}</span>
                          <span style={{ background: biz.open ? CL.successBg : CL.errorBg, color: biz.open ? CL.success : CL.error, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{biz.open ? 'Open' : 'Closed'}</span>
                        </div>
                        <div style={{ color: CL.muted, fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={11} />{biz.area} · {biz.distance} km away
                        </div>
                        <div style={{ background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 8, padding: '4px 10px', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Factory size={11} color="#3182CE" />
                          <span style={{ color: '#2B6CB0', fontSize: 11, fontWeight: 600 }}>{biz.machines}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.gold, fontSize: 12, fontWeight: 700 }}><Star size={11} fill={CL.gold} strokeWidth={0} />{biz.rating} <span style={{ color: CL.muted, fontWeight: 400 }}>({biz.reviews})</span></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}><Zap size={11} />{biz.turnaround}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}><DollarSign size={11} />KSh {biz.priceFrom.toLocaleString()}/carpet</span>
                        </div>
                        <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>{biz.speciality}</div>
                      </div>
                      {biz.open && (
                        <div style={{ flexShrink: 0, background: CL.navy, color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap' }}>Select</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* How it works */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 16 }}>How Carpet Washing Works</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { Icon: MapPin,      step: '1', label: 'We find nearest washing business' },
                  { Icon: Car,         step: '2', label: 'Rider picks up your carpet' },
                  { Icon: Factory,     step: '3', label: 'Machine washed at station' },
                  { Icon: Truck,       step: '4', label: 'Rider returns clean carpet' },
                  { Icon: Home,        step: '5', label: 'Delivered back to your door' },
                ].map(s => (
                  <div key={s.step} style={{ textAlign: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <s.Icon size={16} color={CL.gold} strokeWidth={1.7} />
                    </div>
                    <div style={{ color: CL.gold, fontSize: 9, fontWeight: 800, marginBottom: 3 }}>STEP {s.step}</div>
                    <div style={{ color: CL.muted, fontSize: 10, lineHeight: 1.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Carpet Details ── */}
        {step === 1 && (
          <div>
            {/* Selected business recap */}
            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: `${selected?.color}15`, border: `1px solid ${selected?.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: selected?.color, fontSize: 13, fontWeight: 900 }}>{selected?.initials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{selected?.name}</div>
                <div style={{ color: CL.muted, fontSize: 11, marginTop: 2, display: 'flex', gap: 8 }}>
                  <span>{selected?.area}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={10} fill={CL.gold} strokeWidth={0} />{selected?.rating}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={10} />{selected?.turnaround}</span>
                </div>
              </div>
              <button onClick={() => setStep(0)} style={{ background: 'transparent', border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Change</button>
            </div>

            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>Select Carpet Size</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {CARPET_SIZES.map(c => (
                <div key={c.id} onClick={() => setCarpetSize(c.id)} style={{
                  padding: '16px', borderRadius: 14, cursor: 'pointer',
                  background: carpetSize === c.id ? CL.goldSoft : CL.surface,
                  border: `2px solid ${carpetSize === c.id ? CL.goldBorder : CL.border}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: carpetSize === c.id ? CL.goldSoft : CL.bg, border: `1px solid ${carpetSize === c.id ? CL.goldBorder : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <c.Icon size={20} color={carpetSize === c.id ? CL.gold : CL.muted} strokeWidth={1.7} />
                  </div>
                  <div style={{ color: carpetSize === c.id ? CL.gold : CL.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginBottom: 6 }}>{c.size}</div>
                  <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>{c.price}</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{c.days}</div>
                </div>
              ))}
            </div>

            {/* Quantity */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>Number of Carpets</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setForm(f => ({ ...f, carpets: Math.max(1, f.carpets - 1) }))} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.text, fontSize: 18, cursor: 'pointer' }}>−</button>
                <span style={{ color: CL.text, fontSize: 20, fontWeight: 800, minWidth: 32, textAlign: 'center' }}>{form.carpets}</span>
                <button onClick={() => setForm(f => ({ ...f, carpets: f.carpets + 1 }))} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.goldBorder}`, background: CL.goldSoft, color: CL.gold, fontSize: 18, cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Add-ons */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Add-ons (optional)</div>
              {ADD_ONS.map(a => (
                <div key={a.id} onClick={() => toggleAddOn(a.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                  background: addOns.includes(a.id) ? CL.goldSoft : CL.surface,
                  border: `1px solid ${addOns.includes(a.id) ? CL.goldBorder : CL.border}`,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.Icon size={16} color={addOns.includes(a.id) ? CL.gold : CL.muted} strokeWidth={1.7} />
                  </div>
                  <span style={{ flex: 1, color: CL.text, fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                  <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>{a.price}</span>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${addOns.includes(a.id) ? CL.gold : CL.border}`, background: addOns.includes(a.id) ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {addOns.includes(a.id) && <CheckCircle2 size={11} color={CL.navy} strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)} disabled={!carpetSize}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: carpetSize ? CL.navy : CL.border, border: 'none', color: carpetSize ? '#fff' : CL.muted, fontWeight: 800, fontSize: 15, cursor: carpetSize ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              Next: Pickup Info
            </button>
          </div>
        )}

        {/* ── Step 2: Pickup Details ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Your Pickup Address</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Westlands, Nairobi — full address"
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Pickup Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Pickup Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div>
              <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Leave carpet at gate, call before arriving…" rows={3}
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setStep(3)} disabled={!form.address || !form.date || !form.time}
              style={{ padding: '14px', borderRadius: 12, background: (!form.address || !form.date || !form.time) ? CL.border : CL.navy, border: 'none', color: (!form.address || !form.date || !form.time) ? CL.muted : '#fff', fontWeight: 800, fontSize: 15, cursor: (!form.address || !form.date || !form.time) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              Next: Review
            </button>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div>
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 16, letterSpacing: 0.8, textTransform: 'uppercase' }}>Booking Summary</div>
              {[
                ['Business',   `${selected?.name} · ${selected?.area}`],
                ['Machines',   selected?.machines],
                ['Carpet',     `${selectedCarpet?.label} (${selectedCarpet?.size}) × ${form.carpets}`],
                ['Turnaround', selectedCarpet?.days],
                ['Pickup',     `${form.date} at ${form.time}`],
                ['Address',    form.address],
                ...(addOns.length ? [['Add-ons', addOns.map(a => ADD_ONS.find(x => x.id === a)?.label).join(', ')]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${CL.border}` }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>{k}</span>
                  <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Car size={16} color="#3182CE" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
                A <strong style={{ color: CL.text }}>Fixera rider</strong> will collect your carpet, take it to <strong style={{ color: CL.text }}>{selected?.name}</strong> for machine washing, then return it within <strong style={{ color: CL.text }}>{selectedCarpet?.days}</strong>.
              </div>
            </div>

            <button onClick={handleConfirm} disabled={submitting}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: submitting ? CL.border : CL.navy, border: 'none', color: submitting ? CL.muted : '#fff', fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scheduling…</> : <><Car size={16} /> Schedule Pickup</>}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
