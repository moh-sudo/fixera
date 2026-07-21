import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, CalendarClock, FolderOpen, Search, Headphones, HelpCircle, FileText, ShieldCheck, Info, LogOut, ChevronRight, X, User, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

import { useCL } from '../../hooks/useCL';

// ── Delete Account Modal ──
function DeleteAccountModal({ onClose, onDeleted }) {
  const CL = useCL();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError(''); setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete account.');
      await onDeleted();
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,22,40,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, background: CL.bg, borderRadius: 20, padding: 26 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: CL.errorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={24} color={CL.error} />
        </div>
        <div style={{ color: CL.text, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Delete your account?</div>
        <p style={{ color: CL.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          This permanently removes your personal details (name, phone, email, photo) and signs you out everywhere. You can't undo this.
          Booking and payment records are kept in anonymized form as required by law.
          {' '}Any active bookings must be completed or cancelled first.
        </p>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Type DELETE to confirm</div>
          <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 11, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {error && <div style={{ background: CL.errorBg, border: `1px solid ${CL.error}40`, borderRadius: 11, padding: '11px 14px', color: CL.error, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleDelete} disabled={confirmText !== 'DELETE' || loading}
            style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: CL.error, color: '#fff', fontSize: 14, fontWeight: 700, cursor: confirmText !== 'DELETE' || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: confirmText !== 'DELETE' || loading ? 0.5 : 1 }}>
            {loading ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit Profile Drawer ──
function EditProfileDrawer({ profile, onClose, onSave }) {
  const CL = useCL();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || 'Nairobi, Kenya');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try { await onSave({ full_name: fullName.trim(), phone: phone.trim(), city: city.trim() }); onClose(); }
    catch (e) { setError(e.message || 'Failed to save. Try again.'); }
    finally { setSaving(false); }
  };

  const fieldStyle = { width: '100%', padding: '13px 14px', borderRadius: 11, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,22,40,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, background: CL.bg, borderRadius: '24px 24px 0 0', padding: '24px 22px 36px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>Edit profile</div>
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>Update your information</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        {[
          { label: 'Full name', value: fullName, set: setFullName, ph: 'Your full name', type: 'text' },
          { label: 'Phone number', value: phone, set: setPhone, ph: '+254 7XX XXX XXX', type: 'tel' },
          { label: 'City', value: city, set: setCity, ph: 'Nairobi, Kenya', type: 'text' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <div style={labelStyle}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={fieldStyle} />
          </div>
        ))}

        <div style={{ marginBottom: 22 }}>
          <div style={labelStyle}>Email</div>
          <div style={{ ...fieldStyle, color: CL.light, background: '#EEF0F2' }}>{profile?.email || '—'} · read-only</div>
        </div>

        {error && <div style={{ background: CL.errorBg, border: `1px solid ${CL.error}40`, borderRadius: 11, padding: '11px 14px', color: CL.error, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>⚠️ {error}</div>}

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: CL.navy, color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </motion.div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function ProfilePage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { profile, user, logout, updateProfile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [statsLoad, setStatsLoad] = useState(true);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';
  const email = profile?.email || user?.email || '—';
  const phone = profile?.phone || null;
  const firstName = displayName.split(' ')[0];
  const firstCap = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : 'there';

  useEffect(() => {
    if (!user) { setStatsLoad(false); return; }
    supabase.from('bookings').select('status').eq('user_id', user.id).then(({ data }) => {
      const all = data || [];
      setStats({ total: all.length, completed: all.filter(b => b.status === 'completed').length });
      setStatsLoad(false);
    });
  }, [user]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/export-data', { headers: { Authorization: `Bearer ${session?.access_token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not export your data.');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `fixera-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || 'Something went wrong exporting your data.');
    } finally { setExporting(false); }
  };

  const handleAccountDeleted = async () => {
    setShowDelete(false);
    await logout();
    navigate('/');
  };

  const MENU_SECTIONS = [
    { title: 'Account', items: [
      { Icon: Pencil, label: 'Edit profile', onClick: () => setShowEdit(true) },
      { Icon: CalendarClock, label: 'Booking history', onClick: () => navigate('/history') },
      { Icon: FolderOpen, label: 'My documents', onClick: () => navigate('/documents') },
      { Icon: Search, label: 'Inspections', onClick: () => navigate('/inspections') },
    ]},
    { title: 'Help & info', items: [
      { Icon: Headphones, label: 'Support center', onClick: () => navigate('/support') },
      { Icon: HelpCircle, label: 'FAQ', onClick: () => navigate('/faq') },
      { Icon: Info, label: 'About Fixera', onClick: () => navigate('/about') },
    ]},
    { title: 'Legal', items: [
      { Icon: FileText,   label: 'Terms of service', onClick: () => navigate('/terms') },
      { Icon: ShieldCheck, label: 'Privacy policy',  onClick: () => navigate('/privacy') },
      { Icon: Info,       label: 'AI policy',        onClick: () => navigate('/ai-policy') },
    ]},
    { title: 'Privacy', items: [
      { Icon: Download, label: exporting ? 'Preparing export…' : 'Export my data', onClick: handleExport },
      { Icon: Trash2,   label: 'Delete my account', onClick: () => setShowDelete(true), danger: true },
    ]},
  ];

  const statCards = [
    { val: statsLoad ? '…' : stats.total, label: 'Total bookings', color: CL.gold },
    { val: statsLoad ? '…' : stats.completed, label: 'Completed', color: CL.success },
    { val: statsLoad ? '…' : Math.max(0, stats.total - stats.completed), label: 'Pending', color: CL.info },
    { val: statsLoad ? '…' : '4.8★', label: 'Your rating', color: '#D98A1F' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 18px 0' }}>

        {/* Greeting */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 20 }}>
          <div style={{ margin: 0, fontSize: 22, fontWeight: 800, color: CL.text }}>Hi {firstCap} 👋</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 3 }}>Welcome back to Fixera</div>
        </motion.div>

        {/* User card */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, background: CL.navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={30} color="#fff" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            {phone && <div style={{ color: CL.light, fontSize: 11, marginTop: 1 }}>{phone}</div>}
          </div>
          <button onClick={() => setShowEdit(true)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 10, background: CL.navy, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={13} /> Edit</button>
        </motion.div>

        {/* Stats */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, marginBottom: 20, display: 'flex', overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.05)' }}>
          {statCards.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${CL.border}` : 'none' }}>
              <div style={{ color: s.color, fontSize: 20, fontWeight: 800, marginBottom: 3 }}>{s.val}</div>
              <div style={{ color: CL.muted, fontSize: 10, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Menu sections */}
        {MENU_SECTIONS.map((sec, si) => (
          <motion.div key={sec.title} custom={3 + si} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 18 }}>
            <div style={{ color: CL.light, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>{sec.title}</div>
            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, overflow: 'hidden' }}>
              {sec.items.map((item, idx) => (
                <div key={item.label}>
                  <div onClick={item.onClick} className="prof-row"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: item.danger ? CL.errorBg : CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.Icon size={18} color={item.danger ? CL.error : CL.gold} strokeWidth={2} />
                      </div>
                      <span style={{ color: item.danger ? CL.error : CL.text, fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <ChevronRight size={18} color={CL.light} />
                  </div>
                  {idx < sec.items.length - 1 && <div style={{ height: 1, background: CL.border, marginLeft: 66 }} />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.button custom={6} variants={fadeUp} initial="hidden" animate="show" whileTap={{ scale: 0.99 }} onClick={handleLogout}
          style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', borderRadius: 14, background: CL.errorBg, border: `1px solid ${CL.error}40`, color: CL.error, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 18 }}>
          <LogOut size={18} /> Log out
        </motion.button>

        <div style={{ color: CL.light, fontSize: 11, textAlign: 'center', paddingBottom: 8 }}>Fixera v1.0.0 · Nairobi, Kenya</div>
      </div>

      <style>{`.prof-row:hover{ background:#FAFBFC; }`}</style>

      {showEdit && <EditProfileDrawer profile={profile} onClose={() => setShowEdit(false)} onSave={updateProfile} />}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} onDeleted={handleAccountDeleted} />}
    </div>
  );
}
