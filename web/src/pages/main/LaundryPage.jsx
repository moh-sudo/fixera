import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Signal, CheckCircle2, Star, Zap, DollarSign,
  Package, Search, Car, Store, Loader, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const MOCK_LAUNDRIES = [
  { id: 'lau-1', name: 'CleanPro Laundry',   initials: 'CP', color: '#4A90D9', area: 'Westlands', rating: 4.9, reviews: 312, distance: 0.8, turnaround: 'Same day', open: true,  priceFrom: 150, speciality: 'Express & Dry Cleaning' },
  { id: 'lau-2', name: 'Fresh Wave Laundry', initials: 'FW', color: '#48BB78', area: 'Parklands', rating: 4.7, reviews: 189, distance: 1.2, turnaround: 'Same day', open: true,  priceFrom: 120, speciality: 'Wash & Fold Experts' },
  { id: 'lau-3', name: 'Sparkle Clean',      initials: 'SC', color: '#4FD1C5', area: 'Kilimani',  rating: 4.8, reviews: 254, distance: 1.9, turnaround: '4 hrs',     open: true,  priceFrom: 140, speciality: 'Eco-Friendly Cleaning' },
  { id: 'lau-4', name: 'NairobiWash Plus',   initials: 'NW', color: '#63B3ED', area: 'Lavington', rating: 4.6, reviews: 143, distance: 2.4, turnaround: '1 day',     open: false, priceFrom: 100, speciality: 'Budget Friendly' },
  { id: 'lau-5', name: 'Elite Dry Cleaners', initials: 'ED', color: '#9F7AEA', area: 'Upperhill', rating: 4.9, reviews: 421, distance: 3.1, turnaround: '2 days',    open: true,  priceFrom: 300, speciality: 'Premium Dry Cleaning' },
  { id: 'lau-6', name: 'QuickWash Nairobi',  initials: 'QW', color: '#FC8A4D', area: 'Ngara',     rating: 4.5, reviews: 98,  distance: 3.8, turnaround: '3 hrs',     open: true,  priceFrom: 130, speciality: 'Express Only' },
];

const SERVICES = [
  { id: 'wash-fold', label: 'Wash & Fold',      price: 'From KSh 150/kg'   },
  { id: 'dry-clean', label: 'Dry Cleaning',      price: 'From KSh 300/item' },
  { id: 'ironing',   label: 'Ironing Only',      price: 'From KSh 30/item'  },
  { id: 'duvet',     label: 'Duvet / Blanket',   price: 'From KSh 800'      },
  { id: 'express',   label: 'Express 3-hr Wash', price: 'From KSh 500'      },
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest First' },
  { value: 'rating',   label: 'Top Rated'     },
  { value: 'price',    label: 'Lowest Price'  },
  { value: 'speed',    label: 'Fastest'       },
];

export default function LaundryPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user, guestContact } = useAuth();
  const [step, setStep]         = useState('browse');
  const [locating, setLocating] = useState(true);
  const [userArea, setUserArea] = useState('');
  const [laundries, setLaundries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy]     = useState('distance');
  const [serviceType, setServiceType] = useState('wash-fold');
  const [form, setForm] = useState({ address: '', notes: '', pickupDate: '', pickupTime: '', mode: 'pickup' });
  const [booking, setBooking]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Nairobi';
          setUserArea(area);
        } catch { setUserArea('Nairobi'); }
        const shuffled = [...MOCK_LAUNDRIES]
          .map(l => ({ ...l, distance: +(l.distance + (Math.random() * 0.4 - 0.2)).toFixed(1) }))
          .sort((a, b) => a.distance - b.distance);
        setLaundries(shuffled);
        setLocating(false);
      },
      () => { setUserArea('Nairobi'); setLaundries(MOCK_LAUNDRIES); setLocating(false); },
      { timeout: 5000 }
    );
  }, []);

  const sorted = [...laundries].sort((a, b) => {
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'rating')   return b.rating - a.rating;
    if (sortBy === 'price')    return a.priceFrom - b.priceFrom;
    if (sortBy === 'speed')    return (a.turnaround.includes('Same') ? 0 : a.turnaround.includes('hr') ? 1 : 2) - (b.turnaround.includes('Same') ? 0 : b.turnaround.includes('hr') ? 1 : 2);
    return 0;
  });

  async function handleBook(e) {
    e.preventDefault();
    if (!user) {
      navigate('/signup', { state: { prefill: { name: guestContact?.name || '', phone: guestContact?.phone || '', email: guestContact?.email || '' } } });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await supabase.from('bookings').insert({
        user_id:      user.id,
        service:      'Cleaning',
        sub_service:  'Laundry – ' + SERVICES.find(s => s.id === serviceType)?.label,
        address:      form.address,
        booking_date: form.pickupDate,
        booking_time: form.pickupTime,
        notes:        `Mode: ${form.mode === 'pickup' ? 'Pickup & Delivery' : 'Drop-off'}. Provider: ${selected.name}, ${selected.area}. ${form.notes}`,
        status:       'pending',
      }).select().single();
      setBooking(data);
      setStep('booked');
    } catch (err) { console.error(err); }
    setSubmitting(false);
  }

  /* ── BOOKED ── */
  if (step === 'booked') {
    return (
      <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: CL.successBg, border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
          </div>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Booking Confirmed!</div>
          <div style={{ color: CL.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            {selected.name} will {form.mode === 'pickup' ? 'pick up your laundry' : 'receive your drop-off'} on <strong>{form.pickupDate}</strong> at <strong>{form.pickupTime}</strong>.
          </div>

          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 24, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Provider',    `${selected.name} · ${selected.area}`],
                ['Service',     SERVICES.find(s => s.id === serviceType)?.label],
                ['Mode',        form.mode === 'pickup' ? 'Pickup & Delivery' : 'Drop-off at shop'],
                ['Date',        form.pickupDate],
                ['Time',        form.pickupTime],
                ['Turnaround',  selected.turnaround],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>{k}</span>
                  <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => navigate(`/track/${booking?.id}`)}
              style={{ padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MapPin size={16} /> Track My Order
            </button>
            <button onClick={() => navigate('/history')}
              style={{ padding: '12px', borderRadius: 13, background: 'transparent', border: `1px solid ${CL.border}`, color: CL.muted, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
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

  /* ── CONFIRM FORM ── */
  if (step === 'confirm' && selected) {
    return (
      <div style={{ minHeight: '100vh', background: CL.bg }}>
        <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
          <button onClick={() => setStep('browse')} style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} color={CL.text} />
          </button>
          <div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Complete Booking</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Book with {selected.name}</div>
          </div>
        </div>

        <div style={{ padding: '24px 18px', maxWidth: 560, margin: '0 auto' }}>
          {/* Selected laundry mini card */}
          <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${selected.color}18`, border: `1px solid ${selected.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: selected.color, fontSize: 14, fontWeight: 900 }}>{selected.initials}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selected.area} · {selected.distance} km</span>
                <Star size={11} fill={CL.gold} strokeWidth={0} />
                <span>{selected.rating}</span>
              </div>
            </div>
            <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={10} color={CL.success} />
              <span style={{ color: CL.success, fontSize: 11, fontWeight: 700 }}>{selected.turnaround}</span>
            </div>
          </div>

          <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Service type */}
            <div>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Service Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SERVICES.map(s => (
                  <div key={s.id} onClick={() => setServiceType(s.id)} style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: serviceType === s.id ? CL.goldSoft : CL.surface,
                    border: `1px solid ${serviceType === s.id ? CL.goldBorder : CL.border}`,
                  }}>
                    <div style={{ color: serviceType === s.id ? CL.gold : CL.text, fontSize: 12, fontWeight: 700 }}>{s.label}</div>
                    <div style={{ color: CL.muted, fontSize: 10, marginTop: 2 }}>{s.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Collection Mode</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: 'pickup',  Icon: Car,   label: 'Pickup & Delivery', desc: 'We come to you' },
                  { value: 'dropoff', Icon: Store,  label: 'Drop-Off at Shop',  desc: 'You bring it to us' },
                ].map(m => (
                  <div key={m.value} onClick={() => setForm(f => ({ ...f, mode: m.value }))} style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: form.mode === m.value ? CL.goldSoft : CL.surface,
                    border: `1px solid ${form.mode === m.value ? CL.goldBorder : CL.border}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <m.Icon size={14} color={form.mode === m.value ? CL.gold : CL.muted} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ color: form.mode === m.value ? CL.gold : CL.text, fontSize: 12, fontWeight: 700 }}>{m.label}</div>
                      <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {form.mode === 'pickup' && (
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Your Address</label>
                <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. Apt 4B, Parklands Road, Nairobi"
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Date</label>
                <input required type="date" value={form.pickupDate} onChange={e => setForm(f => ({ ...f, pickupDate: e.target.value }))} min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>Time</label>
                <input required type="time" value={form.pickupTime} onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))}
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div>
              <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Special Instructions <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Handle delicates gently, separate whites…" rows={3}
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={submitting}
              style={{ padding: '14px', borderRadius: 12, background: submitting ? CL.border : CL.navy, border: 'none', color: submitting ? CL.muted : '#fff', fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Booking…</> : <><CheckCircle2 size={16} /> Confirm Booking</>}
            </button>
          </form>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── BROWSE ── */
  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate('/service/cleaning')} style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={CL.text} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Laundry Services</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Smart nearest-provider matching</div>
        </div>
      </div>

      <div style={{ padding: '20px 18px', maxWidth: 760, margin: '0 auto' }}>

        {/* Location Banner */}
        <div style={{ background: locating ? '#EBF8FF' : CL.successBg, border: `1px solid ${locating ? '#BEE3F8' : CL.successBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          {locating ? <Signal size={20} color="#3182CE" /> : <MapPin size={20} color={CL.success} />}
          <div style={{ flex: 1 }}>
            <div style={{ color: locating ? '#2B6CB0' : CL.success, fontSize: 13, fontWeight: 700 }}>
              {locating ? 'Detecting your location…' : `Showing laundries near ${userArea}`}
            </div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
              {locating ? 'Searching for nearby providers' : `${sorted.filter(l => l.open).length} providers open now · Sorted by ${sortBy}`}
            </div>
          </div>
          {!locating && <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, color: CL.success, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 }}>LIVE</div>}
        </div>

        {/* Sort Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)} style={{
              background: sortBy === opt.value ? CL.goldSoft : CL.surface,
              border: `1px solid ${sortBy === opt.value ? CL.goldBorder : CL.border}`,
              color: sortBy === opt.value ? CL.gold : CL.muted,
              fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Cards */}
        {locating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 20, height: 100, opacity: 0.4 + i * 0.1 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map((laundry, idx) => (
              <motion.div key={laundry.id}
                initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: idx * 0.05 }}
                onClick={() => { if (laundry.open) { setSelected(laundry); setStep('confirm'); } }}
                style={{
                  background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16,
                  padding: '18px 20px', cursor: laundry.open ? 'pointer' : 'default',
                  opacity: laundry.open ? 1 : 0.55, transition: 'all 0.15s', position: 'relative',
                }}
                onMouseEnter={e => { if (laundry.open) e.currentTarget.style.borderColor = CL.goldBorder; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; }}
              >
                {idx === 0 && laundry.open && (
                  <div style={{ position: 'absolute', top: -1, left: 18, background: CL.gold, color: CL.navy, fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: '0 0 8px 8px', letterSpacing: 0.5 }}>
                    TOP PICK
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: idx === 0 && laundry.open ? 8 : 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${laundry.color}15`, border: `1px solid ${laundry.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: laundry.color, fontSize: 14, fontWeight: 900 }}>{laundry.initials}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>{laundry.name}</span>
                      <span style={{ background: laundry.open ? CL.successBg : CL.errorBg, color: laundry.open ? CL.success : CL.error, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {laundry.open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div style={{ color: CL.muted, fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={11} />
                      {laundry.area} · {laundry.distance} km · {laundry.speciality}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.gold, fontSize: 12, fontWeight: 700 }}>
                        <Star size={11} fill={CL.gold} strokeWidth={0} />{laundry.rating} <span style={{ color: CL.muted, fontWeight: 400 }}>({laundry.reviews})</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}>
                        <Zap size={11} />{laundry.turnaround}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}>
                        <DollarSign size={11} />From KSh {laundry.priceFrom}/kg
                      </span>
                    </div>
                  </div>
                  {laundry.open && (
                    <div style={{ flexShrink: 0, background: CL.navy, color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                      Book
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: 32, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 16 }}>How Laundry Matching Works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { Icon: MapPin,      step: '1', label: 'We detect your location' },
              { Icon: Search,      step: '2', label: 'Find nearest rated laundries' },
              { Icon: Package,     step: '3', label: 'Rider picks up your clothes' },
              { Icon: CheckCircle2, step: '4', label: 'Clean clothes returned to you' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <s.Icon size={18} color={CL.gold} strokeWidth={1.7} />
                </div>
                <div style={{ color: CL.gold, fontSize: 10, fontWeight: 800, marginBottom: 4 }}>STEP {s.step}</div>
                <div style={{ color: CL.muted, fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
