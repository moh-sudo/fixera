import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { Btn, Card } from '../../components/UI';
import PaymentPrompt from '../../components/PaymentPrompt';
import LiveMap from '../../components/LiveMap';
import { supabase } from '../../supabase';
import { getSupplierOrder } from '../../services/supplierShopService';

const STEPS = [
  { id: 'confirmed',        label: 'Confirmed',        icon: '✅', desc: 'Supplier accepted your order' },
  { id: 'packing',          label: 'Packing',          icon: '📦', desc: 'Your items are being packed' },
  { id: 'ready',            label: 'Ready',            icon: '🏷️', desc: 'Packed — preparing delivery' },
  { id: 'out_for_delivery', label: 'Out for delivery', icon: '🏍️', desc: 'A rider is bringing your order' },
  { id: 'delivered',        label: 'Delivered',        icon: '🎉', desc: 'Order delivered' },
];

export default function SupplierOrderTrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try { setOrder(await getSupplierOrder(id)); setError(null); }
    catch (err) { console.error(err); setError('Could not load this order.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`sup_order_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'supplier_orders', filter: `id=eq.${id}` },
        payload => setOrder(o => ({ ...o, ...payload.new })))
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Loading your order…</div>;
  if (error || !order) return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order not found</div>
      <Btn onClick={() => navigate('/shop')}>Back to Shop</Btn>
    </div>
  );

  const stage = order.fulfillment_stage || (order.status === 'pending' ? null : order.status);
  const si = STEPS.findIndex(s => s.id === stage);
  const items = Array.isArray(order.items) ? order.items : [];
  const isOut = stage === 'out_for_delivery';

  return (
    <div style={{ padding: '24px 20px 100px', minHeight: '100vh', background: C.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={() => navigate('/shop')} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.navyBorder}`, background: C.navyLight, color: C.textPrimary, fontSize: 18, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ color: C.textPrimary, fontSize: 20, fontWeight: 900 }}>📦 Supplies Order</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>#{order.id.slice(0, 8).toUpperCase()} · {order.supplier?.business_name || 'Supplier'}</div>
        </div>
      </div>

      {order.status === 'pending' && (
        <Card style={{ background: `${C.warning}10`, border: `1px solid ${C.warning}40`, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>⏳</div>
            <div>
              <div style={{ color: C.warning, fontSize: 15, fontWeight: 800 }}>Waiting for supplier</div>
              <div style={{ color: C.textSec, fontSize: 13, marginTop: 2 }}>The supplier will confirm your order shortly.</div>
            </div>
          </div>
        </Card>
      )}

      {isOut && (
        <div style={{ marginBottom: 16 }}>
          <LiveMap
            supplierOrderId={order.id}
            vehicleIcon="🏍️"
            vehicleLabel="rider"
            destinationAddress={order.delivery_address}
          />
        </div>
      )}

      {/* Timeline */}
      {order.status !== 'pending' && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>Order Progress</div>
          {STEPS.map((step, i) => {
            const done = si >= 0 && i <= si;
            const current = i === si;
            return (
              <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: done ? C.gold : C.navy, border: `2px solid ${done ? C.gold : C.navyBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: done ? C.navy : C.textMuted }}>{done ? '✓' : step.icon}</div>
                  {i < STEPS.length - 1 && <div style={{ width: 2, height: 24, background: i < si ? C.gold : C.navyBorder }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 5 }}>
                  <div style={{ color: current ? C.gold : C.textPrimary, fontSize: 14, fontWeight: 700 }}>{step.label}{current && ' • now'}</div>
                  <div style={{ color: C.textMuted, fontSize: 12, marginTop: 1 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Items */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Your Items</div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.navyBorder}` : 'none' }}>
            <span style={{ color: C.textPrimary, fontSize: 13 }}>{it.name} × {it.qty}</span>
            <span style={{ color: C.textSec, fontSize: 13 }}>KSh {(it.price * it.qty).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, color: C.gold, fontSize: 16, fontWeight: 800 }}>
          <span>Total</span><span>KSh {Number(order.total || 0).toLocaleString()}</span>
        </div>
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 8 }}>📍 {order.delivery_address}</div>
      </Card>

      {/* Payment due on delivery */}
      {stage === 'delivered' && (
        <PaymentPrompt
          refType="supplier_order" refId={order.id}
          payeeId={order.supplier_id} payeeRole="supplier"
          purpose="materials" amount={Number(order.total || 0)}
          label={`Supplies from ${order.supplier?.business_name || 'supplier'}`}
        />
      )}

      {stage === 'delivered' && (
        <Card style={{ background: `${C.success}10`, border: `1px solid ${C.success}40`, textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
          <div style={{ color: C.success, fontSize: 17, fontWeight: 800 }}>Order Delivered!</div>
        </Card>
      )}
    </div>
  );
}
