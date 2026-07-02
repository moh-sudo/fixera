// ============================================================
//  Fixera Partner M-Pesa Top-Up Callback — Vercel Serverless
//  Safaricom POSTs here after the partner completes/cancels payment.
//  On success: marks topup as paid AND increments wallet_balance.
//
//  Required env vars:
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//    MPESA_CALLBACK_SECRET
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cbSecret = process.env.MPESA_CALLBACK_SECRET;
  const provided = req.query?.secret;
  if (!cbSecret || !provided || provided !== cbSecret) {
    console.warn('[mpesa-topup-callback] rejected — bad or missing secret');
    return res.status(403).end();
  }

  const callback = req.body?.Body?.stkCallback;
  if (!callback) return res.status(400).end();

  const { CheckoutRequestID, ResultCode } = callback;

  if (ResultCode !== 0) {
    // Mark failed so the UI can show an error
    await supabase
      .from('wallet_topups')
      .update({ status: 'failed' })
      .eq('mpesa_checkout_id', CheckoutRequestID);

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // Success — extract receipt and credited amount from Safaricom metadata
  const items   = callback.CallbackMetadata?.Item || [];
  const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null;
  const amount  = items.find(i => i.Name === 'Amount')?.Value || null;

  const { data: topup } = await supabase
    .from('wallet_topups')
    .select('id, worker_id, amount, status')
    .eq('mpesa_checkout_id', CheckoutRequestID)
    .single();

  if (!topup) {
    console.warn('[mpesa-topup-callback] unknown CheckoutRequestID:', CheckoutRequestID);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  if (topup.status !== 'paid') {
    const creditAmount = amount != null ? Number(amount) : Number(topup.amount);

    // Mark topup as paid
    await supabase
      .from('wallet_topups')
      .update({ status: 'paid', mpesa_ref: receipt, amount: creditAmount, paid_at: new Date().toISOString() })
      .eq('id', topup.id);

    // Credit the wallet using a Postgres RPC to avoid race conditions
    await supabase.rpc('increment_wallet_balance', {
      p_worker_id: topup.worker_id,
      p_amount:    creditAmount,
    });
  }

  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
