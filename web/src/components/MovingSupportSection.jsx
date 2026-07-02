import { useState } from 'react';
import { C } from '../theme';
import { Btn, Card, Input } from './UI';
import { reportMovingIssue } from '../services/movingService';
import { useAuth } from '../hooks/useAuth';

const FIXERA_SUPPORT_PHONE = '+254700000000';
const FIXERA_SUPPORT_WHATSAPP = '254700000000';

const ISSUE_CATEGORIES = [
  { id: 'delay',        label: 'Mover is delayed',     icon: '⏰' },
  { id: 'crew_issue',   label: 'Issue with crew',      icon: '👥' },
  { id: 'damage',       label: 'Item damaged',         icon: '💥' },
  { id: 'missing_item', label: 'Item missing',         icon: '❓' },
  { id: 'safety',       label: 'Safety concern',       icon: '⚠️' },
  { id: 'payment',      label: 'Payment dispute',      icon: '💸' },
  { id: 'other',        label: 'Other',                icon: '💬' },
];

export default function MovingSupportSection({ requestId, moverPhone, moverCompany, compact = false }) {
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReport = async () => {
    if (!category || !description.trim()) return;
    setSubmitting(true);
    try {
      await reportMovingIssue(requestId, user.id, category, description.trim());
      setSubmitted(true);
    } catch (err) {
      console.error('Report issue failed:', err);
      alert('Failed to send report. Please call Fixera support directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card style={{ background: `${C.success}15`, border: `1px solid ${C.success}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div>
            <div style={{ color: C.success, fontSize: 15, fontWeight: 700 }}>Report Received</div>
            <div style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Our team will reach out within 30 minutes.</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        color: C.textPrimary, fontSize: 15, fontWeight: 700,
      }}>
        <span>🆘</span> Need Help During Your Move?
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
        {/* Call Fixera */}
        <a href={`tel:${FIXERA_SUPPORT_PHONE}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: C.navyLight, border: `1px solid ${C.gold}40`,
            borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 22 }}>📞</div>
            <div>
              <div style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>Call Fixera</div>
              <div style={{ color: C.textMuted, fontSize: 10 }}>24/7 Support</div>
            </div>
          </div>
        </a>

        {/* WhatsApp Fixera */}
        <a href={`https://wa.me/${FIXERA_SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi Fixera, I need help with my moving request ${requestId.slice(0, 8)}`)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <div style={{
            background: C.navyLight, border: `1px solid #25D36640`,
            borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ fontSize: 22 }}>💬</div>
            <div>
              <div style={{ color: '#25D366', fontSize: 12, fontWeight: 700 }}>WhatsApp</div>
              <div style={{ color: C.textMuted, fontSize: 10 }}>Fixera Support</div>
            </div>
          </div>
        </a>

        {/* Call Mover — only when assigned */}
        {moverPhone && (
          <a href={`tel:${moverPhone}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.navyLight, border: `1px solid ${C.info}40`,
              borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontSize: 22 }}>🚚</div>
              <div>
                <div style={{ color: C.info, fontSize: 12, fontWeight: 700 }}>Call Mover</div>
                <div style={{ color: C.textMuted, fontSize: 10 }}>{moverCompany || 'Direct line'}</div>
              </div>
            </div>
          </a>
        )}

        {/* Report Issue */}
        <div onClick={() => setShowReport(!showReport)} style={{
          background: C.navyLight, border: `1px solid ${C.error}40`,
          borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 22 }}>🚨</div>
          <div>
            <div style={{ color: C.error, fontSize: 12, fontWeight: 700 }}>Report Issue</div>
            <div style={{ color: C.textMuted, fontSize: 10 }}>Damage, delay, etc.</div>
          </div>
        </div>
      </div>

      {/* Report Form */}
      {showReport && (
        <Card style={{ marginTop: 10 }}>
          <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>What happened?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 14 }}>
            {ISSUE_CATEGORIES.map(c => {
              const selected = category === c.id;
              return (
                <div key={c.id} onClick={() => setCategory(c.id)} style={{
                  background: selected ? `${C.gold}18` : C.navy,
                  border: `1px solid ${selected ? C.gold : C.navyBorder}`,
                  borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{c.icon}</span>
                  <span style={{ color: selected ? C.gold : C.textSec, fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                </div>
              );
            })}
          </div>
          <Input placeholder="Describe what happened…" value={description} onChange={setDescription} multiline rows={3} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setShowReport(false)} style={{ flex: 1 }}>Cancel</Btn>
            <Btn onClick={handleReport} disabled={submitting || !category || !description.trim()} style={{ flex: 1 }}>
              {submitting ? 'Sending…' : 'Send Report'}
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
