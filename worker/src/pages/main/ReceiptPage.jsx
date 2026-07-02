import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Printer, CheckCircle, Briefcase, Calendar, Clock, MapPin, CreditCard, Hash } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
};

export default function ReceiptPage() {
  const { jobId }   = useParams();
  const navigate    = useNavigate();
  const { profile } = useAuth();

  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('bookings').select('*').eq('id', jobId).single()
      .then(({ data }) => { setJob(data); setLoading(false); });
  }, [jobId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CL.bg }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${CL.gold}30`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: CL.bg }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: `${CL.muted}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Briefcase size={30} color={CL.muted} strokeWidth={1.5} />
      </div>
      <div style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>Job not found</div>
      <button onClick={() => navigate('/history')} style={{ padding: '10px 24px', borderRadius: 12, background: CL.text, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Back to History
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const receiptNo  = `FIX-W-${job.id.slice(0, 8).toUpperCase()}`;
  const doneDate   = job.completed_at
    ? new Date(job.completed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : job.booking_date || '—';
  const doneTime   = job.completed_at
    ? new Date(job.completed_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    : job.booking_time || '—';

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .receipt-wrap {
            padding: 0 !important;
            background: #fff !important;
            min-height: unset !important;
          }
          .receipt-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Action bar */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="no-print" style={{
        background: CL.surface, borderBottom: `1px solid ${CL.border}`,
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: CL.muted, fontSize: 13, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 20px', borderRadius: 12, border: 'none',
          background: CL.text, color: '#fff',
          fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Printer size={15} /> Download PDF
        </button>
      </motion.div>

      {/* Receipt wrapper */}
      <div className="receipt-wrap" style={{
        minHeight: '100vh', background: CL.bg,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 20px 80px',
      }}>
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="receipt-card" style={{
          width: '100%', maxWidth: 580,
          background: CL.surface, borderRadius: 20,
          border: `1px solid ${CL.border}`,
          boxShadow: '0 4px 32px rgba(10,22,40,0.08)',
          overflow: 'hidden',
        }}>

          {/* Brand header */}
          <div style={{ background: CL.goldSoft, borderBottom: `1px solid ${CL.goldBorder}`, padding: '24px 36px', textAlign: 'center' }}>
            <img src="/logo-mark.png" alt="Fixera" style={{ height: 48, width: 'auto', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ color: CL.gold, fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>FIXERA</div>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, letterSpacing: 2, marginTop: 4 }}>PARTNER PORTAL · NAIROBI</div>
          </div>

          {/* Status bar */}
          <div style={{
            background: CL.greenSoft, borderBottom: `1px solid ${CL.greenBorder}`,
            padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, letterSpacing: 0.5 }}>JOB COMPLETION SUMMARY</div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>#{receiptNo}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: CL.green, color: '#fff', fontSize: 12, fontWeight: 800 }}>
              <CheckCircle size={13} strokeWidth={2.5} /> COMPLETED
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 36px' }}>

            {/* Worker + date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <InfoBlock label="Worker" value={profile?.full_name || 'Fixera Worker'} />
              <InfoBlock label="Completed" value={doneDate} />
            </div>

            <Divider />

            <Section title="Job Details">
              <Row Icon={Briefcase}   label="Service"      value={job.sub_service || job.service || '—'} />
              <Row Icon={Calendar}    label="Booked Date"  value={job.booking_date || '—'} />
              <Row Icon={Clock}       label="Booked Time"  value={job.booking_time || '—'} />
              <Row Icon={CheckCircle} label="Completed"    value={`${doneDate} · ${doneTime}`} />
              <Row Icon={MapPin}      label="Location"     value={job.address || '—'} />
              {job.notes && <Row Icon={Hash} label="Customer Notes" value={job.notes} />}
            </Section>

            <Divider />

            <Section title="Earnings">
              <Row Icon={CreditCard} label="Payment Method" value="M-Pesa (customer)" />
              <Row Icon={CheckCircle} label="Status" value="Settled" highlight />
              <div style={{
                background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`,
                borderRadius: 14, padding: '16px 20px', marginTop: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ color: CL.muted, fontSize: 13, fontWeight: 600 }}>Total Earned</div>
                <div style={{ color: CL.green, fontSize: 22, fontWeight: 900 }}>KSh 1,500</div>
              </div>
            </Section>

            <Divider />

            {/* Reference */}
            <div style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ color: CL.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Booking Reference</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: CL.text, wordBreak: 'break-all' }}>{job.id}</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: CL.bg, borderTop: `1px solid ${CL.border}`, padding: '20px 36px', textAlign: 'center' }}>
            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
              Thank you for your great work!<br />
              Questions? Contact <strong style={{ color: CL.gold }}>workers@fixera.africa</strong><br />
              <span style={{ fontSize: 11 }}>www.fixera.africa · Nairobi, Kenya</span>
            </div>
          </div>

        </motion.div>
      </div>
    </>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={{ color: CL.muted, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: CL.gold, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, minWidth: 140 }}>
        <Icon size={13} color={CL.muted} strokeWidth={2} />
        <span style={{ color: CL.muted, fontSize: 13 }}>{label}</span>
      </div>
      <span style={{ color: highlight ? CL.green : CL.text, fontWeight: highlight ? 700 : 500, fontSize: 13, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: CL.border, margin: '20px 0' }} />;
}
