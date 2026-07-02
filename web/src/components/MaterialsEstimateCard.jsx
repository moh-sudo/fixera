import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../theme';
import { Btn, Card } from './UI';
import { getEstimateForBooking, confirmEstimate, declineEstimate } from '../services/materialsService';
import { docFromEstimate } from '../services/documentService';
import { downloadDocument } from '../utils/fixeraDocument';

const STAGE = {
  estimate:         { label: 'Your painter recommends these materials', color: '#F6AD55', icon: '🎨' },
  pending:          { label: 'Confirmed — supplier notified', color: '#63B3ED', icon: '✅' },
  confirmed:        { label: 'Supplier preparing your materials', color: '#63B3ED', icon: '📦' },
  packing:          { label: 'Supplier packing', color: '#63B3ED', icon: '📦' },
  ready:            { label: 'Ready — rider dispatched', color: '#9F7AEA', icon: '🏍️' },
  out_for_delivery: { label: 'Materials on the way to you', color: '#9F7AEA', icon: '🚗' },
  delivered:        { label: 'Materials delivered', color: '#48BB78', icon: '🎉' },
};

// Shows on the customer's job page when the worker has estimated materials.
export default function MaterialsEstimateCard({ bookingId }) {
  const navigate = useNavigate();
  const [est, setEst]       = useState(null);
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [busy, setBusy]     = useState(false);

  const load = async () => {
    try {
      const e = await getEstimateForBooking(bookingId);
      setEst(e);
      setItems(Array.isArray(e?.items) ? e.items.map(i => ({ ...i })) : []);
    } catch (err) { console.error(err); }
    finally { setLoad(false); }
  };
  useEffect(() => { if (bookingId) load(); }, [bookingId]);

  if (loading || !est) return null;

  const meta = STAGE[est.status] || STAGE.estimate;
  const total = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const isEstimate = est.status === 'estimate';
  const setQty = (idx, q) => setItems(arr => arr.map((it, i) => i === idx ? { ...it, qty: Math.max(1, q) } : it));

  const handleConfirm = async () => {
    setBusy(true);
    try { await confirmEstimate(est.id, items); await load(); }
    catch (e) { console.error(e); alert('Could not confirm.'); }
    finally { setBusy(false); }
  };
  const handleDecline = async () => {
    if (!confirm('Decline these materials?')) return;
    setBusy(true);
    try { await declineEstimate(est.id); await load(); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  if (est.status === 'cancelled') return null;

  return (
    <Card style={{ marginBottom: 16, border: `1px solid ${meta.color}55`, background: `${meta.color}0D` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{meta.icon}</span>
        <div>
          <div style={{ color: meta.color, fontSize: 14, fontWeight: 800 }}>{meta.label}</div>
          {est.supplier?.business_name && <div style={{ color: C.textMuted, fontSize: 11 }}>from {est.supplier.business_name}</div>}
        </div>
      </div>

      {/* Items — editable qty only while it's an estimate */}
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.navyBorder}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>{it.name}</div>
            <div style={{ color: C.textMuted, fontSize: 11 }}>KSh {it.price?.toLocaleString()} each</div>
          </div>
          {isEstimate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setQty(i, it.qty - 1)} style={stepBtn}>−</button>
              <span style={{ color: C.textPrimary, fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{it.qty}</span>
              <button onClick={() => setQty(i, it.qty + 1)} style={stepBtn}>+</button>
            </div>
          ) : (
            <span style={{ color: C.textSec, fontSize: 13 }}>× {it.qty}</span>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', color: C.gold, fontSize: 16, fontWeight: 800 }}>
        <span>Total</span><span>KSh {total.toLocaleString()}</span>
      </div>

      {isEstimate ? (
        <>
          <button onClick={() => downloadDocument(docFromEstimate({ ...est, items }))} style={{
            width: '100%', marginBottom: 10, padding: '9px', borderRadius: 10,
            background: 'rgba(201,160,32,0.12)', border: `1px solid ${C.gold}40`,
            color: C.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>📄 Download Quotation</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={handleDecline} disabled={busy} style={{ flex: 1 }}>Decline</Btn>
            <Btn onClick={handleConfirm} disabled={busy} style={{ flex: 2 }}>
              {busy ? 'Confirming…' : 'Confirm & Order →'}
            </Btn>
          </div>
        </>
      ) : (
        <Btn variant="outline" onClick={() => navigate(`/supplier-order/${est.id}`)} style={{ width: '100%' }}>
          📍 Track Materials Delivery
        </Btn>
      )}
      <div style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
        🚚 Supplied and delivered to your site by Fixera.
      </div>
    </Card>
  );
}

const stepBtn = { width: 28, height: 28, borderRadius: 8, background: C.navy, color: C.textPrimary, border: `1px solid ${C.navyBorder}`, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
