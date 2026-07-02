import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME } from '../../components/ProtectedRoute';
import { CheckCircle2, ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import { evaluateQualifications } from '../../data/qualifications';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
};

export default function QualificationChecklistPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const role     = profile?.partner_role || 'worker';
  const roleHome = ROLE_HOME[role] || '/dashboard';

  const [crewCount,  setCrewCount]  = useState(0);
  const [fleetCount, setFleetCount] = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ count: cc }, { count: fc }] = await Promise.all([
          supabase.from('partner_crew_members').select('id', { count: 'exact', head: true }).eq('partner_user_id', user.id),
          supabase.from('mover_vehicles').select('id', { count: 'exact', head: true }).eq('mover_user_id', user.id),
        ]);
        setCrewCount(cc || 0);
        setFleetCount(fc || 0);
      } catch (e) {
        console.warn('qualification counts failed:', e);
      } finally { setLoading(false); }
    })();
  }, [user]);

  const result = evaluateQualifications(role, { profile, crewCount, fleetCount });
  const pct    = Math.round((result.completed / result.total) * 100);

  return (
    <div style={{ padding: '20px 16px 90px', maxWidth: 680, margin: '0 auto', fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: CL.bg }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={() => navigate(roleHome)} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 20, fontWeight: 900 }}>Qualification Checklist</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>Everything Fixera needs before you can take jobs</div>
        </div>
      </div>

      {/* Progress card */}
      <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>{result.completed} of {result.total} complete</span>
          <span style={{ color: result.allDone ? CL.green : result.color, fontSize: 14, fontWeight: 900 }}>{pct}%</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 8, borderRadius: 999, background: CL.border, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: result.allDone ? CL.green : result.color, transition: 'width 0.4s' }} />
        </div>
        {result.allDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CL.green, fontSize: 12, fontWeight: 700, marginTop: 12 }}>
            <CheckCircle2 size={14} color={CL.green} strokeWidth={2} />
            All requirements met — you're ready to take jobs!
          </div>
        )}
      </div>

      {/* Checklist items */}
      {loading ? (
        <div style={{ textAlign: 'center', color: CL.muted, padding: 40, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16 }}>
          <Clock size={28} color={CL.muted} strokeWidth={1.5} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>Loading your status…</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.items.map((item, i) => (
            <div key={i} style={{ background: CL.surface, border: `1px solid ${item.done ? CL.greenBorder : CL.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: `4px solid ${item.done ? CL.green : CL.border}` }}>
              {/* Status icon */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: item.done ? CL.greenSoft : CL.bg, border: `2px solid ${item.done ? CL.green : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.done
                  ? <CheckCircle2 size={14} color={CL.green} strokeWidth={2.5} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: CL.border }} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                  {item.done && (
                    <span style={{ background: CL.greenSoft, color: CL.green, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>DONE</span>
                  )}
                  {!item.done && item.pendingNote && (
                    <span style={{ background: '#FFFBEB', color: '#F59E0B', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>⏳ {item.pendingNote}</span>
                  )}
                </div>
                <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>{item.hint}</div>
                {!item.done && item.action && (
                  <button onClick={() => navigate(item.action.path)}
                    style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, background: `${result.color}15`, color: result.color, border: `1px solid ${result.color}40`, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {item.action.label} <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <button onClick={() => navigate(roleHome)}
        style={{ width: '100%', padding: '14px', borderRadius: 12, marginTop: 20, background: result.allDone ? CL.text : CL.text, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(10,22,40,0.18)' }}>
        {result.allDone ? 'Go to Dashboard' : 'Continue to Dashboard'}
        <ArrowRight size={16} />
      </button>
      {!result.allDone && (
        <div style={{ color: CL.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          You can finish the remaining items any time from Support → My Qualifications
        </div>
      )}
    </div>
  );
}
