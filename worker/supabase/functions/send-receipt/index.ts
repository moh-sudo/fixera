import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { receipt, customerEmail, pdfUrl } = await req.json();

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No customer email' }), { status: 400, headers: CORS });
    }

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: CORS });
    }

    const dateStr = new Date(receipt.generated_at || Date.now())
      .toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin:0; padding:0; background:#f0f2f5; font-family:Inter,Arial,sans-serif; }
    .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#0A0E1A,#111827); padding:32px; text-align:center; }
    .logo-box { width:52px; height:52px; background:linear-gradient(135deg,#C9A020,#D4B033); border-radius:14px; display:inline-flex; align-items:center; justify-content:center; font-size:26px; margin-bottom:12px; }
    .brand { color:#C9A020; font-size:22px; font-weight:900; letter-spacing:3px; }
    .sub { color:#7A8BA0; font-size:11px; letter-spacing:2px; margin-top:4px; }
    .badge-bar { background:#48BB7815; border-bottom:3px solid #48BB78; padding:14px 32px; display:flex; justify-content:space-between; align-items:center; }
    .receipt-title { font-size:17px; font-weight:900; color:#1a1a2e; }
    .receipt-no { font-size:12px; color:#888; margin-top:3px; }
    .badge { background:#48BB78; color:#fff; padding:5px 14px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:1px; }
    .body { padding:28px 32px; }
    .section-title { font-size:10px; font-weight:800; color:#C9A020; text-transform:uppercase; letter-spacing:2px; margin:20px 0 12px; }
    .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f0f0f0; }
    .row-label { font-size:13px; color:#888; }
    .row-value { font-size:13px; color:#1a1a2e; font-weight:600; text-align:right; }
    .amount-box { background:#48BB7812; border:1px solid #48BB7840; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; margin:16px 0; }
    .amount-label { font-size:14px; color:#555; font-weight:600; }
    .amount-value { font-size:22px; font-weight:900; color:#48BB78; }
    .pdf-btn { display:block; text-align:center; background:linear-gradient(135deg,#C9A020,#D4B033); color:#0A0E1A; font-weight:800; font-size:14px; padding:14px 28px; border-radius:12px; text-decoration:none; margin:20px 0 8px; }
    .footer { background:#f8f9fa; border-top:1px solid #e8e8e8; padding:20px 32px; text-align:center; color:#999; font-size:12px; line-height:1.8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo-box">🔧</div>
      <div class="brand">FIXERA</div>
      <div class="sub">PROFESSIONAL HOME SERVICES · NAIROBI</div>
    </div>

    <div class="badge-bar">
      <div>
        <div class="receipt-title">SERVICE RECEIPT</div>
        <div class="receipt-no">#${receipt.receipt_no}</div>
      </div>
      <div class="badge">✅ COMPLETED</div>
    </div>

    <div class="body">
      <p style="color:#1a1a2e;font-size:15px;margin:0 0 4px;">Hi there 👋</p>
      <p style="color:#666;font-size:13px;margin:0 0 4px;">Your service has been completed. Here's your receipt.</p>

      <div class="section-title">Service Details</div>
      <div class="row"><span class="row-label">Service</span><span class="row-value">${receipt.sub_service || receipt.service || '—'}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${receipt.booking_date || dateStr}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${receipt.booking_time || '—'}</span></div>
      <div class="row"><span class="row-label">Location</span><span class="row-value">${receipt.address || '—'}</span></div>

      <div class="section-title">Professional</div>
      <div class="row"><span class="row-label">Worker</span><span class="row-value">${receipt.worker_name || 'Fixera Professional'}</span></div>

      <div class="section-title">Payment</div>
      <div class="row"><span class="row-label">Method</span><span class="row-value">M-Pesa</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#48BB78;font-weight:700;">Settled ✅</span></div>

      <div class="amount-box">
        <span class="amount-label">Total Amount</span>
        <span class="amount-value">KSh ${(receipt.amount || 1500).toLocaleString()}</span>
      </div>

      ${pdfUrl ? `<a href="${pdfUrl}" class="pdf-btn">📄 Download PDF Receipt</a>` : ''}

      <div style="background:#f8f9fa;border-radius:10px;padding:12px 16px;margin-top:8px;">
        <div style="font-size:10px;color:#999;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Booking Reference</div>
        <div style="font-family:monospace;font-size:11px;color:#444;word-break:break-all;">${receipt.booking_id || '—'}</div>
      </div>
    </div>

    <div class="footer">
      Thank you for choosing <strong style="color:#C9A020;">Fixera</strong>!<br/>
      Questions? <a href="mailto:support@fixera.co.ke" style="color:#C9A020;">support@fixera.co.ke</a><br/>
      <span style="font-size:11px;">www.fixera.co.ke · Nairobi, Kenya</span>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Fixera Receipts <onboarding@resend.dev>',
        to:      customerEmail,
        subject: `Your Fixera Receipt — ${receipt.receipt_no}`,
        html,
      }),
    });

    const result = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: result }), { status: 500, headers: CORS });
    }

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
});
