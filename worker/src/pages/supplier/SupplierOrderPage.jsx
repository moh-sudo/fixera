import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import { getOrder, acceptOrder, setStage, SUPPLIER_STEPS } from '../../services/supplierService';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  navy: '#0A1628',
};

const SUPPLIER_AMBER = '#F59E0B';

const iconBtn    = { width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.text, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const primaryBtn = { padding: '13px 18px', borderRadius: 12, marginBottom: 12, background: CL.text, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
const ghostBtn   = { padding: '12px 16px', borderRadius: 12, background: CL.bg, color: CL.muted, border: `1px dashed ${CL.border}`, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };

function Card({ children, style }) {
  return <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 14, marginBottom: 12, ...style }}>{children}</div>;
}
function Row({ label, value, multiline }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', flexDirection: multiline ? 'column' : 'row' }}>
      <span style={{ color: CL.muted, fontSize: 11 }}>{label}</span>
      <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}

export default function SupplierOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder]   = useState(null);
  const [loading, setLoad]  = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    try { setOrder(await getOrder(id)); } catch (e) { console.error(e); } finally { setLoad(false); }
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`sup_order_partner_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'supplier_orders', filter: `id=eq.${id}` },
        payload => setOrder(o => ({ ...o, ...payload.new })))
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  const handleAccept = async () => {
    setActing(true);
    try { await acceptOrder(id); await load(); } catch (e) { console.error(e); alert('Failed.'); } finally { setActing(false); }
  };

  const advance = (stage) => async () => {
    setActing(true);
    try { await setStage(id, stage, profile); await load(); } catch (e) { console.error(e); alert('Failed.'); } finally { setActing(false); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: CL.muted, background: CL.bg, minHeight: '100vh' }}>Loading…</div>;
  if (!order) return (
    <div style={{ padding: 32, textAlign: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order not found</div>
      <button onClick={() => navigate('/supplier/dashboard')} style={primaryBtn}>Back</button>
    </div>
  );

  const stage = order.fulfillment_stage;
  const si    = SUPPLIER_STEPS.findIndex(s => s.id === stage);
  const items = Array.isArray(order.items) ? order.items : [];
  const isNew = order.status === 'pending';

  const next     = !stage || stage === 'confirmed' ? 'packing' : stage === 'packing' ? 'ready' : null;
  const nextMeta = next ? SUPPLIER_STEPS.find(s => s.id === next) : null;

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 680, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navigate('/supplier/dashboard')} style={iconBtn}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>📦 Order</div>
          <div style={{ color: CL.muted, fontSize: 11 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Customer */}
      <Card>
        <Row label="Customer"   value={order.customer_name || 'Customer'} />
        <Row label="Phone"      value={order.customer_phone || '—'} />
        <Row label="Deliver to" value={order.delivery_address || '—'} multiline />
        {order.notes && <Row label="Notes" value={order.notes} multiline />}
        {order.customer_phone && (
          <a href={`tel:${order.customer_phone}`} style={{ textDecoration: 'none' }}>
            <button style={{ ...ghostBtn, width: '100%', marginTop: 8 }}>📞 Call Customer</button>
          </a>
        )}
      </Card>

      {/* Items */}
      <Card>
        <div style={{ color: SUPPLIER_AMBER, fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>Items</div>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < items.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
            <span style={{ color: CL.text, fontSize: 13 }}>{it.name} × {it.qty}</span>
            <span style={{ color: CL.muted, fontSize: 13 }}>KSh {(it.price * it.qty).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, color: CL.gold, fontSize: 16, fontWeight: 800 }}>
          <span>Total</span><span>KSh {Number(order.total || 0).toLocaleString()}</span>
        </div>
      </Card>

      {/* Accept or progress */}
      {isNew ? (
        <button onClick={handleAccept} disabled={acting} style={{ ...primaryBtn, width: '100%' }}>
          {acting ? 'Accepting…' : '✓ Accept Order'}
        </button>
      ) : (
        <>
          {/* Progress timeline */}
          <Card>
            <div style={{ color: SUPPLIER_AMBER, fontSize: 12, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Progress</div>
            {SUPPLIER_STEPS.map((step, i) => {
              const done    = si >= 0 && i <= si;
              const current = i === si;
              return (
                <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < SUPPLIER_STEPS.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: done ? SUPPLIER_AMBER : CL.bg,
                      border: `2px solid ${done ? SUPPLIER_AMBER : CL.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: done ? '#fff' : CL.muted,
                    }}>{done ? '✓' : step.icon}</div>
                    {i < SUPPLIER_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 20, background: i < si ? SUPPLIER_AMBER : CL.border }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 3 }}>
                    <div style={{ color: current ? SUPPLIER_AMBER : CL.text, fontSize: 13, fontWeight: 700 }}>
                      {step.label}{current && ' • now'}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>

          {nextMeta && (
            <button onClick={advance(next)} disabled={acting} style={{ ...primaryBtn, width: '100%' }}>
              {nextMeta.icon} Mark {nextMeta.label}
            </button>
          )}

          {/* Rider card */}
          {(stage === 'ready' || stage === 'out_for_delivery') && (
            order.rider_name ? (
              <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}` }}>
                <div style={{ color: CL.green, fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>
                  🏍️ Rider {stage === 'out_for_delivery' ? 'collected — on the way' : 'assigned to collect'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏍️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{order.rider_name}</div>
                    <div style={{ color: CL.muted, fontSize: 12 }}>{order.rider_vehicle || 'Rider'}</div>
                  </div>
                  {order.rider_phone && (
                    <a href={`tel:${order.rider_phone}`} style={{ textDecoration: 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: CL.blueSoft, border: `1px solid ${CL.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📞</div>
                    </a>
                  )}
                </div>
              </Card>
            ) : (
              <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🏍️</div>
                <div style={{ color: CL.green, fontSize: 14, fontWeight: 800 }}>Finding a rider…</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 4 }}>A Fixera rider will collect and deliver to the customer.</div>
              </Card>
            )
          )}

          {stage === 'delivered' && (
            <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
              <div style={{ color: CL.green, fontSize: 15, fontWeight: 800 }}>Order Delivered</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
