import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
};

const MIN_TOPUP = 100;
const POLL_INTERVAL = 4000;
const MAX_POLLS = 30; // ~2 minutes

const STATUS_META = {
  pending: { label: 'Pending',   color: CL.amber, bg: CL.amberSoft,  border: CL.amberBorder },
  paid:    { label: 'Paid ✓',   color: CL.green, bg: CL.greenSoft,  border: CL.greenBorder },
  failed:  { label: 'Failed',    color: CL.red,   bg: CL.redSoft,    border: '#FECACA'      },
};

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

export default function TopupPage() {
  const { user, profile } = useAuth();
  const navigate          = useNavigate();

  const [balance,  setBalance]  = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [amount,   setAmount]   = useState('');
  const [phone,    setPhone]    = useState(profile?.phone || '');
  const [step,     setStep]     = useState('form'); // form | waiting | success | error
  const [errMsg,   setErrMsg]   = useState('');
  const [receipt,  setReceipt]  = useState(null);
  const pollRef   = useRef(null);
  const pollCount = useRef(0);
  const checkoutRef = useRef(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, historyRes] = await Promise.all([
      supabase.from('workers').select('wallet_balance').eq('id', user.id).single(),
      supabase.from('wallet_topups').select('*').eq('worker_id', user.id)
        .order('created_at', { ascending: false }).limit(10),
    ]);
    setBalance(walletRes.data?.wallet_balance ?? 0);
    setHistory(historyRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const stopPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const startPolling = (checkoutRequestId) => {
    pollCount.current = 0;
    pollRef.current = setInterval(async () => {
      pollCount.current += 1;

      // Timeout after MAX_POLLS
      if (pollCount.current > MAX_POLLS) {
        stopPolling();
        setStep('error');
        setErrMsg('Payment timed out. If you were charged, your balance will update shortly.');
        return;
      }

      try {
        const token = await getSession();
        const res   = await fetch('/api/mpesa-topup-status', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ checkoutRequestId }),
        });
        const data = await res.json();

        if (data.status === 'paid') {
          stopPolling();
          setReceipt(data.receipt);
          setStep('success');
          await load();
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          stopPolling();
          setStep('error');
          setErrMsg(data.message || 'Payment was not completed.');
        }
        // 'pending' → keep polling
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL);
  };

  const handleTopup = async () => {
    setErrMsg('');
    const amt = Number(amount);
    if (!amt || amt < MIN_TOPUP) return;
    if (!phone.trim()) return;

    try {
      // 1. Insert topup row to get an ID
      const { data: topup, error: insertErr } = await supabase
        .from('wallet_topups')
        .insert({ worker_id: user.id, amount: amt, status: 'initiated', phone: phone.trim() })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Trigger STK push
      const token = await getSession();
      const res   = await fetch('/api/mpesa-topup-push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ topupId: topup.id, phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'STK push failed');

      checkoutRef.current = data.checkoutRequestId;
      setStep('waiting');
      startPolling(data.checkoutRequestId);
    } catch (e) {
      setErrMsg(e.message || 'Could not initiate payment. Please try again.');
    }
  };

  const parsedAmt  = Number(amount) || 0;
  const canSubmit  = parsedAmt >= MIN_TOPUP && phone.trim().length >= 9;

  return (
    <div style={{ padding: '20px 16px 60px', maxWidth: 560, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/earnings')} style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${CL.border}`,
          background: CL.surface, color: CL.text, fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
        }}>←</button>
        <div>
          <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>Top Up Wallet</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 1 }}>Add funds via M-Pesa STK push</div>
        </div>
      </div>

      {/* Balance card */}
      <div style={{
        background: `linear-gradient(135deg, ${CL.gold}18, ${CL.gold}06)`,
        border: `1px solid ${CL.gold}40`, borderRadius: 20, padding: '20px 22px', marginBottom: 20,
      }}>
        <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Current Balance
        </div>
        {loading ? (
          <div style={{ height: 40, width: 160, borderRadius: 8, background: CL.border, marginTop: 10 }} />
        ) : (
          <div style={{ color: CL.gold, fontSize: 36, fontWeight: 900, marginTop: 6, letterSpacing: -1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.8 }}>KSh </span>
            {(balance ?? 0).toLocaleString()}
          </div>
        )}
      </div>

      {/* ── WAITING STATE ── */}
      {step === 'waiting' && (
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 20, padding: 28, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📲</div>
          <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Check your phone</div>
          <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            An M-Pesa prompt has been sent to <strong style={{ color: CL.text }}>{phone}</strong>.
            Enter your PIN to complete the top-up of <strong style={{ color: CL.gold }}>KSh {parsedAmt.toLocaleString()}</strong>.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: CL.muted, fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: CL.gold, animation: 'pulse 1.4s infinite' }} />
            Waiting for payment confirmation…
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          <button onClick={() => { stopPolling(); setStep('form'); }} style={{
            marginTop: 20, padding: '10px 20px', borderRadius: 10,
            background: CL.bg, border: `1px solid ${CL.border}`,
            color: CL.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      )}

      {/* ── SUCCESS STATE ── */}
      {step === 'success' && (
        <div style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, borderRadius: 20, padding: 28, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <div style={{ color: CL.green, fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Top-up successful!</div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 6 }}>
            KSh {parsedAmt.toLocaleString()} has been added to your wallet.
          </div>
          {receipt && (
            <div style={{ color: CL.green, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
              M-Pesa Ref: {receipt}
            </div>
          )}
          <button onClick={() => { setStep('form'); setAmount(''); setReceipt(null); }} style={{
            padding: '12px 24px', borderRadius: 12,
            background: CL.text, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Top Up Again</button>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {step === 'error' && (
        <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <div style={{ color: CL.red, fontSize: 15, fontWeight: 800, marginBottom: 6 }}>❌ Payment not completed</div>
          <div style={{ color: CL.muted, fontSize: 13 }}>{errMsg}</div>
          <button onClick={() => setStep('form')} style={{
            marginTop: 14, padding: '10px 20px', borderRadius: 10,
            background: CL.surface, border: `1px solid ${CL.border}`,
            color: CL.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Try Again</button>
        </div>
      )}

      {/* ── FORM STATE ── */}
      {step === 'form' && (
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 20, padding: 20, marginBottom: 20 }}>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 18 }}>💳 New Top-Up</div>

          {errMsg && (
            <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: CL.red, fontSize: 13 }}>
              ❌ {errMsg}
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              Amount (KSh)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: CL.muted, fontSize: 13, fontWeight: 700 }}>KSh</span>
              <input
                type="number" value={amount} min={MIN_TOPUP}
                onChange={e => { setAmount(e.target.value); setErrMsg(''); }}
                placeholder="0"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: CL.bg, border: `1px solid ${CL.border}`,
                  borderRadius: 12, padding: '13px 14px 13px 46px',
                  color: CL.text, fontSize: 18, fontWeight: 800,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            {parsedAmt > 0 && parsedAmt < MIN_TOPUP && (
              <div style={{ color: CL.red, fontSize: 11, marginTop: 6 }}>
                Minimum top-up is KSh {MIN_TOPUP.toLocaleString()}.
              </div>
            )}
            {/* Quick amount buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {[500, 1000, 2000, 5000].map(q => (
                <button key={q} onClick={() => setAmount(String(q))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  background: parsedAmt === q ? CL.goldSoft : CL.bg,
                  border: `1px solid ${parsedAmt === q ? CL.goldBorder : CL.border}`,
                  color: parsedAmt === q ? CL.gold : CL.muted,
                  fontSize: 12, fontWeight: 700,
                }}>{q.toLocaleString()}</button>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              M-Pesa Number
            </label>
            <input
              type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 254XXXXXXXXX"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: CL.bg, border: `1px solid ${CL.border}`,
                borderRadius: 12, padding: '13px 14px',
                color: CL.text, fontSize: 15, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 6 }}>
              You'll receive an M-Pesa PIN prompt on this number.
            </div>
          </div>

          <button
            onClick={handleTopup} disabled={!canSubmit}
            style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: canSubmit ? CL.text : CL.bg,
              color: canSubmit ? '#fff' : CL.muted,
              fontSize: 15, fontWeight: 800,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}>
            {canSubmit ? `Pay KSh ${parsedAmt.toLocaleString()} via M-Pesa` : 'Enter amount and phone number'}
          </button>
        </div>
      )}

      {/* Top-up history */}
      <div>
        <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Top-Up History</div>
        {loading ? (
          [0, 1].map(i => (
            <div key={i} style={{ height: 68, borderRadius: 14, background: CL.surface, border: `1px solid ${CL.border}`, marginBottom: 10, opacity: 1 - i * 0.3 }} />
          ))
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: CL.muted }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
            <div style={{ fontSize: 13 }}>No top-ups yet.</div>
          </div>
        ) : history.map(t => {
          const meta = STATUS_META[t.status] || STATUS_META.pending;
          return (
            <div key={t.id} style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 16, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>
                    + KSh {Number(t.amount || 0).toLocaleString()}
                  </div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 3 }}>
                    {new Date(t.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {t.phone ? ` · ${t.phone}` : ''}
                  </div>
                  {t.mpesa_ref && (
                    <div style={{ color: CL.green, fontSize: 11, marginTop: 3, fontWeight: 700 }}>Ref: {t.mpesa_ref}</div>
                  )}
                </div>
                <span style={{
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  color: meta.color, fontSize: 11, fontWeight: 800,
                  padding: '5px 12px', borderRadius: 999, whiteSpace: 'nowrap',
                }}>{meta.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
