import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getSettings, updateSettings, uploadBranding, uploadAvatar,
  updateProfile, changeEmail, changePassword,
  listFactors, enrollTotp, verifyTotp, unenrollTotp,
  listAdmins, grantAdminByEmail, revokeAdmin, logAction, listAudit,
} from '../../services/settingsService';

const TABS = [
  { id: 'profile',  label: '👤 My Profile' },
  { id: 'security', label: '🔐 Security & 2FA' },
  { id: 'company',  label: '🏢 Company' },
  { id: 'finance',  label: '💰 Finance' },
  { id: 'policies', label: '📋 Policies' },
  { id: 'team',     label: '👥 Admin Team' },
  { id: 'notify',   label: '🔔 Notifications' },
  { id: 'audit',    label: '🗒️ Audit Log' },
];

const ROLES = ['worker','rider','vendor','supplier','mover','water_carrier'];

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { getSettings(true).then(setSettings); }, []);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const saveSettings = async (patch, action) => {
    const updated = await updateSettings(patch);
    setSettings(updated);
    if (action) logAction(profile, action);
    flash('Saved ✓');
  };

  return (
    <>
      <div className="page-heading"><h1>Settings</h1><p>Manage your account, company, finance and platform configuration</p></div>

      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="mb-3" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="btn btn-sm"
            style={{ fontWeight:700, background: tab===t.id?'#C9A020':'#fff', color: tab===t.id?'#0A0E1A':'#555', border:'1px solid #e3e6f0' }}>
            {t.label}
          </button>
        ))}
      </div>

      {!settings ? <div className="text-center py-5"><div className="sb-spinner" /></div> : (
        <div className="admin-card"><div className="card-body">
          {tab === 'profile'  && <ProfileTab user={user} profile={profile} flash={flash} />}
          {tab === 'security' && <SecurityTab flash={flash} />}
          {tab === 'company'  && <CompanyTab settings={settings} save={saveSettings} flash={flash} />}
          {tab === 'finance'  && <FinanceTab settings={settings} save={saveSettings} />}
          {tab === 'policies' && <PoliciesTab settings={settings} save={saveSettings} />}
          {tab === 'team'     && <TeamTab actor={profile} flash={flash} />}
          {tab === 'notify'   && <NotifyTab settings={settings} save={saveSettings} />}
          {tab === 'audit'    && <AuditTab />}
        </div></div>
      )}
    </>
  );
}

// ── Reusable field ──
function Field({ label, value, onChange, type='text', placeholder, half }) {
  return (
    <div className={half ? 'col-md-6 mb-3' : 'col-12 mb-3'}>
      <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>{label}</label>
      <input type={type} className="form-control" value={value || ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}
const Save = ({ onClick, children='Save Changes' }) => (
  <button onClick={onClick} className="btn btn-warning font-weight-bold" style={{ background:'#C9A020', border:'none', color:'#0A0E1A' }}>{children}</button>
);

// ── PROFILE ──
function ProfileTab({ user, profile, flash }) {
  const [name, setName]   = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pw, setPw]       = useState('');
  const [avatar, setAvatar] = useState(profile?.avatar_url || '');
  const fileRef = useRef(null);

  const onPic = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const url = await uploadAvatar(user.id, f);
    await updateProfile(user.id, { avatar_url: url }); setAvatar(url); flash('Photo updated ✓');
  };
  return (
    <div className="row">
      <div className="col-12 mb-4 d-flex align-items-center" style={{ gap:16 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>
          {avatar ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPic} style={{ display:'none' }} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => fileRef.current?.click()}>Change Photo</button>
        </div>
      </div>
      <Field label="Full Name" value={name} onChange={setName} half />
      <Field label="Phone" value={phone} onChange={setPhone} half />
      <div className="col-12 mb-3">
        <Save onClick={async () => { await updateProfile(user.id, { full_name:name, phone }); flash('Profile saved ✓'); }}>Save Profile</Save>
      </div>
      <div className="col-12"><hr /></div>
      <Field label="Email" value={email} onChange={setEmail} type="email" half />
      <div className="col-md-6 mb-3 d-flex align-items-end">
        <button className="btn btn-outline-warning" onClick={async () => { try { await changeEmail(email); flash('Confirmation link sent to new email'); } catch(e){ alert(e.message);} }}>Change Email</button>
      </div>
      <Field label="New Password" value={pw} onChange={setPw} type="password" placeholder="Min 6 characters" half />
      <div className="col-md-6 mb-3 d-flex align-items-end">
        <button className="btn btn-outline-warning" onClick={async () => { if(pw.length<6){alert('Min 6 chars');return;} try { await changePassword(pw); setPw(''); flash('Password changed ✓'); } catch(e){ alert(e.message);} }}>Update Password</button>
      </div>
    </div>
  );
}

// ── SECURITY / 2FA ──
function SecurityTab({ flash }) {
  const [factors, setFactors] = useState([]);
  const [enroll, setEnroll]   = useState(null); // { id, totp }
  const [code, setCode]       = useState('');
  const load = () => listFactors().then(setFactors);
  useEffect(() => { load(); }, []);

  const start = async () => { try { setEnroll(await enrollTotp()); } catch(e){ alert(e.message); } };
  const confirm = async () => {
    try { await verifyTotp(enroll.id, code); setEnroll(null); setCode(''); load(); flash('2FA enabled ✓'); }
    catch(e){ alert(e.message || 'Invalid code'); }
  };
  return (
    <div>
      <h5 className="font-weight-bold mb-3">Two-Factor Authentication (2FA)</h5>
      {factors.filter(f => f.status === 'verified').length > 0 ? (
        <div>
          <div className="alert alert-success">✅ 2FA is enabled on your account.</div>
          {factors.map(f => (
            <button key={f.id} className="btn btn-sm btn-outline-danger" onClick={async () => { await unenrollTotp(f.id); load(); flash('2FA disabled'); }}>Disable 2FA</button>
          ))}
        </div>
      ) : enroll ? (
        <div>
          <p className="text-sm text-gray-600">Scan this QR with Google Authenticator / Authy, then enter the 6-digit code.</p>
          <div dangerouslySetInnerHTML={{ __html: enroll.totp?.qr_code || '' }} style={{ maxWidth:200 }} />
          <p className="text-xs text-gray-500">Or enter key: <code>{enroll.totp?.secret}</code></p>
          <div style={{ maxWidth:240 }} className="d-flex gap-2">
            <input className="form-control" value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
            <button className="btn btn-warning" onClick={confirm} style={{ background:'#C9A020', border:'none' }}>Verify</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600">Add an extra layer of security with an authenticator app.</p>
          <button className="btn btn-warning font-weight-bold" style={{ background:'#C9A020', border:'none', color:'#0A0E1A' }} onClick={start}>Enable 2FA</button>
        </div>
      )}
    </div>
  );
}

// ── COMPANY ──
function CompanyTab({ settings, save, flash }) {
  const [s, setS] = useState(settings);
  const logoRef = useRef(null);
  const set = (k,v) => setS(p => ({ ...p, [k]: v }));
  const onLogo = async (e) => { const f = e.target.files[0]; if(!f) return; const url = await uploadBranding(f,'logo'); set('logo_url',url); await save({ logo_url:url }, 'Updated logo'); };
  return (
    <div className="row">
      <div className="col-12 mb-4 d-flex align-items-center" style={{ gap:16 }}>
        <div style={{ width:90, height:90, borderRadius:12, background:'#f8f9fc', border:'1px solid #e3e6f0', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {s.logo_url ? <img src={s.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span className="text-gray-400">No logo</span>}
        </div>
        <div>
          <input ref={logoRef} type="file" accept="image/*" onChange={onLogo} style={{ display:'none' }} />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => logoRef.current?.click()}>Upload Business Logo</button>
          <div className="text-xs text-gray-500 mt-1">Shown on receipts, invoices & emails</div>
        </div>
      </div>
      <Field label="Company Name" value={s.company_name} onChange={v=>set('company_name',v)} half />
      <Field label="KRA PIN" value={s.kra_pin} onChange={v=>set('kra_pin',v)} half />
      <Field label="Registration No." value={s.reg_number} onChange={v=>set('reg_number',v)} half />
      <Field label="Brand Colour (hex)" value={s.brand_color} onChange={v=>set('brand_color',v)} half />
      <Field label="Address" value={s.address} onChange={v=>set('address',v)} />
      <Field label="Support Phone" value={s.support_phone} onChange={v=>set('support_phone',v)} half />
      <Field label="Support WhatsApp" value={s.support_whatsapp} onChange={v=>set('support_whatsapp',v)} half />
      <Field label="Support Email" value={s.support_email} onChange={v=>set('support_email',v)} half />
      <div className="col-12"><Save onClick={() => save({
        company_name:s.company_name, kra_pin:s.kra_pin, reg_number:s.reg_number, brand_color:s.brand_color,
        address:s.address, support_phone:s.support_phone, support_whatsapp:s.support_whatsapp, support_email:s.support_email,
      }, 'Updated company details')} /></div>
    </div>
  );
}

// ── FINANCE ──
function FinanceTab({ settings, save }) {
  const [rates, setRates] = useState(settings.commission_rates || {});
  const [s, setS] = useState(settings);
  const set = (k,v) => setS(p => ({ ...p, [k]: v }));
  return (
    <div className="row">
      <div className="col-12 mb-2"><h6 className="font-weight-bold text-gray-700">Commission Rates (%)</h6></div>
      {ROLES.map(r => (
        <div key={r} className="col-md-4 mb-3">
          <label className="text-xs font-weight-bold text-gray-600 text-uppercase">{r.replace(/_/g,' ')}</label>
          <input type="number" className="form-control" value={rates[r] ?? ''} onChange={e => setRates(p => ({ ...p, [r]: Number(e.target.value) }))} />
        </div>
      ))}
      <Field label="Wallet Minimum (KSh)" value={s.wallet_minimum} onChange={v=>set('wallet_minimum',v)} type="number" half />
      <div className="col-12"><hr /><h6 className="font-weight-bold text-gray-700">Fixera Collection Accounts</h6></div>
      <Field label="Bank Name" value={s.bank_name} onChange={v=>set('bank_name',v)} half />
      <Field label="Bank Account" value={s.bank_account} onChange={v=>set('bank_account',v)} half />
      <Field label="M-Pesa Number" value={s.collection_mpesa} onChange={v=>set('collection_mpesa',v)} half />
      <Field label="M-Pesa Paybill / Till" value={s.collection_paybill} onChange={v=>set('collection_paybill',v)} half />
      <div className="col-12"><Save onClick={() => save({
        commission_rates:rates, wallet_minimum:Number(s.wallet_minimum)||500,
        bank_name:s.bank_name, bank_account:s.bank_account, collection_mpesa:s.collection_mpesa, collection_paybill:s.collection_paybill,
      }, 'Updated finance settings')} /></div>
    </div>
  );
}

// ── POLICIES ──
function PoliciesTab({ settings, save }) {
  const c = settings.cancellation_policy || {};
  const [fee, setFee] = useState(c.fee ?? 100);
  const [win, setWin] = useState(c.window_hours ?? 2);
  return (
    <div className="row">
      <div className="col-12 mb-2"><h6 className="font-weight-bold text-gray-700">Cancellation Policy</h6></div>
      <Field label="Cancellation Fee (KSh)" value={fee} onChange={setFee} type="number" half />
      <Field label="Free-cancel window (hours)" value={win} onChange={setWin} type="number" half />
      <div className="col-12"><Save onClick={() => save({ cancellation_policy: { ...c, fee:Number(fee), window_hours:Number(win) } }, 'Updated policies')} /></div>
    </div>
  );
}

// ── TEAM ──
function TeamTab({ actor, flash }) {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail]   = useState('');
  const load = () => listAdmins().then(setAdmins);
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h6 className="font-weight-bold text-gray-700 mb-3">Admin Team</h6>
      <div className="d-flex gap-2 mb-3" style={{ maxWidth:480 }}>
        <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email of registered user to make admin" />
        <button className="btn btn-warning" style={{ background:'#C9A020', border:'none', whiteSpace:'nowrap' }}
          onClick={async () => { try { await grantAdminByEmail(email.trim()); setEmail(''); load(); logAction(actor,'Granted admin',email); flash('Admin added ✓'); } catch(e){ alert(e.message);} }}>+ Add Admin</button>
      </div>
      <table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th></th></tr></thead><tbody>
        {admins.map(a => (
          <tr key={a.id}>
            <td className="text-xs font-weight-bold">{a.full_name || '—'}</td>
            <td className="text-xs">{a.email}</td>
            <td><button className="btn btn-sm btn-outline-danger" onClick={async () => { if(confirm('Revoke admin access?')){ await revokeAdmin(a.id); load(); logAction(actor,'Revoked admin',a.email); } }}>Revoke</button></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}

// ── NOTIFY ──
function NotifyTab({ settings, save }) {
  const [p, setP] = useState(settings.notify_prefs || {});
  const OPTS = [['new_partner','New partner registrations'],['new_dispute','New disputes / support tickets'],['payout_request','Payout requests'],['product_approval','Product approval requests']];
  return (
    <div>
      <h6 className="font-weight-bold text-gray-700 mb-3">Email me about</h6>
      {OPTS.map(([k,l]) => (
        <div key={k} className="form-check mb-2">
          <input className="form-check-input" type="checkbox" id={k} checked={!!p[k]} onChange={e => setP(s => ({ ...s, [k]: e.target.checked }))} />
          <label className="form-check-label text-sm" htmlFor={k}>{l}</label>
        </div>
      ))}
      <div className="mt-3"><Save onClick={() => save({ notify_prefs: p }, 'Updated notification prefs')} /></div>
    </div>
  );
}

// ── AUDIT ──
function AuditTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { listAudit().then(setRows); }, []);
  return (
    <div>
      <h6 className="font-weight-bold text-gray-700 mb-3">Recent Admin Activity</h6>
      {rows.length === 0 ? <p className="text-gray-500 text-sm">No activity logged yet.</p> : (
        <table className="admin-table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString('en-KE')}</td>
              <td className="text-xs font-weight-bold">{r.actor_name}</td>
              <td className="text-xs">{r.action}</td>
              <td className="text-xs text-gray-600">{r.detail}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}
