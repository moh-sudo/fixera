// ============================================================
//  Fixera M-Pesa Callback — Vercel Serverless Function
//  Safaricom POSTs here when a payment succeeds or fails.
//
//  The callback URL must include the secret query param:
//    MPESA_CALLBACK_URL + ?secret=MPESA_CALLBACK_SECRET
//  mpesa-stk-push.js appends this automatically.
//
//  Required env vars:
//    SUPABASE_URL               — Supabase project URL
//    SUPABASE_SERVICE_ROLE_KEY  — service-role key (bypasses RLS)
//    MPESA_CALLBACK_SECRET      — random secret to verify Safaricom origin
// ============================================================
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── Verify callback origin with shared secret ─────────────
  const cbSecret = process.env.MPESA_CALLBACK_SECRET;
  const provided = req.query?.secret;
  if (!cbSecret || !provided || provided !== cbSecret) {
    console.warn('[mpesa-callback] rejected — bad or missing secret');
    return res.status(403).end();
  }

  const callback = req.body?.Body?.stkCallback;
  if (!callback) return res.status(400).end();

  const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

  // ── Log all failures ──────────────────────────────────────
  if (ResultCode !== 0) {
    const { data: failedPayment } = await supabase
      .from('payments')
      .select('id, amount')
      .eq('mpesa_checkout_id', CheckoutRequestID)
      .maybeSingle();

    await supabase.from('payment_failures').insert({
      payment_id:          failedPayment?.id || null,
      checkout_request_id: CheckoutRequestID,
      result_code:         String(ResultCode),
      result_description:  callback.ResultDesc || null,
      amount:              failedPayment?.amount || null,
      raw_callback:        callback,
    }).catch(() => {});

    if (failedPayment?.id) {
      await supabase.from('payments')
        .update({ status: 'failed' })
        .eq('id', failedPayment.id);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  if (ResultCode === 0) {
    const items   = CallbackMetadata?.Item || [];
    const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value || null;
    const amount  = items.find(i => i.Name === 'Amount')?.Value || null;

    // Only mark paid if the payment row exists and belongs to a real checkout
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('mpesa_checkout_id', CheckoutRequestID)
      .single();

    if (!payment) {
      console.warn('[mpesa-callback] unknown CheckoutRequestID:', CheckoutRequestID);
      // Still return 200 so Daraja stops retrying
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (payment.status !== 'paid') {
      await supabase
        .from('payments')
        .update({
          status:            'paid',
          method:            'mpesa',
          mpesa_ref:         receipt,
          // Update amount to what Safaricom actually charged (source of truth)
          ...(amount != null ? { amount: Number(amount) } : {}),
          settlement_status: 'unsettled',
          paid_at:           new Date().toISOString(),
        })
        .eq('id', payment.id);
    }
  }

  // Daraja requires this exact response to stop retrying
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
