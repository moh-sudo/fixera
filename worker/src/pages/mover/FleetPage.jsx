import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  listFleet, addVehicle, updateVehicle, setVehicleStatus, deleteVehicle,
  uploadVehiclePhotos, uploadLogbook, uploadInsuranceDoc,
  VEHICLE_TYPES, vehicleTypeMeta, insuranceStatus,
} from '../../services/fleetService';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6',
  red: '#EF4444', redSoft: '#FEF2F2',
  purple: '#8B5CF6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
  navy: '#0A1628',
};

const iconBtn = {
  width: 28, height: 28, borderRadius: 8,
  background: CL.bg, border: `1px solid ${CL.border}`,
  fontSize: 12, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0,
};

const fieldLabel = {
  display: 'block', color: CL.muted, fontSize: 12, fontWeight: 600,
  marginBottom: 6, letterSpacing: 0.3,
};

export default function FleetPage() {
  const { user } = useAuth();
  const [fleet, setFleet]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showForm, setShow]   = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listFleet(user.id);
      setFleet(rows); setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load fleet. Make sure the mover_vehicles table is created in Supabase.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleSaved = async () => { setShow(false); setEditing(null); await load(); };

  if (showForm || editing) {
    return <VehicleForm moverUserId={user.id} editing={editing} onCancel={() => { setShow(false); setEditing(null); }} onSaved={handleSaved} />;
  }

  const active   = fleet.filter(v => v.status === 'active');
  const inactive = fleet.filter(v => v.status !== 'active');

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>🚚 My Fleet</div>
        <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>
          Register every vehicle you use for moves. Quotes pull plate # from here.
        </div>
      </div>

      {/* Safety notice */}
      <div style={{
        background: CL.purpleSoft, border: `1px solid ${CL.purpleBorder}`,
        borderRadius: 12, padding: '12px 14px', marginBottom: 16,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.5 }}>
          <strong style={{ color: CL.purple }}>Legal:</strong> Each vehicle needs
          valid liability insurance (min KSh 10M). Per Fixera Mover Agreement §1031,
          insurance lapse = immediate suspension until renewed.
        </div>
      </div>

      <button onClick={() => setShow(true)} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        background: CL.purple, color: '#fff', border: 'none',
        fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 18, fontFamily: 'inherit',
      }}>+ Register Vehicle</button>

      {loading && <div style={{ textAlign: 'center', color: CL.muted, padding: 32 }}>Loading fleet…</div>}

      {error && (
        <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 12, padding: 14, color: CL.red, fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {!loading && fleet.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: CL.muted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: CL.text, marginBottom: 6 }}>No vehicles yet</div>
          <div style={{ fontSize: 13 }}>Register your first vehicle to start accepting moving jobs.</div>
        </div>
      )}

      {active.length > 0 && (
        <>
          <SectionHeader title={`Active (${active.length})`} />
          {active.map(v => (
            <VehicleCard key={v.id} vehicle={v}
              onEdit={() => setEditing(v)}
              onToggle={async () => { await setVehicleStatus(v.id, 'maintenance'); await load(); }}
              onDelete={async () => { if (confirm(`Delete ${v.plate_number}?`)) { await deleteVehicle(v.id); await load(); } }}
            />
          ))}
        </>
      )}

      {inactive.length > 0 && (
        <>
          <SectionHeader title={`Inactive / Maintenance (${inactive.length})`} />
          {inactive.map(v => (
            <VehicleCard key={v.id} vehicle={v}
              onEdit={() => setEditing(v)}
              onToggle={async () => { await setVehicleStatus(v.id, 'active'); await load(); }}
              onDelete={async () => { if (confirm(`Delete ${v.plate_number}?`)) { await deleteVehicle(v.id); await load(); } }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{
      color: CL.purple, fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
      textTransform: 'uppercase', margin: '14px 0 10px',
    }}>{title}</div>
  );
}

function VehicleCard({ vehicle, onEdit, onToggle, onDelete }) {
  const meta = vehicleTypeMeta(vehicle.vehicle_type);
  const ins  = insuranceStatus(vehicle.insurance_expiry);

  return (
    <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14,
          background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
        }}>{meta.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
            {vehicle.fixera_verified && (
              <span style={{ background: CL.greenSoft, color: CL.green, fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 999 }}>
                ✓ VERIFIED
              </span>
            )}
          </div>
          <div style={{
            display: 'inline-block', padding: '3px 10px',
            background: '#FFFFFF', color: '#000', fontSize: 13, fontWeight: 800,
            borderRadius: 6, letterSpacing: 2, fontFamily: 'monospace',
            border: `1px solid ${CL.border}`,
          }}>{vehicle.plate_number}</div>
          {(vehicle.make || vehicle.model || vehicle.year) && (
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>
              {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
              {vehicle.color && ` · ${vehicle.color}`}
              {vehicle.capacity_tons && ` · ${vehicle.capacity_tons}t`}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onEdit}   style={iconBtn}>✏️</button>
          <button onClick={onToggle} style={iconBtn}>{vehicle.status === 'active' ? '⏸️' : '▶️'}</button>
          <button onClick={onDelete} style={iconBtn}>🗑️</button>
        </div>
      </div>

      {/* Insurance */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: `${ins.color}15`, border: `1px solid ${ins.color}40`,
        borderRadius: 8, padding: '6px 10px', marginBottom: vehicle.photo_urls?.length ? 10 : 0,
      }}>
        <span style={{ fontSize: 13 }}>🛡️</span>
        <span style={{ color: ins.color, fontSize: 11, fontWeight: 700 }}>Insurance: {ins.label}</span>
        {vehicle.insurance_provider && (
          <span style={{ color: CL.muted, fontSize: 10, marginLeft: 'auto' }}>{vehicle.insurance_provider}</span>
        )}
      </div>

      {/* Photos */}
      {Array.isArray(vehicle.photo_urls) && vehicle.photo_urls.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {vehicle.photo_urls.slice(0, 6).map((url, i) => (
            <img key={i} src={url} alt={`vehicle photo ${i+1}`}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleForm({ moverUserId, editing, onCancel, onSaved }) {
  const photosRef    = useRef(null);
  const logbookRef   = useRef(null);
  const insuranceRef = useRef(null);

  const [vehicleType, setVehicleType] = useState(editing?.vehicle_type || 'truck-3t');
  const [plate, setPlate]             = useState(editing?.plate_number || '');
  const [make, setMake]               = useState(editing?.make   || '');
  const [model, setModel]             = useState(editing?.model  || '');
  const [year, setYear]               = useState(editing?.year   || '');
  const [color, setColor]             = useState(editing?.color  || '');
  const [capacity, setCapacity]       = useState(editing?.capacity_tons || vehicleTypeMeta(editing?.vehicle_type || 'truck-3t').capacityTons || '');

  const [photos, setPhotos]           = useState([]);
  const [photoPreviews, setPP]        = useState(editing?.photo_urls || []);
  const [logbookFile, setLogbook]     = useState(null);
  const [logbookName, setLogbookName] = useState(editing?.logbook_url ? 'Current logbook on file' : '');

  const [insProv, setInsProv]   = useState(editing?.insurance_provider      || '');
  const [insNum, setInsNum]     = useState(editing?.insurance_policy_number || '');
  const [insExpiry, setInsExp]  = useState(editing?.insurance_expiry        || '');
  const [insFile, setInsFile]   = useState(null);
  const [insFileName, setInsFN] = useState(editing?.insurance_doc_url ? 'Current insurance on file' : '');

  const [notes, setNotes]   = useState(editing?.notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const onTypeChange = (t) => {
    setVehicleType(t);
    if (!editing) {
      const meta = VEHICLE_TYPES.find(v => v.id === t);
      if (meta) setCapacity(meta.capacityTons);
    }
  };

  const handlePhotosPick = (e) => {
    const files = Array.from(e.target.files).slice(0, 6);
    setPhotos(prev => [...prev, ...files].slice(0, 6));
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPP(prev => [...prev, ...newPreviews].slice(0, 6));
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPP(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setErr('');
    if (!vehicleType || !plate.trim()) { setErr('Vehicle Type and Plate Number are required.'); return; }
    setSaving(true);
    try {
      let uploadedPhotoUrls = editing ? photoPreviews.filter(u => u.startsWith('http')) : [];
      if (photos.length > 0) {
        const newUrls = await uploadVehiclePhotos(moverUserId, photos);
        uploadedPhotoUrls = [...uploadedPhotoUrls, ...newUrls];
      }
      let logbookUrl      = editing?.logbook_url || null;
      if (logbookFile) logbookUrl = await uploadLogbook(moverUserId, logbookFile);
      let insuranceDocUrl = editing?.insurance_doc_url || null;
      if (insFile) insuranceDocUrl = await uploadInsuranceDoc(moverUserId, insFile);

      const payload = {
        vehicle_type:            vehicleType,
        plate_number:            plate.trim().toUpperCase(),
        make:                    make.trim(),
        model:                   model.trim(),
        year:                    year ? Number(year) : null,
        color:                   color.trim(),
        capacity_tons:           capacity ? Number(capacity) : null,
        photo_urls:              uploadedPhotoUrls,
        logbook_url:             logbookUrl,
        insurance_provider:      insProv.trim(),
        insurance_policy_number: insNum.trim(),
        insurance_expiry:        insExpiry || null,
        insurance_doc_url:       insuranceDocUrl,
        notes:                   notes.trim(),
      };
      if (editing) await updateVehicle(editing.id, payload);
      else         await addVehicle(moverUserId, payload);
      onSaved();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Could not save vehicle.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 640, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <button onClick={onCancel} style={{
          width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`,
          background: CL.surface, color: CL.text, fontSize: 16, cursor: 'pointer',
        }}>←</button>
        <div style={{ color: CL.text, fontSize: 20, fontWeight: 900 }}>
          {editing ? 'Edit Vehicle' : 'Register Vehicle'}
        </div>
      </div>

      {/* Vehicle Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>Vehicle Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
          {VEHICLE_TYPES.map(v => {
            const sel = vehicleType === v.id;
            return (
              <div key={v.id} onClick={() => onTypeChange(v.id)} style={{
                background: sel ? `${v.color}20` : CL.surface,
                border: `2px solid ${sel ? v.color : CL.border}`,
                borderRadius: 12, padding: '12px 6px', cursor: 'pointer', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{v.icon}</div>
                <div style={{ color: sel ? v.color : CL.text, fontSize: 11, fontWeight: 700 }}>{v.label}</div>
                <div style={{ color: CL.muted, fontSize: 9, marginTop: 2 }}>{v.capacityTons}t</div>
              </div>
            );
          })}
        </div>
      </div>

      <Field label="Plate Number *" value={plate} onChange={setPlate} placeholder="e.g. KDA 234B" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Make"  value={make}  onChange={setMake}  placeholder="Toyota" />
        <Field label="Model" value={model} onChange={setModel} placeholder="Hilux" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="Year"          value={year}     onChange={setYear}     placeholder="2020" type="number" />
        <Field label="Color"         value={color}    onChange={setColor}    placeholder="White" />
        <Field label="Capacity (t)"  value={capacity} onChange={setCapacity} placeholder="3"    type="number" />
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 18 }}>
        <label style={fieldLabel}>Vehicle Photos (up to 6 — recommend 4 sides + interior)</label>
        <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotosPick} style={{ display: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
          {photoPreviews.map((url, i) => (
            <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', border: `1px solid ${CL.border}` }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removePhoto(i)} style={{
                position: 'absolute', top: 3, right: 3, width: 20, height: 20,
                borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))}
          {photoPreviews.length < 6 && (
            <div onClick={() => photosRef.current?.click()} style={{
              aspectRatio: '1', borderRadius: 8, border: `2px dashed ${CL.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: CL.surface,
            }}>
              <div style={{ fontSize: 18 }}>📷</div>
              <div style={{ color: CL.muted, fontSize: 9, marginTop: 2 }}>Add</div>
            </div>
          )}
        </div>
      </div>

      {/* Insurance */}
      <div style={{ background: CL.purpleSoft, border: `1px solid ${CL.purpleBorder}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div style={{ color: CL.purple, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🛡️ Liability Insurance</div>
        <Field label="Provider"    value={insProv}   onChange={setInsProv}   placeholder="e.g. Britam, Jubilee" />
        <Field label="Policy #"    value={insNum}    onChange={setInsNum}    placeholder="Policy / cover number" />
        <Field label="Expiry Date" value={insExpiry} onChange={setInsExp}    type="date" />
        <UploadRow label="Insurance Certificate (PDF / image)" fileName={insFileName} onPick={(f) => { setInsFile(f); setInsFN(f.name); }} inputRef={insuranceRef} accept=".pdf,image/*" />
      </div>

      {/* Logbook */}
      <UploadRow label="Logbook / Vehicle Registration" fileName={logbookName} onPick={(f) => { setLogbook(f); setLogbookName(f.name); }} inputRef={logbookRef} accept=".pdf,image/*" />

      <Field label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any extra detail Fixera should know" multiline />

      {err && (
        <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 12, color: CL.red, fontSize: 13, marginBottom: 14 }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 12, background: CL.surface, color: CL.muted, border: `1px solid ${CL.border}`, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: 12, background: CL.purple, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Register Vehicle')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={fieldLabel}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{
          width: '100%', background: CL.surface, border: `1px solid ${CL.border}`,
          borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14,
          fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
        }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
          width: '100%', background: CL.surface, border: `1px solid ${CL.border}`,
          borderRadius: 10, padding: '12px 14px', color: CL.text, fontSize: 14,
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
        }} />
      )}
    </div>
  );
}

function UploadRow({ label, fileName, onPick, inputRef, accept }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={fieldLabel}>{label}</label>
      <input ref={inputRef} type="file" accept={accept} onChange={e => e.target.files[0] && onPick(e.target.files[0])} style={{ display: 'none' }} />
      <div onClick={() => inputRef.current?.click()} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: CL.surface, border: `1px dashed ${CL.border}`,
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 18 }}>📎</span>
        <span style={{ color: fileName ? CL.text : CL.muted, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName || 'Tap to upload'}
        </span>
        {fileName && <span style={{ color: CL.green, fontSize: 12 }}>✓</span>}
      </div>
    </div>
  );
}
