// Partner-app email helper. Posts to /api/send-email (serverless, NodeMailer).
// Non-blocking — never throws into the signup flow.
import { supabase } from '../supabase';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL)
  || (typeof window !== 'undefined' ? window.location.origin : 'https://partner.fixera.africa');

async function send({ to, subject, html, fromName = 'Fixera Partners' }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('📧 partner email not sent — no active session yet (non-blocking)');
      return { success: false };
    }
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ to, subject, html, fromName }),
    });
    return { success: res.ok };
  } catch (e) {
    console.warn('📧 partner email not sent (non-blocking):', e.message);
    return { success: false };
  }
}

export async function sendStatementEmail(partner, statement) {
  if (!partner?.email) return;
  const t = statement.totals || {};
  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:34px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:22px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:#48BB78;margin:8px 0 0;font-size:20px;">Earnings Statement</h1>
        <p style="color:#ccc;margin:6px 0 0;font-size:13px;">${statement.periodLabel || 'All time'}</p>
      </div>
      <div style="background:white;padding:28px;border-radius:0 0 12px 12px;">
        <p style="color:#555;line-height:1.6;margin:0 0 16px;">Hi <strong>${statement.partnerName || 'Partner'}</strong>, here is your Fixera earnings summary.</p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#555;">Gross earnings</td><td style="padding:8px 0;text-align:right;color:#333;">KSh ${num(t.gross)}</td></tr>
          <tr style="border-bottom:1px solid #eee;"><td style="padding:8px 0;color:#555;">Fixera commission</td><td style="padding:8px 0;text-align:right;color:#F6AD55;">- KSh ${num(t.commission)}</td></tr>
          <tr><td style="padding:10px 0;color:#333;font-weight:700;">Net earnings</td><td style="padding:10px 0;text-align:right;color:#48BB78;font-weight:800;font-size:18px;">KSh ${num(t.net)}</td></tr>
        </table>
        <div style="text-align:center;margin:24px 0 4px;">
          <a href="${BASE_URL}/earnings" style="background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Open Earnings</a>
        </div>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:16px;border-top:1px solid #eee;padding-top:14px;">Open the Fixera Partner app → Earnings to download the full PDF statement.</p>
      </div>
      <div style="text-align:center;padding:18px;color:#999;font-size:11px;">© 2026 Fixera. All rights reserved.</div>
    </div>`;
  return send({ to: partner.email, subject: `Your Fixera Earnings Statement — ${statement.periodLabel || 'All time'}`, html });
}
function num(n) { return Number(n || 0).toLocaleString(); }

// Sent to the PARTNER — confirms their support ticket was received.
export async function sendPartnerTicketConfirmation(partner, ticket) {
  if (!partner?.email) return { success: false };
  const ref = ticket.id ? `#${String(ticket.id).slice(0, 8).toUpperCase()}` : '';
  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:34px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:22px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:#C9A020;margin:8px 0 0;font-size:20px;">We've got your request</h1>
      </div>
      <div style="background:white;padding:28px;border-radius:0 0 12px 12px;">
        <p style="color:#333;font-size:15px;margin:0 0 12px;">Hi <strong>${partner.full_name || 'Partner'}</strong>,</p>
        <p style="color:#555;line-height:1.6;margin:0 0 16px;">Your support ticket ${ref ? `<strong>${ref}</strong> ` : ''}has been received. Our team will review it and get back to you.</p>
        <div style="background:#f8f9fb;border:1px solid #eee;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#555;">
          <div style="margin-bottom:6px;"><strong>Subject:</strong> ${ticket.subject || '—'}</div>
          <div><strong>Category:</strong> ${ticket.categoryLabel || ticket.category || '—'}</div>
        </div>
        <p style="color:#555;line-height:1.6;margin:0;">You can track the status anytime in the Partner app under <strong>Support → My Tickets</strong>.</p>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:20px;border-top:1px solid #eee;padding-top:14px;">Fixera Partner Support · partner@fixera.africa</p>
      </div>
      <div style="text-align:center;padding:18px;color:#999;font-size:11px;">© 2026 Fixera. All rights reserved.</div>
    </div>`;
  return send({ to: partner.email, subject: `Support ticket received ${ref}`.trim(), html });
}

// Sent to the TEAM inbox — alerts you a partner opened a ticket.
export async function notifyPartnerSupportTeam(ticket, partner) {
  const ref = ticket.id ? `#${String(ticket.id).slice(0, 8).toUpperCase()}` : '';
  const urgent = ticket.priority === 'urgent';
  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:${urgent ? '#7f1d1d' : 'linear-gradient(135deg,#0A0E1A,#1a2f52)'};padding:26px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:20px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:#fff;margin:6px 0 0;font-size:17px;">${urgent ? '🚨 URGENT ' : ''}New Partner Ticket ${ref}</h1>
      </div>
      <div style="background:white;padding:26px;border-radius:0 0 12px 12px;font-size:14px;color:#555;line-height:1.7;">
        <div><strong>From:</strong> ${partner?.full_name || 'Partner'} (${partner?.email || 'no email'})</div>
        <div><strong>Role:</strong> ${ticket.userType || '—'}</div>
        <div><strong>Category:</strong> ${ticket.categoryLabel || ticket.category || '—'}</div>
        <div><strong>Priority:</strong> ${ticket.priority || 'normal'}</div>
        <div><strong>Subject:</strong> ${ticket.subject || '—'}</div>
        ${ticket.bookingId ? `<div><strong>Booking:</strong> ${ticket.bookingId}</div>` : ''}
        <div style="background:#f8f9fb;border:1px solid #eee;border-radius:8px;padding:14px;margin-top:12px;white-space:pre-wrap;color:#333;">${(ticket.message || '').replace(/</g, '&lt;')}</div>
        <p style="color:#999;font-size:11px;margin-top:16px;">Manage this ticket in the Admin Dashboard → Support.</p>
      </div>
    </div>`;
  return send({ to: 'partner@fixera.africa', subject: `${urgent ? '[URGENT] ' : ''}Partner ticket ${ref} — ${ticket.subject || 'New'}`, html });
}

export async function sendWelcomeEmail(partner) {
  if (!partner?.email) return;
  const name = partner.full_name || partner.business_name || 'Partner';
  const role = (partner.partner_role || 'partner').replace(/_/g, ' ');
  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:36px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:24px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:#C9A020;margin:10px 0 0;font-size:22px;">Welcome aboard 🎉</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 12px 12px;">
        <p style="color:#333;font-size:16px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#555;line-height:1.6;">Thank you for joining Fixera as a <strong>${role}</strong>. Your application has been received.</p>
        <div style="background:#fff8e6;border-left:4px solid #C9A020;padding:16px;margin:20px 0;border-radius:6px;color:#555;font-size:14px;">
          <strong>Next steps:</strong>
          <ul style="margin:8px 0 0;padding-left:18px;">
            <li>Confirm your email (check your inbox)</li>
            <li>Complete onboarding & accept the Partner Agreement</li>
            <li>Our team verifies your documents (24–48 hrs)</li>
            <li>Once approved, you start receiving jobs</li>
          </ul>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${BASE_URL}/login" style="background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Open Partner App</a>
        </div>
      </div>
      <div style="text-align:center;padding:20px;color:#999;font-size:11px;">© 2026 Fixera. All rights reserved.</div>
    </div>`;
  return send({ to: partner.email, subject: '🎉 Welcome to Fixera — Application Received', html });
}
