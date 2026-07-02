import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { categoriesForRole, findCategory, departmentMeta } from '../../data/supportCategories';
import { sendPartnerTicketConfirmation, notifyPartnerSupportTeam } from '../../services/partnerEmailService';
import { AGREEMENT_VERSION } from '../../data/partnerAgreements';
import { Headphones, Phone, MessageCircle, Mail, ClipboardList, Scale, Plus, Shield, CheckCircle2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  purple: '#8B5CF6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
};

const STATUS_COLOR = {
  open:        { bg: CL.blueSoft,  color: CL.blue,  label: 'Open' },
  in_progress: { bg: '#FFFBEB',    color: '#F59E0B', label: 'In Progress' },
  resolved:    { bg: CL.greenSoft, color: CL.green,  label: 'Resolved' },
  closed:      { bg: '#F9FAFB',    color: CL.muted,  label: 'Closed' },
};

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

export default function SupportPage() {
  const { user, profile } = useAuth();
  const navigate   = useNavigate();
  const w          = useWindowWidth();
  const role       = profile?.partner_role || 'worker';
  const CATEGORIES = categoriesForRole(role);

  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('list');
  const [selected, setSelected]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', message: '', booking_id: '' });
  const [emailCopied, setEmailCopied] = useState(false);

  const copySupportEmail = async () => {
    const addr = 'support@fixera.africa';
    // Always copy (guarantees a non-dead tap on desktop without a mail client)
    try { await navigator.clipboard.writeText(addr); } catch { /* clipboard blocked — mailto below still helps */ }
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
    // Also open the device's mail app if one exists (mobile / desktop with a client)
    window.location.href = `mailto:${addr}?subject=Fixera%20Partner%20Support`;
  };

  // Responsive breakpoints
  const isTablet  = w >= 768;
  const isDesktop = w >= 1100;
  const isLarge   = w >= 1440;
  const isXL      = w >= 1920;

  // Layout values
  const pagePad   = isXL ? '48px 120px' : isLarge ? '40px 64px' : isDesktop ? '32px 40px' : isTablet ? '28px 32px' : '20px 16px';
  const innerMax  = isDesktop ? '100%' : isTablet ? '800px' : '100%';
  const sideW     = isXL ? 420 : isLarge ? 380 : 340;
  const catCols   = isLarge ? 4 : isDesktop ? 3 : 2;

  useEffect(() => { fetchTickets(); }, [user]);

  async function fetchTickets() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      const cat = findCategory(role, form.category);
      const { data: ticket } = await supabase.from('support_tickets').insert({
        user_id:    user.id,
        user_name:  profile?.full_name || 'Partner',
        user_email: profile?.email,
        user_type:  role,
        category:   form.category,
        department: cat?.department || 'partner_success',
        priority:   cat?.priority   || 'normal',
        subject:    form.subject.trim(),
        message:    form.message.trim(),
        booking_id: form.booking_id.trim() || null,
        status:     'open',
      }).select().single();

      // Notify — partner gets a confirmation, team gets an alert (both non-blocking)
      const ticketMeta = {
        id: ticket?.id, subject: form.subject.trim(), message: form.message.trim(),
        category: form.category, categoryLabel: cat?.label, priority: cat?.priority || 'normal',
        userType: role, bookingId: form.booking_id.trim() || null,
      };
      if (profile?.email) {
        sendPartnerTicketConfirmation({ email: profile.email, full_name: profile.full_name }, ticketMeta);
      }
      notifyPartnerSupportTeam(ticketMeta, { email: profile?.email, full_name: profile?.full_name });

      setSuccess(true);
      setForm({ category: '', subject: '', message: '', booking_id: '' });
      await fetchTickets();
      setTimeout(() => { setSuccess(false); setView('list'); }, 2000);
    } catch (err) { console.error(err); }
    setSubmitting(false);
  }

  const wrap  = { padding: pagePad, background: CL.bg, minHeight: '100%', boxSizing: 'border-box' };
  const inner = { width: '100%', maxWidth: innerMax, margin: '0 auto' };

  /* ── DETAIL VIEW ── */
  if (view === 'detail' && selected) {
    const s = STATUS_COLOR[selected.status] || STATUS_COLOR.open;
    return (
      <div style={wrap}>
        <div style={{ ...inner, maxWidth: isDesktop ? 900 : isTablet ? 720 : '100%' }}>
          <button onClick={() => { setView('list'); setSelected(null); }}
            style={{ background: 'none', border: 'none', color: CL.gold, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            ← Back to tickets
          </button>
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: isTablet ? 28 : 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  TICKET #{selected.id?.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ color: CL.text, fontSize: 20, fontWeight: 700 }}>{selected.subject}</div>
              </div>
              <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 12 }}>
                {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
              <Tag label="Category" value={CATEGORIES.find(c => c.value === selected.category)?.label || selected.category} />
              <Tag label="Submitted" value={new Date(selected.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })} />
              {selected.booking_id && <Tag label="Booking ID" value={selected.booking_id} />}
            </div>
            <div style={{ background: CL.bg, borderRadius: 12, padding: 18, marginBottom: 20 }}>
              <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>YOUR MESSAGE</div>
              <div style={{ color: CL.text, fontSize: 14, lineHeight: 1.7 }}>{selected.message}</div>
            </div>
            {selected.admin_note && (
              <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: 18 }}>
                <div style={{ color: CL.gold, fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={12} /> ADMIN RESPONSE
                </div>
                <div style={{ color: CL.text, fontSize: 14, lineHeight: 1.7 }}>{selected.admin_note}</div>
              </div>
            )}
            {!selected.admin_note && selected.status === 'open' && (
              <div style={{ background: CL.blueSoft, border: `1px solid ${CL.blue}25`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CL.blue, margin: '0 auto 10px' }} />
                <div style={{ color: CL.blue, fontSize: 13, fontWeight: 600 }}>Our team will respond within 24 hours</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── NEW TICKET FORM ── */
  if (view === 'new') {
    return (
      <div style={wrap}>
        <div style={{ ...inner, maxWidth: isDesktop ? 1000 : isTablet ? 800 : '100%' }}>
          <button onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', color: CL.gold, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            ← Back
          </button>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={22} color={CL.text} /> New Support Ticket
          </div>
          <div style={{ color: CL.muted, fontSize: 14, marginBottom: 28 }}>Describe your issue and our team will help within 24 hours.</div>

          {success && (
            <div style={{ background: CL.greenSoft, border: '1px solid #A7F3D0', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: CL.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{ color: CL.green, fontWeight: 600 }}>Ticket submitted! Redirecting…</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div style={{ color: CL.muted, fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>ISSUE CATEGORY *</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${catCols}, 1fr)`, gap: 10 }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', position: 'relative',
                      background: form.category === cat.value ? CL.goldSoft : CL.bg,
                      border: `1px solid ${form.category === cat.value ? CL.goldBorder : CL.border}`,
                      transition: 'all 0.15s',
                    }}>
                    {cat.priority === 'urgent' && (
                      <span style={{ position: 'absolute', top: 8, right: 8, background: CL.redSoft, color: CL.red, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 999, letterSpacing: 0.5 }}>URGENT</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {cat.Icon && <cat.Icon size={16} color={form.category === cat.value ? CL.gold : CL.muted} strokeWidth={1.9} />}
                      <div style={{ fontSize: 13, fontWeight: 700, color: form.category === cat.value ? CL.gold : CL.text }}>{cat.label}</div>
                    </div>
                    <div style={{ fontSize: 11, color: CL.muted }}>{cat.desc}</div>
                  </div>
                ))}
              </div>
              {form.category && (() => {
                const cat  = findCategory(role, form.category);
                const dept = departmentMeta(cat?.department);
                return (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: `${dept.color}12`, border: `1px solid ${dept.color}40`, borderRadius: 10, padding: '10px 14px' }}>
                    {dept.Icon && <dept.Icon size={18} color={dept.color} strokeWidth={2} />}
                    <div>
                      <div style={{ color: dept.color, fontSize: 12, fontWeight: 800 }}>Routes to: {dept.name}</div>
                      <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>{dept.sla}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label style={{ color: CL.muted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>SUBJECT *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of your issue" maxLength={120}
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '13px 16px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ color: CL.muted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
                BOOKING ID <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input value={form.booking_id} onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))}
                placeholder="e.g. FIX-XXXXXXXX — if related to a specific job"
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '13px 16px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>

            <div>
              <label style={{ color: CL.muted, fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>DESCRIBE YOUR ISSUE *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="What happened, when, and what you expected…" rows={6}
                style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '13px 16px', color: CL.text, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={submitting || !form.category || !form.subject.trim() || !form.message.trim()}
              style={{
                background: CL.text, color: '#fff', fontWeight: 800, fontSize: 15,
                border: 'none', borderRadius: 12, padding: '15px', fontFamily: 'inherit',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: (!form.category || !form.subject.trim() || !form.message.trim()) ? 0.45 : 1,
              }}>
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── TICKET LIST ── */
  return (
    <div style={wrap}>
      <div style={inner}>

        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ color: CL.text, fontSize: isTablet ? 26 : 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Headphones size={isTablet ? 26 : 22} color={CL.text} strokeWidth={2} /> Support
            </div>
            <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>Get help from the Fixera team</div>
          </div>
          <button onClick={() => setView('new')}
            style={{ background: CL.text, color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 12, padding: '11px 20px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            + New Ticket
          </button>
        </motion.div>

        {/* 2-col on desktop */}
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 28 : 20, alignItems: 'flex-start' }}>

          {/* LEFT — contact + quick links */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ width: isDesktop ? sideW : '100%', flexShrink: 0 }}>

            {/* Contact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <a href="https://wa.me/254712008361?text=Hi%20Fixera%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '20px 12px', borderRadius: 16, textDecoration: 'none', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={26} color="#25D366" strokeWidth={2} />
                </div>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>WhatsApp</div>
                <div style={{ color: '#25D366', fontSize: 12, fontWeight: 600 }}>Avg. 2 min reply</div>
              </a>
              <a href="tel:+254712008361"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '20px 12px', borderRadius: 16, textDecoration: 'none', background: CL.greenSoft, border: '1px solid #A7F3D0' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={24} color={CL.green} strokeWidth={2} />
                </div>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>Call Us</div>
                <div style={{ color: CL.green, fontSize: 12, fontWeight: 600 }}>24/7 Available</div>
              </a>
            </div>

            {/* Quick Links */}
            <QuickLink
              icon={<ClipboardList size={20} color={CL.green} strokeWidth={2} />}
              iconBg={CL.greenSoft} iconBorder="#A7F3D0"
              title="My Qualifications" sub="Track what's needed to go live"
              badge="View →" badgeColor={CL.green} badgeBg={CL.greenSoft} badgeBorder="#A7F3D0"
              onClick={() => navigate('/qualifications')} />

            <QuickLink
              icon={<Scale size={20} color={CL.purple} strokeWidth={2} />}
              iconBg={CL.purpleSoft} iconBorder={CL.purpleBorder}
              title="My Partner Agreement"
              sub={profile?.agreement_version === AGREEMENT_VERSION ? `Accepted · ${AGREEMENT_VERSION}` : 'Not accepted — tap to review & sign'}
              badge="View →" badgeColor={CL.purple} badgeBg={CL.purpleSoft} badgeBorder={CL.purpleBorder}
              onClick={() => navigate('/agreement')} />

            <QuickLink
              onClick={copySupportEmail}
              icon={emailCopied ? <CheckCircle2 size={20} color={CL.green} strokeWidth={2} /> : <Mail size={20} color={CL.gold} strokeWidth={2} />}
              iconBg={emailCopied ? CL.green + '18' : CL.goldSoft} iconBorder={emailCopied ? CL.green + '30' : CL.goldBorder}
              title="Email Support" sub="support@fixera.africa · Reply within 2 hrs"
              badge={emailCopied ? 'Copied ✓' : 'Copy'} badgeColor={emailCopied ? CL.green : CL.gold} badgeBg={emailCopied ? CL.green + '18' : CL.goldSoft} badgeBorder={emailCopied ? CL.green + '30' : CL.goldBorder} />
          </motion.div>

          {/* RIGHT — tickets */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ flex: 1, minWidth: 0, width: isDesktop ? 'auto' : '100%' }}>
            <div style={{ color: CL.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, marginBottom: 14 }}>
              MY TICKETS {tickets.length > 0 && `(${tickets.length})`}
            </div>

            {loading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: CL.surface, border: `1px solid ${CL.border}`, marginBottom: 10, opacity: 1 - i * 0.25 }} />
              ))
            ) : tickets.length === 0 ? (
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '56px 20px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <Headphones size={52} color={CL.muted} strokeWidth={1.3} />
                </div>
                <div style={{ color: CL.text, fontSize: 17, fontWeight: 700, marginBottom: 8 }}>No tickets yet</div>
                <div style={{ color: CL.muted, fontSize: 14, marginBottom: 24 }}>Having an issue? Our team is here to help.</div>
                <button onClick={() => setView('new')}
                  style={{ background: CL.text, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 10, padding: '13px 28px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Submit Your First Ticket
                </button>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tickets.map((ticket, i) => {
                  const s   = STATUS_COLOR[ticket.status] || STATUS_COLOR.open;
                  const cat = CATEGORIES.find(c => c.value === ticket.category);
                  return (
                    <motion.div key={ticket.id} custom={3 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" onClick={() => { setSelected(ticket); setView('detail'); }}
                      style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = CL.goldBorder; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{cat?.label || ticket.category}</div>
                          <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                            {ticket.subject}
                          </div>
                          <div style={{ color: CL.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ticket.message}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, marginLeft: 16 }}>
                          <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{s.label}</span>
                          <span style={{ color: CL.muted, fontSize: 11 }}>
                            {new Date(ticket.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      {ticket.admin_note && (
                        <div style={{ marginTop: 10, padding: '8px 12px', background: CL.goldSoft, borderRadius: 8, fontSize: 12, color: CL.gold, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={12} color={CL.gold} /> Admin responded — click to read
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon, iconBg, iconBorder, title, sub, badge, badgeColor, badgeBg, badgeBorder, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, cursor: onClick ? 'pointer' : 'default', marginBottom: 10 }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = CL.border; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{title}</div>
        <div style={{ color: CL.muted, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      {badge && (
        <div style={{ color: badgeColor, fontSize: 12, fontWeight: 700, background: badgeBg, padding: '6px 14px', borderRadius: 20, border: `1px solid ${badgeBorder}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {badge}
        </div>
      )}
    </div>
  );
}

function Tag({ label, value }) {
  return (
    <div style={{ background: CL.bg, borderRadius: 8, padding: '6px 12px', border: `1px solid ${CL.border}` }}>
      <div style={{ color: CL.muted, fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: CL.text, fontSize: 12, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
