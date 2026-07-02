import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ChevronDown, Search, Flag, RefreshCw, Headphones, ClipboardList, HelpCircle, Phone, Zap, MessageCircle, Mail, CheckCircle2, BellOff, MessageSquare, Lightbulb, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { sendSupportTicketConfirmation, notifySupportTeam } from '../../services/emailService';
import { CUSTOMER_CATEGORIES, REFUND_REASONS, deptMeta, findCategory } from '../../data/supportCategories';

import { useCL } from '../../hooks/useCL';

const OPTIONS = [
  { Icon: Flag,          label: 'Report an Issue',   sub: 'Tell us about a problem with your service', color: '#E24B4A'  },
  { Icon: RefreshCw,     label: 'Request a Refund',  sub: 'Submit a refund request for your booking',  color: '#E07B2A'  },
  { Icon: Headphones,    label: 'Contact Support',   sub: 'Chat or call our support team directly',     color: '#2F7FD1'  },
  { Icon: ClipboardList, label: 'Track a Complaint', sub: 'Check the status of a filed complaint',      color: '#1E9E5A'  },
  { Icon: HelpCircle,    label: 'FAQ',               sub: 'Find answers to common questions',            color: '#C9A020'  },
];

const FAQS = [
  { q: 'How do I cancel a booking?',       a: 'Go to Bookings → select the booking → tap Cancel. Free cancellation up to 2 hours before the appointment.' },
  { q: 'How long does a refund take?',      a: 'Refunds are processed within 3–5 business days back to your original payment method.' },
  { q: 'Can I change my assigned worker?',  a: 'Yes. Open the booking and tap "Request different professional" before the worker arrives.' },
  { q: 'What areas do you cover?',          a: 'We currently cover Nairobi and its environs. More cities coming soon!' },
  { q: 'How are workers vetted?',           a: 'All professionals go through background checks, skills tests, and a trial period before joining Fixera.' },
];

const STATUS_STEPS = ['open', 'in_review', 'in_progress', 'resolved'];
const STATUS_LABEL = { open: 'Received', in_review: 'Under Review', in_progress: 'In Progress', resolved: 'Resolved' };
const STATUS_COLOR = { open: '#E07B2A', in_review: '#2F7FD1', in_progress: '#C9A020', resolved: '#1E9E5A' };

function DeptBadge({ deptId }) {
  const CL = useCL();
  const d = deptMeta(deptId);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: d.color + '10', border: `1px solid ${d.color}30`, borderRadius: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: d.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: d.color, fontSize: 12, fontWeight: 800 }}>{(d.name || 'Ops').slice(0, 2).toUpperCase()}</span>
      </div>
      <div>
        <div style={{ color: d.color, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>{d.name.toUpperCase()}</div>
        <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Responds {d.sla_label}</div>
      </div>
    </div>
  );
}

function SuccessView({ Icon, iconColor, title, sub, onTrack }) {
  const CL = useCL();
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: (iconColor || CL.success) + '15', border: `1px solid ${(iconColor || CL.success)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        {Icon && <Icon size={28} color={iconColor || CL.success} strokeWidth={1.8} />}
      </div>
      <div style={{ color: iconColor || CL.success, fontSize: 19, fontWeight: 800 }}>{title}</div>
      <div style={{ color: CL.muted, fontSize: 13, marginTop: 10, lineHeight: 1.65, maxWidth: 280, margin: '10px auto 0' }}>{sub}</div>
      {onTrack && (
        <button onClick={onTrack} style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.gold}40`, color: CL.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Search size={14} /> Track My Ticket
        </button>
      )}
    </div>
  );
}

function Panel({ opt, onClose, setActive }) {
  const CL = useCL();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [category, setCategory]   = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [text, setText]           = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundRef, setRefundRef] = useState('');
  const [refInput, setRefInput]   = useState('');
  const [tickets, setTickets]     = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError]     = useState('');
  const [searched, setSearched]   = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const copySupportEmail = async () => {
    const addr = 'support@fixera.africa';
    // Always copy (guarantees a non-dead tap on desktop without a mail client)
    try { await navigator.clipboard.writeText(addr); } catch { /* clipboard blocked — mailto below still helps */ }
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
    // Also open the device's mail app if one exists (mobile / desktop with a client)
    window.location.href = `mailto:${addr}?subject=Fixera%20Support%20Request`;
  };

  const selectedCat = findCategory(category);

  useEffect(() => {
    if (opt.label === 'Track a Complaint' && user && !searched) searchTickets();
  }, [opt.label, user]);

  const searchTickets = async () => {
    setTicketLoading(true); setTicketError(''); setSearched(true);
    try {
      if (!user) { setTicketError('Please sign in to track your tickets.'); setTicketLoading(false); return; }
      // Always scope to the current user — prevents leaking other users' tickets via search
      let query = supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (refInput.trim()) query = query.or(`id.ilike.%${refInput.trim()}%,subject.ilike.%${refInput.trim()}%`);
      const { data, error } = await query.limit(10);
      if (error) throw error;
      setTickets(data || []);
    } catch { setTicketError('Could not load tickets. Please try again.'); }
    setTicketLoading(false);
  };

  const submitTicket = async ({ subject, message, catValue, dept, pri }) => {
    setSaving(true);
    try {
      const { data: ticket, error } = await supabase.from('support_tickets').insert({
        user_id: user?.id, user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        user_email: user?.email, user_type: 'customer', category: catValue, department: dept,
        priority: pri, subject, message, status: 'open',
      }).select().single();
      if (error) throw error;
      if (user?.email) {
        const ud = { email: user.email, full_name: user.user_metadata?.full_name || user.email.split('@')[0] };
        await sendSupportTicketConfirmation(ud, { id: ticket.id, category: catValue, subject, message });
        await notifySupportTeam(ticket, ud, 'support@fixera.africa');
      }
      setSubmitted(true);
    } catch (err) { console.error(err); alert('Error submitting ticket. Please try again.'); }
    setSaving(false);
  };

  const handleReportSubmit = () => {
    if (!category || !text.trim()) return;
    const cat = findCategory(category);
    submitTicket({ subject: cat?.label?.replace(/^[^\w]*/, '') || 'Service Issue', message: bookingRef.trim() ? `Booking ref: ${bookingRef}\n\n${text.trim()}` : text.trim(), catValue: category, dept: cat?.department || 'operations', pri: cat?.priority || 'normal' });
  };

  const handleRefundSubmit = () => {
    if (!refundReason) return;
    const reason = REFUND_REASONS.find(r => r.value === refundReason);
    submitTicket({ subject: 'Refund Request', message: refundRef.trim() ? `Booking ref: ${refundRef}\nReason: ${reason?.label || refundReason}` : `Reason: ${reason?.label || refundReason}`, catValue: 'refund_request', dept: 'finance', pri: 'high' });
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 11, padding: '11px 14px', color: CL.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,22,40,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, background: CL.bg, borderRadius: '24px 24px 0 0', padding: '24px 22px 36px', maxHeight: '88vh', overflowY: 'auto' }}>

        {/* Sheet handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: CL.border, margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: opt.color + '15', border: `1px solid ${opt.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <opt.Icon size={20} color={opt.color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>{opt.label}</div>
              <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{opt.sub}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Report an Issue ── */}
        {opt.label === 'Report an Issue' && (
          submitted ? <SuccessView Icon={CheckCircle2} iconColor={CL.success} title="Report Submitted!" sub="We'll review your issue and respond based on priority." onTrack={() => setActive(OPTIONS.find(o => o.label === 'Track a Complaint'))} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: CL.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>What's the issue?</div>
              {CUSTOMER_CATEGORIES.filter(c => c.value !== 'refund_request').map(cat => (
                <div key={cat.value} onClick={() => setCategory(cat.value)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: category === cat.value ? CL.goldSoft : CL.surface, border: `1px solid ${category === cat.value ? CL.gold + '60' : CL.border}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.12s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${category === cat.value ? CL.gold : CL.border}`, background: category === cat.value ? CL.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {category === cat.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{cat.label}</div>
                    <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>{cat.desc}</div>
                  </div>
                  {cat.priority === 'urgent' && <span style={{ fontSize: 9, fontWeight: 800, color: CL.error, background: CL.errorBg, padding: '2px 7px', borderRadius: 6, border: `1px solid ${CL.error}30`, whiteSpace: 'nowrap' }}>URGENT</span>}
                </div>
              ))}
              {selectedCat && <DeptBadge deptId={selectedCat.department} />}
              <input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="Booking reference (optional)" style={inputStyle} />
              <textarea placeholder="Describe the issue in detail…" value={text} onChange={e => setText(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
              <button onClick={handleReportSubmit} disabled={!category || !text.trim() || saving}
                style={{ padding: '14px', borderRadius: 12, background: category && text.trim() ? CL.navy : CL.border, border: 'none', color: category && text.trim() ? '#fff' : CL.light, fontSize: 14, fontWeight: 700, cursor: category && text.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          )
        )}

        {/* ── Request a Refund ── */}
        {opt.label === 'Request a Refund' && (
          submitted ? <SuccessView Icon={RefreshCw} iconColor="#E07B2A" title="Refund Requested!" sub="Your refund will be reviewed by our Finance team within 24 hours." onTrack={() => setActive(OPTIONS.find(o => o.label === 'Track a Complaint'))} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DeptBadge deptId="finance" />
              <input value={refundRef} onChange={e => setRefundRef(e.target.value)} placeholder="Booking reference (optional)" style={inputStyle} />
              <div style={{ color: CL.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>Reason for refund</div>
              {REFUND_REASONS.map(r => (
                <div key={r.value} onClick={() => setRefundReason(r.value)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: refundReason === r.value ? CL.goldSoft : CL.surface, border: `1px solid ${refundReason === r.value ? CL.gold + '60' : CL.border}`, borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${refundReason === r.value ? CL.gold : CL.border}`, background: refundReason === r.value ? CL.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {refundReason === r.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ color: CL.text, fontSize: 13 }}>{r.label}</span>
                </div>
              ))}
              <button onClick={handleRefundSubmit} disabled={!refundReason || saving}
                style={{ padding: '14px', borderRadius: 12, background: refundReason ? CL.navy : CL.border, border: 'none', color: refundReason ? '#fff' : CL.light, fontSize: 14, fontWeight: 700, cursor: refundReason ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1, fontFamily: 'inherit', marginTop: 4 }}>
                {saving ? 'Submitting…' : 'Submit Refund Request'}
              </button>
            </div>
          )
        )}

        {/* ── Contact Support ── */}
        {opt.label === 'Contact Support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '13px 15px', background: CL.successBg, border: `1px solid ${CL.success}30`, borderRadius: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: CL.success + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={17} color={CL.success} strokeWidth={2} />
              </div>
              <div>
                <div style={{ color: CL.success, fontSize: 13, fontWeight: 800 }}>Fast Support</div>
                <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>WhatsApp: ~2 min · Call: Instant · Email: 2 hrs</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { LIcon: MessageCircle, label: 'WhatsApp', sub: 'Chat with us', detail: '~2 min reply', color: '#25D366', href: 'https://wa.me/254712008361?text=Hi%20Fixera%20Support%2C%20I%20need%20help.' },
                { LIcon: Phone,         label: 'Call Us',  sub: '24/7 Available', detail: '+254 712 008 361', color: CL.success, href: 'tel:+254712008361' },
              ].map(c => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, padding: '18px 10px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, textDecoration: 'none', transition: 'border-color 0.15s' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 15, background: c.color + '15', border: `1px solid ${c.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <c.LIcon size={24} color={c.color} strokeWidth={1.7} />
                  </div>
                  <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>{c.label}</div>
                  <div style={{ color: CL.muted, fontSize: 11 }}>{c.sub}</div>
                  <div style={{ color: c.color, fontSize: 11, fontWeight: 700 }}>{c.detail}</div>
                </a>
              ))}
            </div>
            <button onClick={copySupportEmail} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: CL.surface, border: `1px solid ${emailCopied ? CL.success + '60' : CL.border}`, borderRadius: 14, transition: 'border-color 0.15s' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: emailCopied ? CL.success + '18' : CL.goldSoft, border: `1px solid ${emailCopied ? CL.success + '30' : CL.gold + '25'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {emailCopied ? <CheckCircle2 size={20} color={CL.success} strokeWidth={2} /> : <Mail size={20} color={CL.gold} strokeWidth={1.8} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Email Support</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>support@fixera.africa</div>
              </div>
              <span style={{ color: emailCopied ? CL.success : CL.gold, fontSize: 12, fontWeight: 700, background: emailCopied ? CL.success + '18' : CL.goldSoft, padding: '5px 12px', borderRadius: 20, border: `1px solid ${emailCopied ? CL.success + '30' : CL.gold + '30'}` }}>{emailCopied ? 'Copied ✓' : 'Copy'}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: CL.border }} />
              <span style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FOLLOW US</span>
              <div style={{ flex: 1, height: 1, background: CL.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { initials: 'IG', label: 'Instagram', handle: '@fixera.ke',    color: '#E1306C', href: 'https://instagram.com/fixera.ke' },
                { initials: 'TT', label: 'TikTok',    handle: '@fixera.ke',    color: '#fe2c55', href: 'https://tiktok.com/@fixera.ke' },
                { initials: 'TG', label: 'Telegram',  handle: 't.me/fixerake', color: '#2AABEE', href: 'https://t.me/fixerake' },
                { initials: 'FB', label: 'Facebook',  handle: 'Fixera Kenya',  color: '#1877F2', href: 'https://facebook.com/fixerakenya' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, textDecoration: 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + '15', border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: s.color, fontSize: 11, fontWeight: 800 }}>{s.initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: CL.text, fontSize: 12, fontWeight: 700 }}>{s.label}</div>
                    <div style={{ color: s.color, fontSize: 10, marginTop: 1, fontWeight: 600 }}>{s.handle}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Track a Complaint ── */}
        {opt.label === 'Track a Complaint' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 9 }}>
              <input value={refInput} onChange={e => setRefInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchTickets()} placeholder="Reference ID or keyword…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={searchTickets} disabled={ticketLoading} style={{ padding: '11px 14px', borderRadius: 11, background: CL.navy, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: ticketLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: ticketLoading ? 0.7 : 1, display: 'flex', alignItems: 'center' }}>
                {ticketLoading ? '…' : <Search size={16} />}
              </button>
            </div>
            {!searched && user && (
              <button onClick={searchTickets} style={{ padding: '11px', borderRadius: 11, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, color: CL.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <ClipboardList size={15} /> Load My Support Tickets
              </button>
            )}
            {ticketError && (
              <div style={{ background: CL.errorBg, border: `1px solid ${CL.error}30`, borderRadius: 11, padding: '11px 14px', color: CL.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} strokeWidth={2} /> {ticketError}
              </div>
            )}
            {searched && !ticketLoading && tickets !== null && (
              tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <BellOff size={44} color={CL.border} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>No tickets found</div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 6 }}>Try a different reference ID, or open a new support ticket.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tickets.map(ticket => {
                    const stepIdx = STATUS_STEPS.indexOf(ticket.status);
                    const color   = STATUS_COLOR[ticket.status] || CL.gold;
                    const created = new Date(ticket.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
                    const dept    = ticket.department ? deptMeta(ticket.department) : null;
                    return (
                      <div key={ticket.id} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${CL.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div>
                              <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 3 }}>{ticket.subject || 'Support Request'}</div>
                              <div style={{ color: CL.light, fontSize: 11, fontWeight: 600 }}>
                                #{ticket.id.slice(0, 8).toUpperCase()} · {created}
                                {dept && <span style={{ color: dept.color }}> · {dept.icon} {dept.name}</span>}
                              </div>
                            </div>
                            <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: color + '15', border: `1px solid ${color}35`, color, whiteSpace: 'nowrap' }}>
                              {STATUS_LABEL[ticket.status] || ticket.status}
                            </div>
                          </div>
                          {ticket.message && <div style={{ color: CL.muted, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{ticket.message.length > 120 ? ticket.message.slice(0, 120) + '…' : ticket.message}</div>}
                        </div>
                        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', background: CL.bg }}>
                          {STATUS_STEPS.map((step, i) => {
                            const done = i <= stepIdx; const current = i === stepIdx;
                            return (
                              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: done ? color : CL.surface, border: `2px solid ${done ? color : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? '#fff' : CL.light, fontSize: 10, fontWeight: 800, boxShadow: current ? `0 0 0 3px ${color}25` : 'none' }}>
                                    {done ? (current ? i + 1 : '✓') : i + 1}
                                  </div>
                                  <div style={{ color: done ? color : CL.light, fontSize: 8, fontWeight: done ? 700 : 500, textAlign: 'center', width: 50, lineHeight: 1.2 }}>{STATUS_LABEL[step]}</div>
                                </div>
                                {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: done && i < stepIdx ? color + '50' : CL.border, margin: '0 3px', marginBottom: 18 }} />}
                              </div>
                            );
                          })}
                        </div>
                        {ticket.admin_note && (
                          <div style={{ margin: '0 14px 14px', padding: '10px 13px', background: '#E8F1FB', border: '1px solid #2F7FD130', borderRadius: 10 }}>
                            <div style={{ color: '#2F7FD1', fontSize: 11, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}><MessageSquare size={11} strokeWidth={2} /> ADMIN RESPONSE</div>
                            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.5 }}>{ticket.admin_note}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
            {!searched && (
              <div style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 11, padding: '12px 14px', display: 'flex', gap: 10 }}>
                <Lightbulb size={15} color={CL.gold} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.65 }}>
                  Enter your ticket reference to track a specific complaint, or tap <strong style={{ color: CL.gold }}>Load My Support Tickets</strong> to see all your tickets.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FAQ ── */}
        {opt.label === 'FAQ' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: CL.surface, border: `1px solid ${openFaq === i ? CL.gold + '50' : CL.border}`, borderRadius: 12, overflow: 'hidden', borderLeft: openFaq === i ? `3px solid ${CL.gold}` : '3px solid transparent' }}>
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ color: CL.text, fontSize: 13, fontWeight: 600, flex: 1, paddingRight: 10, lineHeight: 1.4 }}>{faq.q}</div>
                  <ChevronDown size={15} color={openFaq === i ? CL.gold : CL.light} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {openFaq === i && <div style={{ padding: '0 16px 14px', color: CL.muted, fontSize: 13, lineHeight: 1.7, borderTop: `1px solid ${CL.border}`, paddingTop: 12 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SupportPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Support Center</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>We're here to help 24/7</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 18px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Headphones size={32} color={CL.gold} strokeWidth={1.6} />
          </div>
          <div style={{ color: CL.text, fontSize: 20, fontWeight: 800 }}>How can we help?</div>
          <div style={{ color: CL.muted, fontSize: 13, marginTop: 6 }}>Our team is available 24/7 to assist you</div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {OPTIONS.map(opt => (
            <div key={opt.label} onClick={() => setActive(opt)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color + '50'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,22,40,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: opt.color + '12', border: `1px solid ${opt.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <opt.Icon size={20} color={opt.color} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{opt.sub}</div>
              </div>
              <span style={{ color: opt.color, fontSize: 16, fontWeight: 700 }}>→</span>
            </div>
          ))}
        </div>

        {/* Emergency hotline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CL.errorBg, border: `1px solid ${CL.error}30`, borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: CL.error + '18', border: `1px solid ${CL.error}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={18} color={CL.error} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ color: CL.error, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>Emergency Hotline</div>
              <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginTop: 2, letterSpacing: 0.3 }}>+254 712 008 361</div>
            </div>
          </div>
          <a href="tel:+254712008361" style={{ padding: '9px 16px', borderRadius: 10, background: CL.error, color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>Call Now</a>
        </div>
      </div>

      {active && <Panel opt={active} onClose={() => setActive(null)} setActive={setActive} />}
    </div>
  );
}
