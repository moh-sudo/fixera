import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { SERVICES, formatPrice } from '../../data/services';
import { getCategories, getServicesForCategory } from '../../services/catalogService';
import LocationPickerMap from '../../components/LocationPickerMap';
import { useUserLocation } from '../../hooks/useUserLocation';
import { supabase } from '../../supabase';
import { validateServiceArea } from '../../services/serviceAreaService';

// Maps serviceId param → workers.service column value (must match exactly what workers save)
const SERVICE_LABEL = {
  plumbing:   'Plumbing 💧',
  electrical: 'Electrical ⚡',
  cleaning:   'Cleaning ✨',
  painting:   'Painting 🎨',
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

export default function BookingFormPage() {
  const { serviceId, categoryId, subServiceId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [areaError, setAreaError] = useState('');

  // Real workers from Supabase
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

  // Pre-fill address when location is detected
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
      .select('id, full_name, service, status, rating, total_jobs, avatar')
      .eq('service', label)
      .order('rating', { ascending: false })
      .then(({ data, error }) => {
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
      try {
        await validateServiceArea(address);
      } catch (err) {
        setAreaError(err.message);
        return;
      }
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
    <div style={{ padding:'32px', minHeight:'100vh', background:C.navy }}>
      <style>{`
        .worker-opt:hover { border-color:#C9A02050 !important; transform:translateY(-2px); }
        .time-slot:hover { border-color:#C9A02060 !important; }
        .step-btn:hover { opacity:0.85; }
        .booking-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
        @media (max-width:700px) { .booking-grid { grid-template-columns:1fr; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:30 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{
          width:40, height:40, borderRadius:12, border:`1px solid ${C.navyBorder}`,
          background:C.navyLight, color:C.textPrimary, fontSize:18, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>←</button>
        <div>
          <div style={{ color:C.textPrimary, fontSize:20, fontWeight:800 }}>
            {sub?.name || 'Book Service'}
          </div>
          <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </div>
        </div>
      </div>

      {/* ── Step progress bar ── */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', gap:6 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{
                height:4, width:'100%', borderRadius:2,
                background: i <= step ? C.gold : C.navyBorder,
                transition:'background 0.3s ease',
              }} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ color: i === step ? C.gold : C.textMuted, fontSize:11, fontWeight: i === step ? 700 : 400 }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 0: Service Details ── */}
      {step === 0 && (
        <div className="booking-grid">
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Service summary */}
            <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22 }}>
              <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Service Selected</div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:`${svc?.color || C.gold}18`, border:`1px solid ${svc?.color || C.gold}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
                  {svc?.icon || '🔧'}
                </div>
                <div>
                  <div style={{ color:C.textPrimary, fontSize:16, fontWeight:800 }}>{sub?.name || 'Service'}</div>
                  <div style={{ color:C.textMuted, fontSize:13, marginTop:3 }}>{cat?.name} · {svc?.name}</div>
                  <div style={{ display:'flex', gap:8, marginTop:6 }}>
                    <span style={{ background:C.navyMid, color:C.textSec, fontSize:11, padding:'3px 10px', borderRadius:8 }}>⏱ {sub?.duration || '1-2 hrs'}</span>
                    <span style={{ background:`rgba(201,160,32,0.12)`, color:C.gold, fontSize:11, padding:'3px 10px', borderRadius:8 }}>💰 {formatPrice(sub)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22 }}>
              <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Service Address</div>
              <div style={{ position:'relative', marginBottom:12 }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>📍</span>
                <input value={address} onChange={e => { setAddress(e.target.value); setAreaError(''); }}
                  placeholder="Enter your full address"
                  style={{ width:'100%', padding:'13px 14px 13px 42px', borderRadius:12, border:`1px solid ${C.navyBorder}`, background:C.navyMid, color:C.textPrimary, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='#C9A02060'}
                  onBlur={e => e.target.style.borderColor=C.navyBorder}
                />
              </div>
              {/* Map picker — centered on user's real location */}
              <LocationPickerMap
                onLocationSelect={(addr) => setAddress(addr)}
                initialLat={userLocation?.lat}
                initialLng={userLocation?.lng}
                initialAddress={userLocation?.full}
              />
              <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
                {['Home','Work','Partner\'s Place'].map(q => (
                  <button key={q} onClick={() => { setAddress(q + ' Address'); setAreaError(''); }} style={{
                    padding:'6px 14px', borderRadius:20, border:`1px solid ${C.navyBorder}`,
                    background:'transparent', color:C.textSec, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                  }}>{q}</button>
                ))}
              </div>
              {areaError && (
                <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(220,50,50,0.1)', border:'1px solid rgba(220,50,50,0.3)', color:'#ff6b6b', fontSize:13 }}>
                  ⚠️ {areaError}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22 }}>
              <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Special Instructions</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any special instructions for the professional? (optional)"
                rows={3}
                style={{ width:'100%', padding:'13px 14px', borderRadius:12, border:`1px solid ${C.navyBorder}`, background:C.navyMid, color:C.textPrimary, fontSize:14, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#C9A02060'}
                onBlur={e => e.target.style.borderColor=C.navyBorder}
              />
            </div>
          </div>

          {/* Sidebar hint */}
          <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22 }}>
            <div style={{ color:C.gold, fontSize:13, fontWeight:700, marginBottom:16 }}>📋 How it works</div>
            {['Enter your address & notes','Pick your preferred professional','Choose date & time','Confirm and we handle the rest!'].map((t, i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:14, alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:8, background:i === 0 ? C.gold : C.navyMid, color: i === 0 ? '#0A0E1A' : C.textMuted, fontSize:12, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
                <div style={{ color: i === 0 ? C.textPrimary : C.textMuted, fontSize:13, lineHeight:1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Choose Professional ── */}
      {step === 1 && (
        <div>
          <div style={{ color:C.textSec, fontSize:14, marginBottom:20 }}>
            Choose your preferred professional for this job:
          </div>

          {/* Loading */}
          {workersLoading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:16 }}>
              <div style={{ width:40, height:40, border:`3px solid rgba(201,160,32,0.2)`, borderTopColor:C.gold, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <div style={{ color:C.textSec, fontSize:14 }}>Finding available professionals…</div>
            </div>
          )}

          {/* No workers */}
          {!workersLoading && workers.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>😔</div>
              <div style={{ color:C.textPrimary, fontSize:16, fontWeight:700, marginBottom:8 }}>No professionals available right now</div>
              <div style={{ color:C.textSec, fontSize:13 }}>All our {SERVICE_LABEL[serviceId]} experts are currently busy. Please try again later or contact support.</div>
            </div>
          )}

          {/* Worker cards */}
          {!workersLoading && workers.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14 }}>
              {workers.map(w => {
                const isOnline   = w.status === 'online';
                const isSelected = selectedWorker === w.id;
                const initials   = (w.full_name || 'W').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
                const rating     = w.rating ? parseFloat(w.rating).toFixed(1) : '—';
                const jobs       = w.total_jobs || 0;

                return (
                  <div key={w.id} className="worker-opt" onClick={() => setSelectedWorker(w.id)} style={{
                    background: isSelected ? `rgba(201,160,32,0.1)` : C.navyLight,
                    border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.navyBorder}`,
                    borderRadius:18, padding:20, cursor:'pointer',
                    transition:'all 0.2s ease', position:'relative',
                  }}>

                    {/* Online badge — top left */}
                    <div style={{ position:'absolute', top:12, left:12, display:'flex', alignItems:'center', gap:4,
                      background: isOnline ? 'rgba(72,187,120,0.15)' : 'rgba(120,120,120,0.1)',
                      border: `1px solid ${isOnline ? '#48BB7850' : 'transparent'}`,
                      borderRadius:20, padding:'2px 8px',
                    }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background: isOnline ? '#48BB78' : '#666' }} />
                      <span style={{ fontSize:10, fontWeight:700, color: isOnline ? '#48BB78' : C.textMuted }}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Selected checkmark — top right */}
                    {isSelected && (
                      <div style={{ position:'absolute', top:12, right:12, width:22, height:22, borderRadius:'50%', background:C.gold, display:'flex', alignItems:'center', justifyContent:'center', color:'#0A0E1A', fontSize:12, fontWeight:900 }}>✓</div>
                    )}

                    {/* Avatar */}
                    <div style={{ width:60, height:60, borderRadius:'50%', background:`rgba(201,160,32,0.15)`, border:`2px solid rgba(201,160,32,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: w.avatar ? 30 : 20, fontWeight:800, color:C.gold, margin:'28px auto 14px' }}>
                      {w.avatar || initials}
                    </div>

                    <div style={{ color:C.textPrimary, fontSize:15, fontWeight:800, textAlign:'center' }}>{w.full_name}</div>
                    <div style={{ color:C.textMuted, fontSize:12, marginTop:3, textAlign:'center' }}>{w.service} Expert</div>

                    <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'center' }}>
                      <span style={{ color:C.gold, fontSize:13 }}>⭐ {rating}</span>
                      <span style={{ color:C.textMuted, fontSize:12 }}>· {jobs} jobs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Date & Time ── */}
      {step === 2 && (
        <div className="booking-grid">
          <div>
            {/* Calendar row */}
            <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22, marginBottom:16 }}>
              <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Select Date</div>
              <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
                {DAYS_DATA.map((d, i) => (
                  <div key={i} onClick={() => setSelectedDate(i)} style={{
                    textAlign:'center', cursor:'pointer', minWidth:52, padding:'12px 8px',
                    borderRadius:14, border: selectedDate === i ? `2px solid ${C.gold}` : `1px solid ${C.navyBorder}`,
                    background: selectedDate === i ? `rgba(201,160,32,0.12)` : C.navyMid,
                    transition:'all 0.15s ease',
                  }}>
                    <div style={{ color: selectedDate === i ? C.gold : C.textMuted, fontSize:10, fontWeight:700, letterSpacing:1 }}>{d.day}</div>
                    <div style={{ color: selectedDate === i ? C.gold : C.textPrimary, fontSize:20, fontWeight:900, marginTop:4 }}>{d.date}</div>
                    {d.isToday && <div style={{ color:C.gold, fontSize:9, marginTop:2 }}>Today</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22 }}>
              <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Select Time</div>
              {['Morning','Afternoon','Evening'].map(period => {
                const slots = TIME_SLOTS.filter(t => t.period === period);
                return (
                  <div key={period} style={{ marginBottom:18 }}>
                    <div style={{ color:C.textMuted, fontSize:11, fontWeight:600, marginBottom:10 }}>{period}</div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {slots.map((slot, i) => (
                        <div key={i} className="time-slot" onClick={() => setSelectedTime(slot.label)} style={{
                          padding:'10px 18px', borderRadius:12, cursor:'pointer',
                          border: selectedTime === slot.label ? `2px solid ${C.gold}` : `1px solid ${C.navyBorder}`,
                          background: selectedTime === slot.label ? `rgba(201,160,32,0.12)` : C.navyMid,
                          color: selectedTime === slot.label ? C.gold : C.textPrimary,
                          fontSize:13, fontWeight: selectedTime === slot.label ? 700 : 400,
                          transition:'all 0.15s ease',
                        }}>{slot.label}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary sidebar */}
          <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:18, padding:22, alignSelf:'start' }}>
            <div style={{ color:C.textSec, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Your Booking</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ color:C.textMuted, fontSize:11 }}>Service</div>
                <div style={{ color:C.textPrimary, fontSize:14, fontWeight:700, marginTop:3 }}>{sub?.name || 'Service'}</div>
              </div>
              <div style={{ height:1, background:C.navyBorder }} />
              {worker && (
                <div>
                  <div style={{ color:C.textMuted, fontSize:11 }}>Professional</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(201,160,32,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:C.gold }}>
                      {worker.avatar || (worker.full_name || 'W').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ color:C.textPrimary, fontSize:13, fontWeight:700 }}>{worker.full_name}</div>
                  </div>
                </div>
              )}
              <div style={{ height:1, background:C.navyBorder }} />
              <div>
                <div style={{ color:C.textMuted, fontSize:11 }}>Date & Time</div>
                <div style={{ color:C.textPrimary, fontSize:13, fontWeight:700, marginTop:3 }}>
                  {selectedDate !== null ? DAYS_DATA[selectedDate].full : '—'}
                </div>
                <div style={{ color:C.textSec, fontSize:12, marginTop:2 }}>{selectedTime || '—'}</div>
              </div>
              <div style={{ height:1, background:C.navyBorder }} />
              <div>
                <div style={{ color:C.textMuted, fontSize:11 }}>Address</div>
                <div style={{ color:C.textPrimary, fontSize:13, marginTop:3 }}>{address || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 3 && (
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:20 }}>✅</div>
          <div style={{ color:C.textPrimary, fontSize:28, fontWeight:900, marginBottom:12 }}>All Set!</div>
          <div style={{ color:C.textSec, fontSize:15, lineHeight:1.7, marginBottom:32 }}>
            Review your booking details below and confirm to get matched with your professional.
          </div>
          <div style={{ background:C.navyLight, border:`1px solid ${C.navyBorder}`, borderRadius:20, padding:24, textAlign:'left', marginBottom:24 }}>
            {[
              ['Service', sub?.name || 'Service'],
              ['Professional', worker?.full_name || '—'],
              ['Date', selectedDate !== null ? DAYS_DATA[selectedDate].full : '—'],
              ['Time', selectedTime || '—'],
              ['Address', address],
              ['Price', formatPrice(sub)],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.navyBorder}` }}>
                <span style={{ color:C.textMuted, fontSize:13 }}>{label}</span>
                <span style={{ color:C.textPrimary, fontSize:13, fontWeight:700, maxWidth:'60%', textAlign:'right' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Next / Confirm button ── */}
      <div style={{ marginTop:32 }}>
        <button onClick={goNext} disabled={!canNext()} style={{
          padding:'17px 48px', borderRadius:16, border:'none',
          background: canNext() ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.navyMid,
          color: canNext() ? '#0A0E1A' : C.textMuted,
          fontSize:16, fontWeight:800, cursor: canNext() ? 'pointer' : 'not-allowed',
          boxShadow: canNext() ? `0 8px 28px rgba(201,160,32,0.3)` : 'none',
          transition:'all 0.2s ease',
        }}>
          {step === 3 ? '🚀 Confirm Booking' : step === 2 ? 'Review Booking →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
