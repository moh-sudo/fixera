import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Smartphone, Banknote, Tag, CheckCircle2, AlertCircle,
  Lock, RefreshCw, Loader, X, ShieldCheck, CreditCard, Ticket
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validatePromoCode, applyPromoCode } from '../../services/promoService';
import { ensurePayment, initiateMpesa, markCashPaid, pollMpesaStatus } from '../../services/paymentService';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const METHODS = [
  { id: 'mpesa', label: 'M-Pesa',           sub: 'STK Push to your phone', Icon: Smartphone },
  { id: 'cash',  label: 'Cash on Delivery', sub: 'Pay when service is done', Icon: Banknote },
];

export default function PaymentPage() {
  const CL = useCL();
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { user }    = useAuth();

  const booking     = state?.booking || null;
  const baseAmount  = booking ? Number(booking.price || 0) : (state?.amount || 0);
  const serviceName = booking ? (booking.sub_service || booking.service || '') : (state?.service || '');
  const bookingId   = booking?.id || null;

  const [payment,    setPayment]    = useState(null);
  const [selected,   setSelected]   = useState('mpesa');
  const [phone,      setPhone]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [mpesaPhase, setMpesaPhase] = useState('idle');
  const [mpesaMsg,   setMpesaMsg]   = useState('');
  const [error,      setError]      = useState('');

  const [promoInput,   setPromoInput]   = useState('');
  const [promoResult,  setPromoResult]  = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError,   setPromoError]   = useState('');

  const discount    = promoResult?.valid ? promoResult.discount    : 0;
  const totalAmount = promoResult?.valid ? promoResult.finalAmount : baseAmount;

  useEffect(() => {
    if (!user || !bookingId || !baseAmount) return;
    ensurePayment({
      customerId: user.id,
      payeeId:    booking?.worker_id || null,
      payeeRole:  'worker',
      refType:    'booking',
      refId:      bookingId,
      purpose:    'service',
      description: serviceName,
      amount:     baseAmount,
    }).then(setPayment).catch(() => {});
  }, [user, bookingId, baseAmount]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    const result = await validatePromoCode(promoInput.trim(), baseAmount, serviceName);
    if (result.valid) {
      setPromoResult(result);
    } else {
      setPromoError(result.message);
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoResult(null);
    setPromoInput('');
    setPromoError('');
  };

  const handlePay = async () => {
    setError('');
    setLoading(true);

    const paymentId = payment?.id || null;
    if (promoResult?.valid && promoResult.code?.id) {
      await applyPromoCode(promoResult.code.id, paymentId, promoResult.discount).catch(() => {});
    }

    try {
      if (selected === 'cash') {
        if (paymentId) await markCashPaid(paymentId);
        navigate(bookingId ? `/review/${bookingId}` : '/review');
        return;
      }

      if (selected === 'mpesa') {
        if (!phone.trim()) {
          setError('Please enter your M-Pesa number.');
          setLoading(false);
          return;
        }
        if (!paymentId) {
          setError('Unable to process payment — please go back and try again.');
          setLoading(false);
          return;
        }
        setMpesaPhase('waiting');
        setMpesaMsg('Check your phone — enter your M-Pesa PIN to complete payment.');

        const { checkoutRequestId } = await initiateMpesa(paymentId, phone.trim());
        const result = await pollMpesaStatus(checkoutRequestId);

        if (result.status === 'paid') {
          setMpesaPhase('success');
          setTimeout(() => navigate(bookingId ? `/review/${bookingId}` : '/review'), 1500);
        } else {
          setMpesaPhase('error');
          setMpesaMsg(result.message || 'Payment was not completed. Please try again.');
        }
        return;
      }
    } catch (err) {
      setMpesaPhase('error');
      setMpesaMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-grid { display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start; }
        @media (max-width:700px) { .pay-grid { grid-template-columns:1fr; } }
        .method-card:hover { border-color: #C9A020 !important; }
      `}</style>

      {/* Sticky header */}
      <div style={{
        background: CL.surface, borderBottom: `1px solid ${CL.border}`,
        padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 38, height: 38, borderRadius: 12, background: CL.bg,
            border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Payment</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>
            {serviceName || 'Complete your booking'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Lock size={12} color={CL.success} />
          <span style={{ color: CL.success, fontSize: 11, fontWeight: 600 }}>Secure</span>
        </div>
      </div>

      <div style={{ padding: '20px 18px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="pay-grid">

          {/* Left — payment methods */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.35 }}>

            <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Payment Method
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {METHODS.map((m, i) => {
                const active = selected === m.id;
                return (
                  <motion.div
                    key={m.id}
                    className="method-card"
                    onClick={() => setSelected(m.id)}
                    variants={fadeUp}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: active ? CL.goldSoft : CL.surface,
                      border: `1.5px solid ${active ? CL.gold : CL.border}`,
                      borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 14,
                        background: active ? CL.gold + '22' : CL.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <m.Icon size={22} color={active ? CL.gold : CL.muted} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>{m.label}</div>
                        <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{m.sub}</div>
                      </div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 11,
                      border: `2px solid ${active ? CL.gold : CL.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {active && <div style={{ width: 10, height: 10, borderRadius: 5, background: CL.gold }} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* M-Pesa phone input */}
            <AnimatePresence>
              {selected === 'mpesa' && mpesaPhase === 'idle' && (
                <motion.div
                  key="phone-input"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: CL.surface, border: `1px solid ${CL.border}`,
                    borderRadius: 16, padding: '16px 18px', marginBottom: 16, overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Smartphone size={15} color={CL.gold} strokeWidth={2} />
                    <span style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>M-Pesa Number</span>
                  </div>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX or 254XXXXXXXXX"
                    type="tel"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: CL.bg, border: `1px solid ${error ? CL.errorBorder : CL.border}`,
                      borderRadius: 10, padding: '11px 14px', color: CL.text,
                      fontSize: 15, fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 8 }}>
                    You will receive a prompt on this number to enter your PIN.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Waiting for PIN */}
            <AnimatePresence>
              {mpesaPhase === 'waiting' && (
                <motion.div
                  key="mpesa-waiting"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: CL.successBg, border: `1px solid ${CL.successBorder}`,
                    borderRadius: 16, padding: '18px', marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Loader size={17} color={CL.success} style={{ animation: 'spin 1s linear infinite' }} />
                    <div style={{ color: CL.success, fontSize: 15, fontWeight: 800 }}>
                      Waiting for M-Pesa PIN…
                    </div>
                  </div>
                  <div style={{ color: CL.muted, fontSize: 13 }}>{mpesaMsg}</div>
                  <div style={{ marginTop: 14, height: 4, borderRadius: 2, background: CL.border, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      backgroundImage: `linear-gradient(90deg, ${CL.success} 0%, #4ade80 50%, ${CL.success} 100%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.8s linear infinite',
                    }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* M-Pesa success */}
            <AnimatePresence>
              {mpesaPhase === 'success' && (
                <motion.div
                  key="mpesa-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: CL.successBg, border: `1px solid ${CL.successBorder}`,
                    borderRadius: 16, padding: '24px 18px', marginBottom: 16, textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: CL.success + '15', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <CheckCircle2 size={28} color={CL.success} strokeWidth={1.8} />
                  </div>
                  <div style={{ color: CL.success, fontSize: 17, fontWeight: 800 }}>Payment confirmed!</div>
                  <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>Redirecting…</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* M-Pesa error */}
            <AnimatePresence>
              {mpesaPhase === 'error' && (
                <motion.div
                  key="mpesa-error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: CL.errorBg, border: `1px solid ${CL.errorBorder}`,
                    borderRadius: 16, padding: '16px 18px', marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <AlertCircle size={15} color={CL.error} />
                    <div style={{ color: CL.error, fontSize: 14, fontWeight: 700 }}>Payment not completed</div>
                  </div>
                  <div style={{ color: CL.muted, fontSize: 13 }}>{mpesaMsg}</div>
                  <button
                    onClick={() => { setMpesaPhase('idle'); setMpesaMsg(''); setError(''); }}
                    style={{
                      marginTop: 10, background: 'none', border: 'none',
                      color: CL.gold, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                    }}
                  >
                    <RefreshCw size={13} />
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Promo code */}
            <div style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 16, padding: '16px 18px', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ticket size={15} color={CL.gold} strokeWidth={2} />
                <span style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>Promo Code</span>
              </div>

              {promoResult?.valid ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: CL.successBg, border: `1.5px solid ${CL.successBorder}`,
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircle2 size={15} color={CL.success} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ color: CL.success, fontSize: 13, fontWeight: 800 }}>
                        {promoResult.code.code} applied!
                      </div>
                      <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
                        You saved KSh {promoResult.discount.toLocaleString()}
                        {promoResult.code.discount_type === 'percent'
                          ? ` (${promoResult.code.discount_value}% off)` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removePromo}
                    style={{
                      width: 28, height: 28, borderRadius: 8, background: CL.bg,
                      border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <X size={13} color={CL.muted} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      placeholder="Enter promo code"
                      style={{
                        flex: 1, background: CL.bg,
                        border: `1px solid ${promoError ? CL.errorBorder : CL.border}`,
                        borderRadius: 10, padding: '11px 14px', color: CL.text,
                        fontSize: 14, fontWeight: 700, letterSpacing: 1,
                        fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      style={{
                        padding: '11px 20px', borderRadius: 10, border: 'none',
                        fontFamily: 'inherit',
                        background: promoInput.trim() ? CL.gold : CL.bg,
                        color: promoInput.trim() ? '#fff' : CL.muted,
                        fontSize: 13, fontWeight: 800,
                        cursor: promoInput.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {promoLoading
                        ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : 'Apply'
                      }
                    </button>
                  </div>
                  {promoError && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: CL.error, fontSize: 12, marginTop: 8,
                    }}>
                      <AlertCircle size={12} />
                      {promoError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* General error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: CL.errorBg, border: `1px solid ${CL.errorBorder}`,
                borderRadius: 12, padding: '11px 14px', marginBottom: 12,
              }}>
                <AlertCircle size={14} color={CL.error} />
                <span style={{ color: CL.error, fontSize: 13 }}>{error}</span>
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, color: CL.muted, fontSize: 12, marginTop: 4,
            }}>
              <Lock size={12} color={CL.success} />
              <span>All payments are encrypted and secure</span>
            </div>
          </motion.div>

          {/* Right — invoice + pay button */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            {/* Invoice card */}
            <div style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 18, padding: '20px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CreditCard size={15} color={CL.gold} strokeWidth={2} />
                <span style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Invoice Summary</span>
              </div>

              {baseAmount > 0 ? (
                <>
                  {serviceName && (
                    <div style={{
                      fontSize: 12, color: CL.muted,
                      paddingBottom: 10, marginBottom: 10,
                      borderBottom: `1px solid ${CL.border}`,
                    }}>
                      {serviceName}
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: `1px solid ${CL.border}`,
                  }}>
                    <span style={{ color: CL.muted, fontSize: 13 }}>Service Fee</span>
                    <span style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>
                      KSh {baseAmount.toLocaleString()}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 0', borderBottom: `1px solid ${CL.border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={12} color={CL.success} />
                        <span style={{ color: CL.success, fontSize: 13 }}>Promo Discount</span>
                      </div>
                      <span style={{ color: CL.success, fontSize: 13, fontWeight: 700 }}>
                        − KSh {discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-end', paddingTop: 14,
                  }}>
                    <span style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>Total</span>
                    <div style={{ textAlign: 'right' }}>
                      {discount > 0 && (
                        <div style={{
                          color: CL.muted, fontSize: 11,
                          textDecoration: 'line-through', marginBottom: 2,
                        }}>
                          KSh {baseAmount.toLocaleString()}
                        </div>
                      )}
                      <span style={{ color: CL.gold, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                        KSh {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {[{ label: 'Service Fee', value: 'TBD' }, { label: 'Platform Fee', value: 'TBD' }].map(r => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '9px 0', borderBottom: `1px solid ${CL.border}`,
                    }}>
                      <span style={{ color: CL.muted, fontSize: 13 }}>{r.label}</span>
                      <span style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14 }}>
                    <span style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>Total</span>
                    <span style={{ color: CL.gold, fontSize: 26, fontWeight: 800 }}>TBD</span>
                  </div>
                  <div style={{
                    background: CL.bg, borderRadius: 10, padding: '10px 12px', marginTop: 14,
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                  }}>
                    <ShieldCheck size={13} color={CL.muted} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: CL.muted, fontSize: 11, lineHeight: 1.6 }}>
                      Final pricing will be available once our service survey is completed.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Pay button */}
            {mpesaPhase === 'idle' && (
              <button
                onClick={handlePay}
                disabled={loading || (selected === 'mpesa' && !phone.trim())}
                style={{
                  width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
                  background: (loading || (selected === 'mpesa' && !phone.trim()))
                    ? CL.border : CL.navy,
                  color: (loading || (selected === 'mpesa' && !phone.trim()))
                    ? CL.muted : '#fff',
                  fontSize: 15, fontWeight: 800,
                  cursor: (loading || (selected === 'mpesa' && !phone.trim()))
                    ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                {loading ? (
                  <>
                    <Loader size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    Processing…
                  </>
                ) : selected === 'cash' ? (
                  <>
                    <Banknote size={17} />
                    Confirm Cash Payment
                  </>
                ) : (
                  <>
                    <Smartphone size={17} />
                    Send M-Pesa Prompt{totalAmount > 0 ? ` · KSh ${totalAmount.toLocaleString()}` : ''}
                  </>
                )}
              </button>
            )}

            {/* Trust badges */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 18, marginTop: 14, flexWrap: 'wrap',
            }}>
              {[
                { Icon: ShieldCheck, label: 'Secure checkout' },
                { Icon: Lock,        label: 'Data encrypted'  },
              ].map(({ Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={12} color={CL.muted} />
                  <span style={{ color: CL.muted, fontSize: 11 }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
