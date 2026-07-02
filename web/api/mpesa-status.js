// ============================================================
//  Fixera M-Pesa STK Status Query — Vercel Serverless Function
//  Polls Daraja to find out if a payment was completed.
// ============================================================
import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Require authenticated Fixera user
  const auth = await requireAuth(req, res);
  if (!auth) return;

  // Rate limit — generous since this is polled while waiting on payment
  const allowed = await rateLimit(req, res, auth.supabase, `stk-status:${auth.user.id}`, { max: 20, windowSeconds: 60 });
  if (!allowed) return;

  const { checkoutRequestId } = req.body || {};
  if (!checkoutRequestId) {
    return res.status(400).json({ error: 'checkoutRequestId required' });
  }

  const isProd  = process.env.MPESA_ENV === 'production';
  const base    = isProd ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const key     = process.env.MPESA_CONSUMER_KEY;
  const secret  = process.env.MPESA_CONSUMER_SECRET;
  const code    = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  try {
    const tokenRes = await fetch(
      `${base}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` } },
    );
    const { access_token } = await tokenRes.json();

    const ts  = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const pwd = Buffer.from(`${code}${passkey}${ts}`).toString('base64');

    const queryRes = await fetch(`${base}/mpesa/stkpushquery/v1/query`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: code,
        Password:          pwd,
        Timestamp:         ts,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await queryRes.json();

    if (data.errorCode === '500.001.1001') {
      return res.status(200).json({ status: 'pending' });
    }

    const rc = String(data.ResultCode ?? '');
    if (rc === '0')    return res.status(200).json({ status: 'paid',      receipt: data.MpesaReceiptNumber || null });
    if (rc === '1032') return res.status(200).json({ status: 'cancelled', message: 'Request cancelled by user' });
    if (rc === '1037') return res.status(200).json({ status: 'timeout',   message: 'Timed out waiting for customer input' });

    return res.status(200).json({ status: 'failed', resultCode: rc, message: data.ResultDesc || 'Payment failed' });
  } catch (err) {
    console.error('[mpesa-status]', err.message);
    return res.status(500).json({ error: 'Status check failed. Please try again.' });
  }
}
