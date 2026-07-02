// Vercel serverless function — sends announcement email to all targeted users
// POST /api/broadcast-announcement
// Requires admin JWT (Authorization: Bearer <token>)
// Body: { announcementId, title, body, type, target }

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// ── Inline admin auth (CJS-compatible, mirrors api/_auth.js) ──
async function requireAdmin(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return { user, supabase };
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const TYPE_COLORS = {
  info:        '#4A90D9',
  warning:     '#E69900',
  promotion:   '#C9A020',
  maintenance: '#718096',
};

const TYPE_ICONS = {
  info:        'ℹ️',
  warning:     '⚠️',
  promotion:   '🎉',
  maintenance: '🔧',
};

const TYPE_LABELS = {
  info:        'Announcement',
  warning:     'Important Notice',
  promotion:   'Special Offer',
  maintenance: 'Maintenance Notice',
};

async function fetchTargetEmails(target) {
  const customerTargets = ['all', 'customers'];
  const partnerTargets  = ['all', 'partners', 'worker', 'rider', 'vendor', 'supplier', 'mover', 'water_carrier'];

  let emails = [];

  if (customerTargets.includes(target)) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', false)
      .not('email', 'is', null);
    if (data) emails = [...emails, ...data.map(p => ({ name: p.full_name || 'Valued Customer', email: p.email }))];
  }

  if (partnerTargets.includes(target) && target !== 'customers') {
    let q = supabaseAdmin.from('workers').select('full_name, email, partner_role');
    if (!['all', 'partners'].includes(target)) {
      q = q.eq('partner_role', target);
    }
    const { data } = await q.not('email', 'is', null);
    if (data) emails = [...emails, ...data.map(w => ({ name: w.full_name || 'Partner', email: w.email }))];
  }

  const seen = new Set();
  return emails.filter(e => {
    if (!e.email || seen.has(e.email)) return false;
    seen.add(e.email);
    return true;
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(to, name, { title, body, type }) {
  const color     = TYPE_COLORS[type] || '#4A90D9';
  const icon      = TYPE_ICONS[type]  || 'ℹ️';
  const label     = TYPE_LABELS[type] || 'Announcement';
  const safeTitle = escapeHtml(title);
  const safeBody  = escapeHtml(body).replace(/\n/g, '<br>');

  return {
    from:    `"Fixera" <${process.env.GMAIL_EMAIL}>`,
    to,
    subject: `${icon} ${safeTitle} — Fixera`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Nunito',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#0A0E1A,#1A2035);padding:28px 36px;">
          <table width="100%"><tr>
            <td><span style="color:#C9A020;font-size:22px;font-weight:900;letter-spacing:2px;">FIXERA</span></td>
            <td align="right"><span style="background:${color}22;color:${color};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;border:1px solid ${color}44;">${icon} ${label.toUpperCase()}</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <div style="background:${color}10;border-left:4px solid ${color};border-radius:0 10px 10px 0;padding:20px 24px;margin-bottom:24px;">
            <div style="font-size:22px;font-weight:900;color:#0A0E1A;margin-bottom:10px;">${icon} ${safeTitle}</div>
            <div style="font-size:15px;color:#4a5568;line-height:1.7;">${safeBody}</div>
          </div>
          <p style="font-size:14px;color:#718096;margin:0;">Hi ${name}, this is an official announcement from the Fixera team.</p>
        </td></tr>
        <tr><td style="padding:0 36px 32px;" align="center">
          <a href="${process.env.VITE_APP_URL || 'https://fixera-web.vercel.app'}"
             style="display:inline-block;background:linear-gradient(135deg,#C9A020,#D4B033);color:#0A0E1A;font-weight:900;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
            Open Fixera App →
          </a>
        </td></tr>
        <tr><td style="background:#f8f9fc;padding:20px 36px;border-top:1px solid #e3e6f0;" align="center">
          <p style="font-size:12px;color:#a0aec0;margin:0;">© ${new Date().getFullYear()} Fixera · Nairobi, Kenya</p>
          <p style="font-size:11px;color:#a0aec0;margin:6px 0 0;">You received this because you have a Fixera account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Require admin JWT — only authenticated admins can broadcast
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { announcementId, title, body, type, target } = req.body || {};
  if (!title || !body || !target) return res.status(400).json({ error: 'title, body and target required' });

  try {
    const recipients = await fetchTargetEmails(target);
    if (recipients.length === 0) return res.json({ sent: 0, message: 'No recipients found for this target' });

    let sent = 0;
    let failed = 0;

    const BATCH = 10;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async r => {
          try {
            await transporter.sendMail(buildEmail(r.email, r.name, { title, body, type }));
            sent++;
          } catch {
            failed++;
          }
        })
      );
      if (i + BATCH < recipients.length) await new Promise(r => setTimeout(r, 500));
    }

    res.json({ sent, failed, total: recipients.length });
  } catch (err) {
    console.error('Broadcast error:', err);
    console.error('[broadcast-announcement]', err.message);
    res.status(500).json({ error: 'Broadcast failed. Please try again.' });
  }
};
