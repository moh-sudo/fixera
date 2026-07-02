// ============================================================
//  Fixera Partner M-Pesa Top-Up STK Push — Vercel Serverless
//  Prompts the partner's phone to pay into their Fixera wallet.
//
//  Required env vars (same as customer app):
//    MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET
//    MPESA_SHORTCODE, MPESA_PASSKEY
//    MPESA_TOPUP_CALLBACK_URL  — e.g. https://partner-app-five.vercel.app/api/mpesa-topup-callback
//    MPESA_CALLBACK_SECRET
//    MPESA_ENV                 — 'sandbox' | 'production'
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = await requireAuth(req, res);
  if (!auth) return;

  // Rate limit — max 3 top-up STK pushes per minute per partner
  const allowed = await rateLimit(req, res, auth.supabase, `topup-stk:${auth.user.id}`, { max: 3, windowSeconds: 60 });
  if (!allowed) return;

  const { topupId, phone } = req.body || {};
  if (!topupId || !phone) {
    return res.status(400).json({ error: 'topupId and phone are required' });
  }

  // Load topup row — amount comes from DB, never from client
  const { data: topup, error: topupErr } = await auth.supabase
    .from('wallet_topups')
    .select('id, amount, worker_id, status')
    .eq('id', topupId)
    .single();

  if (topupErr || !topup) {
    return res.status(404).json({ error: 'Top-up record not found' });
  }
  if (topup.worker_id !== auth.user.id) {
    return res.status(403).json({ error: 'Not your top-up' });
  }
  if (topup.status === 'paid') {
    return res.status(409).json({ error: 'Already paid' });
  }

  const isProd   = process.env.MPESA_ENV === 'production';
  const base     = isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const key      = process.env.MPESA_CONSUMER_KEY;
  const secret   = process.env.MPESA_CONSUMER_SECRET;
  const code     = process.env.MPESA_SHORTCODE;
  const passkey  = process.env.MPESA_PASSKEY;
  const cbBase   = process.env.MPESA_TOPUP_CALLBACK_URL;
  const cbSecret = process.env.MPESA_CALLBACK_SECRET;

  if (!key || !secret || !code || !passkey || !cbBase) {
    return res.status(500).json({ error: 'M-Pesa credentials not configured on server' });
  }

  const cbUrl = cbSecret ? `${cbBase}?secret=${cbSecret}` : cbBase;

  try {
    const tokenRes = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` } },
    );
    if (!tokenRes.ok) throw new Error(`Token request failed: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();

    const ts  = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const pwd = Buffer.from(`${code}${passkey}${ts}`).toString('base64');

    const normalizedPhone = phone.toString()
      .replace(/\s+/g, '')
      .replace(/^\+/, '')
      .replace(/^0/, '254');

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: code,
        Password:          pwd,
        Timestamp:         ts,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.round(Number(topup.amount)),
        PartyA:            normalizedPhone,
        PartyB:            code,
        PhoneNumber:       normalizedPhone,
        CallBackURL:       cbUrl,
        AccountReference:  'FixeraWallet',
        TransactionDesc:   'Fixera Wallet Top-Up',
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0') {
      return res.status(400).json({
        error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
      });
    }

    await auth.supabase
      .from('wallet_topups')
      .update({ status: 'pending', mpesa_checkout_id: stkData.CheckoutRequestID })
      .eq('id', topupId);

    return res.status(200).json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    });
  } catch (err) {
    console.error('[mpesa-topup-push]', err.message);
    return res.status(500).json({ error: 'Top-up initiation failed. Please try again.' });
  }
}
