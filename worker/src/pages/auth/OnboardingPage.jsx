import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  CheckCircle2, Camera, FileText, ChevronLeft, ChevronRight, Send, AlertTriangle, Upload,
  User, IdCard, Heart, Wallet, Wrench, Store, Settings, Package, ClipboardList,
  Car, Truck, ShieldCheck, Star, Droplets, Lock, Zap, Sparkles, Paintbrush,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const CITIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Ruiru',
  'Kikuyu','Machakos','Meru','Nyeri','Naivasha','Kitale','Garissa','Malindi'];

const HEALTH_OPTIONS = [
  'Excellent – fully fit for field work',
  'Good – minor condition, fully functional',
  'Fair – manageable condition, no restrictions',
];

const PAYMENT_OPTIONS = ['M-Pesa','Bank Transfer','Both M-Pesa & Bank'];

const COMMISSION_RATES = {
  worker:       { rate: '15%', keep: '85%', deposit: 'None',       example: { job: 3000,  fee: 450,  net: 2550  } },
  rider:        { rate: '15%', keep: '85%', deposit: 'None',       example: { job: 800,   fee: 120,  net: 680   } },
  vendor:       { rate: '10%', keep: '90%', deposit: 'KSh 5,000',  example: { job: 5000,  fee: 500,  net: 4500  } },
  supplier:     { rate: '10%', keep: '90%', deposit: 'KSh 10,000', example: { job: 8000,  fee: 800,  net: 7200  } },
  mover:        { rate: '12%', keep: '88%', deposit: 'KSh 15,000', example: { job: 12000, fee: 1440, net: 10560 } },
  water_carrier:{ rate: '12%', keep: '88%', deposit: 'KSh 5,000',  example: { job: 2000,  fee: 240,  net: 1760  } },
};

const ROLE_STEPS = {
  worker: [
    { id:'general',      label:'GENERAL',      icon:'01' },
    { id:'identity',     label:'IDENTITY',     icon:'02' },
    { id:'health',       label:'HEALTH',       icon:'03' },
    { id:'payment',      label:'PAYMENT',      icon:'04' },
    { id:'service',      label:'SERVICE',      icon:'05' },
    { id:'requirements', label:'REQUIREMENTS', icon:'06' },
  ],
  rider: [
    { id:'general',    label:'GENERAL',    icon:'01' },
    { id:'identity',   label:'IDENTITY',   icon:'02' },
    { id:'health',     label:'HEALTH',     icon:'03' },
    { id:'payment',    label:'PAYMENT',    icon:'04' },
    { id:'vehicle',    label:'VEHICLE',    icon:'05' },
    { id:'compliance', label:'COMPLIANCE', icon:'06' },
  ],
  vendor: [
    { id:'general',    label:'GENERAL',    icon:'01' },
    { id:'identity',   label:'IDENTITY',   icon:'02' },
    { id:'payment',    label:'PAYMENT',    icon:'03' },
    { id:'business',   label:'BUSINESS',   icon:'04' },
    { id:'operations', label:'OPERATIONS', icon:'05' },
    { id:'agreement',  label:'AGREEMENT',  icon:'06' },
  ],
  supplier: [
    { id:'general',    label:'GENERAL',    icon:'01' },
    { id:'identity',   label:'IDENTITY',   icon:'02' },
    { id:'payment',    label:'PAYMENT',    icon:'03' },
    { id:'business',   label:'BUSINESS',   icon:'04' },
    { id:'products',   label:'PRODUCTS',   icon:'05' },
    { id:'agreement',  label:'AGREEMENT',  icon:'06' },
  ],
  mover: [
    { id:'general',    label:'GENERAL',    icon:'01' },
    { id:'identity',   label:'OWNER ID',   icon:'02' },
    { id:'payment',    label:'PAYMENT',    icon:'03' },
    { id:'business',   label:'BUSINESS',   icon:'04' },
    { id:'fleet',      label:'FLEET',      icon:'05' },
    { id:'insurance',  label:'INSURANCE',  icon:'06' },
    { id:'references', label:'REFERENCES', icon:'07' },
    { id:'agreement',  label:'AGREEMENT',  icon:'08' },
  ],
  water_carrier: [
    { id:'general',    label:'GENERAL',    icon:'01' },
    { id:'identity',   label:'IDENTITY',   icon:'02' },
    { id:'health',     label:'HEALTH',     icon:'03' },
    { id:'payment',    label:'PAYMENT',    icon:'04' },
    { id:'business',   label:'BUSINESS',   icon:'05' },
    { id:'vehicle',    label:'VEHICLE',    icon:'06' },
    { id:'quality',    label:'WATER QC',   icon:'07' },
    { id:'agreement',  label:'AGREEMENT',  icon:'08' },
  ],
};

// ─────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────
const CL = {
  bg:          '#F7F8FA',
  surface:     '#FFFFFF',
  border:      '#E8ECF0',
  text:        '#0A1628',
  muted:       '#6B7A8F',
  gold:        '#C9A020',
  goldSoft:    '#FDF8EC',
  goldBorder:  '#E8D48A',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
  greenBorder: '#A7F3D0',
  blue:        '#3B82F6',
  blueSoft:    '#EFF6FF',
  red:         '#EF4444',
  redSoft:     '#FEF2F2',
};

const inputSt = {
  width: '100%', padding: '12px 15px', borderRadius: 11,
  border: `1px solid ${CL.border}`, background: CL.surface,
  color: CL.text, fontSize: 14, boxSizing: 'border-box',
  outline: 'none', fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.18s',
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function Label({ text, hint, required }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <span style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {text}{required && <span style={{ color: CL.red }}> *</span>}
      </span>
      {hint && <div style={{ color: CL.muted, fontSize: 11, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label text={label} hint={hint} required={required} />
      {children}
    </div>
  );
}

function ChipSelect({ options, value, onChange, multi, color = CL.gold }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const v   = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        const sel = multi ? (value || []).includes(v) : value === v;
        return (
          <div key={v} onClick={() => {
            if (multi) {
              const arr = value || [];
              onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
            } else { onChange(v); }
          }} style={{
            padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: sel ? `${color}18` : CL.surface,
            border: `1.5px solid ${sel ? color : CL.border}`,
            color: sel ? color : CL.muted,
            transition: 'all 0.15s',
          }}>{lbl}</div>
        );
      })}
    </div>
  );
}

function PhotoUpload({ label, hint, value, onChange, required }) {
  const ref = useRef();
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('worker-documents').upload(path, file, { upsert: true });
      if (!error) {
        const { data: { signedUrl } } = await supabase.storage.from('worker-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
        onChange(signedUrl);
      }
    } catch {}
    setUploading(false);
  }

  return (
    <Field label={label} hint={hint} required={required}>
      <div onClick={() => ref.current.click()}
        style={{ border: `2px dashed ${preview ? CL.gold : CL.border}`, borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', background: CL.surface, position: 'relative', transition: 'border-color 0.18s' }}>
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Camera size={20} color={CL.muted} strokeWidth={1.5} />
            </div>
            <div style={{ color: uploading ? CL.gold : CL.muted, fontSize: 13, fontWeight: 600 }}>{uploading ? 'Uploading…' : 'Tap to upload photo'}</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>JPG, PNG — max 5MB</div>
          </>
        )}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,248,250,0.85)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: CL.gold, fontSize: 13, fontWeight: 700 }}>Uploading…</div>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </Field>
  );
}

function FileUpload({ label, hint, value, onChange, required }) {
  const ref = useRef();
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setName(file.name);
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/docs/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('worker-documents').upload(path, file, { upsert: true });
      if (!error) {
        const { data: { signedUrl } } = await supabase.storage.from('worker-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
        onChange(signedUrl);
      }
    } catch {}
    setUploading(false);
  }

  return (
    <Field label={label} hint={hint} required={required}>
      <div onClick={() => ref.current.click()}
        style={{ border: `2px dashed ${value ? CL.gold : CL.border}`, borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', background: CL.surface, transition: 'border-color 0.18s' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: value ? CL.goldSoft : CL.bg, border: `1px solid ${value ? CL.goldBorder : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          {value ? <CheckCircle2 size={18} color={CL.gold} /> : <Upload size={18} color={CL.muted} strokeWidth={1.5} />}
        </div>
        <div style={{ color: value ? CL.gold : CL.muted, fontSize: 13, fontWeight: 600 }}>
          {uploading ? 'Uploading…' : value ? (name || 'Document uploaded') : 'Tap to upload document'}
        </div>
        <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>PDF, JPG, PNG</div>
        <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    </Field>
  );
}

function SectionTitle({ Icon, title, subtitle, color = CL.gold }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {Icon && <Icon size={18} color={color} strokeWidth={2} />}
        </div>
        <div style={{ color: CL.text, fontSize: 17, fontWeight: 800 }}>{title}</div>
      </div>
      {subtitle && <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6, paddingLeft: 48 }}>{subtitle}</div>}
    </div>
  );
}

function InfoBox({ color, label, children }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}35`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
      {label && <div style={{ color, fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>{label}</div>}
      {children}
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <div onClick={onChange} style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? CL.gold : CL.border}`, background: checked ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
        {checked && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{ color: CL.text, fontSize: 12, lineHeight: 1.6 }}>{label}</span>
    </div>
  );
}

function CommissionCard({ role }) {
  const c = COMMISSION_RATES[role];
  if (!c) return null;
  return (
    <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: '18px 20px', marginBottom: 20, marginTop: 8 }}>
      <div style={{ color: CL.gold, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Commission & Earnings Breakdown</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Platform Fee',     value: c.rate,    color: CL.red   },
          { label: 'You Keep',         value: c.keep,    color: CL.green },
          { label: 'Security Deposit', value: c.deposit, color: CL.blue  },
          { label: 'Payout Method',    value: 'M-Pesa',  color: CL.gold  },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: CL.surface, borderRadius: 10, padding: '10px 12px', border: `1px solid ${CL.border}` }}>
            <div style={{ color: CL.muted, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontSize: 16, fontWeight: 900 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: CL.surface, borderRadius: 10, padding: '10px 14px', border: `1px solid ${CL.border}` }}>
        <div style={{ color: CL.gold, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Example Calculation</div>
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
          Job value: <strong style={{ color: CL.text }}>KSh {c.example.job.toLocaleString()}</strong>
          {' · '}Fixera fee: <strong style={{ color: CL.red }}>KSh {c.example.fee.toLocaleString()}</strong>
          {' · '}You receive: <strong style={{ color: CL.green }}>KSh {c.example.net.toLocaleString()}</strong>
        </div>
      </div>
      <div style={{ color: CL.muted, fontSize: 11, marginTop: 10, lineHeight: 1.6, fontStyle: 'italic' }}>
        Payments are processed within 24 hours of job completion. Commission is deducted automatically before payout.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const role  = profile?.partner_role || 'worker';
  const steps = ROLE_STEPS[role] || ROLE_STEPS.worker;

  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const [data, setData] = useState({
    fullName:       profile?.full_name || '',
    phone:          profile?.phone     || '',
    email:          profile?.email     || '',
    city:           '',
    area:           '',
    healthStatus:   '',
    emergencyName:  '',
    emergencyPhone: '',
    emergencyRel:   '',
    paymentMethod:  '',
    mpesaNumber:    '',
    bankName:       '',
    bankAccount:    '',
    idType:         'National ID',
    idNumber:       '',
    idPhotoFront:   '',
    idPhotoBack:    '',
    taxPin:         profile?.tax_pin || '',
    profilePhoto:   '',
    termsAccepted:  false,
    service:              profile?.service || '',
    plumbCertUrl:         '',
    plumbExperience:      '',
    plumbTools:           [],
    plumbAreas:           [],
    plumbPortfolioUrl:    '',
    plumbCriminalDecl:    false,
    elecErbNumber:        '',
    elecErbCertUrl:       '',
    elecEpraCompliant:    false,
    elecInsuranceUrl:     '',
    elecInsuranceNumber:  '',
    elecSafetyTraining:   '',
    elecExperience:       '',
    elecCriminalDecl:     false,
    paintPortfolioUrl:    '',
    paintExperience:      '',
    paintSpecialty:       [],
    paintTeamSize:        '1',
    paintEquipment:       [],
    paintCriminalDecl:    false,
    cleanBgCheckUrl:      '',
    cleanCriminalDecl:    false,
    cleanAvailability:    [],
    cleanPreference:      '',
    cleanSpecialties:     [],
    cleanTeamStatus:      '',
    drivingLicenseUrl:    '',
    drivingLicenseNumber: '',
    drivingLicenseClass:  '',
    vehicleMake:          '',
    vehicleModel:         '',
    vehiclePlate:         '',
    vehicleRegUrl:        '',
    vehicleInsuranceUrl:  '',
    gpsConsent:           false,
    bizRegUrl:            '',
    bizRegNumber:         '',
    bizLocation:          '',
    bizArea:              '',
    bizHoursOpen:         '08:00',
    bizHoursClose:        '18:00',
    bizDays:              [],
    bizMachineCapacity:   '',
    bizPickupAgreement:   false,
    bizCoverageRadius:    '',
    bizTurnaround:        '',
    bizPriceSmall:        '',
    bizPriceMedium:       '',
    bizPriceLarge:        '',
    supplierBizRegUrl:    '',
    supplierBizRegNumber: '',
    supplierBrands:       '',
    supplierBrandAuthUrl: '',
    supplierBulkPricing:  '',
    supplierDelivery:     '',
    supplierPromoAccept:  false,
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    try {
      const serviceDetails = buildServiceDetails();
      await supabase.from('workers').update({
        full_name:           data.fullName,
        phone:               data.phone,
        city:                data.city,
        profile_photo_url:   data.profilePhoto,
        id_photo_url:        data.idPhotoFront,
        tax_pin:             data.taxPin || null,
        service_details:     serviceDetails,
        verification_status: 'pending',
        onboarding_complete: true,
      }).eq('id', user.id);
      setDone(true);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  function buildServiceDetails() {
    const base = {
      role, city: data.city, area: data.area,
      healthStatus: data.healthStatus,
      emergencyContact: { name: data.emergencyName, phone: data.emergencyPhone, relation: data.emergencyRel },
      payment: { method: data.paymentMethod, mpesa: data.mpesaNumber, bank: data.bankName, bankAccount: data.bankAccount },
      identity: { type: data.idType, number: data.idNumber, frontUrl: data.idPhotoFront, backUrl: data.idPhotoBack },
      termsAccepted: data.termsAccepted,
    };
    if (role === 'worker') {
      const svc = data.service;
      if (svc?.includes('Plumbing'))   return { ...base, service: 'Plumbing',   plumbing:   { certUrl: data.plumbCertUrl, experience: data.plumbExperience, tools: data.plumbTools, areas: data.plumbAreas, portfolioUrl: data.plumbPortfolioUrl, criminalDecl: data.plumbCriminalDecl } };
      if (svc?.includes('Electrical')) return { ...base, service: 'Electrical', electrical: { erbNumber: data.elecErbNumber, erbCertUrl: data.elecErbCertUrl, epraCompliant: data.elecEpraCompliant, insuranceUrl: data.elecInsuranceUrl, insuranceNumber: data.elecInsuranceNumber, safetyTraining: data.elecSafetyTraining, experience: data.elecExperience, criminalDecl: data.elecCriminalDecl } };
      if (svc?.includes('Painting'))   return { ...base, service: 'Painting',   painting:   { portfolioUrl: data.paintPortfolioUrl, experience: data.paintExperience, specialty: data.paintSpecialty, teamSize: data.paintTeamSize, equipment: data.paintEquipment, criminalDecl: data.paintCriminalDecl } };
      if (svc?.includes('Cleaning'))   return { ...base, service: 'Cleaning',   cleaning:   { bgCheckUrl: data.cleanBgCheckUrl, criminalDecl: data.cleanCriminalDecl, availability: data.cleanAvailability, preference: data.cleanPreference, specialties: data.cleanSpecialties, teamStatus: data.cleanTeamStatus } };
    }
    if (role === 'rider')    return { ...base, license: { url: data.drivingLicenseUrl, number: data.drivingLicenseNumber, class: data.drivingLicenseClass }, vehicle: { make: data.vehicleMake, model: data.vehicleModel, plate: data.vehiclePlate, regUrl: data.vehicleRegUrl, insuranceUrl: data.vehicleInsuranceUrl }, gpsConsent: data.gpsConsent };
    if (role === 'vendor')   return { ...base, business: { regUrl: data.bizRegUrl, regNumber: data.bizRegNumber, location: data.bizLocation, area: data.bizArea, hours: `${data.bizHoursOpen}–${data.bizHoursClose}`, days: data.bizDays, machineCapacity: data.bizMachineCapacity, pickupAgreement: data.bizPickupAgreement, coverageRadius: data.bizCoverageRadius, turnaround: data.bizTurnaround, pricing: { small: data.bizPriceSmall, medium: data.bizPriceMedium, large: data.bizPriceLarge } } };
    if (role === 'supplier') return { ...base, business: { regUrl: data.supplierBizRegUrl, regNumber: data.supplierBizRegNumber, brands: data.supplierBrands, brandAuthUrl: data.supplierBrandAuthUrl, bulkPricing: data.supplierBulkPricing, delivery: data.supplierDelivery, promoAccept: data.supplierPromoAccept } };
    return base;
  }

  const currentStep = steps[step];
  const pct = Math.round(((step + 1) / steps.length) * 100);

  // ── DONE SCREEN ──────────────────────────────────────────────
  if (done) {
    const ROLE_HOME = { worker: '/dashboard', vendor: '/vendor/dashboard', rider: '/rider/dashboard', supplier: '/supplier/dashboard', mover: '/mover/dashboard', water_carrier: '/dashboard' };
    return (
      <div style={{ width: '100vw', minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 80, height: 80, borderRadius: 28, background: CL.greenSoft, border: `2px solid ${CL.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={38} color={CL.green} strokeWidth={1.6} />
          </div>
          <div style={{ color: CL.text, fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Application Submitted!</div>
          <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Your partner application has been received. Our team will verify your documents and notify you within <strong style={{ color: CL.gold }}>24–48 hours</strong>.
          </div>
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ color: CL.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Documents Submitted</div>
            {[
              'General partner information',
              'National ID / Passport',
              'Profile photo',
              role === 'worker'   ? 'Service-specific certifications' : '',
              role === 'rider'    ? 'Driving license & vehicle details' : '',
              role === 'vendor'   ? 'Business registration & operations' : '',
              role === 'supplier' ? 'Business registration & product catalog' : '',
              'Fixera Partner Terms accepted',
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ color: CL.text, fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${CL.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle2 size={14} color={CL.green} strokeWidth={2} />
                {item}
              </div>
            ))}
          </div>
          <button onClick={() => navigate(ROLE_HOME[role] || '/dashboard')}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: CL.text, border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(10,22,40,0.2)' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const isLast = step === steps.length - 1;

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* ── TOP PROGRESS BAR ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ color: CL.gold, fontSize: 13, fontWeight: 900, letterSpacing: '0.12em' }}>FIXERA PARTNER</div>
              <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>
                {role.replace('_', ' ').toUpperCase()} VERIFICATION — Step {step + 1} of {steps.length}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 6, width: 120, borderRadius: 999, background: CL.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: CL.gold, borderRadius: 999, transition: 'width 0.4s' }} />
              </div>
              <span style={{ color: CL.gold, fontSize: 12, fontWeight: 800 }}>{pct}%</span>
            </div>
          </div>
          {/* Step pills */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {steps.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 44 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                  background: i < step ? CL.gold : i === step ? CL.goldSoft : CL.bg,
                  border: `2px solid ${i <= step ? CL.gold : CL.border}`,
                  color: i < step ? '#fff' : i === step ? CL.gold : CL.muted,
                  fontSize: i < step ? 11 : 10, fontWeight: 900,
                }}>
                  {i < step ? <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} /> : s.icon}
                </div>
                <div style={{ color: i === step ? CL.gold : CL.muted, fontSize: 8, fontWeight: 700, textAlign: 'center', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

        {/* ════════════════════════════════════════════════
            GENERAL STEP — ALL ROLES
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'general' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={User} title="General Partner Information"
              subtitle="This information is required from ALL Fixera partners. Please fill in accurately." />

            <Field label="Full Name" required>
              <input value={data.fullName} onChange={e => set('fullName', e.target.value)}
                placeholder="As it appears on your National ID" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Phone Number" required>
                <input value={data.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="0712 345 678" style={inputSt}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </Field>
              <Field label="Email Address" required>
                <input value={data.email} onChange={e => set('email', e.target.value)}
                  type="email" placeholder="you@email.com" style={inputSt}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </Field>
            </div>

            <Field label="City / Town" required>
              <ChipSelect options={CITIES} value={data.city} onChange={v => set('city', v)} />
            </Field>

            <Field label="Specific Area / Estate" hint="e.g. Westlands, Kilimani, Pipeline, Umoja" required>
              <input value={data.area} onChange={e => set('area', e.target.value)}
                placeholder="Your specific area or estate" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>

            <PhotoUpload label="Profile Photo" required
              hint="Clear headshot, good lighting — this is how clients see you"
              value={data.profilePhoto} onChange={v => set('profilePhoto', v)} />

            <Field label="Health Status" required hint="This helps us ensure you are fit for field work">
              <ChipSelect options={HEALTH_OPTIONS} value={data.healthStatus} onChange={v => set('healthStatus', v)} />
            </Field>

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
              <div style={{ color: CL.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Emergency Contact / Next of Kin</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Full Name" required>
                  <input value={data.emergencyName} onChange={e => set('emergencyName', e.target.value)}
                    placeholder="Jane Mwangi" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <Field label="Phone Number" required>
                  <input value={data.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)}
                    placeholder="0712 000 000" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
              </div>
              <Field label="Relationship">
                <ChipSelect options={['Spouse','Parent','Sibling','Friend','Other']}
                  value={data.emergencyRel} onChange={v => set('emergencyRel', v)} />
              </Field>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            IDENTITY STEP — ALL ROLES
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'identity' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={IdCard} title="Identity Verification"
              subtitle="Upload a valid government-issued ID. This is required to verify your identity before activation." />

            <Field label="ID Type" required>
              <ChipSelect options={['National ID','Passport','Alien ID']}
                value={data.idType} onChange={v => set('idType', v)} />
            </Field>

            <Field label="ID / Passport Number" required>
              <input value={data.idNumber} onChange={e => set('idNumber', e.target.value)}
                placeholder="e.g. 12345678" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>

            <Field label="KRA PIN" required hint="Required by Kenyan tax law for partner earnings reporting and withholding tax">
              <input value={data.taxPin} onChange={e => set('taxPin', e.target.value.toUpperCase())}
                placeholder="e.g. A001234567B" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <PhotoUpload label="ID Front Photo" required
                hint="Clear photo of the front side"
                value={data.idPhotoFront} onChange={v => set('idPhotoFront', v)} />
              <PhotoUpload label="ID Back Photo"
                hint="Clear photo of the back side"
                value={data.idPhotoBack} onChange={v => set('idPhotoBack', v)} />
            </div>

            <InfoBox color={CL.blue} label="WHY WE NEED THIS">
              <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
                Your ID is used solely for identity verification. It is encrypted and stored securely. Fixera complies with Kenya's Data Protection Act 2019.
              </div>
            </InfoBox>

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: CL.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Fixera Partner Policies</div>
              {[
                'I confirm all information provided is accurate and truthful',
                'I accept Fixera\'s Partner Terms & Conditions',
                'I give Fixera permission to verify my documents',
                'I understand my account will be suspended if documents are fraudulent',
                'I agree to Fixera\'s code of professional conduct',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 4 ? `1px solid ${CL.border}` : 'none' }}>
                  <CheckCircle2 size={13} color={CL.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ color: CL.muted, fontSize: 12 }}>{item}</div>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <Checkbox checked={data.termsAccepted} onChange={() => set('termsAccepted', !data.termsAccepted)}
                  label="I accept all Fixera Partner Policies & Terms" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            HEALTH STEP — WORKERS / RIDERS / WATER_CARRIER
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'health' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Heart} title="Health & Medical Status"
              subtitle="Required for all field workers. This ensures you are physically fit to perform the service." />

            <Field label="Current Health Status" required>
              <ChipSelect options={HEALTH_OPTIONS} value={data.healthStatus} onChange={v => set('healthStatus', v)} />
            </Field>

            <InfoBox color={CL.green} label="Health Declaration">
              {[
                'I do not have any condition that would prevent me from performing physical field work',
                'I will inform Fixera immediately if my health status changes',
                'I understand that health information is private and protected',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < 2 ? `1px solid ${CL.greenBorder}` : 'none' }}>
                  <CheckCircle2 size={13} color={CL.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: CL.muted, fontSize: 12 }}>{item}</span>
                </div>
              ))}
            </InfoBox>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            PAYMENT STEP — ALL ROLES
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'payment' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Wallet} title="Payment Methods"
              subtitle="How would you like to receive your payments from Fixera?" />

            <Field label="Preferred Payment Method" required>
              <ChipSelect options={PAYMENT_OPTIONS} value={data.paymentMethod} onChange={v => set('paymentMethod', v)} />
            </Field>

            {(data.paymentMethod === 'M-Pesa' || data.paymentMethod === 'Both M-Pesa & Bank') && (
              <Field label="M-Pesa Number" required hint="The number registered on your M-Pesa account">
                <input value={data.mpesaNumber} onChange={e => set('mpesaNumber', e.target.value)}
                  placeholder="0712 345 678" style={inputSt}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </Field>
            )}

            {(data.paymentMethod === 'Bank Transfer' || data.paymentMethod === 'Both M-Pesa & Bank') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Bank Name" required>
                  <input value={data.bankName} onChange={e => set('bankName', e.target.value)}
                    placeholder="e.g. Equity Bank" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <Field label="Account Number" required>
                  <input value={data.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                    placeholder="Bank account number" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
              </div>
            )}

            <InfoBox color={CL.gold} label="Payment Info">
              <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
                Payments are processed weekly every Friday. Workers receive 85% of job value. Vendors receive 90%. Riders receive a fixed per-delivery fee. Fixera retains 10–15% as platform fee.
              </div>
            </InfoBox>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            SERVICE STEP — WORKERS
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'service' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Wrench} title="Your Service Type"
              subtitle="Select the service you specialize in. Your next step will show requirements specific to that service." />

            <Field label="Service Specialization" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { v: 'Plumbing',   Icon: Droplets,   label: 'Plumbing',   desc: 'Pipes, drainage, installations' },
                  { v: 'Electrical', Icon: Zap,        label: 'Electrical', desc: 'Wiring, sockets, power systems'  },
                  { v: 'Painting',   Icon: Paintbrush, label: 'Painting',   desc: 'Interior, exterior, decorative'  },
                  { v: 'Cleaning',   Icon: Sparkles,   label: 'Cleaning',   desc: 'House, office, deep cleaning'    },
                ].map(s => (
                  <div key={s.v} onClick={() => set('service', s.v)}
                    style={{ padding: '18px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      background: data.service === s.v ? CL.goldSoft : CL.surface,
                      border: `2px solid ${data.service === s.v ? CL.gold : CL.border}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ width:48, height:48, borderRadius:14, background: data.service === s.v ? `${CL.gold}18` : CL.bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                      <s.Icon size={22} color={data.service === s.v ? CL.gold : CL.muted} strokeWidth={1.8} />
                    </div>
                    <div style={{ color: data.service === s.v ? CL.gold : CL.text, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ color: CL.muted, fontSize: 11 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </Field>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            REQUIREMENTS STEP — WORKERS (service-specific)
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'requirements' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            {/* ── PLUMBING ── */}
            {data.service?.includes('Plumbing') && (
              <div>
                <SectionTitle Icon={Droplets} title="Plumbing Certification Requirements"
                  subtitle="You must provide the following to be listed as a Fixera plumbing professional." color="#3B82F6" />
                <FileUpload label="Plumbing Certificate / License" required
                  hint="e.g. National Industrial Training Authority (NITA) plumbing certificate"
                  value={data.plumbCertUrl} onChange={v => set('plumbCertUrl', v)} />
                <Field label="Years of Experience" required>
                  <ChipSelect options={['Less than 1 year','1–2 years','3–5 years','6–10 years','10+ years']}
                    value={data.plumbExperience} onChange={v => set('plumbExperience', v)} />
                </Field>
                <Field label="Tools You Own" hint="Select all that apply" required>
                  <ChipSelect multi options={['Pipe wrench','Drain snake','Pipe cutter','Soldering kit','Pressure gauge','Plunger','Leak detector','Others']}
                    value={data.plumbTools} onChange={v => set('plumbTools', v)} />
                </Field>
                <Field label="Areas You Can Serve" required>
                  <ChipSelect multi options={['Nairobi CBD','Westlands','Kilimani','Langata','Eastlands','Karen','Ruiru','Thika','Kiambu','Ngong']}
                    value={data.plumbAreas} onChange={v => set('plumbAreas', v)} />
                </Field>
                <PhotoUpload label="Portfolio / Past Work Photo" required
                  hint="Upload a photo of a completed plumbing job — this builds trust with customers"
                  value={data.plumbPortfolioUrl} onChange={v => set('plumbPortfolioUrl', v)} />
                <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={CL.red} />
                    <span style={{ color: CL.red, fontSize: 12, fontWeight: 700 }}>Criminal Record Declaration</span>
                  </div>
                  <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                    To protect our customers, we require all partners to declare their criminal record status. False declaration will result in permanent account ban and potential legal action.
                  </div>
                  <Checkbox checked={data.plumbCriminalDecl} onChange={() => set('plumbCriminalDecl', !data.plumbCriminalDecl)}
                    label="I declare that I have no criminal convictions related to theft, fraud, violence, or sexual offences. I consent to a background check if required." />
                </div>
              </div>
            )}

            {/* ── ELECTRICAL ── */}
            {data.service?.includes('Electrical') && (
              <div>
                <SectionTitle Icon={Zap} title="Electrical Certification Requirements"
                  subtitle="STRICTLY REGULATED — Electrical work is high risk. Kenya law requires ERB registration and EPRA compliance. All documents are verified before activation." color="#F59E0B" />

                <InfoBox color="#F59E0B" label="Mandatory Kenya Requirements">
                  <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
                    • ERB (Energy Regulatory Bureau) Registration<br/>
                    • EPRA (Energy & Petroleum Regulatory Authority) Compliance<br/>
                    • Valid Electrical Contractor License (ECL)<br/>
                    • Public Liability Insurance
                  </div>
                </InfoBox>

                <Field label="ERB Registration Number" required hint="Energy Regulatory Bureau registration number">
                  <input value={data.elecErbNumber} onChange={e => set('elecErbNumber', e.target.value)}
                    placeholder="ERB-XXXX-XXXX" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <FileUpload label="ERB Certificate / Electrical License" required
                  hint="Upload your ERB registration certificate or electrical contractor license"
                  value={data.elecErbCertUrl} onChange={v => set('elecErbCertUrl', v)} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Public Liability Insurance Number" required>
                    <input value={data.elecInsuranceNumber} onChange={e => set('elecInsuranceNumber', e.target.value)}
                      placeholder="Insurance policy number" style={inputSt}
                      onFocus={e => e.target.style.borderColor = CL.gold}
                      onBlur={e => e.target.style.borderColor = CL.border} />
                  </Field>
                  <FileUpload label="Insurance Certificate" required
                    value={data.elecInsuranceUrl} onChange={v => set('elecInsuranceUrl', v)} />
                </div>

                <Field label="Safety Training Completed" required>
                  <ChipSelect options={['OSHA Kenya Basic','OSHA Kenya Advanced','Electrical Safety Course','First Aid Certified','None']}
                    value={data.elecSafetyTraining} onChange={v => set('elecSafetyTraining', v)} />
                </Field>

                <Field label="Experience Level" required>
                  <ChipSelect options={['Apprentice (1–2 yrs)','Journeyman (3–5 yrs)','Licensed Electrician (5–10 yrs)','Master Electrician (10+ yrs)']}
                    value={data.elecExperience} onChange={v => set('elecExperience', v)} />
                </Field>

                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                  <Checkbox checked={data.elecEpraCompliant} onChange={() => set('elecEpraCompliant', !data.elecEpraCompliant)}
                    label="I confirm I am EPRA (Energy & Petroleum Regulatory Authority) compliant and all my electrical work meets Kenya's wiring regulations (IEE Wiring Regulations as adopted by KEBS)." />
                </div>

                <div style={{ background: CL.redSoft, border: '1px solid #FECACA', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={CL.red} />
                    <span style={{ color: CL.red, fontSize: 12, fontWeight: 700 }}>Criminal Record Declaration</span>
                  </div>
                  <Checkbox checked={data.elecCriminalDecl} onChange={() => set('elecCriminalDecl', !data.elecCriminalDecl)}
                    label="I declare I have no criminal convictions and consent to DCI (Directorate of Criminal Investigations) background verification." />
                </div>
              </div>
            )}

            {/* ── PAINTING ── */}
            {data.service?.includes('Painting') && (
              <div>
                <SectionTitle Icon={Paintbrush} title="Painting Professional Requirements"
                  subtitle="Painting verification is simpler but portfolio and criminal declaration are required." />
                <PhotoUpload label="Portfolio — Past Work Photo" required
                  hint="Upload your best completed painting job — customers choose based on portfolio"
                  value={data.paintPortfolioUrl} onChange={v => set('paintPortfolioUrl', v)} />
                <Field label="Years of Experience" required>
                  <ChipSelect options={['Less than 1 year','1–2 years','3–5 years','6–10 years','10+ years']}
                    value={data.paintExperience} onChange={v => set('paintExperience', v)} />
                </Field>
                <Field label="Specialization" required>
                  <ChipSelect multi options={['Interior','Exterior','Decorative / Texture','Waterproofing','Wood & Metal','Wallpaper']}
                    value={data.paintSpecialty} onChange={v => set('paintSpecialty', v)} />
                </Field>
                <Field label="Team Size" required>
                  <ChipSelect options={['Solo (just me)','Small team (2–3)','Medium team (4–6)','Large team (7+)']}
                    value={data.paintTeamSize} onChange={v => set('paintTeamSize', v)} />
                </Field>
                <Field label="Equipment You Own" required>
                  <ChipSelect multi options={['Rollers & brushes','Spray machine','Scaffolding','Drop cloths','Pressure washer','Mixing equipment','Ladders']}
                    value={data.paintEquipment} onChange={v => set('paintEquipment', v)} />
                </Field>
                <div style={{ background: CL.redSoft, border: '1px solid #FECACA', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={CL.red} />
                    <span style={{ color: CL.red, fontSize: 12, fontWeight: 700 }}>Criminal Record Declaration</span>
                  </div>
                  <Checkbox checked={data.paintCriminalDecl} onChange={() => set('paintCriminalDecl', !data.paintCriminalDecl)}
                    label="I declare no criminal convictions related to theft, fraud, or violence and consent to background verification." />
                </div>
              </div>
            )}

            {/* ── CLEANING ── */}
            {data.service?.includes('Cleaning') && (
              <div>
                <SectionTitle Icon={Sparkles} title="Cleaning Professional Requirements"
                  subtitle="Cleaning workers enter customers' homes and offices. Background checks are mandatory." />
                <FileUpload label="Background Check Certificate" required
                  hint="DCI (Directorate of Criminal Investigations) certificate of good conduct — apply at goodconduct.go.ke"
                  value={data.cleanBgCheckUrl} onChange={v => set('cleanBgCheckUrl', v)} />
                <Field label="Availability Schedule" required>
                  <ChipSelect multi options={['Weekdays (Mon–Fri)','Weekends (Sat–Sun)','Morning (6am–12pm)','Afternoon (12pm–6pm)','Evening (6pm–10pm)']}
                    value={data.cleanAvailability} onChange={v => set('cleanAvailability', v)} />
                </Field>
                <Field label="Service Preference" required>
                  <ChipSelect options={['Residential only','Commercial only','Both residential & commercial']}
                    value={data.cleanPreference} onChange={v => set('cleanPreference', v)} />
                </Field>
                <Field label="Cleaning Specialties" required>
                  <ChipSelect multi options={['Deep cleaning','Post-construction','Move-in/out','Carpet & rugs','Sofa & upholstery','Windows','Office cleaning','Medical facility cleaning']}
                    value={data.cleanSpecialties} onChange={v => set('cleanSpecialties', v)} />
                </Field>
                <Field label="Team / Solo Status" required>
                  <ChipSelect options={['Solo worker','Small team (2–3)','Medium team (4–6)']}
                    value={data.cleanTeamStatus} onChange={v => set('cleanTeamStatus', v)} />
                </Field>
                <div style={{ background: CL.redSoft, border: '1px solid #FECACA', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={CL.red} />
                    <span style={{ color: CL.red, fontSize: 12, fontWeight: 700 }}>Criminal Record Declaration</span>
                  </div>
                  <Checkbox checked={data.cleanCriminalDecl} onChange={() => set('cleanCriminalDecl', !data.cleanCriminalDecl)}
                    label="I declare no criminal convictions and consent to DCI background verification. I understand this is mandatory for all cleaning workers who enter private premises." />
                </div>
              </div>
            )}

            <CommissionCard role={role} />
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            VEHICLE STEP — RIDERS / WATER_CARRIER
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'vehicle' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Car} title="Vehicle & License Information"
              subtitle="All delivery riders must provide valid driving credentials and vehicle details." color={CL.green} />

            <Field label="Driving License Number" required>
              <input value={data.drivingLicenseNumber} onChange={e => set('drivingLicenseNumber', e.target.value)}
                placeholder="e.g. DL123456789" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>
            <Field label="License Class" required hint="As shown on your driving license">
              <ChipSelect options={['Class A (Motorcycle)','Class B (Light Vehicle)','Class C (Heavy Vehicle)','Class G (Tuk-Tuk/3-Wheeler)']}
                value={data.drivingLicenseClass} onChange={v => set('drivingLicenseClass', v)} color={CL.green} />
            </Field>
            <FileUpload label="Driving License Photo" required
              hint="Upload a clear photo of your valid driving license"
              value={data.drivingLicenseUrl} onChange={v => set('drivingLicenseUrl', v)} />

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
              <div style={{ color: CL.green, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Vehicle Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Vehicle Make" required>
                  <input value={data.vehicleMake} onChange={e => set('vehicleMake', e.target.value)}
                    placeholder="e.g. Honda, TVS, Bajaj" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <Field label="Vehicle Model" required>
                  <input value={data.vehicleModel} onChange={e => set('vehicleModel', e.target.value)}
                    placeholder="e.g. CB150, Apache, Boxer" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <Field label="Number Plate" required>
                  <input value={data.vehiclePlate} onChange={e => set('vehiclePlate', e.target.value)}
                    placeholder="e.g. KDA 123A" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
              </div>
            </div>

            <FileUpload label="Vehicle Registration Certificate (Logbook)" required
              hint="Upload a photo of the vehicle logbook"
              value={data.vehicleRegUrl} onChange={v => set('vehicleRegUrl', v)} />
            <FileUpload label="Vehicle Insurance Certificate"
              hint="Upload insurance certificate if applicable"
              value={data.vehicleInsuranceUrl} onChange={v => set('vehicleInsuranceUrl', v)} />
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            COMPLIANCE STEP — RIDERS
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'compliance' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={ClipboardList} title="Rider Compliance & Agreements" color={CL.green} />

            <div style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ color: CL.green, fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Live GPS Tracking</div>
              <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                As a Fixera rider, your live location must be shared during active delivery runs. This allows customers to track their orders and enables our dispatch system to assign jobs near you.
              </div>
              <Checkbox checked={data.gpsConsent} onChange={() => set('gpsConsent', !data.gpsConsent)}
                label="I consent to live GPS location sharing during active delivery runs" />
            </div>

            {[
              'I will handle all picked-up items with care',
              'I will not open or tamper with customer items',
              'I will be punctual and communicate delays immediately',
              'I will maintain a professional appearance at all times',
              'I accept Fixera\'s Rider Code of Conduct',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${CL.border}` }}>
                <CheckCircle2 size={13} color={CL.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: CL.muted, fontSize: 12 }}>{item}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            BUSINESS STEP — VENDORS / SUPPLIERS / MOVERS / WATER_CARRIER
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'business' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Store} title="Business Registration Details"
              subtitle="Your business must be registered. Unregistered businesses cannot join Fixera." color={CL.blue} />

            <Field label="Business Registration Number" required hint="From the Business Registration Service (BRS) Kenya">
              <input value={data.bizRegNumber} onChange={e => set('bizRegNumber', e.target.value)}
                placeholder="e.g. BN/2023/XXXXXXX" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>
            <FileUpload label="Business Registration Certificate" required
              hint="Upload the official certificate from the Registrar of Companies or BRS"
              value={data.bizRegUrl} onChange={v => set('bizRegUrl', v)} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Business Location / Address" required>
                <input value={data.bizLocation} onChange={e => set('bizLocation', e.target.value)}
                  placeholder="e.g. Westlands, Nairobi" style={inputSt}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </Field>
              <Field label="Business Area" required>
                <input value={data.bizArea} onChange={e => set('bizArea', e.target.value)}
                  placeholder="Specific area / estate" style={inputSt}
                  onFocus={e => e.target.style.borderColor = CL.gold}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </Field>
            </div>

            {role === 'vendor' && (
              <>
                <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
                  <div style={{ color: CL.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Operation Hours</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Opening Time" required>
                      <input type="time" value={data.bizHoursOpen} onChange={e => set('bizHoursOpen', e.target.value)} style={inputSt}
                        onFocus={e => e.target.style.borderColor = CL.gold}
                        onBlur={e => e.target.style.borderColor = CL.border} />
                    </Field>
                    <Field label="Closing Time" required>
                      <input type="time" value={data.bizHoursClose} onChange={e => set('bizHoursClose', e.target.value)} style={inputSt}
                        onFocus={e => e.target.style.borderColor = CL.gold}
                        onBlur={e => e.target.style.borderColor = CL.border} />
                    </Field>
                  </div>
                  <Field label="Operating Days" required>
                    <ChipSelect multi options={['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']}
                      value={data.bizDays} onChange={v => set('bizDays', v)} color={CL.blue} />
                  </Field>
                </div>

                <Field label="Machine / Equipment Capacity" required hint="e.g. 5 washing machines (50kg each), 2 dry-cleaning units">
                  <input value={data.bizMachineCapacity} onChange={e => set('bizMachineCapacity', e.target.value)}
                    placeholder="Describe your equipment capacity" style={inputSt}
                    onFocus={e => e.target.style.borderColor = CL.gold}
                    onBlur={e => e.target.style.borderColor = CL.border} />
                </Field>
                <Field label="Service Coverage Radius" required hint="How far can you serve customers?">
                  <ChipSelect options={['Within 2km','Up to 5km','Up to 10km','Up to 20km','Nairobi-wide']}
                    value={data.bizCoverageRadius} onChange={v => set('bizCoverageRadius', v)} color={CL.blue} />
                </Field>
                <Field label="Typical Turnaround Time" required>
                  <ChipSelect options={['Same day','Next day (24hrs)','2 days','3 days','Weekly']}
                    value={data.bizTurnaround} onChange={v => set('bizTurnaround', v)} color={CL.blue} />
                </Field>
              </>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            OPERATIONS STEP — VENDORS
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'operations' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Settings} title="Pricing & Operations Setup" color={CL.blue} />

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ color: CL.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Pricing Setup (KSh)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { key: 'bizPriceSmall',  label: 'Small / Basic',     placeholder: 'e.g. 1500' },
                  { key: 'bizPriceMedium', label: 'Medium / Standard', placeholder: 'e.g. 2500' },
                  { key: 'bizPriceLarge',  label: 'Large / Premium',   placeholder: 'e.g. 4000' },
                ].map(p => (
                  <Field key={p.key} label={p.label} required>
                    <input type="number" value={data[p.key]} onChange={e => set(p.key, e.target.value)}
                      placeholder={p.placeholder} style={inputSt}
                      onFocus={e => e.target.style.borderColor = CL.gold}
                      onBlur={e => e.target.style.borderColor = CL.border} />
                  </Field>
                ))}
              </div>
            </div>

            <div style={{ background: CL.blueSoft, border: '1px solid #BFDBFE', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
              <Checkbox checked={data.bizPickupAgreement} onChange={() => set('bizPickupAgreement', !data.bizPickupAgreement)}
                label="I agree to participate in Fixera's Pickup & Delivery service — allowing Fixera riders to collect items from customers and deliver to my premises." />
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            PRODUCTS STEP — SUPPLIERS
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'products' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Package} title="Product Catalog & Supplier Details" color="#F59E0B" />

            <Field label="Brands / Products You Supply" required hint="List the main brands or products you supply">
              <input value={data.supplierBrands} onChange={e => set('supplierBrands', e.target.value)}
                placeholder="e.g. Crown Paints, Sadolin, Basco Paints" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>
            <FileUpload label="Brand Authorization Letter"
              hint="Upload a letter from the brand authorizing you as a supplier (if applicable)"
              value={data.supplierBrandAuthUrl} onChange={v => set('supplierBrandAuthUrl', v)} />
            <Field label="Bulk Pricing / Wholesale Setup" hint="Describe your pricing structure for volume orders">
              <input value={data.supplierBulkPricing} onChange={e => set('supplierBulkPricing', e.target.value)}
                placeholder="e.g. 5% discount for orders above KSh 50,000" style={inputSt}
                onFocus={e => e.target.style.borderColor = CL.gold}
                onBlur={e => e.target.style.borderColor = CL.border} />
            </Field>
            <Field label="Delivery / Fulfillment Capability" required>
              <ChipSelect options={['I deliver to customers','Customer picks up from me','Both options available','I use third-party courier']}
                value={data.supplierDelivery} onChange={v => set('supplierDelivery', v)} color="#F59E0B" />
            </Field>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            AGREEMENT STEP — VENDORS / SUPPLIERS / MOVERS / WATER_CARRIER
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'agreement' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={ClipboardList} title="Partnership Agreement & Promotions" />

            <CommissionCard role={role} />

            {[
              `I agree to Fixera's ${role} commission structure (${COMMISSION_RATES[role]?.rate || '10%'} platform fee on each completed job)`,
              'I will maintain accurate pricing and product/service listings',
              'I agree to respond to customer orders within 2 hours during operating hours',
              'I understand that consistent poor ratings may result in suspension',
              'I agree to participate in Fixera promotional campaigns when applicable',
              'I consent to Fixera displaying my business/products on the customer platform',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: `1px solid ${CL.border}` }}>
                <CheckCircle2 size={13} color={CL.green} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: CL.muted, fontSize: 12, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}

            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 12, padding: '16px', marginTop: 20 }}>
              <Checkbox checked={data.supplierPromoAccept} onChange={() => set('supplierPromoAccept', !data.supplierPromoAccept)}
                label="I accept the Fixera Partner Agreement and Promotion & Advertising terms" />
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            MOVER — FLEET STEP
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'fleet' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Truck} title="Fleet Registration"
              subtitle="Register each vehicle in your fleet. Fixera will verify all vehicle documents before going live." color="#8B5CF6" />
            <InfoBox color="#8B5CF6" label="What to upload per vehicle (Phase 2)">
              <ul style={{ margin: '0', paddingLeft: 18, color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
                <li>Vehicle type — Pickup / Van / 3-Ton / 5-Ton / 10-Ton Truck</li>
                <li>Plate number</li>
                <li>Carrying capacity</li>
                <li>Vehicle photos (4 sides)</li>
                <li>Current insurance certificate</li>
                <li>Logbook / vehicle registration document</li>
              </ul>
              <div style={{ marginTop: 10, fontStyle: 'italic', color: CL.muted, fontSize: 11 }}>
                After signup approval you'll add vehicles via the Fleet page. Required before accepting jobs.
              </div>
            </InfoBox>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            MOVER — INSURANCE STEP
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'insurance' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={ShieldCheck} title="Liability Insurance"
              subtitle="Movers must carry liability insurance — minimum KSh 10,000,000 coverage." color="#8B5CF6" />
            <InfoBox color="#8B5CF6" label="What to upload (Phase 2)">
              <ul style={{ margin: '0', paddingLeft: 18, color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
                <li>Liability insurance certificate (≥ KSh 10M)</li>
                <li>Insurance provider name</li>
                <li>Policy number</li>
                <li>Coverage expiry date</li>
                <li>Goods-in-transit insurance (recommended above KSh 50K quote value)</li>
              </ul>
              <div style={{ marginTop: 10, fontStyle: 'italic', color: CL.muted, fontSize: 11 }}>
                Insurance lapse = immediate account suspension until renewed (legal §1081).
              </div>
            </InfoBox>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            MOVER — REFERENCES STEP
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'references' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Star} title="Professional References"
              subtitle="Provide 5+ professional references — past clients or business contacts." color="#8B5CF6" />
            <InfoBox color="#8B5CF6" label="What to provide (Phase 2)">
              <ul style={{ margin: '0', paddingLeft: 18, color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
                <li>Reference 1 — name, phone, company / relationship</li>
                <li>Reference 2 — name, phone, company / relationship</li>
                <li>Reference 3 — name, phone, company / relationship</li>
                <li>Reference 4 — name, phone, company / relationship</li>
                <li>Reference 5 — name, phone, company / relationship</li>
                <li>(Optional) Portfolio link / company website</li>
                <li>(Optional) Customer testimonials</li>
              </ul>
            </InfoBox>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════
            WATER CARRIER — QUALITY STEP
        ════════════════════════════════════════════════ */}
        {currentStep.id === 'quality' && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <SectionTitle Icon={Droplets} title="Water Quality & Equipment"
              subtitle="Water carriers must prove clean, food-grade delivery throughout the supply chain." color="#06B6D4" />
            <InfoBox color="#06B6D4" label="What to upload (Phase 2)">
              <ul style={{ margin: '0', paddingLeft: 18, color: CL.muted, fontSize: 12, lineHeight: 1.8 }}>
                <li>Water quality test certificate (lab analysis)</li>
                <li>Source documentation (borehole permit / council supply contract)</li>
                <li>Food-grade jerrycan / container photos</li>
                <li>Spill prevention equipment photos</li>
                <li>Vehicle cleanliness procedures</li>
                <li>Hygiene & handling standards declaration</li>
              </ul>
              <div style={{ marginTop: 10, fontStyle: 'italic', color: CL.muted, fontSize: 11 }}>
                Contaminated delivery = 30-day suspension + full refund (legal §1156).
              </div>
            </InfoBox>
          </motion.div>
        )}

        {/* ── NAVIGATION BUTTONS ── */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'none', border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ flex: 2, padding: '14px', borderRadius: 12, background: CL.text, border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(10,22,40,0.18)' }}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 2, padding: '14px', borderRadius: 12, background: saving ? CL.border : CL.text, border: 'none', color: saving ? CL.muted : '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Send size={16} />
              {saving ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </motion.div>

      </div>
    </div>
  );
}
