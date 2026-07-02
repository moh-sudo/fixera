import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  listCrew, addCrewMember, updateCrewMember,
  setCrewStatus, deleteCrewMember,
  POSITION_OPTIONS, positionLabel, positionIcon,
} from '../../services/crewService';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  red: '#EF4444', redSoft: '#FEF2F2',
  navy: '#0A1628',
};

const CREW_ROLES = ['mover', 'vendor', 'water_carrier', 'supplier', 'rider'];

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 8,
  background: CL.bg, border: `1px solid ${CL.border}`,
  fontSize: 12, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0,
};

const fieldLabel = {
  display: 'block', color: CL.muted, fontSize: 12, fontWeight: 600,
  marginBottom: 6, letterSpacing: 0.3,
};

export default function CrewManagementPage() {
  const { user, profile } = useAuth();

  const partnerType =
    profile?.partner_role === 'rider' ? 'water_carrier' :
    profile?.partner_role || 'mover';

  const [crew, setCrew]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listCrew(user.id);
      setCrew(rows); setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load crew. Make sure the partner_crew_members table is created in Supabase.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleSaved = async () => { setShowForm(false); setEditing(null); await load(); };
  const positions   = POSITION_OPTIONS[partnerType] || POSITION_OPTIONS.mover;
  const active      = crew.filter(c => c.status === 'active');
  const inactive    = crew.filter(c => c.status !== 'active');

  if (showForm || editing) {
    return (
      <CrewMemberForm
        partnerUserId={user.id}
        partnerType={partnerType}
        positions={positions}
        editing={editing}
        onCancel={() => { setShowForm(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>👥 My Crew</div>
        <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>
          Workers you employ. Fixera keeps every name + ID + photo on permanent file for safety.
        </div>
      </div>

      {/* Safety notice */}
      <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.5 }}>
          <strong style={{ color: CL.gold }}>Customer safety guarantee:</strong> Every worker you
          register here is permanently on Fixera's file. When you assign someone to a job —
          even temporarily — Fixera already has their identity on record.
        </div>
      </div>

      <button onClick={() => setShowForm(true)} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        background: CL.text, color: '#fff', border: 'none',
        fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 18, fontFamily: 'inherit',
      }}>+ Add Crew Member</button>

      {loading && <div style={{ textAlign: 'center', color: CL.muted, padding: 32 }}>Loading crew…</div>}

      {error && (
        <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 12, padding: 14, color: CL.red, fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {!loading && crew.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: CL.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: CL.text, marginBottom: 6 }}>No crew yet</div>
          <div style={{ fontSize: 13 }}>Add your first worker to start accepting jobs.</div>
        </div>
      )}

      {active.length > 0 && (
        <>
          <SectionHeader title={`Active (${active.length})`} />
          {active.map(c => (
            <CrewCard key={c.id} member={c} partnerType={partnerType}
              onEdit={() => setEditing(c)}
              onToggle={async () => { await setCrewStatus(c.id, 'inactive'); await load(); }}
              onDelete={async () => { if (confirm(`Delete ${c.full_name} from crew?`)) { await deleteCrewMember(c.id); await load(); } }}
            />
          ))}
        </>
      )}

      {inactive.length > 0 && (
        <>
          <SectionHeader title={`Inactive (${inactive.length})`} />
          {inactive.map(c => (
            <CrewCard key={c.id} member={c} partnerType={partnerType}
              onEdit={() => setEditing(c)}
              onToggle={async () => { await setCrewStatus(c.id, 'active'); await load(); }}
              onDelete={async () => { if (confirm(`Delete ${c.full_name} from crew?`)) { await deleteCrewMember(c.id); await load(); } }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', margin: '14px 0 10px' }}>
      {title}
    </div>
  );
}

function CrewCard({ member, partnerType, onEdit, onToggle, onDelete }) {
  const isLead = ['team_leader', 'supervisor'].includes(member.default_position);
  return (
    <div style={{
      background: CL.surface,
      border: `1px solid ${isLead ? CL.goldBorder : CL.border}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 10,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: member.photo_url ? 'transparent' : CL.bg,
        border: `2px solid ${isLead ? CL.gold : CL.border}`,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
      }}>
        {member.photo_url
          ? <img src={member.photo_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '👤'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ color: CL.text, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.full_name}
          </span>
          {isLead && (
            <span style={{ background: CL.gold, color: CL.navy, fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 999, letterSpacing: 0.4 }}>
              ⭐ SUPERVISOR
            </span>
          )}
          {member.fixera_verified && (
            <span style={{ background: CL.greenSoft, color: CL.green, fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 999, letterSpacing: 0.4 }}>
              ✓ VERIFIED
            </span>
          )}
        </div>
        <div style={{ color: CL.muted, fontSize: 12 }}>
          {positionIcon(partnerType, member.default_position)} {positionLabel(partnerType, member.default_position)}
        </div>
        <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
          ID: {member.national_id}{member.phone ? ` · ${member.phone}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={onEdit}   style={iconBtnStyle}>✏️</button>
        <button onClick={onToggle} style={iconBtnStyle}>{member.status === 'active' ? '⏸️' : '▶️'}</button>
        <button onClick={onDelete} style={iconBtnStyle}>🗑️</button>
      </div>
    </div>
  );
}

function CrewMemberForm({ partnerUserId, partnerType, positions, editing, onCancel, onSaved }) {
  const fileRef = useRef(null);
  const [fullName,   setFullName]   = useState(editing?.full_name || '');
  const [nationalId, setNationalId] = useState(editing?.national_id || '');
  const [phone,      setPhone]      = useState(editing?.phone || '');
  const [position,   setPosition]   = useState(editing?.default_position || positions[0]?.id || '');
  const [photoFile,  setPhotoFile]  = useState(null);
  const [preview,    setPreview]    = useState(editing?.photo_url || '');
  const [notes,      setNotes]      = useState(editing?.notes || '');
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhotoFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setErr('');
    if (!fullName.trim() || !nationalId.trim() || !position) {
      setErr('Full name, National ID and Position are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name:        fullName.trim(),
        national_id:      nationalId.trim(),
        phone:            phone.trim(),
        default_position: position,
        notes:            notes.trim(),
      };
      if (editing) await updateCrewMember(editing.id, partnerUserId, payload, photoFile);
      else         await addCrewMember(partnerUserId, partnerType, payload, photoFile);
      onSaved();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Could not save crew member.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 600, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 16, cursor: 'pointer' }}>←</button>
        <div style={{ color: CL.text, fontSize: 20, fontWeight: 900 }}>
          {editing ? 'Edit Crew Member' : 'Add Crew Member'}
        </div>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        <div onClick={() => fileRef.current?.click()} style={{
          width: 110, height: 110, borderRadius: '50%',
          border: `2px dashed ${CL.goldBorder}`, background: CL.bg,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {preview
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: CL.gold, fontSize: 12, fontWeight: 700 }}>📷<br />Add Photo</div>}
        </div>
      </div>

      <Field label="Full Name *"   value={fullName}   onChange={setFullName}   placeholder="e.g. Ahmed Mwangi" />
      <Field label="National ID *" value={nationalId} onChange={setNationalId} placeholder="e.g. 12345678" />
      <Field label="Phone"         value={phone}      onChange={setPhone}      placeholder="07XX XXX XXX" />

      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>Position *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {positions.map(p => {
            const sel = position === p.id;
            return (
              <div key={p.id} onClick={() => setPosition(p.id)} style={{
                background: sel ? CL.goldSoft : CL.surface,
                border: `1px solid ${sel ? CL.goldBorder : CL.border}`,
                borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span style={{ color: sel ? CL.gold : CL.muted, fontSize: 12, fontWeight: 600 }}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Field label="Notes (optional)" value={notes} onChange={setNotes} placeholder="e.g. Speaks English & Swahili" multiline />

      {err && (
        <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 12, color: CL.red, fontSize: 13, marginBottom: 14 }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: CL.surface, color: CL.muted, border: `1px solid ${CL.border}`, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: 12, background: CL.text, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add to Crew')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={fieldLabel}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{
          width: '100%', background: CL.surface, border: `1px solid ${CL.border}`,
          borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14,
          fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
        }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width: '100%', background: CL.surface, border: `1px solid ${CL.border}`,
          borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14,
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
        }} />
      )}
    </div>
  );
}

export { CREW_ROLES };
