import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME } from '../../components/ProtectedRoute';
import { CheckCircle2, ChevronLeft, FileText, AlertTriangle, PenLine } from 'lucide-react';
import {
  agreementForRole, SHARED_CLAUSES,
  AGREEMENT_VERSION, PENDING_VERIFICATION_NOTICE,
} from '../../data/partnerAgreements';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  red: '#EF4444', redSoft: '#FEF2F2',
  purple: '#8B5CF6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
};

export default function PartnerAgreementPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const role      = profile?.partner_role || 'worker';
  const agreement = agreementForRole(role);
  const roleHome  = ROLE_HOME[role] || '/dashboard';

  const alreadyAccepted = profile?.agreement_version === AGREEMENT_VERSION && profile?.agreement_accepted_at;
  const termsUpdated    = !alreadyAccepted && !!profile?.agreement_accepted_at;
  const [checked, setChecked] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  const handleAccept = async () => {
    if (!checked || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('workers').update({
        agreement_version:     AGREEMENT_VERSION,
        agreement_accepted_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
      setDone(true);
      await refreshProfile();
      setTimeout(() => navigate('/qualifications', { replace: true }), 1200);
    } catch (err) {
      console.error(err);
      alert('Could not record your acceptance. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 680, margin: '0 auto', fontFamily: 'Inter, sans-serif', background: CL.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        {alreadyAccepted && (
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={20} color={CL.gold} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ color: CL.text, fontSize: 20, fontWeight: 900 }}>{agreement.icon} {agreement.label}</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>Fixera Partner Terms · {AGREEMENT_VERSION}</div>
          </div>
        </div>
      </div>

      {/* Terms-updated notice */}
      {termsUpdated && !done && (
        <div style={{ background: CL.purpleSoft, border: `2px solid ${CL.purpleBorder}`, borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertTriangle size={20} color={CL.purple} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ color: CL.purple, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Terms & Conditions have been updated</div>
            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
              You previously accepted {profile.agreement_version || 'an earlier version'} on{' '}
              {new Date(profile.agreement_accepted_at).toLocaleDateString('en-KE')}.
              Please review the updated terms below and accept to continue using Fixera.
            </div>
          </div>
        </div>
      )}

      {/* First-time gate notice */}
      {!alreadyAccepted && !termsUpdated && !done && (
        <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} color={CL.gold} />
          <span style={{ color: CL.gold, fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>
            Please review and accept your Partner Agreement to continue to your dashboard.
          </span>
        </div>
      )}

      {/* Draft notice */}
      <div style={{ background: CL.amberSoft, border: `1px solid ${CL.amberBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertTriangle size={14} color={CL.amber} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ color: CL.amber, fontSize: 12, lineHeight: 1.6 }}>{PENDING_VERIFICATION_NOTICE}</span>
      </div>

      {/* Delivery-provider clause */}
      {agreement.deliveryProvider && (
        <div style={{ background: CL.purpleSoft, border: `2px solid ${CL.purpleBorder}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ color: CL.purple, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{agreement.deliveryProvider.title}</div>
          <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>{agreement.deliveryProvider.body}</div>
        </div>
      )}

      {/* Key terms */}
      <Section title="Your Key Terms" color={agreement.color}>
        {agreement.terms.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: `1px solid ${CL.border}` }}>
            <span style={{ color: CL.muted, fontSize: 12, flexShrink: 0 }}>{t.k}</span>
            <span style={{ color: CL.text, fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{t.v}</span>
          </div>
        ))}
      </Section>

      <Section title="Your Requirements" color={agreement.color}>
        <Bullets items={agreement.requirements} />
      </Section>

      <Section title="Service Standards" color={agreement.color}>
        <Bullets items={agreement.standards} />
      </Section>

      <Section title="Suspension Rules" color={CL.red}>
        <Bullets items={agreement.suspension} color={CL.red} />
      </Section>

      <Section title="General Terms (all partners)" color={CL.gold}>
        {SHARED_CLAUSES.map((c, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{c.title}</div>
            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>{c.body}</div>
          </div>
        ))}
      </Section>

      {/* Acceptance */}
      {(alreadyAccepted || done) ? (
        <div style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, borderRadius: 16, padding: 22, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 20, background: CL.greenSoft, border: `1.5px solid ${CL.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={28} color={CL.green} strokeWidth={1.8} />
          </div>
          <div style={{ color: CL.green, fontSize: 16, fontWeight: 800 }}>Agreement Accepted</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 4 }}>
            {AGREEMENT_VERSION}
            {(profile?.agreement_accepted_at || done) &&
              ` · ${new Date(profile?.agreement_accepted_at || Date.now()).toLocaleString('en-KE')}`}
          </div>
          {done && <div style={{ color: CL.green, fontSize: 12, marginTop: 10, fontWeight: 600 }}>Taking you to your dashboard…</div>}
        </div>
      ) : (
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 18 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 16 }}>
            <div onClick={() => setChecked(c => !c)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? CL.gold : CL.border}`, background: checked ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.15s', cursor: 'pointer' }}>
              {checked && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color: CL.text, fontSize: 13, lineHeight: 1.6 }}>
              I have read and accept the Fixera {agreement.label} ({AGREEMENT_VERSION}), including the
              commission, settlement, requirements, and suspension terms above. I understand a
              legally verified version will follow and I will be asked to re-accept it.
            </span>
          </label>
          <button onClick={handleAccept} disabled={!checked || saving}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: checked ? CL.text : CL.border, color: checked ? '#fff' : CL.muted, border: 'none', fontSize: 14, fontWeight: 800, cursor: checked ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', boxShadow: checked ? '0 6px 20px rgba(10,22,40,0.18)' : 'none' }}>
            <PenLine size={16} />
            {saving ? 'Recording…' : 'Accept Agreement'}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid #E8ECF0`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <div style={{ color, fontSize: 12, fontWeight: 800, marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function Bullets({ items, color = '#10B981' }) {
  return items.map((item, i) => (
    <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', alignItems: 'flex-start' }}>
      <CheckCircle2 size={13} color={color} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ color: '#6B7A8F', fontSize: 12, lineHeight: 1.5 }}>{item}</span>
    </div>
  ));
}
