import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { Btn, Card } from '../../components/UI';
import LiveMap from '../../components/LiveMap';
import PaymentPrompt from '../../components/PaymentPrompt';
import { supabase } from '../../supabase';

const STEPS = [
  { id: 'received',         label: 'Received at shop',  icon: '📥', desc: 'Your items reached the cleaner' },
  { id: 'preparing',        label: 'Being cleaned',     icon: '🧼', desc: 'Cleaning in progress' },
  { id: 'ready',            label: 'Ready',             icon: '✅', desc: 'Done — preparing return delivery' },
  { id: 'out_for_delivery', label: 'Out for delivery',  icon: '🏍️', desc: 'A rider is bringing your items back' },
  { id: 'delivered',        label: 'Delivered',         icon: '🎉', desc: 'Back with you' },
];

export default function CustomerOrderTrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [rider, setRider]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      const { data, error: e } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (e) throw e;
      setBooking(data);
      // Pull the assigned rider's public info (name + phone) if present
      if (data?.assigned_rider_id) {
        const { data: r } = await supabase.from('workers')
          .select('full_name, phone, vehicle_type').eq('id', data.assigned_rider_id).maybeSingle();
        setRider(r || null);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load this order.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  // Realtime — advance automatically as vendor + rider act
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`track_${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
        payload => setBooking(payload.new))
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Loading your order…</div>;
  if (error || !booking) return (
    <div style={{ padding: 32, textAlign: 'center', minHeight: '60vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order not found</div>
      <Btn onClick={() => navigate('/history')}>My Bookings</Btn>
    </div>
  );

  const stage = booking.fulfillment_stage;
  const si = STEPS.findIndex(s => s.id === stage);
  const isReturning = stage === 'out_for_delivery';

  return (
    <div style={{ padding: '24px 20px 100px', minHeight: '100vh', background: C.navy }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={() => navigate('/history')} style={{
          width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.navyBorder}`,
          background: C.navyLight, color: C.textPrimary, fontSize: 18, cursor: 'pointer',
        }}>←</button>
        <div>
          <div style={{ color: C.textPrimary, fontSize: 20, fontWeight: 900 }}>{booking.sub_service || 'My Order'}</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>#{booking.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Live map while the rider is returning items */}
      {isReturning && (
        <div style={{ marginBottom: 16 }}>
          <LiveMap
            bookingId={booking.id}
            vehicleIcon="🏍️"
            vehicleLabel="rider"
            destinationAddress={booking.address}
          />
        </div>
      )}

      {/* Rider card */}
      {rider && ['out_for_delivery'].includes(stage) && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏍️</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700 }}>{rider.full_name || 'Your rider'}</div>
              <div style={{ color: C.textSec, fontSize: 12 }}>Returning your items</div>
            </div>
            {rider.phone && (
              <a href={`tel:${rider.phone}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.info}20`, border: `1px solid ${C.info}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📞</div>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>Order Progress</div>
        {STEPS.map((step, i) => {
          const done = si >= 0 && i <= si;
          const current = i === si;
          return (
            <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? 16 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: done ? C.gold : C.navy,
                  border: `2px solid ${done ? C.gold : C.navyBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: done ? C.navy : C.textMuted,
                }}>{done ? '✓' : step.icon}</div>
                {i < STEPS.length - 1 && <div style={{ width: 2, height: 24, background: i < si ? C.gold : C.navyBorder }} />}
              </div>
              <div style={{ flex: 1, paddingTop: 5 }}>
                <div style={{ color: current ? C.gold : C.textPrimary, fontSize: 14, fontWeight: 700 }}>
                  {step.label}{current && ' • now'}
                </div>
                <div style={{ color: C.textMuted, fontSize: 12, marginTop: 1 }}>{step.desc}</div>
              </div>
            </div>
          );
        })}
        {!stage && (
          <div style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
            ⏳ Waiting for the cleaner to receive your items.
          </div>
        )}
      </Card>

      {/* Completed */}
      {stage === 'delivered' && (
        <>
          <PaymentPrompt
            refType="booking" refId={booking.id}
            payeeId={booking.assigned_vendor_id || null} payeeRole="vendor"
            purpose="service" amount={Number(booking.price || 0) || 0}
            label={booking.sub_service || 'Laundry service'}
          />
          <Card style={{ background: `${C.success}10`, border: `1px solid ${C.success}40`, textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={{ color: C.success, fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Order Delivered!</div>
            <Btn onClick={() => navigate(`/review/${booking.id}`)} style={{ marginTop: 8 }}>Leave a Review</Btn>
          </Card>
        </>
      )}
    </div>
  );
}
