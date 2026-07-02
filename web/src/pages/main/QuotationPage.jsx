import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle2, Star, User, Wrench, Zap, Droplets,
  Paintbrush, ShieldCheck, FileText, Tag, AlertCircle
} from 'lucide-react';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const DEMO_QUOTATION = {
  ref: '#INS-48291',
  date: 'May 18, 2026',
  expires: 'May 19, 2026 · 6:00 PM',
  category: { Icon: Droplets, label: 'Plumbing', color: '#4A90D9' },
  issue: 'Kitchen sink leaking under the cabinet with water pooling on the floor.',
  professional: { name: 'James Mwangi', role: 'Senior Plumber', rating: 4.8, jobs: 98, color: '#4A90D9' },
  items: [
    { label: 'Initial Inspection Visit',   amount: 500,   note: 'On-site assessment' },
    { label: 'Pipe Joint Replacement',     amount: 1200,  note: 'Labour + fittings' },
    { label: 'Under-Sink Seal & Repair',   amount: 800,   note: 'Labour included' },
    { label: 'Materials & Parts',          amount: 650,   note: 'Estimated' },
  ],
  discount: 200,
  urgency: { label: 'Moderate', color: '#D4780A' },
  notes: 'Based on photos provided, this appears to be a worn pipe joint. The repair should take approximately 1.5–2 hours. Final cost may vary slightly if additional issues are found during inspection.',
};

export default function QuotationPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [showDeclinePanel, setShowDeclinePanel] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const q = DEMO_QUOTATION;
  const subtotal = q.items.reduce((s, i) => s + i.amount, 0);
  const total = subtotal - q.discount;

  /* Approved */
  if (approved) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 24, background: CL.successBg,
          border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
        </div>
        <div style={{ color: CL.text, fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Quotation Approved!</div>
        <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Great! <strong style={{ color: CL.gold }}>{q.professional.name}</strong> has been notified and will be assigned to your job.
        </div>
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${q.professional.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color={q.professional.color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>{q.professional.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Star size={12} fill={CL.gold} strokeWidth={0} />
                <span style={{ color: CL.muted, fontSize: 12 }}>{q.professional.rating} · {q.professional.role} · {q.professional.jobs} jobs</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${CL.border}` }}>
            <span style={{ color: CL.muted, fontSize: 13 }}>Total Approved</span>
            <span style={{ color: CL.gold, fontSize: 18, fontWeight: 900 }}>KSh {total.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/worker')} style={{ flex: 1, padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            Track Worker
          </button>
          <button onClick={() => navigate('/home')} style={{ flex: 1, padding: '14px', borderRadius: 13, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`.quotation-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; } @media (max-width:700px) { .quotation-grid { grid-template-columns:1fr; } }`}</style>

      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Your Quotation</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Review carefully before approving</div>
        </div>
        <div style={{ background: '#FEF9EC', border: `1px solid #E8D48A`, borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color={CL.gold} />
          <span style={{ color: CL.gold, fontSize: 11, fontWeight: 700 }}>Expires {q.expires}</span>
        </div>
      </div>

      <div style={{ padding: '20px 18px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="quotation-grid">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Reference card */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3 }}
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Quotation Reference</div>
                  <div style={{ color: CL.gold, fontSize: 22, fontWeight: 900, marginTop: 4 }}>{q.ref}</div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 4 }}>Issued {q.date}</div>
                </div>
                <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 20, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={11} color={CL.success} />
                  <span style={{ color: CL.success, fontSize: 11, fontWeight: 700 }}>Quotation Ready</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ background: `${q.category.color}15`, border: `1px solid ${q.category.color}30`, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <q.category.Icon size={12} color={q.category.color} />
                  <span style={{ color: q.category.color, fontSize: 12, fontWeight: 700 }}>{q.category.label}</span>
                </div>
                <div style={{ background: '#FEF9EC', border: '1px solid #E8D48A', borderRadius: 20, padding: '4px 12px' }}>
                  <span style={{ color: q.urgency.color, fontSize: 12, fontWeight: 700 }}>{q.urgency.label} Priority</span>
                </div>
              </div>
            </motion.div>

            {/* Issue summary */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.05 }}
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22 }}
            >
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Issue Summary</div>
              <div style={{ color: CL.text, fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>{q.issue}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: 56, height: 56, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} color={CL.muted} strokeWidth={1.5} />
                  </div>
                ))}
                <div style={{ width: 56, height: 56, borderRadius: 12, background: CL.bg, border: `1px dashed ${CL.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <span style={{ color: CL.muted, fontSize: 10, fontWeight: 700 }}>+ more</span>
                </div>
              </div>
            </motion.div>

            {/* Professional */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.08 }}
              style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22 }}
            >
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Recommended Professional</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 58, height: 58, borderRadius: 18, background: `${q.professional.color}15`, border: `2px solid ${q.professional.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={26} color={q.professional.color} strokeWidth={1.7} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>{q.professional.name}</div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 3 }}>{q.professional.role}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.gold, fontSize: 12, fontWeight: 700 }}>
                      <Star size={11} fill={CL.gold} strokeWidth={0} />{q.professional.rating}
                    </span>
                    <span style={{ color: CL.muted, fontSize: 12 }}>{q.professional.jobs} jobs</span>
                  </div>
                </div>
                <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={11} color={CL.success} />
                  <div style={{ color: CL.success, fontSize: 11, fontWeight: 700 }}>Verified</div>
                </div>
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.11 }}
              style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: 18 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText size={14} color={CL.gold} />
                <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>Notes from Fixera</span>
              </div>
              <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>{q.notes}</div>
            </motion.div>
          </div>

          {/* RIGHT — Price + actions */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.3, delay: 0.06 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Price breakdown */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22 }}>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Price Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {q.items.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                        <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{item.note}</div>
                      </div>
                      <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>KSh {item.amount.toLocaleString()}</div>
                    </div>
                    {i < q.items.length - 1 && <div style={{ height: 1, background: CL.border, marginTop: 12 }} />}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${CL.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>Subtotal</span>
                  <span style={{ color: CL.text, fontSize: 13 }}>KSh {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag size={12} color={CL.success} />
                    <span style={{ color: CL.success, fontSize: 13 }}>New customer discount</span>
                  </div>
                  <span style={{ color: CL.success, fontSize: 13, fontWeight: 700 }}>- KSh {q.discount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12 }}>
                  <span style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Total</span>
                  <span style={{ color: CL.gold, fontSize: 22, fontWeight: 900 }}>KSh {total.toLocaleString()}</span>
                </div>
                <div style={{ color: CL.muted, fontSize: 10, marginTop: 8, textAlign: 'center' }}>
                  Payment collected after job completion
                </div>
              </div>
            </div>

            {/* Approve button */}
            <button
              onClick={() => setApproved(true)}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                background: CL.navy, border: 'none', color: '#fff',
                fontSize: 15, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <CheckCircle2 size={17} />
              Approve Quotation
            </button>

            {/* Decline */}
            <AnimatePresence>
              {!showDeclinePanel ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Decline', 'Request Revision'].map(label => (
                    <button key={label} onClick={() => setShowDeclinePanel(true)} style={{
                      flex: 1, padding: '12px', borderRadius: 12,
                      background: 'transparent', border: `1px solid ${CL.border}`,
                      color: CL.muted, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>{label}</button>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 16 }}
                >
                  <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Tell us why (optional)</div>
                  {['Price is too high', 'I want a different professional', 'I changed my mind', 'Other'].map(r => (
                    <label key={r} onClick={() => setDeclineReason(r)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${declineReason === r ? CL.gold : CL.muted}`, background: declineReason === r ? CL.gold : 'transparent', flexShrink: 0 }} />
                      <span style={{ color: CL.muted, fontSize: 13 }}>{r}</span>
                    </label>
                  ))}
                  <button
                    onClick={() => navigate('/home')}
                    style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 10, background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, color: CL.error, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Confirm Decline
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust badge */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <ShieldCheck size={20} color={CL.navy} strokeWidth={1.7} />
              </div>
              <div style={{ color: CL.text, fontSize: 12, fontWeight: 700 }}>Fixera Protection</div>
              <div style={{ color: CL.muted, fontSize: 11, marginTop: 4, lineHeight: 1.6 }}>
                You only pay after the job is completed to your satisfaction. Work not done? Full refund guaranteed.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
