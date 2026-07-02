import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, Wrench, Clock, Briefcase, ClipboardList,
  MessageSquare, CheckCircle2, Home, History, Loader, ChevronUp
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const GOOD_TAGS = [
  'Clean work', 'On time', 'Very friendly', 'Professional',
  'Fixed it perfectly', 'Good communication', 'Left place tidy', 'Good value',
];
const BAD_TAGS = [
  'Arrived late', 'Work not complete', 'Not professional',
  'Poor communication', 'Left a mess', 'Overcharged',
];

function ratingLabel(r) {
  return ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][r] || '';
}

function StarRating({ value, onChange, size = 40 }) {
  const CL = useCL();
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: size, cursor: 'pointer',
            color: s <= (hovered || value) ? CL.gold : CL.border,
            transition: 'all 0.15s',
            transform: s <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
            display: 'inline-block',
            filter: s <= (hovered || value) ? 'drop-shadow(0 2px 6px rgba(201,160,32,0.5))' : 'none',
          }}
        >★</span>
      ))}
    </div>
  );
}

function SmallStars({ value, onChange }) {
  const CL = useCL();
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange(s)} style={{
          fontSize: 22, cursor: 'pointer',
          color: s <= value ? CL.gold : CL.border,
          transition: 'color 0.1s',
        }}>★</span>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const CL = useCL();
  const navigate      = useNavigate();
  const { state }     = useLocation();
  const { bookingId } = useParams();
  const { user }      = useAuth();

  const [booking, setBooking]     = useState(state?.booking || null);
  const [worker,  setWorker]      = useState(state?.worker  || null);
  const [loadingData, setLoadingData] = useState(!!bookingId && !state?.booking);

  useEffect(() => {
    if (!bookingId || state?.booking) return;
    const load = async () => {
      setLoadingData(true);
      const { data: b } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
      if (b) {
        setBooking(b);
        if (b.worker_id) {
          const { data: w } = await supabase.from('workers').select('*').eq('id', b.worker_id).maybeSingle();
          if (w) setWorker(w);
        }
      }
      setLoadingData(false);
    };
    load();
  }, [bookingId]);

  const [overallRating,  setOverallRating]  = useState(0);
  const [catRatings,     setCatRatings]     = useState({ quality: 0, punctuality: 0, professionalism: 0 });
  const [selectedTags,   setSelectedTags]   = useState([]);
  const [workSummary,    setWorkSummary]    = useState('');
  const [comment,        setComment]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [done,           setDone]           = useState(false);

  const setCat    = (k, v) => setCatRatings(r => ({ ...r, [k]: v }));
  const toggleTag = (tag)  => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const canSubmit = overallRating > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await supabase.from('reviews').insert({
        booking_id:      booking?.id   || null,
        worker_id:       worker?.id    || booking?.worker_id || null,
        customer_id:     user?.id      || null,
        rating:          overallRating,
        quality:         catRatings.quality         || null,
        punctuality:     catRatings.punctuality      || null,
        professionalism: catRatings.professionalism  || null,
        tags:            selectedTags,
        comment:         comment.trim()     || null,
        work_summary:    workSummary.trim() || null,
      });

      if (worker?.id || booking?.worker_id) {
        const wid = worker?.id || booking?.worker_id;
        const { data: allReviews } = await supabase
          .from('reviews').select('rating').eq('worker_id', wid);
        if (allReviews && allReviews.length > 0) {
          const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
          await supabase.from('workers')
            .update({ rating: Math.round(avg * 10) / 10 }).eq('id', wid);
        }
      }
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* Loading */
  if (loadingData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: CL.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 18, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Star size={26} color={CL.gold} strokeWidth={1.8} />
        </div>
        <div style={{ color: CL.muted, fontSize: 14 }}>Loading your review…</div>
      </div>
    </div>
  );

  /* Success screen */
  if (done) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 24,
          background: CL.successBg, border: `1px solid ${CL.successBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((s, i) => (
            <motion.span
              key={s}
              initial={{ scale: 0, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 280 }}
              style={{
                fontSize: 34, color: s <= overallRating ? CL.gold : CL.border,
                display: 'inline-block',
              }}
            >★</motion.span>
          ))}
        </div>

        <div style={{ color: CL.text, fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Thank You!</div>
        <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
          Your review helps other customers and keeps our professionals motivated.
        </div>
        {worker && (
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 28 }}>
            You rated <strong style={{ color: CL.gold }}>{worker.full_name}</strong> {overallRating} out of 5 stars
          </div>
        )}

        <button
          onClick={() => navigate('/home')}
          style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: CL.navy, color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginBottom: 10, fontFamily: 'inherit',
          }}
        >
          <Home size={16} /> Back to Home
        </button>
        <button
          onClick={() => navigate('/history')}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'none', border: `1px solid ${CL.border}`,
            color: CL.muted, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          <History size={15} /> View Booking History
        </button>
      </motion.div>
    </div>
  );

  /* Review form */
  const CATS = [
    { key: 'quality',         Icon: Wrench,    label: 'Service Quality' },
    { key: 'punctuality',     Icon: Clock,     label: 'Punctuality' },
    { key: 'professionalism', Icon: Briefcase, label: 'Professionalism' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Sticky header */}
      <div style={{
        background: CL.surface, borderBottom: `1px solid ${CL.border}`,
        padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 38, height: 38, borderRadius: 12, background: CL.bg,
            border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Rate Your Experience</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>
            How did {worker?.full_name || 'your professional'} do?
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 18px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* Worker card */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '16px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: CL.goldSoft, border: `1.5px solid ${CL.goldBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Wrench size={24} color={CL.gold} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>
                {worker?.full_name || booking?.worker_name || 'Your Professional'}
              </div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>
                {worker?.service || 'Home Service'}
              </div>
              <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
                {booking?.sub_service || booking?.service}
                {booking?.booking_date ? ` · ${booking.booking_date}` : ''}
              </div>
            </div>
            {worker?.rating && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.gold, fontSize: 13, fontWeight: 700 }}>
                  <Star size={13} fill={CL.gold} strokeWidth={0} />
                  {worker.rating}
                </div>
                <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{worker.total_jobs || 0} jobs</div>
              </div>
            )}
          </motion.div>

          {/* Overall star rating */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.06 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '24px 20px', marginBottom: 14, textAlign: 'center',
            }}
          >
            <div style={{
              color: CL.muted, fontSize: 11, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16,
            }}>Overall Rating</div>
            <StarRating value={overallRating} onChange={setOverallRating} size={44} />
            <AnimatePresence>
              {overallRating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ color: CL.gold, fontSize: 15, fontWeight: 700, marginTop: 12 }}
                >
                  {ratingLabel(overallRating)}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Category ratings */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '18px 20px', marginBottom: 14,
            }}
          >
            <div style={{
              color: CL.muted, fontSize: 11, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16,
            }}>Rate Specific Areas</div>
            {CATS.map((cat, i) => (
              <div key={cat.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: i < CATS.length - 1 ? 14 : 0,
                marginBottom: i < CATS.length - 1 ? 14 : 0,
                borderBottom: i < CATS.length - 1 ? `1px solid ${CL.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: CL.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <cat.Icon size={16} color={CL.muted} strokeWidth={1.8} />
                  </div>
                  <span style={{ color: CL.text, fontSize: 14 }}>{cat.label}</span>
                </div>
                <SmallStars value={catRatings[cat.key]} onChange={v => setCat(cat.key, v)} />
              </div>
            ))}
          </motion.div>

          {/* Quick tags */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.14 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '18px 20px', marginBottom: 14,
            }}
          >
            <div style={{
              color: CL.muted, fontSize: 11, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
            }}>
              {overallRating >= 4 ? 'What was great?' : overallRating > 0 ? 'What needs improvement?' : 'What stood out?'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(overallRating >= 4 || overallRating === 0 ? GOOD_TAGS : BAD_TAGS).map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: active ? CL.goldSoft : CL.bg,
                    border: `1px solid ${active ? CL.gold : CL.border}`,
                    color: active ? CL.gold : CL.muted,
                    fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s',
                    transform: active ? 'scale(1.03)' : 'scale(1)',
                  }}>{tag}</button>
                );
              })}
            </div>
          </motion.div>

          {/* Work done summary */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.17 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '18px 20px', marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ClipboardList size={15} color={CL.gold} strokeWidth={2} />
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Work Done Summary</div>
              <span style={{ color: CL.muted, fontSize: 11, fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{ color: CL.muted, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
              Briefly describe what was actually fixed or completed.
            </div>
            <textarea
              placeholder="e.g. Worker replaced the faulty pipe under the kitchen sink. Also checked and tightened all other connections. Tested — no more leaking."
              value={workSummary}
              onChange={e => setWorkSummary(e.target.value)}
              rows={3}
              maxLength={500}
              style={{
                width: '100%', background: CL.bg, border: `1px solid ${CL.border}`,
                borderRadius: 12, padding: '12px 14px', color: CL.text, fontSize: 13,
                fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = CL.goldBorder}
              onBlur={e => e.target.style.borderColor = CL.border}
            />
            <div style={{ color: CL.muted, fontSize: 11, textAlign: 'right', marginTop: 4 }}>
              {workSummary.length}/500
            </div>
          </motion.div>

          {/* Additional comments */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '18px 20px', marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MessageSquare size={15} color={CL.gold} strokeWidth={2} />
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Additional Comments</div>
              <span style={{ color: CL.muted, fontSize: 11 }}>(optional)</span>
            </div>
            <textarea
              placeholder="Anything else you'd like to share about your experience?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={300}
              style={{
                width: '100%', background: CL.bg, border: `1px solid ${CL.border}`,
                borderRadius: 12, padding: '12px 14px', color: CL.text, fontSize: 13,
                fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = CL.goldBorder}
              onBlur={e => e.target.style.borderColor = CL.border}
            />
          </motion.div>

          {/* Hint */}
          {!canSubmit && (
            <div style={{
              textAlign: 'center', color: CL.muted, fontSize: 13, marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <ChevronUp size={14} />
              Tap the stars above to leave your rating
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              width: '100%', padding: '17px', borderRadius: 16, marginBottom: 12,
              background: canSubmit && !submitting ? CL.navy : CL.border,
              border: 'none',
              color: canSubmit && !submitting ? '#fff' : CL.muted,
              fontSize: 16, fontWeight: 800,
              cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {submitting ? (
              <>
                <Loader size={17} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting…
              </>
            ) : (
              <>
                <Star size={17} fill={canSubmit ? '#fff' : CL.muted} strokeWidth={0} />
                Submit Review{overallRating ? ` (${overallRating}/5)` : ''}
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/home')}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'none', border: `1px solid ${CL.border}`,
              color: CL.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Skip for now
          </button>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
