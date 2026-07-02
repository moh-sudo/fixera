import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { TERMS_VERSION, PRIVACY_VERSION } from '../data/legalVersions';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
};

// Blocking overlay shown whenever the logged-in partner's accepted
// Terms/Privacy version is out of date (or missing). Fires app-wide
// via Layout.jsx so it catches the partner regardless of which page
// they land on after login. Separate from the Master Partner Agreement
// gate (ProtectedRoute → AGREEMENT_VERSION), which is a full-page redirect.
export default function TermsReacceptanceModal() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving]   = useState(false);

  if (!profile || !user) return null;

  const isFirstTime = !profile.terms_accepted_at;
  const needsTerms   = profile.terms_version   !== TERMS_VERSION;
  const needsPrivacy = profile.privacy_version !== PRIVACY_VERSION;
  if (!needsTerms && !needsPrivacy) return null;

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('workers').update({
        terms_version: TERMS_VERSION, terms_accepted_at: now,
        privacy_version: PRIVACY_VERSION, privacy_accepted_at: now,
      }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (err) {
      console.error('[TermsReacceptanceModal]', err.message);
      alert('Could not record your acceptance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'inherit' }}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, background: CL.surface, borderRadius: 20, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ width: 52, height: 52, borderRadius: 16, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <FileText size={24} color={CL.gold} strokeWidth={1.8} />
        </div>

        <div style={{ color: CL.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          {isFirstTime ? 'Accept our Terms' : 'We’ve updated our policies'}
        </div>
        <div style={{ color: CL.muted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 20 }}>
          {isFirstTime
            ? 'Please review and accept the Fixera Partner Terms of Service and Privacy Policy to continue.'
            : 'Our Terms of Service and/or Privacy Policy have changed since you last accepted them. Please review and re-accept to keep using the Fixera Partner app.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <button onClick={() => navigate('/terms')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: CL.text, fontSize: 13.5, fontWeight: 600 }}>
              <FileText size={15} color={CL.muted} /> Terms of Service
            </span>
            <ChevronRight size={15} color={CL.muted} />
          </button>
          <button onClick={() => navigate('/privacy')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: CL.text, fontSize: 13.5, fontWeight: 600 }}>
              <ShieldCheck size={15} color={CL.muted} /> Privacy Policy
            </span>
            <ChevronRight size={15} color={CL.muted} />
          </button>
        </div>

        <div onClick={() => setChecked(c => !c)} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? CL.gold : CL.border}`, background: checked ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {checked && <Check size={14} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ color: CL.text, fontSize: 13, lineHeight: 1.6 }}>
            I have read and accept the Fixera Partner Terms of Service and Privacy Policy.
          </span>
        </div>

        <button onClick={handleAccept} disabled={!checked || saving}
          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
            background: checked && !saving ? CL.text : CL.border,
            color: checked && !saving ? '#fff' : CL.muted,
            fontSize: 14.5, fontWeight: 800, cursor: checked && !saving ? 'pointer' : 'not-allowed' }}>
          {saving ? 'Saving…' : 'Accept & Continue'}
        </button>
      </motion.div>
    </div>
  );
}
