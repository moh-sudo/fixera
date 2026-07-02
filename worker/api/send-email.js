// ============================================================
//  Fixera Partner Email API — Vercel Serverless Function
//  Sends via Resend using noreply@fixera.africa
//  Requires a valid Supabase JWT (Authorization: Bearer <token>).
// ============================================================
import { requireAuth } from './_auth.js';
import { rateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;

  // Rate limit — protects the Resend quota/cost from abuse
  const rateLimitOk = await rateLimit(req, res, auth.supabase, `send-email:${auth.user.id}`, { max: 10, windowSeconds: 60 });
  if (!rateLimitOk) return;

  const { to, subject, html, fromName = 'Fixera' } = req.body || {};
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing to, subject or html' });
  }

  // Prevent open relay — only allow sending to the authenticated user's own email
  // or Fixera's internal addresses. Blocks phishing/spam via our Resend account.
  const FIXERA_DOMAINS = ['@fixera.africa'];
  const recipients = Array.isArray(to) ? to : [to];
  const recipientsAllowed = recipients.every(addr =>
    addr === auth.user.email || FIXERA_DOMAINS.some(d => addr.endsWith(d))
  );
  if (!recipientsAllowed) {
    return res.status(403).json({ error: 'Recipient address not permitted' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured on server' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <noreply@fixera.africa>`,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Resend API error');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send failed:', error.message);
    return res.status(500).json({ error: 'Email delivery failed. Please try again.' });
  }
}
