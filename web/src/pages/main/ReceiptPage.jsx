import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { sendReceipt } from '../../services/emailService';
import { generateAndUploadReceipt } from '../../utils/receiptPDF';

import { useCL } from '../../hooks/useCL';

export default function ReceiptPage() {
  const CL = useCL();
  const { bookingId } = useParams();
  const navigate      = useNavigate();
  const { profile }   = useAuth();

  const [booking, setBooking] = useState(null);
  const [worker,  setWorker]  = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.from('bookings').select('*').eq('id', bookingId).single()
      .then(({ data }) => {
        setBooking(data);
        if (data?.worker_id) {
          supabase.from('workers').select('full_name,service,phone').eq('id', data.worker_id).single()
            .then(({ data: w }) => setWorker(w));
        }
        setLoading(false);

        if (data && profile) {
          const customerEmail = {
            email: profile.email || data.customer_email,
            full_name: profile.full_name || 'Customer',
          };
          const receiptData = {
            receipt_no:   `FIX-${data.id.slice(0, 8).toUpperCase()}`,
            service:      data.service || 'Service',
            sub_service:  data.sub_service || data.service || 'Service',
            worker_name:  data.worker_name || 'Assigned Worker',
            amount:       data.price || data.total || '0',
            generated_at: new Date().toISOString(),
          };
          sendReceipt(customerEmail, receiptData).catch(() => {});
        }
      });

    supabase.from('receipts').select('id,pdf_url,amount,commission,service,address,generated_at').eq('booking_id', bookingId).maybeSingle()
      .then(({ data }) => { if (data) setReceipt(data); });
  }, [bookingId, profile]);

  const handleDownload = async () => {
    if (receipt?.pdf_url) {
      window.open(receipt.pdf_url, '_blank');
      return;
    }
    setGenerating(true);
    try {
      const url = await generateAndUploadReceipt({
        bookingId,
        receiptId: receipt?.id,
        doc: {
          number:   receiptNo,
          date:     receipt?.generated_at || booking.completed_at || booking.created_at,
          partner:  { name: worker?.full_name || booking.worker_name || 'Fixera Partner', role: 'worker' },
          customer: { name: profile?.full_name || 'Fixera Customer' },
          items: [{ name: booking.sub_service || booking.service || 'Service', qty: 1, price: Number(receipt?.amount || booking.price || booking.total || 0) }],
          total:    Number(receipt?.amount || booking.price || booking.total || 0),
          commission: receipt?.commission != null ? Number(receipt.commission) : undefined,
          refId:    booking.id,
        },
      });
      if (url) { setReceipt(r => ({ ...(r || {}), pdf_url: url })); window.open(url, '_blank'); }
      else window.print();
    } catch (e) {
      console.error('Receipt PDF generation failed:', e.message);
      window.print();
    } finally { setGenerating(false); }
  };

  /* Loading */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CL.bg }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* Not found */
  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: CL.bg }}>
      <div style={{ width: 60, height: 60, borderRadius: 20, background: CL.errorBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={30} color={CL.error} />
      </div>
      <div style={{ fontSize: 16, color: CL.muted }}>Receipt not found</div>
      <button
        onClick={() => navigate('/history')}
        style={{ padding: '10px 24px', borderRadius: 10, background: CL.navy, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Back to History
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const receiptNo   = `FIX-${booking.id.slice(0, 8).toUpperCase()}`;
  const issueDate   = booking.completed_at
    ? new Date(booking.completed_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(booking.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  const isCompleted = booking.status === 'completed';

  return (
    <>
      {/* Action bar */}
      <div className="no-print" style={{
        background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: CL.muted, fontSize: 13, fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDownload}
            disabled={generating}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: CL.navy, color: '#fff',
              fontWeight: 800, fontSize: 13, cursor: generating ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
              opacity: generating ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            {generating ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Receipt document */}
      <div className="receipt-page" style={{
        minHeight: '100vh', background: CL.bg,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 24px 80px', fontFamily: 'Inter, sans-serif',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            width: '100%', maxWidth: 620,
            background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16,
            boxShadow: '0 4px 32px rgba(10,22,40,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Header strip */}
          <div style={{
            background: CL.goldSoft, borderBottom: `1px solid ${CL.goldBorder}`,
            padding: '24px 40px', textAlign: 'center',
          }}>
            <img src="/logo-mark.png" alt="Fixera" style={{ height: 48, width: 'auto', margin: '0 auto 10px', display: 'block' }} />
            <div style={{ color: CL.gold, fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>FIXERA</div>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, letterSpacing: 2, marginTop: 3 }}>
              PROFESSIONAL HOME SERVICES · NAIROBI
            </div>
          </div>

          {/* Receipt title bar */}
          <div style={{
            background: isCompleted ? '#F0FAF4' : '#FEF9EC',
            borderBottom: `3px solid ${isCompleted ? CL.success : '#D4780A'}`,
            padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', letterSpacing: 1 }}>
                SERVICE RECEIPT
              </div>
              <div style={{ fontSize: 12, color: CL.muted, marginTop: 2 }}>#{receiptNo}</div>
            </div>
            <div style={{
              padding: '7px 16px', borderRadius: 20,
              background: isCompleted ? CL.success : '#D4780A',
              color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {isCompleted && <CheckCircle2 size={13} />}
              {isCompleted ? 'COMPLETED' : booking.status.toUpperCase()}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '32px 40px' }}>

            {/* Date + customer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div>
                <div style={labelStyle}>Issue Date</div>
                <div style={valueStyle}>{issueDate}</div>
              </div>
              <div>
                <div style={labelStyle}>Customer</div>
                <div style={valueStyle}>{profile?.full_name || 'Fixera Customer'}</div>
              </div>
            </div>

            <Divider />

            <Section title="Service Details">
              <Row label="Service"     value={booking.service || '—'} />
              <Row label="Sub-service" value={booking.sub_service || booking.service || '—'} />
              <Row label="Date"        value={booking.booking_date || '—'} />
              <Row label="Time"        value={booking.booking_time || '—'} />
              <Row label="Location"    value={booking.address || '—'} />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </Section>

            <Divider />

            <Section title="Service Professional">
              <Row label="Name"    value={worker?.full_name || booking.worker_name || 'Assigned by Fixera'} />
              <Row label="Service" value={worker?.service || booking.service || '—'} />
            </Section>

            <Divider />

            <Section title="Payment">
              <Row label="Method" value="M-Pesa" />
              <Row
                label="Status"
                value={isCompleted ? 'Settled after job completion' : 'Pending completion'}
                highlight={isCompleted}
              />
            </Section>

            <Divider />

            {/* Reference */}
            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 18px', marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <FileText size={14} color={CL.muted} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={labelStyle}>Booking Reference</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#444', marginTop: 3, wordBreak: 'break-all' }}>
                  {booking.id}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#f8f9fa', borderTop: '1px solid #e8e8e8', padding: '20px 40px', textAlign: 'center' }}>
            <div style={{ color: '#999', fontSize: 12, lineHeight: 1.8 }}>
              Thank you for choosing Fixera!<br />
              For support, contact us at <strong style={{ color: CL.gold }}>support@fixera.africa</strong><br />
              <span style={{ fontSize: 11 }}>www.fixera.africa · Nairobi, Kenya</span>
            </div>
          </div>

        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .receipt-page {
            padding: 0 !important;
            background: #fff !important;
            min-height: unset !important;
          }
          .receipt-page > div {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

const labelStyle = { fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };
const valueStyle = { fontSize: 14, color: '#1a1a2e', fontWeight: 600 };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#C9A020', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <span style={{ fontSize: 13, color: '#888', flexShrink: 0, minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 13, color: highlight ? '#1A7F3C' : '#1a1a2e', fontWeight: highlight ? 700 : 500, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#f0f0f0', margin: '20px 0' }} />;
}
