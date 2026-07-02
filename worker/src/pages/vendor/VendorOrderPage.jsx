import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import {
  getVendorOrder, acceptOrder, setStage, uploadPrepPhotos,
  FULFILLMENT_STEPS, stageIndex,
} from '../../services/vendorService';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  navy: '#0A1628',
};

const primaryBtn = {
  padding: '13px 18px', borderRadius: 12, marginBottom: 12,
  background: CL.text, color: '#fff', border: 'none',
  fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};
const iconBtn = {
  width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`,
  background: CL.bg, color: CL.text, fontSize: 16,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const ghostBtn = {
  padding: '12px 16px', borderRadius: 12,
  background: CL.bg, color: CL.muted,
  border: `1px dashed ${CL.border}`, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};

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

export default function VendorOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const photosRef = useRef(null);

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [acting, setActing]   = useState(false);

  const load = async () => {
    try { setOrder(await getVendorOrder(id)); setError(null); }
    catch (err) { console.error(err); setError('Could not load this order.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`vendor_order_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
        payload => setOrder(o => ({ ...o, ...payload.new })))
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  const handleAccept = async () => {
    setActing(true);
    try { await acceptOrder(id); await load(); }
    catch (err) { console.error(err); alert('Could not accept.'); }
    finally { setActing(false); }
  };

  const advance = (stage) => async () => {
    setActing(true);
    try { await setStage(id, stage, profile); await load(); }
    catch (err) { console.error(err); alert('Action failed.'); }
    finally { setActing(false); }
  };

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setActing(true);
    try { await uploadPrepPhotos(user.id, id, files); await load(); }
    catch (err) { console.error(err); alert('Upload failed.'); }
    finally { setActing(false); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: CL.muted, background: CL.bg, minHeight: '100vh' }}>Loading order…</div>;
  if (error || !order) return (
    <div style={{ padding: 32, textAlign: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order not found</div>
      <button onClick={() => navigate('/vendor/dashboard')} style={primaryBtn}>Back to Dashboard</button>
    </div>
  );

  const stage = order.fulfillment_stage;
  const si = stageIndex(stage);
  const isNew = order.status === 'pending';
  const photos = Array.isArray(order.prep_photos) ? order.prep_photos : [];

  const vendorNext =
    !stage || stage === 'received' ? (stage === 'received' ? 'preparing' : 'received')
    : stage === 'preparing' ? 'ready'
    : null;
  const vendorNextMeta = vendorNext ? FULFILLMENT_STEPS.find(s => s.id === vendorNext) : null;

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 680, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navigate('/vendor/dashboard')} style={iconBtn}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>🏪 {order.sub_service || 'Order'}</div>
          <div style={{ color: CL.muted, fontSize: 11 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Customer */}
      <Card>
        <Row label="Customer"  value={order.profiles?.full_name || 'Customer'} />
        <Row label="Phone"     value={order.profiles?.phone || '—'} />
        <Row label="Scheduled" value={`${order.booking_date || '—'} · ${order.booking_time || ''}`} />
        <Row label="Address"   value={order.address || '—'} multiline />
        {order.notes && <Row label="Notes" value={order.notes} multiline />}
        {order.profiles?.phone && (
          <a href={`tel:${order.profiles.phone}`} style={{ textDecoration: 'none' }}>
            <button style={{ ...ghostBtn, width: '100%', marginTop: 8 }}>📞 Call Customer</button>
          </a>
        )}
      </Card>

      {/* New order → accept */}
      {isNew ? (
        <button onClick={handleAccept} disabled={acting} style={{ ...primaryBtn, width: '100%' }}>
          {acting ? 'Accepting…' : '✓ Accept Order'}
        </button>
      ) : (
        <>
          {/* Fulfillment timeline */}
          <Card>
            <div style={{ color: CL.blue, fontSize: 12, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Order Progress</div>
            {FULFILLMENT_STEPS.map((step, i) => {
              const done    = si >= 0 && i <= si;
              const current = i === si;
              return (
                <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < FULFILLMENT_STEPS.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: done ? CL.blue : CL.bg,
                      border: `2px solid ${done ? CL.blue : CL.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: done ? '#fff' : CL.muted,
                    }}>{done ? '✓' : step.icon}</div>
                    {i < FULFILLMENT_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 22, background: i < si ? CL.blue : CL.border }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ color: current ? CL.blue : CL.text, fontSize: 13, fontWeight: 700 }}>
                      {step.label}{current && ' • now'}
                    </div>
                    <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Photos */}
          <Card>
            <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>📸 Item Photos (before / after)</div>
            <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10 }}>
              Document the items' condition — protects you in any dispute.
            </div>
            <input ref={photosRef} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotos} style={{ display: 'none' }} />
            <button onClick={() => photosRef.current?.click()} disabled={acting} style={{ ...ghostBtn, width: '100%', marginBottom: photos.length ? 10 : 0 }}>
              {acting ? 'Uploading…' : `📷 Add Photos${photos.length ? ` (${photos.length})` : ''}`}
            </button>
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            )}
          </Card>

          {/* Stage action */}
          {vendorNextMeta && (
            <button onClick={advance(vendorNext)} disabled={acting} style={{ ...primaryBtn, width: '100%' }}>
              {vendorNextMeta.icon} Mark {vendorNextMeta.label}
            </button>
          )}

          {/* Rider card */}
          {(stage === 'ready' || stage === 'out_for_delivery') && (
            order.rider_name ? (
              <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}` }}>
                <div style={{ color: CL.green, fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: 'uppercase' }}>
                  🏍️ Rider {stage === 'out_for_delivery' ? 'collected — returning to customer' : 'assigned to collect'}
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
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ color: CL.green, fontSize: 14, fontWeight: 800 }}>Ready — finding a rider…</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 4 }}>
                  A rider will collect and return the items to the customer.
                </div>
              </Card>
            )
          )}
          {stage === 'delivered' && (
            <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, textAlign: 'center' }}>
              <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
              <div style={{ color: CL.green, fontSize: 15, fontWeight: 800 }}>Order Complete</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
