import { useEffect, useState } from 'react';
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
  navy: '#0A1628',
};

const MIN_WITHDRAW = 500;

const STATUS_META = {
  pending:  { label: 'Pending Review', color: CL.amber, bg: CL.amberSoft,  border: CL.amberBorder  },
  approved: { label: 'Approved',       color: CL.blue,  bg: CL.blueSoft,   border: '#BFDBFE'       },
  paid:     { label: 'Paid ✓',         color: CL.green, bg: CL.greenSoft,  border: CL.greenBorder  },
  rejected: { label: 'Rejected',       color: CL.red,   bg: CL.redSoft,    border: '#FECACA'       },
};

export default function WithdrawPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [balance,    setBalance]    = useState(0);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [phone,      setPhone]      = useState(profile?.phone || '');
  const [amount,     setAmount]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, historyRes] = await Promise.all([
      supabase.from('workers').select('wallet_balance').eq('id', user.id).single(),
      supabase.from('payouts').select('*').eq('worker_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setBalance(walletRes.data?.wallet_balance || 0);
    setHistory(historyRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const hasPending = history.some(h => h.status === 'pending' || h.status === 'approved');
  const parsedAmt  = Number(amount);
  const canSubmit  = phone.trim().length >= 9 && parsedAmt >= MIN_WITHDRAW && parsedAmt <= balance && !hasPending;

  const handleSubmit = async () => {
    setError('');
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from('payouts').insert([{
        worker_id:  user.id,
        partner_id: user.id,
        amount:     parsedAmt,
        phone:      phone.trim(),
        method:     'mpesa',
        status:     'pending',
      }]);
      if (err) throw err;
      setSuccess(true);
      setAmount('');
      await load();
    } catch (e) {
      setError(e.message || 'Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const amountNum = Number(amount) || 0;

  return (
    <div style={{ padding: '20px 16px 60px', maxWidth: 560, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/earnings')} style={{
          width: 38, height: 38, borderRadius: 10, border: `1px solid ${CL.border}`,
          background: CL.surface, color: CL.text,
          fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
        }}>←</button>
        <div>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 900 }}>Request Withdrawal</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 1 }}>Funds sent to M-Pesa within 24 hours of approval</div>
        </div>
      </div>

      {/* Balance card */}
      <div style={{
        background: `linear-gradient(135deg, ${CL.green}18, ${CL.green}06)`,
        border: `1px solid ${CL.green}40`, borderRadius: 20, padding: '20px 22px', marginBottom: 20,
      }}>
        <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Available Balance</div>
        {loading ? (
          <div style={{ height: 40, width: 160, borderRadius: 8, background: `${CL.border}`, marginTop: 10 }} />
        ) : (
          <div style={{ color: CL.green, fontSize: 36, fontWeight: 900, marginTop: 6, letterSpacing: -1 }}>
            <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.8 }}>KSh </span>
            {balance.toLocaleString()}
          </div>
        )}
        <div style={{ color: CL.muted, fontSize: 11, marginTop: 6 }}>
          Minimum withdrawal: KSh {MIN_WITHDRAW.toLocaleString()}
        </div>
        <button onClick={() => navigate('/topup')} style={{
          marginTop: 14, padding: '9px 18px', borderRadius: 10, border: 'none',
          background: CL.green, color: '#fff',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Top Up Wallet</button>
      </div>

      {/* Pending warning */}
      {hasPending && (
        <div style={{
          background: CL.amberSoft, border: `1px solid ${CL.amberBorder}`,
          borderRadius: 14, padding: '13px 16px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div>
            <div style={{ color: CL.amber, fontSize: 13, fontWeight: 700 }}>Withdrawal in progress</div>
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>
              You already have a pending or approved request. Wait for it to complete before submitting a new one.
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ color: CL.green, fontSize: 14, fontWeight: 800 }}>Request submitted!</div>
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>
              Your payout will be sent to your M-Pesa within 24 hours of admin approval.
            </div>
          </div>
        </div>
      )}

      {/* Request form */}
      {!hasPending && (
        <div style={{
          background: CL.surface, border: `1px solid ${CL.border}`,
          borderRadius: 20, padding: '20px', marginBottom: 20,
        }}>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 18 }}>💸 New Withdrawal Request</div>

          {/* Amount */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              Amount (KSh)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: CL.muted, fontSize: 13, fontWeight: 700 }}>KSh</span>
              <input
                type="number" value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); setSuccess(false); }}
                placeholder="0" min={MIN_WITHDRAW} max={balance}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: CL.bg, border: `1px solid ${amountNum > balance && amount ? CL.red : CL.border}`,
                  borderRadius: 12, padding: '13px 14px 13px 46px',
                  color: CL.text, fontSize: 18, fontWeight: 800,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            {amountNum > balance && amount && (
              <div style={{ color: CL.red, fontSize: 11, marginTop: 6 }}>Amount exceeds your available balance.</div>
            )}
            {amountNum > 0 && amountNum < MIN_WITHDRAW && (
              <div style={{ color: CL.red, fontSize: 11, marginTop: 6 }}>Minimum withdrawal is KSh {MIN_WITHDRAW.toLocaleString()}.</div>
            )}
            {balance >= MIN_WITHDRAW && (
              <button onClick={() => setAmount(String(balance))} style={{ marginTop: 8, background: 'none', border: 'none', color: CL.green, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Withdraw all (KSh {balance.toLocaleString()})
              </button>
            )}
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
                color: CL.text, fontSize: 15,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 6 }}>
              This is where Fixera will send your payment via M-Pesa.
            </div>
          </div>

          {error && (
            <div style={{ color: CL.red, fontSize: 12, marginBottom: 14, padding: '10px 12px', background: CL.redSoft, borderRadius: 10 }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: canSubmit ? CL.text : CL.bg,
              color: canSubmit ? '#fff' : CL.muted,
              fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', opacity: submitting ? 0.7 : 1,
            }}>
            {submitting ? 'Submitting…' : canSubmit ? `Request KSh ${parsedAmt.toLocaleString()} Payout` : 'Enter amount and phone number'}
          </button>
        </div>
      )}

      {/* Payout history */}
      <div>
        <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Payout History</div>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: CL.surface, border: `1px solid ${CL.border}`, marginBottom: 10, opacity: 1 - i * 0.2 }} />
          ))
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: CL.muted }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>
            <div style={{ fontSize: 13 }}>No payout requests yet.</div>
          </div>
        ) : history.map((p) => {
          const meta = STATUS_META[p.status] || STATUS_META.pending;
          return (
            <div key={p.id} style={{
              background: CL.surface, border: `1px solid ${CL.border}`,
              borderRadius: 16, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>
                    KSh {Number(p.amount || 0).toLocaleString()}
                  </div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 3 }}>
                    {new Date(p.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{p.phone || p.phone_number || '—'}
                  </div>
                  {p.mpesa_ref && (
                    <div style={{ color: CL.green, fontSize: 11, marginTop: 3, fontWeight: 700 }}>Ref: {p.mpesa_ref}</div>
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
