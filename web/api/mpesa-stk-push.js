// ============================================================
//  Fixera M-Pesa STK Push — Vercel Serverless Function
//  Initiates a USSD payment prompt on the customer's phone.
//
//  Required env vars (Vercel dashboard → Environment Variables):
//    MPESA_CONSUMER_KEY       — Daraja app consumer key
//    MPESA_CONSUMER_SECRET    — Daraja app consumer secret
//    MPESA_SHORTCODE          — Business shortcode (174379 for sandbox)
//    MPESA_PASSKEY            — Lipa Na M-Pesa Online Passkey
//    MPESA_CALLBACK_URL       — Public HTTPS URL for Daraja to POST result
//    MPESA_CALLBACK_SECRET    — Random secret appended to callback URL
//    MPESA_ENV                — 'sandbox' | 'production'  (default: sandbox)
//    SUPABASE_URL             — Supabase project URL
//    SUPABASE_SERVICE_ROLE_KEY — Service-role key (used to look up payment row)
// ============================================================
import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── 1. Require authenticated Fixera user ──────────────────
  const auth = await requireAuth(req, res);
  if (!auth) return; // requireAuth already sent 401

  // ── 1b. Rate limit — max 3 STK pushes per minute per user ──
  const allowed = await rateLimit(req, res, auth.supabase, `stk:${auth.user.id}`, { max: 3, windowSeconds: 60 });
  if (!allowed) return;

  const { paymentId, phone } = req.body || {};
  if (!paymentId || !phone) {
    return res.status(400).json({ error: 'paymentId and phone are required' });
  }

  // ── 2. Look up payment row — amount comes from DB, not client ─
  const { data: payment, error: payErr } = await auth.supabase
    .from('payments')
    .select('id, amount, customer_id, status')
    .eq('id', paymentId)
    .single();

  if (payErr || !payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  // ── 3. Verify the payment belongs to the authenticated user ──
  if (payment.customer_id !== auth.user.id) {
    return res.status(403).json({ error: 'Not your payment' });
  }

  // ── 4. Prevent double-charging an already-paid row ────────
  if (payment.status === 'paid') {
    return res.status(409).json({ error: 'Payment already completed' });
  }

  const amount = payment.amount;

  const isProd    = process.env.MPESA_ENV === 'production';
  const base      = isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const key       = process.env.MPESA_CONSUMER_KEY;
  const secret    = process.env.MPESA_CONSUMER_SECRET;
  const code      = process.env.MPESA_SHORTCODE;
  const passkey   = process.env.MPESA_PASSKEY;
  const cbBase    = process.env.MPESA_CALLBACK_URL;
  const cbSecret  = process.env.MPESA_CALLBACK_SECRET;

  if (!key || !secret || !code || !passkey || !cbBase) {
    return res.status(500).json({ error: 'M-Pesa credentials not configured on server' });
  }

  // Append secret so the callback handler can verify origin
  const cbUrl = cbSecret ? `${cbBase}?secret=${cbSecret}` : cbBase;

  try {
    // OAuth access token
    const tokenRes = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` } },
    );
    if (!tokenRes.ok) throw new Error(`Token request failed: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();

    // Timestamp + password
    const ts  = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const pwd = Buffer.from(`${code}${passkey}${ts}`).toString('base64');

    // Normalize phone to 254XXXXXXXXX
    const normalizedPhone = phone.toString()
      .replace(/\s+/g, '')
      .replace(/^\+/, '')
      .replace(/^0/, '254');

    // STK Push
    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: code,
        Password:          pwd,
        Timestamp:         ts,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.round(Number(amount)),
        PartyA:            normalizedPhone,
        PartyB:            code,
        PhoneNumber:       normalizedPhone,
        CallBackURL:       cbUrl,
        AccountReference:  'Fixera',
        TransactionDesc:   'Fixera Service',
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0') {
      return res.status(400).json({
        error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
      });
    }

    // Store checkout ID on the payment row
    await auth.supabase
      .from('payments')
      .update({ method: 'mpesa', status: 'pending', mpesa_checkout_id: stkData.CheckoutRequestID })
      .eq('id', paymentId);

    return res.status(200).json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    });
  } catch (err) {
    console.error('[mpesa-stk-push]', err.message);
    return res.status(500).json({ error: 'Payment initiation failed. Please try again.' });
  }
}
