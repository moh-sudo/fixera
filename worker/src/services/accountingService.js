import { supabase } from '../supabase';

// Roles that use a deposit wallet (commission deducted on cash jobs).
// Others settle (Fixera pays them net, or collects commission on cash).
export const WALLET_ROLES = ['worker', 'rider'];

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day);
  return d.toISOString();
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// Compute a partner's full financial picture from the payments table.
export async function getFinances(partnerId, role) {
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('payee_id', partnerId)
    .order('created_at', { ascending: false });

  const paid = (payments || []).filter(p => p.status === 'paid');

  const sum = (arr, k) => arr.reduce((s, p) => s + Number(p[k] || 0), 0);

  const totalEarned   = sum(paid, 'partner_amount');     // your take, net of commission
  const totalGross    = sum(paid, 'amount');
  const totalCommission = sum(paid, 'commission_amount');
  const jobs          = paid.length;

  const wk = startOfWeek(), mo = startOfMonth();
  const weekEarned  = sum(paid.filter(p => p.paid_at >= wk), 'partner_amount');
  const monthEarned = sum(paid.filter(p => p.paid_at >= mo), 'partner_amount');

  // ── Outstanding with Fixera ──
  // Cash jobs: partner collected full cash → owes Fixera the commission
  const owedToFixera = sum(
    paid.filter(p => p.method === 'cash' && p.settlement_status !== 'settled'),
    'commission_amount'
  );
  // M-Pesa jobs (future): Fixera holds money → owes partner their net
  const pendingPayout = sum(
    paid.filter(p => p.method === 'mpesa' && p.settlement_status !== 'settled'),
    'partner_amount'
  );

  // Latest paid payout (for the statement's M-Pesa reference)
  let lastPayout = null;
  try {
    const { data: po } = await supabase
      .from('payouts').select('mpesa_ref, amount, processed_at, settled_period')
      .eq('worker_id', partnerId).eq('status', 'paid')
      .order('processed_at', { ascending: false }).limit(1);
    if (po && po[0]) lastPayout = po[0];
  } catch (_) { /* payouts table optional */ }

  const isWallet = WALLET_ROLES.includes(role);
  let walletBalance = null, walletTx = [];
  if (isWallet) {
    const { data: worker } = await supabase.from('workers').select('wallet_balance').eq('id', partnerId).maybeSingle();
    walletBalance = Number(worker?.wallet_balance || 0);
    const { data: tx } = await supabase
      .from('wallet_transactions').select('*').eq('worker_id', partnerId)
      .order('created_at', { ascending: false }).limit(30);
    walletTx = tx || [];
  }

  // ── Chart series ──
  // Daily earnings (last 14 days)
  const dailySeries = lastNDays(14).map(({ key, label }) => ({
    label,
    earned: round2(sum(paid.filter(p => (p.paid_at || p.created_at).slice(0, 10) === key), 'partner_amount')),
    commission: round2(sum(paid.filter(p => (p.paid_at || p.created_at).slice(0, 10) === key), 'commission_amount')),
  }));
  // Monthly earnings (last 6 months)
  const monthlySeries = lastNMonths(6).map(({ key, label }) => ({
    label,
    earned: round2(sum(paid.filter(p => (p.paid_at || p.created_at).slice(0, 7) === key), 'partner_amount')),
    commission: round2(sum(paid.filter(p => (p.paid_at || p.created_at).slice(0, 7) === key), 'commission_amount')),
  }));

  // ── Transaction rows ──
  const transactions = paid.map(p => ({
    id: p.id,
    date: p.paid_at || p.created_at,
    jobId: (p.ref_id || '').slice(0, 8).toUpperCase(),
    customer: p.description || p.purpose || '—',
    amount: Number(p.amount || 0),
    commission: Number(p.commission_amount || 0),
    net: Number(p.partner_amount || 0),
    method: p.method,
    status: p.status,
  }));

  return {
    isWallet,
    totalEarned, totalGross, totalCommission, jobs,
    weekEarned, monthEarned,
    owedToFixera, pendingPayout,
    walletBalance, walletTx,
    dailySeries, monthlySeries,
    transactions,
    lastPayout,
    recent: paid.slice(0, 20),
  };
}

function round2(n) { return Math.round(n * 100) / 100; }

function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) });
  }
  return out;
}
function lastNMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-KE', { month: 'short' }) });
  }
  return out;
}
