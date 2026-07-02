import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TERMS_VERSION, PRIVACY_VERSION } from '../../data/legalVersions';

const ROLES = [
  { id: 'worker',        label: 'Service Worker',    desc: 'Plumber, Electrician, Painter, Cleaner',           img: '/services/plumbing.webp' },
  { id: 'vendor',        label: 'Business / Vendor', desc: 'Laundry, Carpet Washing, Cleaning Station',        img: '/services/vendor-hero.jpg' },
  { id: 'rider',         label: 'Rider / Courier',   desc: 'Pickup & Delivery for laundry, carpets, products', img: '/services/riders.webp' },
  { id: 'supplier',      label: 'Supplier',          desc: 'Paint, Cleaning Products, Tools & Materials',      img: '/services/supplier-hero.webp' },
  { id: 'mover',         label: 'Mover',             desc: 'House moves, office relocation, item transport',   img: '/services/movers.webp' },
  { id: 'water_carrier', label: 'Water Carrier',     desc: 'Jerrycan, bulk water & bowser delivery',           img: '/services/water.webp' },
];

const WORKER_SERVICES   = ['Plumbing', 'Electrical', 'Cleaning', 'Painting'];
const BUSINESS_TYPES    = [
  { id: 'laundry',      label: 'Laundry Shop' },
  { id: 'carpet_wash',  label: 'Carpet Washing' },
  { id: 'sofa_clean',   label: 'Sofa & Upholstery' },
  { id: 'office_clean', label: 'Office Cleaning' },
  { id: 'curtain',      label: 'Curtain Cleaning' },
];
const VEHICLE_TYPES     = [
  { id: 'motorcycle', label: 'Motorcycle' },
  { id: 'tuk-tuk',   label: 'Tuk-Tuk' },
  { id: 'car',        label: 'Car / Van' },
  { id: 'bicycle',    label: 'Bicycle' },
];
const PRODUCT_CATEGORIES = [
  { id: 'paint',      label: 'Paint & Finishes' },
  { id: 'cleaning',   label: 'Cleaning Supplies' },
  { id: 'tools',      label: 'Tools & Equipment' },
  { id: 'plumbing',   label: 'Plumbing Materials' },
  { id: 'electrical', label: 'Electrical Materials' },
];
const WATER_SOURCES = [
  { id: 'borehole', label: 'Borehole' },
  { id: 'county',   label: 'County Supply' },
  { id: 'private',  label: 'Private Source' },
  { id: 'mixed',    label: 'Mixed Sources' },
];

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  error: '#C0392B', errorBg: '#FDF2F2', errorBorder: '#F5C6C6',
  success: '#1A7F3C', successBg: '#F0FAF4', successBorder: '#A3D9B3',
};

const fieldStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: `1px solid ${CL.border}`, background: CL.surface,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', color: CL.text, transition: 'border-color 0.18s',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: CL.text, marginBottom: 7 };

function ChipGrid({ options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {options.map(o => {
        const sel = value === (o.id || o);
        return (
          <div key={o.id || o} onClick={() => onChange(o.id || o)}
            style={{ padding: '11px 14px', borderRadius: 11, cursor: 'pointer', textAlign: 'center',
              background: sel ? CL.goldSoft : CL.surface,
              border: `1.5px solid ${sel ? CL.gold : CL.border}`,
              color: sel ? CL.gold : CL.muted, fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s' }}>
            {o.label || o}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [step, setStep]     = useState(0);
  const [role, setRole]     = useState('');
  const [form, setForm]     = useState({
    fullName: '', email: '', phone: '', password: '',
    service: '', businessName: '', businessType: '',
    vehicleType: '', productCategory: '',
    companyName: '', registrationNumber: '', taxPin: '',
    ownerNationalId: '', legalAcknowledged: false,
    yearsInOperation: '', serviceArea: '', waterSource: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [hoveredRole, setHoveredRole] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const roleConfig = ROLES.find(r => r.id === role);

  function isDetailsValid() {
    if (!form.fullName || !form.email || !form.phone || !form.password) return false;
    if (role === 'worker'        && !form.service)                                         return false;
    if (role === 'vendor'        && (!form.businessName || !form.businessType))            return false;
    if (role === 'rider'         && !form.vehicleType)                                     return false;
    if (role === 'supplier'      && !form.productCategory)                                 return false;
    if (role === 'mover') {
      if (!form.companyName || !form.registrationNumber || !form.taxPin) return false;
      if (!form.ownerNationalId) return false;
      if (!form.yearsInOperation || Number(form.yearsInOperation) < 2)   return false;
      if (!form.legalAcknowledged) return false;
    }
    if (role === 'water_carrier') {
      if (!form.companyName || !form.serviceArea || !form.waterSource) return false;
      if (!form.ownerNationalId)   return false;
      if (!form.legalAcknowledged) return false;
    }
    if (!agreedTerms || !agreedPrivacy) return false;
    return true;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!agreedTerms || !agreedPrivacy) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return; }
    setError(''); setLoading(true);
    try {
      const sharedBusinessName =
        role === 'vendor'        ? form.businessName
      : role === 'mover'         ? form.companyName
      : role === 'water_carrier' ? form.companyName
      : null;

      const registeredUser = await signUp(form.email, form.password, form.fullName, form.phone, {
        partner_role:        role,
        service:             role === 'worker'        ? form.service              : null,
        business_name:       sharedBusinessName,
        business_type:       role === 'vendor'        ? form.businessType         : null,
        vehicle_type:        role === 'rider'         ? form.vehicleType          : null,
        product_category:    role === 'supplier'      ? form.productCategory      : null,
        registration_number: role === 'mover'         ? form.registrationNumber   : null,
        tax_pin:             role === 'mover'         ? form.taxPin               : null,
        service_area:        role === 'water_carrier' ? form.serviceArea          : null,
        water_source:        role === 'water_carrier' ? form.waterSource          : null,
        owner_national_id:   ['mover','water_carrier'].includes(role) ? form.ownerNationalId : null,
        years_in_operation:  role === 'mover'         ? Number(form.yearsInOperation) : null,
      });
      if (registeredUser?.id) {
        const now = new Date().toISOString();
        const { supabase: sb } = await import('../../supabase').catch(() => ({}));
        if (sb) sb.from('workers').update({ terms_version: TERMS_VERSION, terms_accepted_at: now, privacy_version: PRIVACY_VERSION, privacy_accepted_at: now }).eq('id', registeredUser.id).then(() => {});
      }
      setDone(true);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  }

  // ── Done screen ───────────────────────────────────────────
  if (done) {
    const RoleIcon = roleConfig?.Icon;
    return (
      <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: CL.successBg, border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={36} color={CL.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: CL.text }}>Registration Submitted!</h2>
          <p style={{ margin: '0 0 20px', color: CL.muted, fontSize: 14, lineHeight: 1.6 }}>Check your email to confirm your account.</p>
          <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: '14px 18px', marginBottom: 24, color: CL.gold, fontSize: 13, fontWeight: 600 }}>
            {['vendor','supplier','mover','water_carrier'].includes(role)
              ? 'Your business account will be reviewed by our team before approval.'
              : 'Once confirmed, log in to complete your profile and start working.'}
          </div>
          <button onClick={() => navigate('/login')}
            style={{ width: '100%', padding: '15px 0', borderRadius: 12, background: CL.text, border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Go to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', padding: '24px 20px' }}>
      <style>{`.reg-input:focus { border-color: ${CL.gold} !important; box-shadow: 0 0 0 3px rgba(201,160,32,0.14); }`}</style>

      <div style={{ maxWidth: step === 0 ? 600 : 480, margin: '0 auto' }}>

        {/* Navy header banner */}
        <div style={{ background: '#0A1628', borderRadius: 20, padding: '28px 28px 24px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(201,160,32,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(201,160,32,0.05)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
            <button onClick={() => step === 0 ? navigate('/welcome') : setStep(0)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '6px 12px' }}>
              <ChevronLeft size={15} /> {step === 0 ? 'Back' : 'Change role'}
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 12px' }}>Step {step + 1} of 2</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <img src="/logo-mark.png" alt="Fixera" style={{ height: 44, width: 'auto' }} />
            <div>
              <div style={{ color: '#C9A020', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Partner Portal</div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                {step === 0 ? 'Choose your role' : `Registering as ${roleConfig?.label}`}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 20, position: 'relative' }}>
            <motion.div animate={{ width: step === 0 ? '50%' : '100%' }} transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #C9A020, #D4B033)', borderRadius: 2 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 0: ROLE SELECTION ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: CL.text }}>Join as a Partner</h1>
              <p style={{ margin: '0 0 28px', color: CL.muted, fontSize: 15 }}>Choose your role to get started</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                {ROLES.map(r => {
                  const sel = role === r.id;
                  return (
                    <motion.div key={r.id}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      onClick={() => setRole(r.id)}
                      onMouseEnter={() => setHoveredRole(r.id)}
                      onMouseLeave={() => setHoveredRole('')}
                      style={{ borderRadius: 16, cursor: 'pointer', overflow: 'hidden', position: 'relative', height: 140,
                        border: `3px solid ${sel ? CL.gold : hoveredRole === r.id ? 'rgba(201,160,32,0.5)' : 'transparent'}`,
                        boxShadow: sel ? '0 6px 24px rgba(201,160,32,0.3)' : hoveredRole === r.id ? '0 8px 28px rgba(10,22,40,0.2)' : '0 2px 8px rgba(10,22,40,0.1)',
                        transition: 'border 0.2s, box-shadow 0.2s' }}>
                      <img src={r.img} alt={r.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.3s' }} />
                      <div style={{ position: 'absolute', inset: 0, background: sel || hoveredRole === r.id ? 'linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.25) 100%)' : 'linear-gradient(to top, rgba(10,22,40,0.85) 0%, rgba(10,22,40,0.45) 100%)', transition: 'background 0.2s' }} />
                      {sel && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: CL.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#C9A020' : '#fff', marginBottom: 3 }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{r.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setStep(1)} disabled={!role}
                style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
                  background: role ? CL.text : CL.border,
                  color: role ? '#fff' : CL.muted,
                  fontSize: 15, fontWeight: 700, cursor: role ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                Continue as {ROLES.find(r => r.id === role)?.label || '…'}
              </motion.button>

              <p style={{ textAlign: 'center', marginTop: 20, color: CL.muted, fontSize: 14 }}>
                Already registered?{' '}
                <span onClick={() => navigate('/login')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer' }}>Sign In</span>
              </p>
            </motion.div>
          )}

          {/* ── STEP 1: DETAILS FORM ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

              {/* Role badge */}
              {roleConfig && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 20, padding: '6px 16px', marginBottom: 22 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={roleConfig.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ color: CL.gold, fontSize: 13, fontWeight: 700 }}>Registering as {roleConfig.label}</span>
                </div>
              )}

              <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: CL.text }}>Your details</h1>
              <p style={{ margin: '0 0 24px', color: CL.muted, fontSize: 14 }}>Fill in your information to create your account</p>

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Common fields */}
                <div>
                  <label style={labelStyle}>{role === 'vendor' ? 'Owner Full Name' : 'Full Name'}</label>
                  <input className="reg-input" style={fieldStyle} placeholder="John Mwangi" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input className="reg-input" style={fieldStyle} type="email" placeholder="john@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone (M-Pesa)</label>
                    <input className="reg-input" style={fieldStyle} type="tel" placeholder="0712 345 678" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="reg-input" style={{ ...fieldStyle, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: CL.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* ── WORKER ── */}
                {role === 'worker' && (
                  <div>
                    <label style={labelStyle}>Your Service</label>
                    <ChipGrid options={WORKER_SERVICES} value={form.service} onChange={v => set('service', v)} />
                  </div>
                )}

                {/* ── VENDOR ── */}
                {role === 'vendor' && (
                  <>
                    <div>
                      <label style={labelStyle}>Business Name</label>
                      <input className="reg-input" style={fieldStyle} placeholder="e.g. CleanPro Laundry" value={form.businessName} onChange={e => set('businessName', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Business Type</label>
                      <ChipGrid options={BUSINESS_TYPES} value={form.businessType} onChange={v => set('businessType', v)} />
                    </div>
                  </>
                )}

                {/* ── RIDER ── */}
                {role === 'rider' && (
                  <div>
                    <label style={labelStyle}>Vehicle Type</label>
                    <ChipGrid options={VEHICLE_TYPES} value={form.vehicleType} onChange={v => set('vehicleType', v)} />
                  </div>
                )}

                {/* ── SUPPLIER ── */}
                {role === 'supplier' && (
                  <div>
                    <label style={labelStyle}>Product Category</label>
                    <ChipGrid options={PRODUCT_CATEGORIES} value={form.productCategory} onChange={v => set('productCategory', v)} />
                  </div>
                )}

                {/* ── MOVER ── */}
                {role === 'mover' && (
                  <>
                    <div>
                      <label style={labelStyle}>Company Name *</label>
                      <input className="reg-input" style={fieldStyle} placeholder="e.g. Swift Movers Ltd" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
                    </div>
                    <div>
                      <label style={labelStyle}>Certificate of Incorporation # *</label>
                      <input className="reg-input" style={fieldStyle} placeholder="Company registration / incorporation #" value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>KRA Tax PIN *</label>
                        <input className="reg-input" style={fieldStyle} placeholder="P051234567A" value={form.taxPin} onChange={e => set('taxPin', e.target.value)} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Owner National ID # *</label>
                        <input className="reg-input" style={fieldStyle} placeholder="National ID number" value={form.ownerNationalId} onChange={e => set('ownerNationalId', e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Years in Operation * <span style={{ color: CL.muted, fontWeight: 400 }}>(min. 2 years)</span></label>
                      <input className="reg-input" style={fieldStyle} type="number" min="0" placeholder="e.g. 5" value={form.yearsInOperation} onChange={e => set('yearsInOperation', e.target.value)} required />
                      {form.yearsInOperation !== '' && Number(form.yearsInOperation) < 2 && (
                        <p style={{ margin: '6px 0 0', color: CL.error, fontSize: 12 }}>Fixera requires moving companies to be operating for at least 2 years.</p>
                      )}
                    </div>
                    <div style={{ background: '#F8F5FF', border: '1px solid #D6C8F5', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <AlertCircle size={15} color="#7C3AED" />
                        <span style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700 }}>Before going live — you must upload:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#6B7A8F', fontSize: 12, lineHeight: 1.8 }}>
                        <li>Owner National ID (both sides)</li>
                        <li>Certificate of Incorporation</li>
                        <li>Business License for moving services</li>
                        <li>KRA PIN certificate</li>
                        <li>Business address proof</li>
                        <li><strong>Liability Insurance — min. KSh 10,000,000</strong></li>
                        <li>Fleet registration documents (all vehicles)</li>
                        <li>5+ professional references / portfolio</li>
                      </ul>
                      <p style={{ margin: '8px 0 0', color: CL.muted, fontSize: 11 }}>Per Fixera Mover Partner Agreement §2. Uploads completed in onboarding.</p>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.legalAcknowledged} onChange={e => set('legalAcknowledged', e.target.checked)}
                        style={{ width: 17, height: 17, marginTop: 2, accentColor: CL.gold, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ color: CL.text, fontSize: 13, lineHeight: 1.5 }}>
                        I confirm my company is operating ≥ 2 years and I commit to providing the documents above for Fixera verification before accepting any jobs.
                      </span>
                    </label>
                  </>
                )}

                {/* ── WATER CARRIER ── */}
                {role === 'water_carrier' && (
                  <>
                    <div>
                      <label style={labelStyle}>Company / Business Name *</label>
                      <input className="reg-input" style={fieldStyle} placeholder="e.g. AquaPure Deliveries" value={form.companyName} onChange={e => set('companyName', e.target.value)} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Owner National ID # *</label>
                        <input className="reg-input" style={fieldStyle} placeholder="National ID number" value={form.ownerNationalId} onChange={e => set('ownerNationalId', e.target.value)} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Service Areas *</label>
                        <input className="reg-input" style={fieldStyle} placeholder="e.g. Westlands, Kilimani" value={form.serviceArea} onChange={e => set('serviceArea', e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Water Source *</label>
                      <ChipGrid options={WATER_SOURCES} value={form.waterSource} onChange={v => set('waterSource', v)} />
                    </div>
                    <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <AlertCircle size={15} color="#0284C7" />
                        <span style={{ color: '#0284C7', fontSize: 13, fontWeight: 700 }}>Before going live — you must upload:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#6B7A8F', fontSize: 12, lineHeight: 1.8 }}>
                        <li>National ID (clear photo)</li>
                        <li>Recent passport-style photo</li>
                        <li><strong>Health certification (monthly fitness check)</strong></li>
                        <li>Water quality certification</li>
                        <li>Vehicle registration + insurance</li>
                        <li>Background check clearance</li>
                        <li>Food-grade jerrycan / container proof</li>
                        <li>Business license + KRA PIN (if self-employed)</li>
                      </ul>
                      <p style={{ margin: '8px 0 0', color: CL.muted, fontSize: 11 }}>Per Fixera Water Carrier Partner Agreement §2. Uploads completed in onboarding.</p>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.legalAcknowledged} onChange={e => set('legalAcknowledged', e.target.checked)}
                        style={{ width: 17, height: 17, marginTop: 2, accentColor: CL.gold, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ color: CL.text, fontSize: 13, lineHeight: 1.5 }}>
                        I commit to delivering only clean, food-grade water and to provide the documents above for Fixera verification before accepting deliveries.
                      </span>
                    </label>
                  </>
                )}

                {/* ── Consent checkboxes (all roles) ── */}
                <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ color: CL.text, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Legal agreements — required to register</div>
                  {[
                    { key: 'terms',   val: agreedTerms,   set: setAgreedTerms,   label: 'I agree to the', link: 'Terms of Service', path: '/terms' },
                    { key: 'privacy', val: agreedPrivacy, set: setAgreedPrivacy, label: 'I agree to the', link: 'Privacy Policy',   path: '/privacy' },
                  ].map(c => (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: CL.gold, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ color: CL.muted, fontSize: 13, lineHeight: 1.5 }}>
                        {c.label}{' '}
                        <span onClick={e => { e.preventDefault(); navigate(c.path); }} style={{ color: CL.gold, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>{c.link}</span>
                        <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
                      </span>
                    </label>
                  ))}
                  <div style={{ color: '#6B7A8F', fontSize: 11, marginTop: 2 }}>
                    The{' '}
                    <span onClick={() => navigate('/ai-policy')} style={{ color: CL.muted, cursor: 'pointer', textDecoration: 'underline' }}>AI Policy</span>
                    {' '}also applies to your use of this platform. As a partner you will also be subject to the{' '}
                    <span onClick={() => navigate('/agreement')} style={{ color: CL.muted, cursor: 'pointer', textDecoration: 'underline' }}>Master-Partner Agreement</span>
                    {' '}during onboarding.
                  </div>
                </div>

                {error && (
                  <div style={{ background: CL.errorBg, border: `1px solid ${CL.errorBorder}`, borderRadius: 10, padding: '11px 14px', color: CL.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading || !isDetailsValid()}
                  style={{ width: '100%', padding: '15px 0', borderRadius: 12, border: 'none', fontFamily: 'inherit',
                    background: (!loading && isDetailsValid()) ? CL.text : CL.border,
                    color: (!loading && isDetailsValid()) ? '#fff' : CL.muted,
                    fontSize: 15, fontWeight: 700, cursor: (!loading && isDetailsValid()) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', marginTop: 4 }}>
                  {loading ? 'Creating account…' : `Register as ${roleConfig?.label}`}
                </motion.button>

                <p style={{ textAlign: 'center', color: CL.muted, fontSize: 14, margin: 0 }}>
                  Already registered?{' '}
                  <span onClick={() => navigate('/login')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer' }}>Sign In</span>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
