import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, User, Calendar, Clock, AlarmClock, FileText, CheckCircle2, Tag, ShieldCheck, Lock } from 'lucide-react';
import { SERVICES, formatPrice } from '../../data/services';
import { useAuth } from '../../hooks/useAuth';
import { createBooking } from '../../services/bookingService';
import { sendBookingConfirmation } from '../../services/emailService';
import { getCategories, getServicesForCategory } from '../../services/catalogService';

import { useCL } from '../../hooks/useCL';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function BookingConfirmationPage() {
  const CL = useCL();
  const { serviceId, categoryId, subServiceId } = useParams();
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { user, isGuest, guestContact } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const [dbService, setDbService] = useState(null);
  const [dbSubSvc,  setDbSubSvc]  = useState(null);
  useEffect(() => {
    getCategories().then(cats => {
      const match = cats.find(c => c.slug === serviceId);
      if (match) {
        setDbService({ id: match.slug, name: match.name, icon: match.icon, color: match.color });
        getServicesForCategory(match.id).then(svcs => {
          const s = svcs.find(s => s.slug === subServiceId);
          if (s) setDbSubSvc({ id: s.slug, name: s.name, priceMin: s.price_min, priceMax: s.price_max, pricingType: s.is_quotation ? 'Quotation' : 'Fixed' });
        });
      }
    }).catch(() => {});
  }, [serviceId, subServiceId]);

  const hardcodedSvc = SERVICES.find(s => s.id === serviceId);
  const hardcodedCat = hardcodedSvc?.categories?.find(c => c.id === categoryId);
  const service  = dbService  || hardcodedSvc;
  const subSvc   = dbSubSvc   || hardcodedCat?.services?.find(sv => sv.id === subServiceId);

  const address    = state?.address    || '—';
  const date       = state?.date       || '—';
  const time       = state?.time       || '—';
  const notes      = state?.notes      || '';
  const workerName = state?.workerName || '—';

  const handleGuestToSignup = () => {
    navigate('/signup', {
      state: {
        prefill: {
          name:  guestContact?.name  || '',
          phone: guestContact?.phone || '',
          email: guestContact?.email || '',
        },
        returnTo: {
          path: `/confirm/${serviceId}/${categoryId}/${subServiceId}`,
          state,
        },
      },
    });
  };

  const handleConfirm = async () => {
    if (!user && isGuest) { setShowGuestPrompt(true); return; }
    setSaving(true);
    try {
      const booking = await createBooking(user.id, {
        service:      subSvc?.name   || state?.serviceName || 'Service',
        service_id:   service?.id    || state?.serviceId   || null,
        sub_service:  subSvc?.name   || state?.serviceName || 'Service',
        category:     hardcodedCat?.name || state?.category || '',
        service_icon: service?.icon  || state?.serviceIcon || '',
        address,
        booking_date: date,
        booking_time: time,
        notes,
        worker_id:    state?.workerId   || null,
        worker_name:  state?.workerName || null,
      });
      const customerEmail = {
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      };
      const bookingData = {
        service: subSvc?.name || state?.serviceName || 'Service',
        sub_service: subSvc?.name || state?.serviceName || 'Service',
        booking_date: date,
        booking_time: time,
        address,
        worker_name: state?.workerName || 'Assigned Soon',
        price: subSvc?.price ? formatPrice(subSvc.price) : 'TBD',
      };
      await sendBookingConfirmation(customerEmail, bookingData);
      if (service?.id === 'water-carriers' || state?.serviceId === 'water-carriers') {
        navigate(`/water/delivery/${booking.id}`);
      } else {
        navigate(`/worker/${booking.id}`, { state: { booking } });
      }
    } catch (err) {
      console.error('Booking save error:', err);
      navigate('/worker/new');
    } finally {
      setSaving(false);
    }
  };

  const ROWS = [
    { Icon: MapPin,     label: 'Location',     value: address },
    { Icon: User,       label: 'Professional', value: workerName },
    { Icon: Calendar,   label: 'Date',         value: date },
    { Icon: Clock,      label: 'Time',         value: time },
    { Icon: AlarmClock, label: 'Duration',     value: subSvc?.duration || '1–2 hrs' },
    ...(notes ? [{ Icon: FileText, label: 'Notes', value: notes }] : []),
  ];

  const pricingNote =
    subSvc?.pricingType === 'Priority'   ? 'Emergency call-out rates apply' :
    subSvc?.pricingType === 'Size-based' ? 'Final price depends on area size' :
    subSvc?.pricingType === 'Quotation'  ? 'Free survey — no obligation' :
    'Final price confirmed on site';

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`
        .cfm-grid { display:grid; grid-template-columns:1fr 340px; gap:18px; align-items:start; }
        @media (max-width:700px) { .cfm-grid { grid-template-columns:1fr; } }
      `}</style>

      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Confirm Booking</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Review your details before confirming</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 18px 80px' }}>
        <div className="cfm-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Service card */}
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ width: 58, height: 58, borderRadius: 17, background: (service?.color || CL.gold) + '18', border: `1px solid ${(service?.color || CL.gold)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {service?.icon || '🔧'}
              </div>
              <div>
                <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>{subSvc?.name || state?.serviceName || 'Service'}</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 3 }}>{service?.name}</div>
              </div>
            </motion.div>

            {/* Booking details */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${CL.border}` }}>
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Booking Details</div>
              </div>
              {ROWS.map(({ Icon, label, value }, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < ROWS.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={CL.muted} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: CL.light, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{value}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Cancellation policy */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: CL.successBg, border: `1px solid ${CL.success}25`, borderRadius: 14, padding: '13px 16px' }}>
              <CheckCircle2 size={18} color={CL.success} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span style={{ color: CL.muted, fontSize: 13 }}>Free cancellation up to 2 hours before the scheduled time.</span>
            </motion.div>
          </div>

          {/* Right column — pricing + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Pricing card */}
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={15} color={CL.muted} strokeWidth={2} />
                <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Pricing</div>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 13, padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ color: CL.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Estimated Price</div>
                  <div style={{ color: CL.gold, fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>
                    {formatPrice(subSvc)}
                  </div>
                  {subSvc?.priceMin && (
                    <div style={{ color: CL.muted, fontSize: 11, marginTop: 6 }}>{pricingNote}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ background: CL.bg, color: CL.muted, fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 20, border: `1px solid ${CL.border}` }}>
                    {subSvc?.pricingType || 'Fixed'} pricing
                  </span>
                  <span style={{ background: CL.successBg, color: CL.success, fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: `1px solid ${CL.success}25` }}>
                    Price shown before payment
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: CL.infoBg, border: `1px solid ${CL.info}25`, borderRadius: 11, padding: '11px 13px' }}>
                  <ShieldCheck size={14} color={CL.info} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: CL.info, fontSize: 12, lineHeight: 1.6 }}>You will always approve the final price before any payment is charged.</span>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleConfirm} disabled={saving}
                style={{ width: '100%', padding: '15px', borderRadius: 14, background: saving ? CL.border : CL.navy, border: 'none', color: saving ? CL.light : '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background 0.15s' }}>
                {saving ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} strokeWidth={2.2} />
                    Confirm Booking
                  </>
                )}
              </button>
              <button onClick={() => navigate(-1)}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'transparent', border: `1.5px solid ${CL.navy}`, color: CL.navy, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Edit Details
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Guest → account conversion modal */}
      {showGuestPrompt && (
        <div onClick={() => setShowGuestPrompt(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 400, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 22, padding: 28, textAlign: 'center', boxShadow: '0 20px 60px rgba(10,22,40,0.18)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Lock size={26} color={CL.gold} strokeWidth={1.8} />
            </div>
            <div style={{ color: CL.text, fontSize: 20, fontWeight: 800, marginBottom: 10 }}>One last step!</div>
            <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.75, marginBottom: 22 }}>
              {guestContact?.name ? `${guestContact.name.split(' ')[0]}, to` : 'To'} lock in this booking and track your professional, set a quick password. Your details are already filled in — takes 10 seconds.
            </div>
            <button onClick={handleGuestToSignup}
              style={{ width: '100%', padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              Complete My Booking →
            </button>
            <button onClick={() => setShowGuestPrompt(false)}
              style={{ width: '100%', background: 'none', border: 'none', color: CL.light, fontSize: 13, cursor: 'pointer', padding: 8, fontFamily: 'inherit' }}>
              Keep browsing
            </button>
          </motion.div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
