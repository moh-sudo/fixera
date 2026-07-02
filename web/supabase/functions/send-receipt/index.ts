// ─────────────────────────────────────────────────────────────
//  Fixera - Send Receipt Edge Function
//  Triggered by Supabase Database Webhook when booking status = 'completed'
//  Sends a beautiful HTML receipt email via Resend
// ─────────────────────────────────────────────────────────────
import { serve }       from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildEmailHtml(booking: any, customerName: string, customerEmail: string) {
  const service    = booking.sub_service || booking.service_name || booking.service || 'Home Service';
  const price      = Number(booking.price || 0);
  const date       = booking.booking_date || booking.scheduled_date || new Date(booking.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  const time       = booking.booking_time || booking.scheduled_time || '—';
  const worker     = booking.worker_name || 'Fixera Professional';
  const address    = booking.address || '—';
  const receiptNo  = `FXR-${booking.id.slice(0, 8).toUpperCase()}`;
  const completedAt = booking.completed_at ? new Date(booking.completed_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-KE');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fixera Receipt — ${receiptNo}</title>
</head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#C9A020,#D4B033);border-radius:16px;padding:14px 20px;margin-bottom:16px;">
        <span style="color:#0A0E1A;font-size:22px;font-weight:900;letter-spacing:1px;">🔧 FIXERA</span>
      </div>
      <div style="color:#7A8BA0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Service Receipt</div>
    </div>

    <!-- Success banner -->
    <div style="background:rgba(72,187,120,0.10);border:1px solid rgba(72,187,120,0.25);border-radius:20px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      <div style="color:#48BB78;font-size:22px;font-weight:900;margin-bottom:6px;">Job Completed!</div>
      <div style="color:#7A8BA0;font-size:14px;">Thank you for choosing Fixera, ${customerName}.</div>
    </div>

    <!-- Receipt card -->
    <div style="background:#141928;border:1px solid #1E2A3A;border-radius:20px;overflow:hidden;margin-bottom:20px;">

      <!-- Receipt number -->
      <div style="background:rgba(201,160,32,0.08);border-bottom:1px solid #1E2A3A;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="color:#7A8BA0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Receipt Number</div>
          <div style="color:#C9A020;font-size:16px;font-weight:900;margin-top:2px;">${receiptNo}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:#7A8BA0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Completed</div>
          <div style="color:#E2E8F0;font-size:12px;font-weight:600;margin-top:2px;">${completedAt}</div>
        </div>
      </div>

      <!-- Details -->
      <div style="padding:24px;">
        ${[
          { label: 'Service',        value: service  },
          { label: 'Professional',   value: worker   },
          { label: 'Date',           value: date     },
          { label: 'Time',           value: time     },
          { label: 'Location',       value: address  },
        ].map(row => `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid #1E2A3A;">
            <div style="color:#7A8BA0;font-size:13px;">${row.label}</div>
            <div style="color:#E2E8F0;font-size:13px;font-weight:600;text-align:right;max-width:60%;">${row.value}</div>
          </div>
        `).join('')}

        <!-- Amount -->
        <div style="margin-top:20px;padding:16px;background:rgba(201,160,32,0.08);border:1px solid rgba(201,160,32,0.2);border-radius:14px;text-align:center;">
          <div style="color:#7A8BA0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Total Paid</div>
          <div style="color:#C9A020;font-size:36px;font-weight:900;">KSh ${fmt(price)}</div>
        </div>
      </div>
    </div>

    <!-- Rate your experience -->
    <div style="background:#141928;border:1px solid #1E2A3A;border-radius:16px;padding:20px 24px;text-align:center;margin-bottom:20px;">
      <div style="color:#E2E8F0;font-size:15px;font-weight:700;margin-bottom:6px;">How was your experience?</div>
      <div style="color:#7A8BA0;font-size:13px;margin-bottom:16px;">Your feedback helps us maintain quality</div>
      <div style="font-size:28px;letter-spacing:6px;">⭐⭐⭐⭐⭐</div>
      <div style="margin-top:14px;">
        <a href="https://fixera.co.ke/review/${booking.id}" style="display:inline-block;background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:10px 24px;">
          Leave a Review →
        </a>
      </div>
    </div>

    <!-- Need help -->
    <div style="background:#141928;border:1px solid #1E2A3A;border-radius:16px;padding:20px 24px;margin-bottom:28px;">
      <div style="color:#E2E8F0;font-size:14px;font-weight:700;margin-bottom:12px;">Need help with this job?</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="https://wa.me/254712008361?text=Hi%20Fixera%2C%20my%20receipt%20is%20${receiptNo}" style="flex:1;display:inline-block;background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.25);color:#25D366;font-size:12px;font-weight:700;text-decoration:none;border-radius:10px;padding:10px 16px;text-align:center;">
          💬 WhatsApp
        </a>
        <a href="tel:+254712008361" style="flex:1;display:inline-block;background:rgba(99,179,237,0.1);border:1px solid rgba(99,179,237,0.25);color:#63B3ED;font-size:12px;font-weight:700;text-decoration:none;border-radius:10px;padding:10px 16px;text-align:center;">
          📞 Call Us
        </a>
        <a href="mailto:support@fixera.co.ke?subject=Receipt%20${receiptNo}" style="flex:1;display:inline-block;background:rgba(201,160,32,0.08);border:1px solid rgba(201,160,32,0.2);color:#C9A020;font-size:12px;font-weight:700;text-decoration:none;border-radius:10px;padding:10px 16px;text-align:center;">
          ✉️ Email
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:8px;border-top:1px solid #1E2A3A;">
      <div style="color:#C9A020;font-size:13px;font-weight:900;letter-spacing:1px;margin-bottom:4px;">FIXERA</div>
      <div style="color:#7A8BA0;font-size:11px;margin-bottom:6px;">One Call. We Fix It All.</div>
      <div style="color:#4A5568;font-size:10px;">Nairobi, Kenya · support@fixera.co.ke · +254 712 008 361</div>
      <div style="color:#4A5568;font-size:10px;margin-top:8px;">
        © 2026 Fixera Technologies Ltd. All rights reserved.<br/>
        This receipt was sent to ${customerEmail}
      </div>
    </div>

  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const RESEND_KEY   = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
    const SUPABASE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
    const AT_USERNAME  = Deno.env.get('AT_USERNAME');
    const AT_API_KEY   = Deno.env.get('AT_API_KEY');

    console.log('[send-receipt] Secrets check:', {
      hasResend: !!RESEND_KEY,
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY,
      hasAtUser: !!AT_USERNAME,
      hasAtKey: !!AT_API_KEY,
    });

    if (!RESEND_KEY)   { console.error('RESEND_API_KEY not set'); throw new Error('RESEND_API_KEY not set'); }
    if (!SUPABASE_URL) { console.error('SUPABASE_URL not set');   throw new Error('SUPABASE_URL not set'); }
    if (!SUPABASE_KEY) { console.error('SERVICE_ROLE_KEY not set'); throw new Error('SERVICE_ROLE_KEY not set'); }

    const payload = await req.json();
    console.log('[send-receipt] Raw payload keys:', Object.keys(payload));

    // Support both direct calls and Supabase DB webhook format
    const booking = payload.record || payload.booking || payload;
    console.log('[send-receipt] Booking ID:', booking?.id, '| Status:', booking?.status, '| User:', booking?.user_id);

    if (!booking?.id) {
      console.error('[send-receipt] No booking ID found in payload');
      return new Response(JSON.stringify({ error: 'No booking data provided' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Only send on completion
    if (booking.status && booking.status !== 'completed') {
      console.log(`[send-receipt] Skipping - status is "${booking.status}", not completed`);
      return new Response(JSON.stringify({ skipped: true, reason: 'Not completed yet' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    console.log('[send-receipt] Status is completed — proceeding to send receipt');

    // Fetch user email using service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(booking.user_id);
    if (userErr || !userData?.user?.email) {
      throw new Error(`Could not fetch user email: ${userErr?.message}`);
    }

    const customerEmail = userData.user.email;

    // Fetch profile for name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, fullName')
      .eq('id', booking.user_id)
      .maybeSingle();

    const customerName = profileData?.full_name || profileData?.fullName || customerEmail.split('@')[0];

    // Build and send email
    const html = buildEmailHtml(booking, customerName, customerEmail);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Fixera <onboarding@resend.dev>',
        to:      [customerEmail],
        subject: `✅ Your Fixera Receipt — ${booking.sub_service || booking.service_name || booking.service || 'Service'} Completed`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('[send-receipt] Resend error:', resendData);
      throw new Error(resendData?.message || 'Resend API error');
    }

    console.log(`[send-receipt] ✅ Email sent to ${customerEmail} for booking ${booking.id}`);

    // ── Send SMS via Africa's Talking ──
    let smsResult = null;
    if (AT_USERNAME && AT_API_KEY) {
      try {
        const service    = booking.sub_service || booking.service_name || booking.service || 'Home Service';
        const price      = Number(booking.price || 0);
        const receiptNo  = `FXR-${booking.id.slice(0, 8).toUpperCase()}`;

        // Get customer phone from profile
        const { data: profilePhone } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', booking.user_id)
          .maybeSingle();

        const customerPhone = profilePhone?.phone;

        if (customerPhone) {
          // Format phone for Africa's Talking (must start with +254)
          let phone = customerPhone.replace(/\s/g, '');
          if (phone.startsWith('0')) phone = '+254' + phone.slice(1);
          if (!phone.startsWith('+')) phone = '+254' + phone;

          const smsBody = `✅ Fixera Receipt\n${service} completed!\nReceipt: ${receiptNo}\nAmount: KSh ${price.toLocaleString()}\nThank you for choosing Fixera 🔧\nSupport: +254712008361`;

          const smsParams = new URLSearchParams({
            username: AT_USERNAME,
            to:       phone,
            message:  smsBody,
            from:     'Fixera',
          });

          const smsRes = await fetch('https://api.africastalking.com/version1/messaging', {
            method:  'POST',
            headers: {
              'apiKey':       AT_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept':       'application/json',
            },
            body: smsParams.toString(),
          });

          smsResult = await smsRes.json();
          console.log(`[send-receipt] ✅ SMS sent to ${phone}:`, JSON.stringify(smsResult));
        } else {
          console.log('[send-receipt] No phone number found for customer — skipping SMS');
        }
      } catch (smsErr: any) {
        // SMS failure should not block the email receipt
        console.error('[send-receipt] SMS error (non-fatal):', smsErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true, email: customerEmail, resend_id: resendData.id, sms: smsResult }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[send-receipt] Error:', e.message);
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
