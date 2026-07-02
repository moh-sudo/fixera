import { supabase } from '../supabase';

// ── Wallet-model partners (workers + riders) ──────────────────────────────────

export async function listPartnerWallets() {
  // Uses the partner_wallet_status view (enforce_wallet_minimum.sql)
  // Falls back to workers table if the view doesn't exist yet
  const { data, error } = await supabase
    .from('partner_wallet_status')
    .select('*')
    .order('can_receive_jobs', { ascending: true })
    .order('wallet_balance',   { ascending: true });
  if (!error) return data || [];

  const { data: d2, error: e2 } = await supabase
    .from('workers')
    .select('id, full_name, email, partner_role, wallet_balance, verification_status, security_deposit, security_deposit_status, can_receive_jobs')
    .order('wallet_balance', { ascending: true });
  if (e2) throw e2;
  return d2 || [];
}

export async function getWalletTransactions(partnerId, limit = 50) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('worker_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getWalletAdjustments(partnerId) {
  const { data, error } = await supabase
    .from('wallet_adjustments')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function applyWalletAdjustment(partnerId, adminId, amount, reason) {
  const { data: worker } = await supabase.from('workers').select('wallet_balance').eq('id', partnerId).single();
  const balanceBefore = worker?.wallet_balance || 0;
  const balanceAfter  = balanceBefore + amount;

  const { error: walletErr } = await supabase
    .from('workers')
    .update({ wallet_balance: balanceAfter })
    .eq('id', partnerId);
  if (walletErr) throw walletErr;

  const { error: logErr } = await supabase.from('wallet_adjustments').insert([{
    partner_id:     partnerId,
    admin_id:       adminId,
    amount,
    reason,
    balance_before: balanceBefore,
    balance_after:  balanceAfter,
  }]);
  if (logErr) throw logErr;

  await supabase.from('wallet_transactions').insert([{
    worker_id:     partnerId,
    type:          amount > 0 ? 'topup' : 'adjustment',
    amount:        Math.abs(amount),
    balance_after: balanceAfter,
    note:          reason,
  }]);

  return balanceAfter;
}

export async function getWalletStats() {
  const { data } = await supabase
    .from('workers')
    .select('wallet_balance, security_deposit, partner_role, can_receive_jobs, security_deposit_status');
  const all            = data || [];
  const walletPartners  = all.filter(w => ['worker', 'rider'].includes(w.partner_role));
  const depositPartners = all.filter(w => ['vendor', 'supplier', 'mover', 'water_carrier'].includes(w.partner_role));
  return {
    totalWalletBalance: walletPartners.reduce((s, w) => s + (w.wallet_balance || 0), 0),
    totalDepositsHeld:  depositPartners.reduce((s, w) => s + (w.security_deposit || 0), 0),
    blockedPartners:    all.filter(w => w.can_receive_jobs === false).length,
    walletBelowMin:     walletPartners.filter(w => (w.wallet_balance || 0) <= 500).length,
    depositNotPaid:     depositPartners.filter(w => w.security_deposit_status !== 'held').length,
    totalPartners:      all.length,
  };
}

// ── Security deposits (vendors, movers, suppliers, water carriers) ────────────

export async function getDepositTransactions(partnerId) {
  const { data, error } = await supabase
    .from('deposit_transactions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Admin records a deposit payment received from a partner
export async function recordDepositReceived(partnerId, adminId, { amount, mpesaRef, note }) {
  const { error } = await supabase.from('deposit_transactions').insert([{
    partner_id: partnerId,
    type:       'received',
    amount,
    method:     mpesaRef ? 'mpesa' : 'cash',
    mpesa_ref:  mpesaRef || null,
    admin_id:   adminId,
    note:       note || null,
  }]);
  if (error) throw error;
  // DB trigger trg_deposit_received automatically updates workers.security_deposit
}

// Admin refunds deposit (partner exits in good standing)
export async function refundDeposit(partnerId, adminId, { amount, mpesaRef, note }) {
  const { error } = await supabase.from('deposit_transactions').insert([{
    partner_id: partnerId,
    type:       'refund',
    amount,
    method:     'mpesa',
    mpesa_ref:  mpesaRef || null,
    admin_id:   adminId,
    note:       note || null,
  }]);
  if (error) throw error;
}

// Admin forfeits deposit (fraud / breach of contract)
export async function forfeitDeposit(partnerId, adminId, reason) {
  const { data: worker } = await supabase
    .from('workers')
    .select('security_deposit')
    .eq('id', partnerId)
    .single();
  const { error } = await supabase.from('deposit_transactions').insert([{
    partner_id: partnerId,
    type:       'forfeiture',
    amount:     worker?.security_deposit || 0,
    method:     'cash',
    admin_id:   adminId,
    note:       reason,
  }]);
  if (error) throw error;
}

// ── Customer refunds ──────────────────────────────────────────────────────────

export async function createRefund({ ticketId, paymentId, bookingId, customerId, amount, reason, adminId }) {
  const { data, error } = await supabase.from('refunds').insert([{
    ticket_id:   ticketId   || null,
    payment_id:  paymentId  || null,
    booking_id:  bookingId  || null,
    customer_id: customerId,
    amount,
    reason:      reason || null,
    status:      'pending',
    admin_id:    adminId,
    approved_at: new Date().toISOString(),
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function executeRefund(refundId, adminId) {
  const { error } = await supabase.rpc('execute_refund', {
    p_refund_id: refundId,
    p_admin_id:  adminId,
  });
  if (error) throw error;
}

export async function listPendingRefunds() {
  const { data, error } = await supabase
    .from('refunds')
    .select('*, customer:customer_id(email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Required deposit amounts per role — configured in platform_settings
export async function getDepositRequirements() {
  const { data } = await supabase
    .from('platform_settings')
    .select('deposit_requirements')
    .eq('id', 1)
    .maybeSingle();
  return data?.deposit_requirements || {
    worker:        500,
    rider:         500,
    vendor:        5000,
    supplier:      5000,
    mover:         10000,
    water_carrier: 3000,
  };
}

export async function saveDepositRequirements(requirements) {
  const { error } = await supabase
    .from('platform_settings')
    .update({ deposit_requirements: requirements })
    .eq('id', 1);
  if (error) throw error;
}
