import { useState } from 'react';
import { motion } from 'framer-motion';

import { useCL } from '../hooks/useCL';

/**
 * Bolt-style guest contact capture.
 * Guest gives name + phone (email optional) before browsing — no password, no account.
 */
export default function GuestContactModal({ onContinue, onClose }) {
  const CL = useCL();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validPhone = p => /^(\+?254|0)?7\d{8}$/.test(p.replace(/[\s-]/g, ''));

  const handleContinue = async () => {
    setError('');
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (!form.phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!validPhone(form.phone)) { setError('Please enter a valid Kenyan phone number (07XX XXX XXX).'); return; }
    setSaving(true);
    try {
      await onContinue({ name: form.name.trim(), phone: form.phone.trim().replace(/[\s-]/g, ''), email: form.email.trim() || null });
    } finally { setSaving(false); }
  };

  const fieldStyle = { width: '100%', padding: '14px 16px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: CL.text, transition: 'all 0.18s' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 8 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <style>{`.guest-input:focus{ border-color:${CL.gold} !important; box-shadow:0 0 0 3px rgba(201,160,32,0.16); }`}</style>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400, background: CL.bg, borderRadius: 20, padding: 28 }}>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>👋</div>
          <div style={{ color: CL.text, fontSize: 22, fontWeight: 800 }}>Almost there!</div>
          <div style={{ color: CL.muted, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
            Just your name and number — so professionals can reach you. No password needed.
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Your name</label>
          <input className="guest-input" style={fieldStyle} placeholder="" value={form.name} onChange={update('name')} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Phone number</label>
          <input className="guest-input" style={fieldStyle} placeholder="07XX XXX XXX" value={form.phone} onChange={update('phone')} onKeyDown={e => e.key === 'Enter' && handleContinue()} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email <span style={{ color: CL.light, fontWeight: 400 }}>(optional)</span></label>
          <input className="guest-input" style={fieldStyle} type="email" placeholder="you@email.com" value={form.email} onChange={update('email')} onKeyDown={e => e.key === 'Enter' && handleContinue()} />
        </div>

        {error && (
          <div style={{ background: CL.errorBg, border: `1px solid ${CL.error}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: CL.error, fontSize: 13 }}>⚠️ {error}</div>
        )}

        <motion.button whileTap={{ scale: 0.985 }} whileHover={{ y: -2, boxShadow: '0 16px 38px rgba(10,22,40,0.45)' }} onClick={handleContinue} disabled={saving}
          style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: CL.black, border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, boxShadow: '0 12px 28px rgba(10,22,40,0.30)', transition: 'box-shadow 0.2s', marginBottom: 10 }}>
          {saving ? 'One moment...' : 'Continue as guest →'}
        </motion.button>

        <button onClick={onClose} style={{ width: '100%', background: 'none', border: 'none', color: CL.muted, fontSize: 14, cursor: 'pointer', padding: 8, fontFamily: 'inherit' }}>Cancel</button>

        <div style={{ color: CL.light, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          You can browse and explore services freely. Creating a booking will ask you to set a quick password.
        </div>
      </motion.div>
    </div>
  );
}
