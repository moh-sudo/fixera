import { supabase } from '../supabase';

// ─────────────────────────────────────────────────────────────
//  Fixera Payments — M-Pesa-ready, cash-capable today
//  M-Pesa is stubbed behind initiateMpesa(); when Daraja goes
//  live, swap ONLY that function's body for the real STK Push.
//  Nothing else in the app changes.
// ─────────────────────────────────────────────────────────────

// Commission per partner type (FIXERA-LEGAL-DOCUMENTATION v1.1) — defaults.
// Admin → Settings → Finance can override these; we cache the overrides.
export const COMMISSION_RATES = {
  worker:        15,
  rider:         15,
  vendor:        20,
  supplier:      20,
  mover:         20,
  water_carrier: 20,
};

// Lazily cached commission overrides from platform_settings.
let _rateCache = null;
export async function loadCommissionRates() {
  if (_rateCache) return _rateCache;
  try {
    const { data } = await supabase.from('platform_settings').select('commission_rates').eq('id', 1).maybeSingle();
    _rateCache = { ...COMMISSION_RATES, ...(data?.commission_rates || {}) };
  } catch (_) { _rateCache = { ...COMMISSION_RATES }; }
  return _rateCache;
}

export function commissionFor(role) {
  return (_rateCache && _rateCache[role] != null) ? _rateCache[role] : (COMMISSION_RATES[role] ?? 20);
}

export function splitAmount(amount, role) {
  const rate = commissionFor(role);
  const commission = Math.round(amount * rate) / 100;
  return {
    commission_rate: rate,
    commission_amount: commission,
    partner_amount: Math.round((amount - commission) * 100) / 100,
  };
}

// ── Find an existing payment for a job/order (so we don't double-charge) ──
export async function getPaymentFor(refType, refId) {
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('ref_type', refType)
    .eq('ref_id', refId)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

// ── Create a pending payment row ───────────────────────────
export async function createPayment({ customerId, payeeId, payeeRole, refType, refId, purpose, description, amount }) {
  await loadCommissionRates();              // ensure admin-configured rates are applied
  const split = splitAmount(amount, payeeRole);
  const { data, error } = await supabase
    .from('payments')
    .insert({
      customer_id: customerId,
      payee_id:    payeeId || null,
      payee_role:  payeeRole || null,
      ref_type:    refType,
      ref_id:      refId,
      purpose,
      description: description || null,
      amount,
      ...split,
      method: 'cash',
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Customer pays CASH → mark paid, flag for Fixera reconciliation ──
export async function markCashPaid(paymentId) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('payments')
    .update({
      method: 'cash',
      status: 'paid',
      settlement_status: 'unsettled',
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('customer_id', userId)  // ownership check — prevents marking other users' payments
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Payment not found or not authorised');
  return data;
}

// ── Customer pays via M-PESA (Daraja STK Push) ────────────
// Amount is looked up server-side from the payment row — never trusted from client.
// phone must be a Kenyan number: 07XXXXXXXX, 254XXXXXXXXX, or +254XXXXXXXXX
export async function initiateMpesa(paymentId, phone) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch('/api/mpesa-stk-push', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ paymentId, phone }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initiate M-Pesa payment');
  }

  const { checkoutRequestId } = await res.json();
  return { checkoutRequestId };
}

// Poll Daraja every 3 seconds until the payment resolves (max 10 attempts = 30s).
// Returns { status: 'paid'|'cancelled'|'timeout'|'failed', receipt?, message? }
export async function pollMpesaStatus(checkoutRequestId, maxAttempts = 10) {
  const { data: { session } } = await supabase.auth.getSession();
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res  = await fetch('/api/mpesa-status', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ checkoutRequestId }),
      });
      const data = await res.json();
      if (data.status !== 'pending') return data;
    } catch (_) { /* network hiccup — keep polling */ }
  }
  return { status: 'timeout', message: 'No response from M-Pesa. Please check your M-Pesa messages.' };
}

// Convenience: ensure a payment exists for a ref, return it
export async function ensurePayment(opts) {
  const existing = await getPaymentFor(opts.refType, opts.refId);
  if (existing) return existing;
  return createPayment(opts);
}
