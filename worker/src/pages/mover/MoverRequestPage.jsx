import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getMovingRequest, submitQuote, assignTeam, startMove,
  uploadLoadingPhotos, uploadDeliveryPhotos, markDelivered,
} from '../../services/moverService';
import useLiveLocation from '../../hooks/useLiveLocation';
import { listCrew, positionLabel, positionIcon } from '../../services/crewService';
import { listActiveFleet, vehicleTypeMeta } from '../../services/fleetService';
import VerificationBanner, { isApproved } from '../../components/VerificationBanner';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  purple: '#8B5CF6', purpleSoft: '#F5F3FF', purpleBorder: '#DDD6FE',
  amber: '#F59E0B', amberSoft: '#FFFBEB',
  navy: '#0A1628',
};

const primaryBtn = {
  padding: '13px 18px', borderRadius: 12,
  background: CL.text, color: '#fff', border: 'none',
  fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};
const ghostBtn = {
  padding: '13px 18px', borderRadius: 12,
  background: CL.bg, color: CL.muted,
  border: `1px solid ${CL.border}`, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};
const iconBtn = {
  width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`,
  background: CL.bg, color: CL.text, fontSize: 16,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Card({ children, style }) {
  return <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: 14, marginBottom: 12, ...style }}>{children}</div>;
}
function Row({ label, value, multiline }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', flexDirection: multiline ? 'column' : 'row' }}>
      <span style={{ color: CL.muted, fontSize: 11 }}>{label}</span>
      <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: multiline ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}
function FormField({ label, value, onChange, type = 'text', placeholder, multiline }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '11px 13px', color: CL.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', outline: 'none' }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '11px 13px', color: CL.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  );
}

function FleetPicker({ label, fleet, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 600, marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fleet.map(v => {
          const sel  = value === v.id;
          const meta = vehicleTypeMeta(v.vehicle_type);
          return (
            <div key={v.id} onClick={() => onChange(v.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: sel ? `${meta.color}15` : CL.bg,
              border: `1.5px solid ${sel ? meta.color : CL.border}`,
              borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}20`, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{meta.label}</div>
                <div style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', background: '#FFFFFF', color: '#000', fontSize: 11, fontWeight: 800, borderRadius: 5, letterSpacing: 1.5, fontFamily: 'monospace', border: `1px solid ${CL.border}` }}>{v.plate_number}</div>
              </div>
              {v.fixera_verified && <span style={{ background: CL.greenSoft, color: CL.green, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>✓</span>}
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? meta.color : CL.border}`, background: sel ? meta.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>{sel && '✓'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoFleetCTA({ onGo }) {
  return (
    <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ color: CL.red, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No vehicles registered yet</div>
      <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10 }}>Register at least one vehicle so you can quote moves.</div>
      <button onClick={onGo} style={primaryBtn}>Go to Fleet →</button>
    </div>
  );
}

export default function MoverRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [request, setRequest] = useState(null);
  const [crew, setCrew]       = useState([]);
  const [fleet, setFleet]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [showQuote, setShowQuote]           = useState(false);
  const [price, setPrice]                   = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [workers, setWorkers]               = useState(3);
  const [eta, setEta]                       = useState('Tomorrow 8 AM');
  const [message, setMessage]               = useState('');
  const [saving, setSaving]                 = useState(false);

  const [showAssign, setShowAssign]         = useState(false);
  const [pickedCrew, setPickedCrew]         = useState([]);
  const [assignedVehicleId, setAssignedVehicleId] = useState('');

  const loadingPhotosRef  = useRef(null);
  const deliveryPhotosRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useLiveLocation({
    userId: user?.id, movingRequestId: id,
    active: request?.status === 'in_progress',
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await getMovingRequest(id);
      setRequest(r);
      if (user) {
        const [c, f] = await Promise.all([
          listCrew(user.id).then(rows => rows.filter(x => x.status === 'active')),
          listActiveFleet(user.id),
        ]);
        setCrew(c); setFleet(f);
        if (f.length > 0) {
          if (!selectedVehicleId) setSelectedVehicleId(f[0].id);
          if (!assignedVehicleId && !r.assigned_vehicle_plate) setAssignedVehicleId(f[0].id);
        }
        if (r.assigned_vehicle_plate) {
          const match = f.find(v => v.plate_number === r.assigned_vehicle_plate);
          if (match) setAssignedVehicleId(match.id);
        }
      }
      setError(null);
    } catch (err) {
      console.error(err); setError('Could not load request.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id, user]);

  const handleSubmitQuote = async () => {
    if (!price || !selectedVehicleId) return;
    const v = fleet.find(x => x.id === selectedVehicleId);
    if (!v) return;
    setSaving(true);
    try {
      await submitQuote(id, user.id, {
        mover_name:    profile?.business_name || profile?.full_name || 'Mover',
        mover_rating:  profile?.rating || 4.5,
        price:         Number(price),
        vehicle_type:  vehicleTypeMeta(v.vehicle_type).label,
        vehicle_plate: v.plate_number,
        num_workers:   Number(workers),
        eta, message: message.trim(),
      });
      setShowQuote(false); await load();
      alert('Quote sent. Customer will review and respond.');
    } catch (err) { console.error(err); alert('Could not send quote. ' + (err.message || '')); }
    finally { setSaving(false); }
  };

  const togglePicked = (member) => {
    setPickedCrew(prev =>
      prev.find(p => p.id === member.id) ? prev.filter(p => p.id !== member.id) : [...prev, member]
    );
  };

  const handleAssignTeam = async () => {
    if (pickedCrew.length === 0 || !assignedVehicleId) return;
    const v = fleet.find(x => x.id === assignedVehicleId);
    if (!v) return;
    setSaving(true);
    try {
      const snapshot = pickedCrew.map(m => ({ name: m.full_name, role: m.default_position, photo_url: m.photo_url, phone: m.phone }));
      await assignTeam(id, {
        assigned_crew:          snapshot,
        assigned_vehicle_plate: v.plate_number,
        mover_company_name:     profile?.business_name || profile?.full_name || 'Mover',
        mover_phone:            profile?.phone || '',
      });
      setShowAssign(false); await load();
      alert('Team assigned. Customer can now see your crew.');
    } catch (err) { console.error(err); alert('Could not assign team. ' + (err.message || '')); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: CL.muted, background: CL.bg, minHeight: '100vh' }}>Loading…</div>;
  if (error || !request) return (
    <div style={{ padding: 32, textAlign: 'center', background: CL.bg, minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Request not found</div>
      <button onClick={() => navigate('/mover/dashboard')} style={primaryBtn}>Back to Dashboard</button>
    </div>
  );

  const inv = Array.isArray(request.inventory) ? request.inventory : [];
  const itemCount = inv.reduce((s, i) => s + (i.qty || 0), 0);
  const approved  = isApproved(profile);

  return (
    <div style={{ padding: '20px 16px 80px', maxWidth: 720, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <VerificationBanner />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navigate('/mover/dashboard')} style={iconBtn}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 900 }}>📦 Moving Request</div>
          <div style={{ color: CL.muted, fontSize: 11 }}>#{request.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      {/* Route */}
      <Card>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: CL.gold }} />
            <div style={{ width: 2, height: 28, background: CL.border }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: CL.blue }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: CL.muted, fontSize: 10 }}>PICKUP</div>
            <div style={{ color: CL.text, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{request.pickup_location}</div>
            <div style={{ color: CL.muted, fontSize: 10 }}>DESTINATION</div>
            <div style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{request.destination}</div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card>
        <Row label="Property"         value={request.property_type?.toUpperCase() || '—'} />
        <Row label="Customer prefers" value={request.vehicle_type || '—'} />
        {request.moving_date && <Row label="Moving date" value={request.moving_date} />}
        <Row label="Items" value={`${itemCount} items`} />
        {request.notes && <Row label="Notes" value={request.notes} multiline />}
      </Card>

      {/* Inventory */}
      {inv.length > 0 && (
        <Card>
          <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Inventory</div>
          {inv.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
              <span style={{ color: CL.muted }}>{item.item}</span>
              <span style={{ color: CL.text, fontWeight: 700 }}>x{item.qty}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Customer Photos */}
      {Array.isArray(request.photo_urls) && request.photo_urls.length > 0 && (
        <Card>
          <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Customer Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
            {request.photo_urls.map((url, i) => (
              <img key={i} src={url} alt={`Photo ${i+1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
            ))}
          </div>
        </Card>
      )}

      {/* Quote section */}
      {['awaiting_quotes', 'quoted'].includes(request.status) && !showQuote && (
        approved ? (
          <button onClick={() => setShowQuote(true)} style={{ ...primaryBtn, width: '100%', marginTop: 14 }}>
            💰 Send Quote
          </button>
        ) : (
          <Card style={{ background: CL.amberSoft, border: `1px solid ${CL.amberBorder}`, marginTop: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
            <div style={{ color: CL.amber, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Verification required</div>
            <div style={{ color: CL.muted, fontSize: 12 }}>
              You can browse requests, but quoting is locked until Fixera approves your account.
            </div>
          </Card>
        )
      )}

      {showQuote && (
        <Card>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Send Your Quote</div>
          {fleet.length === 0 ? (
            <NoFleetCTA onGo={() => navigate('/fleet')} />
          ) : (
            <>
              <FleetPicker label="Vehicle *" fleet={fleet} value={selectedVehicleId} onChange={setSelectedVehicleId} />
              <FormField label="Price (KSh) *"       value={price}   onChange={setPrice}   type="number" placeholder="e.g. 18500" />
              <FormField label="Number of Workers"   value={workers} onChange={setWorkers} type="number" />
              <FormField label="ETA"                 value={eta}     onChange={setEta}     placeholder="e.g. Tomorrow 8 AM" />
              <FormField label="Message to customer" value={message} onChange={setMessage} multiline placeholder="Anything they should know" />
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button onClick={() => setShowQuote(false)} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
                <button onClick={handleSubmitQuote} disabled={saving || !price || !selectedVehicleId}
                  style={{ ...primaryBtn, flex: 2, opacity: (saving || !price || !selectedVehicleId) ? 0.5 : 1 }}>
                  {saving ? 'Sending…' : 'Send Quote →'}
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Accepted: Team Assignment */}
      {request.status === 'accepted' && (
        <>
          <Card style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 28 }}>✅</div>
              <div>
                <div style={{ color: CL.green, fontSize: 15, fontWeight: 800 }}>Customer accepted your quote!</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>
                  Assign your team below so the customer can see who's coming.
                </div>
              </div>
            </div>
          </Card>

          {Array.isArray(request.assigned_crew) && request.assigned_crew.length > 0 ? (
            <Card>
              <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
                Assigned Team ({request.assigned_crew.length})
              </div>
              {request.assigned_crew.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.photo_url ? 'transparent' : CL.bg, border: `1px solid ${m.role === 'team_leader' ? CL.gold : CL.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                    <div style={{ color: CL.muted, fontSize: 11 }}>
                      {positionIcon('mover', m.role)} {positionLabel('mover', m.role)}
                    </div>
                  </div>
                  {m.role === 'team_leader' && <span style={{ background: CL.gold, color: CL.navy, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>⭐ SUPERVISOR</span>}
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setShowAssign(true)} style={{ ...ghostBtn, width: '100%' }}>Edit Team</button>
              </div>
            </Card>
          ) : (
            <button onClick={() => setShowAssign(true)} style={{ ...primaryBtn, width: '100%', marginTop: 14 }}>
              👥 Assign Team Now
            </button>
          )}

          {/* Loading verification */}
          {Array.isArray(request.assigned_crew) && request.assigned_crew.length > 0 && (
            <Card style={{ marginTop: 14, background: CL.purpleSoft, border: `1px solid ${CL.purpleBorder}` }}>
              <div style={{ color: CL.purple, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
                📸 Loading Verification — required before departure
              </div>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                Photograph the loaded cargo and your truck at the pickup location.
              </div>
              <input ref={loadingPhotosRef} type="file" accept="image/*" multiple capture="environment"
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  if (!files.length) return;
                  setUploading(true);
                  try { await uploadLoadingPhotos(user.id, id, files); await load(); }
                  catch (err) { console.error(err); alert('Photo upload failed.'); }
                  finally { setUploading(false); }
                }} style={{ display: 'none' }} />
              <button onClick={() => loadingPhotosRef.current?.click()} disabled={uploading}
                style={{ ...ghostBtn, width: '100%', marginBottom: 10 }}>
                {uploading ? 'Uploading…' : `📷 Add Loading Photos${(request.loading_photo_urls?.length || 0) > 0 ? ` (${request.loading_photo_urls.length})` : ''}`}
              </button>
              {Array.isArray(request.loading_photo_urls) && request.loading_photo_urls.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, marginBottom: 10 }}>
                  {request.loading_photo_urls.map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              )}
              <button
                onClick={async () => { await startMove(id); await load(); }}
                disabled={!(request.loading_photo_urls?.length > 0)}
                style={{ ...primaryBtn, width: '100%', opacity: (request.loading_photo_urls?.length > 0) ? 1 : 0.5 }}>
                🚚 Start Move (GPS begins)
              </button>
              {!(request.loading_photo_urls?.length > 0) && (
                <div style={{ color: CL.amber, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                  ⚠️ Upload at least 1 loading photo to start the move
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Team assignment modal */}
      {showAssign && (
        <Card>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Pick crew for this job</div>
          <div style={{ color: CL.muted, fontSize: 12, marginBottom: 12 }}>
            Only crew already registered with Fixera can be assigned. Tap to select.
          </div>
          {crew.length === 0 ? (
            <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ color: CL.red, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No crew registered yet</div>
              <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10 }}>Add your crew first so you can assign them to jobs.</div>
              <button onClick={() => navigate('/crew')} style={primaryBtn}>Go to Crew Dashboard →</button>
            </div>
          ) : (
            <>
              {crew.map(m => {
                const picked = pickedCrew.find(p => p.id === m.id);
                const isLead = m.default_position === 'team_leader';
                return (
                  <div key={m.id} onClick={() => togglePicked(m)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: picked ? `${CL.gold}15` : CL.bg,
                    border: `1px solid ${picked ? CL.gold : CL.border}`,
                    borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.photo_url ? 'transparent' : CL.surface, border: `1px solid ${isLead ? CL.gold : CL.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.photo_url ? <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{m.full_name}</div>
                      <div style={{ color: CL.muted, fontSize: 11 }}>
                        {positionIcon('mover', m.default_position)} {positionLabel('mover', m.default_position)}
                      </div>
                    </div>
                    {isLead && <span style={{ background: CL.gold, color: CL.navy, fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>⭐</span>}
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${picked ? CL.gold : CL.border}`, background: picked ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.navy, fontSize: 12, fontWeight: 800 }}>{picked && '✓'}</div>
                  </div>
                );
              })}
              {fleet.length === 0 ? (
                <NoFleetCTA onGo={() => navigate('/fleet')} />
              ) : (
                <FleetPicker label="Vehicle for this job *" fleet={fleet} value={assignedVehicleId} onChange={setAssignedVehicleId} />
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button onClick={() => setShowAssign(false)} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
                <button onClick={handleAssignTeam} disabled={saving || pickedCrew.length === 0 || !assignedVehicleId}
                  style={{ ...primaryBtn, flex: 2, opacity: (saving || !pickedCrew.length || !assignedVehicleId) ? 0.5 : 1 }}>
                  {saving ? 'Assigning…' : `Assign ${pickedCrew.length} Crew →`}
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* In progress */}
      {request.status === 'in_progress' && (
        <>
          <Card style={{ marginTop: 14, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}` }}>
            <div style={{ color: CL.green, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              📡 Live GPS broadcasting to customer
            </div>
            <div style={{ color: CL.muted, fontSize: 11 }}>
              The customer can watch your truck on a live map. Keep this page open during the drive.
            </div>
          </Card>
          <Card style={{ marginTop: 12 }}>
            <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
              📸 Delivery Verification — at the destination
            </div>
            <div style={{ color: CL.muted, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
              After unloading, photograph the delivered items. The customer will then check their inventory and sign off.
            </div>
            <input ref={deliveryPhotosRef} type="file" accept="image/*" multiple capture="environment"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (!files.length) return;
                setUploading(true);
                try { await uploadDeliveryPhotos(user.id, id, files); await load(); }
                catch (err) { console.error(err); alert('Photo upload failed.'); }
                finally { setUploading(false); }
              }} style={{ display: 'none' }} />
            <button onClick={() => deliveryPhotosRef.current?.click()} disabled={uploading}
              style={{ ...ghostBtn, width: '100%', marginBottom: 10 }}>
              {uploading ? 'Uploading…' : `📷 Add Delivery Photos${(request.delivery_photo_urls?.length || 0) > 0 ? ` (${request.delivery_photo_urls.length})` : ''}`}
            </button>
            {Array.isArray(request.delivery_photo_urls) && request.delivery_photo_urls.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, marginBottom: 10 }}>
                {request.delivery_photo_urls.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            )}
            <button
              onClick={async () => {
                if (confirm('Confirm everything is unloaded at the destination? The customer will be asked to verify and sign.')) {
                  await markDelivered(id); await load();
                }
              }}
              disabled={!(request.delivery_photo_urls?.length > 0)}
              style={{ ...primaryBtn, width: '100%', opacity: (request.delivery_photo_urls?.length > 0) ? 1 : 0.5 }}>
              ✅ Mark Delivered — request customer sign-off
            </button>
            {!(request.delivery_photo_urls?.length > 0) && (
              <div style={{ color: CL.amber, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
                ⚠️ Upload at least 1 delivery photo first
              </div>
            )}
          </Card>
        </>
      )}

      {/* Delivered: waiting */}
      {request.status === 'delivered' && (
        <Card style={{ marginTop: 14, background: CL.purpleSoft, border: `1px solid ${CL.purpleBorder}`, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
          <div style={{ color: CL.purple, fontSize: 14, fontWeight: 800 }}>Waiting for customer sign-off</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
            The customer is checking their inventory and signing on their phone.
            The job closes automatically once they confirm.
          </div>
        </Card>
      )}

      {/* Completed */}
      {request.status === 'completed' && (
        <Card style={{ marginTop: 14, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
          <div style={{ color: CL.green, fontSize: 16, fontWeight: 800 }}>Move Complete</div>
          {request.delivery_signature && (
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 6 }}>
              Signed by <strong style={{ color: CL.text }}>{request.delivery_signature}</strong>
              {request.delivery_signed_at && ` · ${new Date(request.delivery_signed_at).toLocaleString('en-KE')}`}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
