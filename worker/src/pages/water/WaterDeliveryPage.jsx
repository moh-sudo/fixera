import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getOrder, acceptOrder, startLoading, markDeparted, markArrived,
  markDelivered, uploadDeliveryPhotos,
} from '../../services/waterCarrierService';
import { listCrew } from '../../services/crewService';
import { listActiveFleet, vehicleTypeMeta } from '../../services/fleetService';
import useLiveLocation from '../../hooks/useLiveLocation';
import VerificationBanner, { isApproved } from '../../components/VerificationBanner';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6',
  red: '#EF4444', redSoft: '#FEF2F2',
  navy: '#0A1628',
};

const WATER_BLUE = '#00B5D8';

const STATUS_META = {
  pending:    { label: 'Open Order',           color: CL.gold,   icon: '🔍' },
  confirmed:  { label: 'Confirmed',            color: CL.blue,   icon: '✅' },
  loading:    { label: 'Loading',              color: CL.gold,   icon: '📦' },
  on_the_way: { label: 'On the way',           color: CL.green,  icon: '🚐' },
  arrived:    { label: 'At customer gate',     color: CL.green,  icon: '🚪' },
  delivered:  { label: 'Awaiting customer OK', color: '#9F7AEA', icon: '⏳' },
  completed:  { label: 'Completed',            color: CL.green,  icon: '🎉' },
  cancelled:  { label: 'Cancelled',            color: CL.red,    icon: '❌' },
};

const iconBtn = {
  width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`,
  background: CL.surface, color: CL.text, fontSize: 16,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const primaryBtn = {
  padding: '13px 18px', borderRadius: 12,
  background: WATER_BLUE, color: '#fff', border: 'none',
  fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};
const ghostBtn = {
  padding: '13px 18px', borderRadius: 12,
  background: CL.bg, color: CL.muted,
  border: `1px dashed ${CL.border}`, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};
const fieldLabel = {
  display: 'block', color: CL.muted, fontSize: 11, fontWeight: 600,
  margin: '10px 0 5px', letterSpacing: 0.3,
};

function Card({ children, style }) {
  return (
    <div style={{
      background: CL.surface, border: `1px solid ${CL.border}`,
      borderRadius: 14, padding: 14, marginBottom: 12, ...style,
    }}>{children}</div>
  );
}
function Row({ label, value, multiline }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      gap: 12, padding: '4px 0',
      flexDirection: multiline ? 'column' : 'row',
    }}>
      <span style={{ color: CL.muted, fontSize: 11 }}>{label}</span>
      <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}

export default function WaterDeliveryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const photosRef = useRef(null);

  const [order, setOrder]     = useState(null);
  const [crew, setCrew]       = useState([]);
  const [fleet, setFleet]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [acting, setActing]   = useState(false);

  const [driverChoice, setDriverChoice] = useState(null);
  const [vehicleId, setVehicleId]       = useState('');

  useLiveLocation({
    userId:    user?.id,
    bookingId: id,
    active:    order?.status === 'on_the_way',
  });

  const load = async () => {
    try {
      const o = await getOrder(id);
      setOrder(o);
      if (user) {
        const [c, f] = await Promise.all([listCrew(user.id), listActiveFleet(user.id)]);
        setCrew(c.filter(x => x.status === 'active'));
        setFleet(f);
        if (f.length > 0 && !vehicleId) setVehicleId(f[0].id);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load order.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id, user]);

  const handleAccept = async () => {
    if (!isApproved(profile)) { alert('Your account is not yet verified by Fixera.'); return; }
    const vehicle = fleet.find(v => v.id === vehicleId);
    if (!driverChoice || !vehicle) { alert('Pick a driver and a vehicle first.'); return; }
    setActing(true);
    try {
      const snapshot = {
        name:      driverChoice.full_name,
        phone:     driverChoice.phone,
        photo_url: driverChoice.photo_url,
        plate:     vehicle.plate_number,
      };
      await acceptOrder(id, user.id, snapshot);
      await load();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not accept order.');
    } finally { setActing(false); }
  };

  const transition = (fn) => async () => {
    setActing(true);
    try { await fn(id); await load(); }
    catch (err) { console.error(err); alert('Action failed.'); }
    finally { setActing(false); }
  };

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setActing(true);
    try { await uploadDeliveryPhotos(user.id, id, files); await load(); }
    catch (err) { console.error(err); alert('Upload failed.'); }
    finally { setActing(false); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: CL.muted, background: CL.bg, minHeight: '100vh' }}>Loading…</div>;
  if (error || !order) return (
    <div style={{ padding: 32, textAlign: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Order not found</div>
      <button onClick={() => navigate('/water/dashboard')} style={primaryBtn}>Back to Dashboard</button>
    </div>
  );

  const status = STATUS_META[order.status] || STATUS_META.pending;
  const mine   = order.carrier_user_id === user?.id;
  const photos = Array.isArray(order.delivery_photo_urls) ? order.delivery_photo_urls : [];

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <VerificationBanner />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navigate('/water/dashboard')} style={iconBtn}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>💧 Water Delivery</div>
          <div style={{ color: CL.muted, fontSize: 11 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${status.color}18`, border: `1px solid ${status.color}50`,
          borderRadius: 999, padding: '5px 12px',
          color: status.color, fontSize: 11, fontWeight: 700,
        }}>
          {status.icon} {status.label}
        </div>
      </div>

      {/* Order summary */}
      <Card>
        <Row label="Item"             value={order.sub_service || 'Water'} />
        {order.quantity && <Row label="Quantity" value={`× ${order.quantity}`} />}
        <Row label="Delivery Address" value={order.address} multiline />
        <Row label="Price"            value={`KSh ${Number(order.price || 0).toLocaleString()}`} />
        {order.notes && <Row label="Customer Notes" value={order.notes} multiline />}
      </Card>

      {/* Open order — needs driver + accept */}
      {order.status === 'pending' && !mine && (
        <Card>
          <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Accept this order</div>
          {crew.length === 0 ? (
            <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 12 }}>
              <div style={{ color: CL.red, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No drivers registered</div>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10 }}>Add at least one driver to your crew before accepting orders.</div>
              <button onClick={() => navigate('/crew')} style={primaryBtn}>Go to Crew →</button>
            </div>
          ) : (
            <>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 8 }}>Pick the driver doing this delivery</div>
              {crew.map(m => {
                const sel = driverChoice?.id === m.id;
                return (
                  <div key={m.id} onClick={() => setDriverChoice(m)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: sel ? `${WATER_BLUE}15` : CL.bg,
                    border: `1.5px solid ${sel ? WATER_BLUE : CL.border}`,
                    borderRadius: 10, padding: '8px 12px', marginBottom: 6, cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: m.photo_url ? 'transparent' : CL.surface,
                      border: `1px solid ${CL.border}`, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {m.photo_url
                        ? <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{m.full_name}</div>
                      <div style={{ color: CL.muted, fontSize: 11 }}>{(m.default_position || '').replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                );
              })}
              <label style={fieldLabel}>Vehicle</label>
              {fleet.length === 0 ? (
                <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 12, marginBottom: 6 }}>
                  <div style={{ color: CL.red, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No vehicles registered</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginBottom: 8 }}>Register a vehicle before accepting deliveries.</div>
                  <button onClick={() => navigate('/fleet')} style={primaryBtn}>Go to Fleet →</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {fleet.map(v => {
                    const sel  = vehicleId === v.id;
                    const meta = vehicleTypeMeta(v.vehicle_type);
                    return (
                      <div key={v.id} onClick={() => setVehicleId(v.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: sel ? `${meta.color}15` : CL.bg,
                        border: `1.5px solid ${sel ? meta.color : CL.border}`,
                        borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: 18 }}>{meta.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{meta.label}</div>
                          <div style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', background: '#fff', color: '#000', fontSize: 11, fontWeight: 800, borderRadius: 5, letterSpacing: 1.5, fontFamily: 'monospace', border: `1px solid ${CL.border}` }}>{v.plate_number}</div>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? meta.color : CL.border}`, background: sel ? meta.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>{sel && '✓'}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={handleAccept} disabled={acting || !driverChoice || !vehicleId}
                style={{ ...primaryBtn, width: '100%', marginTop: 10, opacity: (acting || !driverChoice || !vehicleId) ? 0.5 : 1 }}>
                {acting ? 'Accepting…' : '✓ Accept Order'}
              </button>
            </>
          )}
        </Card>
      )}

      {/* State transitions (mine only) */}
      {mine && (
        <>
          {order.status === 'confirmed' && (
            <button onClick={transition(startLoading)} disabled={acting}
              style={{ ...primaryBtn, width: '100%', marginTop: 14 }}>
              📦 Start Loading
            </button>
          )}
          {order.status === 'loading' && (
            <button onClick={transition(markDeparted)} disabled={acting}
              style={{ ...primaryBtn, width: '100%', marginTop: 14 }}>
              🚐 Mark Departed (GPS starts)
            </button>
          )}
          {order.status === 'on_the_way' && (
            <Card style={{ marginTop: 14, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}` }}>
              <div style={{ color: CL.green, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                📡 Live GPS broadcasting to customer
              </div>
              <div style={{ color: CL.muted, fontSize: 11, marginBottom: 10 }}>
                The customer can see your position on a live map. Tap below when you reach their gate.
              </div>
              <button onClick={transition(markArrived)} disabled={acting} style={primaryBtn}>
                🚪 I've Arrived at Customer
              </button>
            </Card>
          )}
          {order.status === 'arrived' && (
            <Card style={{ marginTop: 14 }}>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📸 Upload Delivery Photos</div>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10 }}>
                Take 1-4 photos showing the delivered water at the customer's location.
              </div>
              <input ref={photosRef} type="file" accept="image/*" multiple capture="environment"
                onChange={handlePhotos} style={{ display: 'none' }} />
              <button onClick={() => photosRef.current?.click()} style={{ ...ghostBtn, width: '100%', marginBottom: 10 }}>
                📷 Add Delivery Photos {photos.length > 0 && `(${photos.length})`}
              </button>
              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, marginBottom: 10 }}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              )}
              <button onClick={transition(markDelivered)} disabled={acting || photos.length === 0}
                style={{ ...primaryBtn, width: '100%', opacity: (acting || photos.length === 0) ? 0.5 : 1 }}>
                ✅ Mark Delivered
              </button>
            </Card>
          )}
          {order.status === 'delivered' && (
            <Card style={{ marginTop: 14, background: '#9F7AEA10', border: '1px solid #9F7AEA40', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
              <div style={{ color: '#9F7AEA', fontSize: 14, fontWeight: 800 }}>Waiting for customer to confirm receipt</div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 4 }}>
                Once customer taps "Confirm Receipt", this delivery is closed.
              </div>
            </Card>
          )}
          {order.status === 'completed' && (
            <Card style={{ marginTop: 14, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
              <div style={{ color: CL.green, fontSize: 16, fontWeight: 800 }}>Delivery Complete</div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
