import { useEffect, useState } from 'react';
import { C } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { ensurePayment, getPaymentFor, markCashPaid, initiateMpesa, pollMpesaStatus } from '../services/paymentService';
import { docFromPayment } from '../services/documentService';
import { downloadDocument } from '../utils/fixeraDocument';

// Reusable customer payment popup.
// Drop into any completed/delivered screen:
//   <PaymentPrompt refType="supplier_order" refId={order.id}
//     payeeId={order.supplier_id} payeeRole="supplier"
//     purpose="materials" amount={order.total} label="Supplies" />
export default function PaymentPrompt({ refType, refId, payeeId, payeeRole, purpose, amount, label }) {
  const { user } = useAuth();
  const [payment,    setPayment]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [phone,      setPhone]      = useState('');
  const [mpesaPhase, setMpesaPhase] = useState('idle'); // idle | phone | waiting | success | error
  const [mpesaMsg,   setMpesaMsg]   = useState('');

  useEffect(() => {
    if (!user || !refId || !amount) { setLoading(false); return; }
    (async () => {
      try {
        let p = await getPaymentFor(refType, refId);
        if (!p) {
          p = await ensurePayment({
            customerId: user.id, payeeId, payeeRole, refType, refId, purpose, amount,
            description: label,
          });
        }
        setPayment(p);
      } catch (e) { console.warn('payment init:', e); }
      finally { setLoading(false); }
    })();
  }, [user, refType, refId, amount]);

  if (loading || !payment) return null;

  const handleDownload = async (type) => {
    try {
      const d = await docFromPayment(payment, { type });
      if (d) downloadDocument(d);
    } catch (e) { console.error(e); alert('Could not generate document.'); }
  };

  // Already paid → receipt strip
  if (payment.status === 'paid') {
    return (
      <div style={{
        background: 'rgba(72,187,120,0.10)', border: '1px solid rgba(72,187,120,0.40)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#48BB78', fontSize: 14, fontWeight: 800 }}>
              Paid · KSh {Number(payment.amount).toLocaleString()}
            </div>
            <div style={{ color: C.textSec, fontSize: 12 }}>
              {payment.method === 'cash' ? '💵 Cash' : '📱 M-Pesa'}
              {payment.mpesa_ref ? ` · ${payment.mpesa_ref}` : ''}
              {payment.paid_at && ` · ${new Date(payment.paid_at).toLocaleString('en-KE')}`}
            </div>
          </div>
          <button onClick={() => handleDownload('receipt')} style={{
            padding: '8px 14px', borderRadius: 10, background: 'rgba(72,187,120,0.15)',
            border: '1px solid rgba(72,187,120,0.4)', color: '#48BB78', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>📄 Receipt</button>
        </div>
      </div>
    );
  }

  const handleCash = async () => {
    setBusy(true);
    try {
      const updated = await markCashPaid(payment.id);
      setPayment(updated);
    } catch (e) { console.error(e); alert('Could not record payment.'); }
    finally { setBusy(false); }
  };

  const handleMpesaSubmit = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    setMpesaPhase('waiting');
    setMpesaMsg('');
    try {
      const { checkoutRequestId } = await initiateMpesa(payment.id, phone.trim(), payment.amount);
      setMpesaMsg('Check your phone — enter your M-Pesa PIN to complete payment.');
      const result = await pollMpesaStatus(checkoutRequestId);
      if (result.status === 'paid') {
        // Refresh payment row (callback may have updated it, or we update it here)
        setPayment(p => ({ ...p, status: 'paid', method: 'mpesa', mpesa_ref: result.receipt }));
        setMpesaPhase('success');
      } else {
        setMpesaPhase('error');
        setMpesaMsg(result.message || 'Payment was not completed. Please try again.');
      }
    } catch (e) {
      setMpesaPhase('error');
      setMpesaMsg(e.message || 'Could not start M-Pesa. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(201,160,32,0.14), rgba(201,160,32,0.04))`,
      border: `2px solid ${C.gold}55`, borderRadius: 16, padding: 18, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 800 }}>💳 Payment due</div>
          {label && <div style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>{label}</div>}
        </div>
        <div style={{ color: C.gold, fontSize: 22, fontWeight: 900 }}>KSh {Number(amount).toLocaleString()}</div>
      </div>

      {/* M-Pesa phone input panel */}
      {mpesaPhase === 'phone' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>Enter the M-Pesa number to charge:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 254XXXXXXXXX"
              type="tel"
              style={{
                flex: 1, background: C.navyMid, border: `1px solid ${C.navyBorder}`,
                borderRadius: 10, padding: '11px 14px', color: C.textPrimary,
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={handleMpesaSubmit}
              disabled={!phone.trim() || busy}
              style={{
                padding: '11px 18px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                background: phone.trim() ? '#1A7F3C' : C.navyMid,
                color: phone.trim() ? '#fff' : C.textMuted,
                fontSize: 13, fontWeight: 800, cursor: phone.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >Send</button>
          </div>
          <button
            onClick={() => setMpesaPhase('idle')}
            style={{ marginTop: 8, background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >← Cancel</button>
        </div>
      )}

      {/* Waiting for PIN */}
      {mpesaPhase === 'waiting' && (
        <div style={{ background: 'rgba(26,127,60,0.12)', border: '1px solid rgba(26,127,60,0.4)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📱 Waiting for M-Pesa PIN…</div>
          <div style={{ color: C.textSec, fontSize: 12 }}>{mpesaMsg}</div>
          <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: C.navyBorder, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '60%', background: '#1A7F3C', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* M-Pesa error */}
      {mpesaPhase === 'error' && (
        <div style={{ background: 'rgba(231,74,59,0.10)', border: '1px solid rgba(231,74,59,0.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ color: '#FC8181', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>❌ Payment not completed</div>
          <div style={{ color: C.textSec, fontSize: 12 }}>{mpesaMsg}</div>
          <button
            onClick={() => { setMpesaPhase('phone'); setMpesaMsg(''); }}
            style={{ marginTop: 8, background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >Try again →</button>
        </div>
      )}

      {/* Main action buttons (shown when idle or after error) */}
      {(mpesaPhase === 'idle' || mpesaPhase === 'error') && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setMpesaPhase('phone')} disabled={busy} style={{
            flex: 1, padding: '13px', borderRadius: 12, background: '#1A7F3C', color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
          }}>📱 Pay with M-Pesa</button>
          <button onClick={handleCash} disabled={busy} style={{
            flex: 1, padding: '13px', borderRadius: 12, background: C.navyLight, color: C.textPrimary,
            border: `1px solid ${C.navyBorder}`, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
          }}>💵 Paid Cash</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ color: C.textMuted, fontSize: 11 }}>Cash is recorded for partner settlement.</span>
        <button onClick={() => handleDownload('invoice')} style={{
          background: 'none', border: 'none', color: C.gold, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
        }}>📄 Invoice</button>
      </div>
    </div>
  );
}
