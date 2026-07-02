import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Droplets, Zap, Sparkles, Paintbrush, HelpCircle,
  Clock, AlertTriangle, CheckCircle2, Camera, Video, X, Search,
  DollarSign, Bell, Wrench, MapPin, Lightbulb, FileText, Home, Loader
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createInspection } from '../../services/inspectionService';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const CATEGORIES = [
  { id: 'plumbing',   Icon: Droplets,    label: 'Plumbing',     color: '#4A90D9' },
  { id: 'electrical', Icon: Zap,         label: 'Electrical',   color: '#F6C90E' },
  { id: 'cleaning',   Icon: Sparkles,    label: 'Cleaning',     color: '#4FD1C5' },
  { id: 'painting',   Icon: Paintbrush,  label: 'Painting',     color: '#FC8A4D' },
  { id: 'unsure',     Icon: HelpCircle,  label: "I'm Not Sure", color: '#C9A020' },
];

const URGENCY = [
  { id: 'low',       Icon: CheckCircle2,    label: 'Not Urgent',  sub: 'Can wait a few days',  color: '#1A7F3C' },
  { id: 'moderate',  Icon: Clock,           label: 'Moderate',    sub: 'Within 24–48 hours',   color: '#D4780A'  },
  { id: 'emergency', Icon: AlertTriangle,   label: 'Emergency',   sub: 'Need help ASAP',       color: '#C0392B'  },
];

const STEPS = ['Category & Urgency', 'Describe Problem', 'Photos & Videos', 'Location & Submit'];

export default function InspectionRequestPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user, guestContact } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep]               = useState(0);
  const [category, setCategory]       = useState(null);
  const [urgency, setUrgency]         = useState(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos]           = useState([]);
  const [photoFiles, setPhotoFiles]   = useState([]);
  const [address, setAddress]         = useState('');
  const [contactNote, setContactNote] = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [saving, setSaving]           = useState(false);

  const canNext = () => {
    if (step === 0) return category && urgency;
    if (step === 1) return description.trim().length > 10;
    if (step === 2) return true;
    if (step === 3) return address.trim().length > 5;
    return false;
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video') ? 'video' : 'photo',
    }));
    setPhotos(prev => [...prev, ...previews].slice(0, 6));
    setPhotoFiles(prev => [...prev, ...files].slice(0, 6));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/signup', { state: { prefill: { name: guestContact?.name || '', phone: guestContact?.phone || '', email: guestContact?.email || '' } } });
      return;
    }
    setSaving(true);
    try {
      const catObj = CATEGORIES.find(c => c.id === category);
      const urgObj = URGENCY.find(u => u.id === urgency);
      await createInspection(user.id, {
        category:          catObj?.label || category,
        category_icon:     category,
        urgency:           urgObj?.label || urgency,
        issue_description: description,
        location:          address,
        contact_note:      contactNote,
      }, photoFiles);
    } catch (err) {
      console.error('Inspection save error:', err);
    } finally {
      setSaving(false);
      setSubmitted(true);
    }
  };

  /* Success screen */
  if (submitted) {
    const catObj = CATEGORIES.find(c => c.id === category);
    const urgObj = URGENCY.find(u => u.id === urgency);
    return (
      <div style={{ minHeight: '100vh', background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: 480, width: '100%' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: CL.successBg, border: `1px solid ${CL.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} color={CL.success} strokeWidth={1.6} />
            </div>
            <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Request Submitted!</div>
            <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7 }}>
              Our team will review your request and send you a detailed quotation within <strong style={{ color: CL.gold }}>2 hours</strong>.
            </div>
          </div>

          {/* Reference */}
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 22, marginBottom: 16 }}>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Request Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Reference', value: `#INS-${Math.floor(Math.random()*90000)+10000}`, gold: true },
                { label: 'Category',  value: catObj?.label || category },
                { label: 'Urgency',   value: urgObj?.label || urgency },
                { label: 'Photos',    value: `${photos.length} uploaded` },
                { label: 'Status',    value: 'Under Review', green: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: row.gold ? CL.gold : row.green ? CL.success : CL.text, fontWeight: 700, fontSize: 13 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 20, marginBottom: 24 }}>
            <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color={CL.gold} />
              What happens next?
            </div>
            {[
              { Icon: Search,      text: 'Fixera reviews your request and photos', time: 'Within 1 hour' },
              { Icon: DollarSign,  text: 'A detailed quotation is prepared for you', time: 'Within 2 hours' },
              { Icon: Bell,        text: 'You get notified and approve the quote', time: 'Your choice' },
              { Icon: Wrench,      text: 'The right professional is assigned', time: 'After approval' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 14 : 0, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.Icon size={15} color={CL.gold} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>{s.text}</div>
                  <div style={{ color: CL.gold, fontSize: 11, marginTop: 2 }}>{s.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/quotation/demo')} style={{ flex: 1, padding: '14px', borderRadius: 13, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Quotation
            </button>
            <button onClick={() => navigate('/home')} style={{ flex: 1, padding: '14px', borderRadius: 13, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      <style>{`.cat-opt:hover { border-color: rgba(201,160,32,0.5) !important; } .urg-opt:hover { border-color: rgba(201,160,32,0.5) !important; }`}</style>

      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Request Inspection</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 18px', background: CL.surface, borderBottom: `1px solid ${CL.border}` }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? CL.gold : CL.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '20px 18px', maxWidth: 680, margin: '0 auto' }}>

        {/* Step 0: Category & Urgency */}
        {step === 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>What area needs attention?</div>
              <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16 }}>
                Don't worry if you're not sure — just pick the closest option.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {CATEGORIES.map(cat => {
                  const active = category === cat.id;
                  return (
                    <div key={cat.id} className="cat-opt" onClick={() => setCategory(cat.id)} style={{
                      background: active ? `${cat.color}12` : CL.surface,
                      border: `2px solid ${active ? cat.color : CL.border}`,
                      borderRadius: 16, padding: '18px 14px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <cat.Icon size={22} color={cat.color} strokeWidth={1.8} />
                      </div>
                      <div style={{ color: active ? cat.color : CL.text, fontSize: 13, fontWeight: 700 }}>{cat.label}</div>
                      {active && <CheckCircle2 size={14} color={cat.color} style={{ marginTop: 8, margin: '8px auto 0' }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>How urgent is this?</div>
              <div style={{ color: CL.muted, fontSize: 13, marginBottom: 14 }}>This helps us prioritise your request.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {URGENCY.map(u => {
                  const active = urgency === u.id;
                  return (
                    <div key={u.id} className="urg-opt" onClick={() => setUrgency(u.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                      background: active ? CL.goldSoft : CL.surface,
                      border: `2px solid ${active ? CL.gold : CL.border}`,
                      borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: `${u.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <u.Icon size={18} color={u.color} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{u.label}</div>
                        <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{u.sub}</div>
                      </div>
                      {active && <CheckCircle2 size={16} color={CL.gold} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1: Describe problem */}
        {step === 1 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Describe the problem</div>
              <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                Use your own words — no technical knowledge needed. More detail = better quote.
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. My kitchen sink is leaking under the cabinet and there's water on the floor. It started 2 days ago and seems to be getting worse..."
                rows={7}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, boxSizing: 'border-box',
                  border: `1px solid ${CL.border}`, background: CL.surface,
                  color: CL.text, fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', lineHeight: 1.7,
                }}
                onFocus={e => e.target.style.borderColor = CL.goldBorder}
                onBlur={e => e.target.style.borderColor = CL.border}
              />
              <div style={{ color: description.length < 10 ? CL.muted : CL.success, fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                {description.length} characters {description.length >= 10 && '✓'}
              </div>
            </div>

            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: CL.gold, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                <Lightbulb size={13} />
                Helpful tips
              </div>
              {['When did the problem start?', 'Is it getting worse or staying the same?', 'Has this happened before?', 'Any unusual sounds, smells or visual signs?', 'Which part of your home is affected?'].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: CL.gold, fontSize: 12, marginTop: 1 }}>→</span>
                  <span style={{ color: CL.muted, fontSize: 12 }}>{tip}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Upload photos or videos</div>
              <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16 }}>
                Visual evidence helps us diagnose accurately. Up to 6 files.
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${CL.border}`, borderRadius: 18,
                  padding: '36px 24px', textAlign: 'center', cursor: 'pointer',
                  background: CL.surface, marginBottom: 14, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = CL.goldBorder; e.currentTarget.style.background = CL.goldSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; e.currentTarget.style.background = CL.surface; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 16, background: CL.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Camera size={24} color={CL.muted} strokeWidth={1.7} />
                </div>
                <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 5 }}>Tap to upload photos or videos</div>
                <div style={{ color: CL.muted, fontSize: 12 }}>JPG, PNG, MP4 · Max 6 files · Optional but recommended</div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handlePhotoAdd} style={{ display: 'none' }} />
              </div>

              {photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${CL.border}`, aspectRatio: '1' }}>
                      {p.type === 'photo' ? (
                        <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: CL.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Video size={26} color={CL.muted} />
                          <span style={{ color: CL.muted, fontSize: 10 }}>Video</span>
                        </div>
                      )}
                      <button
                        onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <div onClick={() => fileInputRef.current?.click()} style={{ borderRadius: 12, border: `2px dashed ${CL.border}`, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, background: CL.surface }}>
                      <span style={{ color: CL.gold, fontSize: 22, fontWeight: 700 }}>+</span>
                      <span style={{ color: CL.muted, fontSize: 10 }}>Add more</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ background: '#EBF8FF', border: '1px solid #BEE3F8', borderRadius: 14, padding: 16 }}>
              <div style={{ color: '#2B6CB0', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Why photos help</div>
              <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
                Photos allow our team to identify the exact issue and provide an accurate quotation without needing a visit first.
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Where is the problem located?</div>
              <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16 }}>So we know where to send the professional.</div>

              <div style={{ position: 'relative', marginBottom: 10 }}>
                <MapPin size={15} color={CL.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 14px 13px 40px', borderRadius: 12,
                    border: `1px solid ${CL.border}`, background: CL.surface,
                    color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = CL.goldBorder}
                  onBlur={e => e.target.style.borderColor = CL.border}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {['Home', 'Work', "Partner's Place"].map(q => (
                  <button key={q} onClick={() => setAddress(q + ' Address')} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${CL.border}`, background: 'transparent', color: CL.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Notes for our team <span style={{ color: CL.muted, fontWeight: 400, fontSize: 12 }}>(optional)</span></div>
              <textarea
                value={contactNote}
                onChange={e => setContactNote(e.target.value)}
                placeholder="e.g. Best to call after 5pm, gate code is 1234, park on the street..."
                rows={3}
                style={{ width: '100%', padding: '13px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Summary */}
            <div style={{ background: CL.surface, border: `1px solid ${CL.goldBorder}`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: CL.gold, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Request Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Category',    val: CATEGORIES.find(c => c.id === category)?.label || '' },
                  { label: 'Urgency',     val: URGENCY.find(u => u.id === urgency)?.label || '' },
                  { label: 'Photos',      val: `${photos.length} file${photos.length !== 1 ? 's' : ''} uploaded` },
                  { label: 'Description', val: description.length > 40 ? description.slice(0, 40) + '…' : description },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: CL.muted, fontSize: 12 }}>{row.label}</span>
                    <span style={{ color: CL.text, fontSize: 12, fontWeight: 600, textAlign: 'right', flex: 1, maxWidth: '60%' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 28 }}>
          <button
            onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
            disabled={!canNext() || saving}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              background: canNext() && !saving ? CL.navy : CL.border,
              border: 'none', color: canNext() && !saving ? '#fff' : CL.muted,
              fontSize: 15, fontWeight: 800, cursor: canNext() && !saving ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
            ) : step < STEPS.length - 1 ? 'Continue' : 'Submit Inspection Request'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
