// ============================================
// FIXERA EMAIL SERVICE (browser-safe)
// Builds transactional email templates and hands them to the
// /api/send-email serverless function, which does the actual
// SMTP sending with NodeMailer. NodeMailer can NOT run in the
// browser, and Gmail credentials must never ship in client code.
// ============================================
import { supabase } from '../supabase';
import { logNotification } from './pushService';

// Production URL for links in emails (falls back to current origin)
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL)
  || (typeof window !== 'undefined' ? window.location.origin : 'https://fixera.africa');

async function sendViaApi({ to, subject, html, fromName = 'Fixera', logMeta = {} }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ to, subject, html, fromName }),
    });
    if (!res.ok) throw new Error(`Email API responded ${res.status}`);
    logNotification({ channel: 'email', status: 'sent', title: subject, body: to, ...logMeta });
    return { success: true };
  } catch (error) {
    console.warn('📧 Email not sent (non-blocking):', error.message);
    logNotification({ channel: 'email', status: 'failed', title: subject, body: to, error: error.message, ...logMeta });
    return { success: false, error: error.message };
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const templates = {
  // Booking Confirmation Email
  bookingConfirmation: (customer, booking) => ({
    subject: `✅ Booking Confirmed - Fixera Service`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0A0E1A, #1a2f52); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #C9A020; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
          <p style="color: #ccc; margin: 8px 0 0 0;">Your service is booked with Fixera</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">

          <p style="color: #333; font-size: 16px; margin: 0 0 24px 0;">
            Hi <strong>${customer.full_name || 'Valued Customer'}</strong>,
          </p>

          <p style="color: #555; line-height: 1.6; margin: 0 0 24px 0;">
            Great news! Your booking has been confirmed. Here are the details:
          </p>

          <!-- Booking Details Card -->
          <div style="background: #f9f9f9; border-left: 4px solid #C9A020; padding: 20px; margin: 24px 0; border-radius: 6px;">
            <table style="width: 100%; color: #333; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Service:</td>
                <td style="padding: 10px 0; text-align: right;">${booking.service} - ${booking.sub_service}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Date:</td>
                <td style="padding: 10px 0; text-align: right;">${new Date(booking.booking_date).toLocaleDateString('en-KE')} at ${booking.booking_time}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Location:</td>
                <td style="padding: 10px 0; text-align: right;">${booking.address}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Worker:</td>
                <td style="padding: 10px 0; text-align: right;">${booking.worker_name || 'Assigned soon'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600;">Amount:</td>
                <td style="padding: 10px 0; text-align: right; font-size: 18px; color: #C9A020; font-weight: bold;">KSh ${booking.price || 'TBD'}</td>
              </tr>
            </table>
          </div>

          <!-- What's Next -->
          <div style="background: #f0f7ff; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #63B3ED;">
            <h4 style="color: #0A0E1A; margin: 0 0 8px 0;">📋 What's Next?</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin: 6px 0;">Your assigned professional will arrive at the scheduled time</li>
              <li style="margin: 6px 0;">You'll receive a notification 1 hour before arrival</li>
              <li style="margin: 6px 0;">Payment can be made via M-Pesa, Cash, or Card</li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/booking-history" style="background: linear-gradient(135deg, #C9A020, #D4B033); color: #0A0E1A; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Booking Details
            </a>
          </div>

          <!-- Support -->
          <p style="color: #999; font-size: 12px; margin: 32px 0 0 0; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
            Questions? Contact our support team via WhatsApp, call, or email.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 11px;">
          <p style="margin: 0;">© 2026 Fixera. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">This is an automated email. Please don't reply directly.</p>
        </div>
      </div>
    `,
  }),

  // Receipt Email
  receiptEmail: (customer, receipt) => ({
    subject: `📄 Receipt #${receipt.receipt_no} - Fixera Payment`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0A0E1A, #1a2f52); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #48BB78; margin: 0; font-size: 28px;">✅ Payment Received!</h1>
          <p style="color: #ccc; margin: 8px 0 0 0;">Receipt #${receipt.receipt_no}</p>
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">

          <p style="color: #333; font-size: 16px; margin: 0 0 24px 0;">
            Hi <strong>${customer.full_name || 'Valued Customer'}</strong>,
          </p>

          <p style="color: #555; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for your payment! Your receipt is attached below.
          </p>

          <!-- Receipt Details -->
          <div style="background: #f9f9f9; border-left: 4px solid #48BB78; padding: 20px; margin: 24px 0; border-radius: 6px;">
            <table style="width: 100%; color: #333; font-size: 14px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Service:</td>
                <td style="padding: 10px 0; text-align: right;">${receipt.service} - ${receipt.sub_service}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Worker:</td>
                <td style="padding: 10px 0; text-align: right;">${receipt.worker_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: 600;">Date:</td>
                <td style="padding: 10px 0; text-align: right;">${new Date(receipt.generated_at).toLocaleDateString('en-KE')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600; font-size: 16px;">Amount Paid:</td>
                <td style="padding: 10px 0; text-align: right; font-size: 18px; color: #48BB78; font-weight: bold;">KSh ${receipt.amount}</td>
              </tr>
            </table>
          </div>

          <!-- Status -->
          <div style="background: #f0fff4; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; border: 2px solid #48BB78;">
            <h4 style="color: #22543d; margin: 0;">✅ Payment Completed</h4>
            <p style="color: #48BB78; margin: 8px 0 0 0; font-weight: 600;">Thank you for using Fixera!</p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/booking-history" style="background: linear-gradient(135deg, #48BB78, #68D391); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Receipt
            </a>
          </div>

          <!-- Support -->
          <p style="color: #999; font-size: 12px; margin: 32px 0 0 0; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
            Any issues? Contact support immediately.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #999; font-size: 11px;">
          <p style="margin: 0;">© 2026 Fixera. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  // Support Ticket Confirmation
  supportTicketConfirmation: (user, ticket) => ({
    subject: `📋 Support Ticket #${ticket.id} - Fixera`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">

        <div style="background: linear-gradient(135deg, #0A0E1A, #1a2f52); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #63B3ED; margin: 0; font-size: 28px;">✅ Ticket Received</h1>
          <p style="color: #ccc; margin: 8px 0 0 0;">Reference: #${ticket.id}</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">

          <p style="color: #333; font-size: 16px; margin: 0 0 24px 0;">
            Hi <strong>${user.full_name || 'Valued Customer'}</strong>,
          </p>

          <p style="color: #555; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for contacting Fixera support. We've received your request and our team will review it shortly.
          </p>

          <div style="background: #f0f7ff; border-left: 4px solid #63B3ED; padding: 20px; margin: 24px 0; border-radius: 6px;">
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Ticket Reference:</strong> #${ticket.id}</p>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Category:</strong> ${ticket.category || 'Support'}</p>
            <p style="color: #333; margin: 0 0 8px 0;"><strong>Status:</strong> <span style="color: #63B3ED; font-weight: 600;">Open</span></p>
            <p style="color: #666; margin: 12px 0 0 0; font-size: 13px;">We typically respond within 24 hours.</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/support" style="background: linear-gradient(135deg, #63B3ED, #90CDF4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Track Your Ticket
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin: 32px 0 0 0; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
            Keep this reference number handy for future communication.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 11px;">
          <p style="margin: 0;">© 2026 Fixera. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  // Support Team Notification (internal)
  supportTeamNotification: (ticket, user) => ({
    subject: `🚨 NEW SUPPORT TICKET - ${ticket.category || 'Support'}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">

        <div style="background: #0A0E1A; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h2 style="color: #F6AD55; margin: 0;">🎫 New Support Ticket</h2>
        </div>

        <div style="background: white; padding: 20px; border-radius: 0 0 12px 12px;">

          <p style="color: #333; margin: 0 0 16px 0;"><strong>Ticket ID:</strong> #${ticket.id}</p>
          <p style="color: #333; margin: 0 0 16px 0;"><strong>From:</strong> ${user.full_name} (${user.email})</p>
          <p style="color: #333; margin: 0 0 16px 0;"><strong>Category:</strong> ${ticket.category || 'General'}</p>
          <p style="color: #333; margin: 0 0 16px 0;"><strong>Subject:</strong> ${ticket.subject}</p>

          <div style="background: #f9f9f9; border: 1px solid #eee; padding: 16px; margin: 16px 0; border-radius: 6px;">
            <p style="color: #555; margin: 0; white-space: pre-wrap; word-break: break-word;">${ticket.message}</p>
          </div>

          <p style="color: #666; font-size: 13px; margin: 0;">
            ⏰ Time: ${new Date().toLocaleString('en-KE')}
          </p>
        </div>
      </div>
    `,
  }),
};

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (customer, booking) => {
  const template = templates.bookingConfirmation(customer, booking);
  return sendViaApi({ to: customer.email, subject: template.subject, html: template.html, fromName: 'Fixera' });
};

/**
 * Send receipt email
 */
export const sendReceipt = async (customer, receipt) => {
  const template = templates.receiptEmail(customer, receipt);
  return sendViaApi({ to: customer.email, subject: template.subject, html: template.html, fromName: 'Fixera' });
};

/**
 * Send support ticket confirmation
 */
export const sendSupportTicketConfirmation = async (user, ticket) => {
  const template = templates.supportTicketConfirmation(user, ticket);
  return sendViaApi({ to: user.email, subject: template.subject, html: template.html, fromName: 'Fixera Support' });
};

/**
 * Notify support team of new ticket
 */
export const notifySupportTeam = async (ticket, user, supportTeamEmail) => {
  const template = templates.supportTeamNotification(ticket, user);
  return sendViaApi({ to: supportTeamEmail, subject: template.subject, html: template.html, fromName: 'Fixera System' });
};

export const sendTicketStatusUpdate = async (ticket, newStatus) => {
  if (!ticket.user_email) return { success: false };
  const STATUS_LABEL = { in_review: 'Under Review', in_progress: 'Resolution In Progress', resolved: 'Resolved', open: 'Reopened' };
  const STATUS_COLOR = { in_review: '#63B3ED', in_progress: '#C9A020', resolved: '#48BB78', open: '#F6AD55' };
  const label = STATUS_LABEL[newStatus] || newStatus;
  const color = STATUS_COLOR[newStatus] || '#C9A020';
  const isResolved = newStatus === 'resolved';
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:36px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:${color};margin:0;font-size:26px;">${isResolved ? '✅ Ticket Resolved' : '🔔 Ticket Update'}</h1>
        <p style="color:#ccc;margin:8px 0 0 0;">Your support ticket status has changed</p>
      </div>
      <div style="background:#fff;padding:30px;border-radius:0 0 12px 12px;">
        <p style="color:#333;font-size:15px;">Hi <strong>${ticket.user_name || 'Valued Customer'}</strong>,</p>
        <p style="color:#555;line-height:1.6;">Your support ticket has been updated to <strong style="color:${color}">${label}</strong>.</p>
        <div style="background:#f9f9f9;border-left:4px solid ${color};padding:16px 20px;margin:20px 0;border-radius:6px;">
          <p style="margin:0 0 6px 0;color:#333;font-size:13px;font-weight:600;">Ticket: ${ticket.subject || 'Support Request'}</p>
          <p style="margin:0;color:#777;font-size:12px;">Ref: #${ticket.id?.slice(0,8).toUpperCase()}</p>
        </div>
        ${ticket.admin_note ? `
        <div style="background:#e8f4fd;border-left:4px solid #63B3ED;padding:14px 18px;margin:16px 0;border-radius:6px;">
          <p style="margin:0 0 6px 0;color:#0A0E1A;font-size:12px;font-weight:700;">ADMIN RESPONSE</p>
          <p style="margin:0;color:#333;font-size:13px;line-height:1.6;">${ticket.admin_note}</p>
        </div>` : ''}
        ${isResolved ? `<p style="color:#555;font-size:13px;">If you are satisfied with the resolution, no further action is needed. If you have further concerns, please open a new ticket.</p>` : `<p style="color:#555;font-size:13px;">Our team is actively working on your ticket. You will receive another update when there's a change.</p>`}
        <div style="text-align:center;margin:24px 0;">
          <a href="${BASE_URL}/support" style="background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:14px;">View My Tickets</a>
        </div>
        <p style="color:#999;font-size:11px;margin:24px 0 0;text-align:center;border-top:1px solid #eee;padding-top:14px;">Fixera Support · support@fixera.africa · +254 712 008 361</p>
      </div>
    </div>`;
  return sendViaApi({ to: ticket.user_email, subject: `[Ticket Update] ${label} — ${ticket.subject || 'Your Support Request'}`, html, fromName: 'Fixera Support' });
};

/**
 * Test email (for debugging)
 */
export const sendTestEmail = async (recipientEmail) => {
  return sendViaApi({
    to: recipientEmail,
    subject: '🧪 Test Email from Fixera',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #0A0E1A;">✅ Email System Working!</h2>
        <p style="color: #555;">This is a test email from Fixera.</p>
        <p style="color: #999; font-size: 12px;">If you received this, the email service is configured correctly.</p>
      </div>
    `,
    fromName: 'Fixera',
  });
};

// ============================================
// PARTNER LIFECYCLE EMAILS
// ============================================
function partnerShell(title, accent, bodyHtml) {
  return `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:36px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:24px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:${accent};margin:10px 0 0;font-size:22px;">${title}</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 12px 12px;">${bodyHtml}</div>
      <div style="text-align:center;padding:20px;color:#999;font-size:11px;">© 2026 Fixera. All rights reserved.</div>
    </div>`;
}

export const sendPartnerWelcome = async (partner) => {
  const html = partnerShell('Welcome to Fixera 🎉', '#C9A020', `
    <p style="color:#333;font-size:16px;">Hi <strong>${partner.full_name || partner.business_name || 'Partner'}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Thank you for registering as a <strong>${(partner.partner_role||'partner').replace(/_/g,' ')}</strong> on Fixera!</p>
    <div style="background:#fff8e6;border-left:4px solid #C9A020;padding:16px;margin:20px 0;border-radius:6px;color:#555;font-size:14px;">
      <strong>What happens next:</strong>
      <ul style="margin:8px 0 0;padding-left:18px;">
        <li>Complete your onboarding & qualification checklist</li>
        <li>Accept the Partner Agreement</li>
        <li>Our team reviews your documents (24–48 hrs)</li>
        <li>Once approved, you start receiving jobs</li>
      </ul>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/login" style="background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Go to Partner App</a>
    </div>`);
  return sendViaApi({ to: partner.email, subject: '🎉 Welcome to Fixera — Partner Application Received', html, fromName: 'Fixera Partners' });
};

export const sendPartnerApproved = async (partner) => {
  const html = partnerShell('You’re Approved ✅', '#48BB78', `
    <p style="color:#333;font-size:16px;">Hi <strong>${partner.full_name || partner.business_name || 'Partner'}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Great news — your Fixera partner account has been <strong style="color:#48BB78;">approved</strong>. You can now go online and start receiving jobs.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/login" style="background:linear-gradient(135deg,#48BB78,#68D391);color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Start Working →</a>
    </div>`);
  return sendViaApi({ to: partner.email, subject: '✅ Your Fixera Partner Account is Approved', html, fromName: 'Fixera Partners' });
};

export const sendPartnerRejected = async (partner, reason) => {
  const html = partnerShell('Application Update', '#FC8181', `
    <p style="color:#333;font-size:16px;">Hi <strong>${partner.full_name || partner.business_name || 'Partner'}</strong>,</p>
    <p style="color:#555;line-height:1.6;">After reviewing your application, we're unable to approve your account at this time.</p>
    ${reason ? `<div style="background:#fff5f5;border-left:4px solid #FC8181;padding:16px;margin:20px 0;border-radius:6px;color:#555;font-size:14px;"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p style="color:#555;line-height:1.6;">You can update your details and re-apply, or contact support if you believe this is a mistake.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${BASE_URL}/support" style="background:#0A0E1A;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">Contact Support</a>
    </div>`);
  return sendViaApi({ to: partner.email, subject: 'Fixera Partner Application — Update', html, fromName: 'Fixera Partners' });
};

// ============================================
// DOCUMENT EMAIL (receipt / invoice / quotation)
// ============================================
export const sendDocumentEmail = async (toEmail, doc) => {
  if (!toEmail || !doc) return { success: false };
  const meta = {
    receipt:   { label: 'Receipt',   accent: '#48BB78', line: 'Total Paid' },
    invoice:   { label: 'Invoice',   accent: '#63B3ED', line: 'Amount Due' },
    quotation: { label: 'Quotation', accent: '#C9A020', line: 'Estimated Total' },
  }[doc.type] || { label: 'Document', accent: '#C9A020', line: 'Total' };

  const rows = (doc.items || []).map(it => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:8px 0;color:#333;">${it.name}${it.qty > 1 ? ` × ${it.qty}` : ''}</td>
      <td style="padding:8px 0;text-align:right;color:#333;">KSh ${Number((it.price||0)*(it.qty||1)).toLocaleString()}</td>
    </tr>`).join('');

  const html = `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:20px;">
      <div style="background:linear-gradient(135deg,#0A0E1A,#1a2f52);padding:34px 20px;text-align:center;border-radius:12px 12px 0 0;">
        <div style="color:#C9A020;font-size:22px;font-weight:800;letter-spacing:2px;">FIXERA</div>
        <h1 style="color:${meta.accent};margin:8px 0 0;font-size:20px;">${meta.label} ${doc.number}</h1>
      </div>
      <div style="background:white;padding:28px;border-radius:0 0 12px 12px;">
        <p style="color:#555;line-height:1.6;margin:0 0 16px;">
          Here is your ${meta.label.toLowerCase()} from <strong>${doc.partner?.name || 'your Fixera partner'}</strong>.
        </p>
        <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:8px;">${rows}</table>
        <div style="display:flex;justify-content:space-between;border-top:2px solid ${meta.accent};padding-top:10px;margin-top:6px;">
          <strong style="color:#333;">${meta.line}</strong>
          <strong style="color:${meta.accent};font-size:18px;">KSh ${Number(doc.total||0).toLocaleString()}</strong>
        </div>
        <div style="text-align:center;margin:24px 0 4px;">
          <a href="${BASE_URL}/documents" style="background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:600;display:inline-block;">View in App</a>
        </div>
        <p style="color:#999;font-size:11px;text-align:center;margin-top:18px;border-top:1px solid #eee;padding-top:14px;">
          Open the Fixera app → My Documents to download the PDF anytime.
        </p>
      </div>
      <div style="text-align:center;padding:18px;color:#999;font-size:11px;">© 2026 Fixera. All rights reserved.</div>
    </div>`;
  return sendViaApi({ to: toEmail, subject: `${meta.label} ${doc.number} — Fixera`, html, fromName: 'Fixera' });
};

export default { sendBookingConfirmation, sendReceipt, sendSupportTicketConfirmation, notifySupportTeam, sendTestEmail, sendPartnerWelcome, sendPartnerApproved, sendPartnerRejected, sendDocumentEmail };
