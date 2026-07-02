import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, CheckCircle2, Package, Truck, DoorOpen,
  AlertTriangle, Phone, User, Droplets, ShieldCheck, RefreshCw,
  Star, Clock, X, Loader
} from 'lucide-react';
import LiveMap from '../../components/LiveMap';
import PaymentPrompt from '../../components/PaymentPrompt';
import { useAuth } from '../../hooks/useAuth';
import {
  getWaterDelivery, cancelDelivery, confirmReceipt, reorderSame,
  calcCancellationFee, isBowserService,
} from '../../services/waterDeliveryService';
import { supabase } from '../../supabase';

import { useCL } from '../../hooks/useCL';

const STATUS_META = {
  pending:    { label: 'Finding a carrier',  color: '#D4780A',  Icon: Search       },
  confirmed:  { label: 'Confirmed',           color: '#2B6CB0',  Icon: CheckCircle2 },
  loading:    { label: 'Loading at depot',    color: '#C9A020',  Icon: Package      },
  on_the_way: { label: 'On the way',          color: '#1A7F3C',  Icon: Truck        },
  arrived:    { label: 'Arrived at gate',     color: '#1A7F3C',  Icon: DoorOpen     },
  delivered:  { label: 'Delivered',           color: '#1A7F3C',  Icon: CheckCircle2 },
  completed:  { label: 'Completed',           color: '#1A7F3C',  Icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',           color: '#C0392B',  Icon: X            },
};

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function WaterDeliveryStatusPage() {
  const CL = useCL();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      const b = await getWaterDelivery(id);
      setBooking(b);
    } catch (err) {
      console.error('Failed to load water delivery:', err);
      setError('Could not load your water delivery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`booking_${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
        payload => setBooking(payload.new)
      )
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [id]);

  const handleCancel = async () => {
    const fee = calcCancellationFee(booking.status);
    if (fee === null) {
      alert('Cancellation no longer possible at this stage. Please call the driver directly.');
      return;
    }
    const msg = fee === 0
      ? 'Cancel this water delivery? No fee.'
      : `Cancel this water delivery? A KSh ${fee} cancellation fee applies because the driver was already preparing.`;
    const reason = prompt(msg + '\n\nOptional reason:');
    if (reason === null) return;
    try {
      await cancelDelivery(id, reason || '', fee);
      await load();
    } catch (err) { console.error(err); alert('Could not cancel.'); }
  };

  const handleConfirmReceipt = async () => {
    try { await confirmReceipt(id); await load(); }
    catch (err) { console.error(err); alert('Could not confirm receipt.'); }
  };

  const handleReorder = async () => {
    try { const nb = await reorderSame(id, user.id); navigate(`/water/delivery/${nb.id}`); }
    catch (err) { console.error(err); alert('Could not place a new order.'); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: CL.muted, fontSize: 13 }}>Loading water delivery…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !booking) return (
    <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={30} color={CL.error} strokeWidth={1.7} />
      </div>
      <div style={{ color: CL.text, fontSize: 18, fontWeight: 700 }}>Delivery not found</div>
      <div style={{ color: CL.muted, fontSize: 14 }}>{error}</div>
      <button onClick={() => navigate('/home')} style={{ padding: '11px 28px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Back to Home
      </button>
    </div>
  );

  const status  = STATUS_META[booking.status] || STATUS_META.pending;
  const driver  = booking.driver_snapshot || {};
  const isBowser = isBowserService(booking.sub_service);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate('/home')} style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={16} color={CL.info} />
            Water Delivery
          </div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>#{booking.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${status.color}12`, border: `1px solid ${status.color}40`, borderRadius: 20, padding: '6px 14px' }}>
          <status.Icon size={12} color={status.color} strokeWidth={2} />
          <span style={{ color: status.color, fontSize: 12, fontWeight: 700 }}>{status.label}</span>
        </div>
      </div>

      <div style={{ padding: '16px 18px 80px', maxWidth: 640, margin: '0 auto' }}>

        {/* pending */}
        {booking.status === 'pending' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ background: CL.warningBg, border: `1px solid ${CL.warningBorder}`, borderRadius: 16, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${CL.warning}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Search size={22} color={CL.warning} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ color: CL.warning, fontSize: 16, fontWeight: 800 }}>Finding nearest carrier…</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                  Most orders are accepted within 5 min. We're matching you with the closest online water carrier.
                </div>
              </div>
            </div>
            <OrderSummary booking={booking} />
            <DangerBtn onClick={handleCancel}>Cancel Order</DangerBtn>
          </motion.div>
        )}

        {/* confirmed */}
        {booking.status === 'confirmed' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ background: CL.infoBg, border: `1px solid ${CL.infoBorder}`, borderRadius: 16, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${CL.info}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={22} color={CL.info} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ color: CL.info, fontSize: 16, fontWeight: 800 }}>Order confirmed</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>Driver is preparing to depart shortly.</div>
              </div>
            </div>
            <DriverCard driver={driver} />
            <QualityCertNotice />
            <OrderSummary booking={booking} />
            <DangerBtn onClick={handleCancel}>Cancel (KSh 100 fee)</DangerBtn>
          </motion.div>
        )}

        {/* loading at depot */}
        {booking.status === 'loading' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${CL.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={22} color={CL.gold} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ color: CL.gold, fontSize: 16, fontWeight: 800 }}>Loading at depot</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>Your driver is loading the water at their depot. ETA depart: a few minutes.</div>
              </div>
            </div>
            <DriverCard driver={driver} />
            <OrderSummary booking={booking} />
            <DangerBtn onClick={handleCancel}>Cancel (KSh 100 fee)</DangerBtn>
          </motion.div>
        )}

        {/* on the way — live map */}
        {booking.status === 'on_the_way' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ marginBottom: 14, borderRadius: 16, overflow: 'hidden' }}>
              <LiveMap
                bookingId={booking.id}
                destinationAddress={booking.address}
                destinationCoords={
                  booking.latitude && booking.longitude
                    ? [Number(booking.latitude), Number(booking.longitude)]
                    : null
                }
              />
            </div>
            <DriverCard driver={driver} compact />
            <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 14, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color={CL.error} />
              <span style={{ color: CL.error, fontSize: 13, fontWeight: 700 }}>Please meet driver at your gate</span>
            </div>
          </motion.div>
        )}

        {/* arrived */}
        {booking.status === 'arrived' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 16, padding: '18px 20px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${CL.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DoorOpen size={22} color={CL.success} strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ color: CL.success, fontSize: 16, fontWeight: 800 }}>Driver is at your gate</div>
                <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>
                  Please go meet them. {isBowser ? 'They will pump water into your tank.' : 'Hand cash to driver after delivery.'}
                </div>
              </div>
            </div>
            <DriverCard driver={driver} />
            <OrderSummary booking={booking} />
          </motion.div>
        )}

        {/* delivered — awaiting confirmation */}
        {booking.status === 'delivered' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {Array.isArray(booking.delivery_photo_urls) && booking.delivery_photo_urls.length > 0 && (
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ color: CL.gold, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>Delivery Photos</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
                  {booking.delivery_photo_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`delivery ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <OrderSummary booking={booking} />
            <PaymentPrompt
              refType="booking" refId={booking.id}
              payeeId={booking.carrier_user_id} payeeRole="water_carrier"
              purpose="water" amount={Number(booking.price || 0)}
              label="Water delivery"
            />
            <div style={{ background: CL.warningBg, border: `1px solid ${CL.warningBorder}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
              <div style={{ color: CL.warning, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Inspect before driver leaves</div>
              <div style={{ color: CL.muted, fontSize: 12 }}>Check water quality and quantity. Report any issue immediately.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/support')} style={{ flex: 1, padding: '12px', borderRadius: 12, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Report Problem
              </button>
              <button onClick={handleConfirmReceipt} style={{ flex: 2, padding: '12px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <CheckCircle2 size={15} /> Confirm Receipt
              </button>
            </div>
          </motion.div>
        )}

        {/* completed */}
        {booking.status === 'completed' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: CL.successBg, border: `1px solid ${CL.successBorder}`, borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 24, background: '#fff', border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
              </div>
              <div style={{ color: CL.success, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Delivery Complete!</div>
              <div style={{ color: CL.muted, fontSize: 14 }}>
                KSh {Number(booking.price || 0).toLocaleString()} paid
                {booking.delivered_at ? ` · ${new Date(booking.delivered_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </div>
            </div>

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>How was the delivery?</div>
              <button onClick={() => navigate(`/review/${booking.id}`)} style={{ width: '100%', padding: '12px', borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, color: CL.gold, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Star size={15} fill={CL.gold} strokeWidth={0} /> Leave a Review
              </button>
            </div>

            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ color: CL.gold, fontSize: 14, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                <RefreshCw size={14} color={CL.gold} /> Want this again?
              </div>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 14 }}>Place the same order with one tap.</div>
              <button onClick={handleReorder} style={{ width: '100%', padding: '12px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Order Same Again
              </button>
            </div>
          </motion.div>
        )}

        {/* cancelled */}
        {booking.status === 'cancelled' && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 18, padding: '36px 24px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 20, background: '#fff', border: `1px solid ${CL.errorBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <X size={28} color={CL.error} strokeWidth={2} />
              </div>
              <div style={{ color: CL.error, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Order Cancelled</div>
              {booking.cancellation_fee > 0 && (
                <div style={{ color: CL.muted, fontSize: 13, marginBottom: 6 }}>Cancellation fee: KSh {booking.cancellation_fee}</div>
              )}
              {booking.cancellation_reason && (
                <div style={{ color: CL.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 16 }}>"{booking.cancellation_reason}"</div>
              )}
            </div>
            <button onClick={() => navigate('/service/water-carriers')} style={{ width: '100%', padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              Order Again
            </button>
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Helper components ─── */
function OrderSummary({ booking }) {
  const CLS = { gold: '#C9A020', muted: '#6B7A8F', text: '#0A1628', border: '#E8ECF0', surface: '#fff', goldSoft: '#FDF8EC', goldBorder: '#E8D48A' };
  return (
    <div style={{ background: CLS.surface, border: `1px solid ${CLS.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ color: CLS.gold, fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Package size={12} color={CLS.gold} />
        Order Summary
      </div>
      {booking.quantity && <SRow label="Quantity" value={`${booking.quantity} × ${booking.sub_service || 'Water'}`} />}
      {!booking.quantity && booking.sub_service && <SRow label="Item" value={booking.sub_service} />}
      <SRow label="Address" value={booking.address || '—'} multiline />
      <SRow label="Total" value={`KSh ${Number(booking.price || 0).toLocaleString()}`} bold />
      {booking.notes && <SRow label="Notes" value={booking.notes} multiline />}
    </div>
  );
}

function SRow({ label, value, multiline, bold }) {
  const CLS = { gold: '#C9A020', muted: '#6B7A8F', text: '#0A1628' };
  return (
    <div style={{ display: 'flex', flexDirection: multiline ? 'column' : 'row', justifyContent: 'space-between', gap: 8, padding: '5px 0' }}>
      <span style={{ color: CLS.muted, fontSize: 12 }}>{label}</span>
      <span style={{ color: bold ? CLS.gold : CLS.text, fontSize: bold ? 16 : 13, fontWeight: bold ? 800 : 600, textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}

function DriverCard({ driver, compact }) {
  const CLS = { surface: '#fff', border: '#E8ECF0', muted: '#6B7A8F', text: '#0A1628', infoBg: '#EBF8FF', infoBorder: '#BEE3F8', info: '#2B6CB0' };
  if (!driver || !driver.name) return (
    <div style={{ background: CLS.surface, border: `1px solid ${CLS.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
      <Loader size={14} color={CLS.muted} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ color: CLS.muted, fontSize: 13 }}>Driver details coming shortly…</div>
    </div>
  );
  return (
    <div style={{ background: CLS.surface, border: `1px solid ${CLS.border}`, borderRadius: 16, padding: '14px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: compact ? 44 : 56, height: compact ? 44 : 56, borderRadius: '50%', background: driver.photo_url ? 'transparent' : CLS.infoBg, border: `2px solid ${CLS.infoBorder}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {driver.photo_url
            ? <img src={driver.photo_url} alt={driver.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <User size={compact ? 20 : 24} color={CLS.info} strokeWidth={1.7} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: CLS.text, fontSize: 14, fontWeight: 700 }}>{driver.name}</div>
          <div style={{ color: CLS.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Truck size={11} /> Driver
          </div>
          {driver.plate && (
            <div style={{ display: 'inline-block', marginTop: 5, padding: '2px 8px', background: '#fff', border: '1px solid #ccc', color: '#000', fontSize: 11, fontWeight: 800, borderRadius: 5, letterSpacing: 1.5, fontFamily: 'monospace' }}>{driver.plate}</div>
          )}
        </div>
        {driver.phone && (
          <a href={`tel:${driver.phone}`} style={{ textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: CLS.infoBg, border: `1px solid ${CLS.infoBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} color={CLS.info} strokeWidth={1.7} />
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

function QualityCertNotice() {
  return (
    <div style={{ background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: '#BEE3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ShieldCheck size={18} color="#2B6CB0" strokeWidth={1.7} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#2B6CB0', fontSize: 12, fontWeight: 800 }}>Water Quality Verified by Fixera</div>
        <div style={{ color: '#6B7A8F', fontSize: 11, marginTop: 2 }}>This carrier's water source is certified clean and food-grade.</div>
      </div>
    </div>
  );
}

function DangerBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ width: '100%', marginTop: 8, padding: '12px', borderRadius: 12, background: '#FDF2F2', border: '1px solid #F5C6C6', color: '#C0392B', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
      {children}
    </button>
  );
}
