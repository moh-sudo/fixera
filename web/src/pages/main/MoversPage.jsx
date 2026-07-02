import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, BedDouble, Building2, Home,
  Box, Tv, Package, Briefcase,
  AlertTriangle, Camera, Lightbulb, CheckCircle2, Truck, Loader,
  ChevronRight, FileText, DollarSign, Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createMovingRequest } from '../../services/movingService';

import { useCL } from '../../hooks/useCL';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const PROPERTY_TYPES = [
  { id: 'studio',    label: 'Studio / Bedsitter', Icon: Home,      desc: 'Single room',             color: '#4A90D9' },
  { id: '1br',       label: '1 Bedroom',          Icon: BedDouble, desc: 'Small apartment',         color: '#48BB78' },
  { id: '2br',       label: '2 Bedrooms',         Icon: BedDouble, desc: 'Medium apartment',        color: '#F6AD55' },
  { id: '3br',       label: '3+ Bedrooms',        Icon: Building2, desc: 'Large apartment / house', color: '#FC8A4D' },
  { id: 'house',     label: 'Whole House',        Icon: Home,      desc: 'Standalone house',        color: '#9F7AEA' },
  { id: 'office',    label: 'Office',             Icon: Building2, desc: 'Business / office space', color: '#4FD1C5' },
  { id: 'warehouse', label: 'Warehouse / Store',  Icon: Building2, desc: 'Storage / industrial',   color: '#63B3ED' },
];

const INVENTORY_ITEMS = {
  Furniture: [
    { id: 'sofa',         name: 'Sofa Set',       Icon: Package   },
    { id: 'bed',          name: 'Bed & Mattress',  Icon: BedDouble },
    { id: 'wardrobe',     name: 'Wardrobe',        Icon: Package   },
    { id: 'dining-table', name: 'Dining Table',    Icon: Package   },
    { id: 'desk',         name: 'Desk / Table',    Icon: FileText  },
    { id: 'bookshelf',    name: 'Bookshelf',       Icon: Package   },
    { id: 'cabinet',      name: 'Cabinet',         Icon: Box       },
  ],
  Appliances: [
    { id: 'fridge',   name: 'Fridge',          Icon: Package },
    { id: 'tv',       name: 'TV / Monitor',    Icon: Tv      },
    { id: 'washer',   name: 'Washing Machine', Icon: Package },
    { id: 'microwave',name: 'Microwave',       Icon: Package },
    { id: 'cooker',   name: 'Cooker / Oven',  Icon: Package },
    { id: 'ac',       name: 'AC Unit',         Icon: Package },
  ],
  'Boxes & Other': [
    { id: 'box-small',  name: 'Small Box',      Icon: Box          },
    { id: 'box-medium', name: 'Medium Box',     Icon: Box          },
    { id: 'box-large',  name: 'Large Box',      Icon: Package      },
    { id: 'suitcase',   name: 'Suitcase / Bag', Icon: Briefcase    },
    { id: 'fragile',    name: 'Fragile Items',  Icon: AlertTriangle },
  ],
};

const VEHICLES = [
  { id: 'pickup',    name: 'Pickup Truck', capacity: 'Up to 1 ton',   suitable: 'Studio / few items',   color: '#48BB78' },
  { id: 'van',       name: 'Van',          capacity: 'Up to 1.5 tons', suitable: 'Studio – 1 BR',        color: '#4A90D9' },
  { id: 'truck-3t',  name: '3-Ton Truck',  capacity: '3 tons',         suitable: '1 – 2 BR apartment',  color: '#F6AD55' },
  { id: 'truck-5t',  name: '5-Ton Truck',  capacity: '5 tons',         suitable: '2 – 3 BR / house',    color: '#FC8A4D' },
  { id: 'truck-10t', name: '10-Ton Truck', capacity: '10 tons',        suitable: 'Office / warehouse',   color: '#9F7AEA' },
];

const STEPS = ['Locations', 'Property', 'Photos', 'Inventory', 'Vehicle', 'Review'];

export default function MoversPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const fileRef = useRef(null);

  const [step, setStep]         = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [pickup, setPickup]     = useState('');
  const [destination, setDest]  = useState('');
  const [propertyType, setProp] = useState('');
  const [photos, setPhotos]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [inventory, setInventory] = useState({});
  const [vehicleType, setVehicle] = useState('');
  const [movingDate, setDate]   = useState('');
  const [notes, setNotes]       = useState('');

  const updateQty = (itemId, delta) => {
    setInventory(prev => {
      const cur  = prev[itemId] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) { const { [itemId]: _, ...rest } = prev; return rest; }
      return { ...prev, [itemId]: next };
    });
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setPhotos(prev => [...prev, ...files].slice(0, 10));
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };

  const canNext = () => {
    if (step === 0) return pickup.trim() && destination.trim();
    if (step === 1) return !!propertyType;
    if (step === 4) return !!vehicleType;
    return true;
  };

  const inventoryList = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      for (const items of Object.values(INVENTORY_ITEMS)) {
        const found = items.find(i => i.id === id);
        if (found) return { item: found.name, qty };
      }
      return { item: id, qty };
    });

  const handleSubmit = async () => {
    if (!user && isGuest) { navigate('/signup', { state: { returnTo: '/movers' } }); return; }
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      const req = await createMovingRequest(user.id, { pickupLocation: pickup, destination, propertyType, inventory: inventoryList, vehicleType, movingDate, notes }, photos);
      navigate(`/movers/request/${req.id}`);
    } catch (err) {
      console.error('Moving request failed:', err);
      alert('Failed to submit request. Please try again.');
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 40px',
    borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface,
    color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Sticky header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/home')}
          style={{ width: 38, height: 38, borderRadius: 12, background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={CL.text} strokeWidth={2} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color={CL.gold} /> Moving Request
          </div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 18px', background: CL.surface, borderBottom: `1px solid ${CL.border}` }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? CL.gold : CL.border, transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '20px 18px 120px', maxWidth: 680, margin: '0 auto' }}>

        {/* ── Step 0: Locations ── */}
        {step === 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Pickup Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} color={CL.gold} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input style={inputStyle} placeholder="e.g. Kilimani, Nairobi" value={pickup} onChange={e => setPickup(e.target.value)}
                  onFocus={e => e.target.style.borderColor = CL.goldBorder}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Destination</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} color={CL.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input style={inputStyle} placeholder="e.g. Westlands, Nairobi" value={destination} onChange={e => setDest(e.target.value)}
                  onFocus={e => e.target.style.borderColor = CL.goldBorder}
                  onBlur={e => e.target.style.borderColor = CL.border} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Preferred Moving Date <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} color={CL.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input type="date" style={inputStyle} value={movingDate} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Lightbulb size={16} color={CL.gold} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.5 }}>
                Be as specific as possible with locations (include building name, estate, or landmark). This helps movers give you accurate quotes.
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Property Type ── */}
        {step === 1 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>What type of property are you moving from?</div>
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 18 }}>This helps movers understand the scale of the job.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {PROPERTY_TYPES.map(p => {
                const selected = propertyType === p.id;
                return (
                  <div key={p.id} onClick={() => setProp(p.id)} style={{
                    background: selected ? `${p.color}10` : CL.surface,
                    border: `2px solid ${selected ? p.color : CL.border}`,
                    borderRadius: 16, padding: '18px 14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <p.Icon size={22} color={p.color} strokeWidth={1.7} />
                    </div>
                    <div style={{ color: selected ? p.color : CL.text, fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                    <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>{p.desc}</div>
                    {selected && <CheckCircle2 size={14} color={p.color} style={{ marginTop: 8 }} />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Photos ── */}
        {step === 2 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Upload Photos of Your Items</div>
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Take photos of rooms, furniture, appliances, and boxes. This helps movers assess the job accurately. (Up to 10 photos)
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 16 }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '1', border: `1px solid ${CL.border}` }}>
                  <img src={src} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
              {photos.length < 10 && (
                <div onClick={() => fileRef.current?.click()} style={{ aspectRatio: '1', borderRadius: 12, border: `2px dashed ${CL.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: CL.surface, gap: 6, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = CL.goldBorder; e.currentTarget.style.background = CL.goldSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; e.currentTarget.style.background = CL.surface; }}>
                  <Camera size={24} color={CL.muted} strokeWidth={1.7} />
                  <div style={{ color: CL.muted, fontSize: 11 }}>Add Photo</div>
                </div>
              )}
            </div>

            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Image size={16} color={CL.gold} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.5 }}>
                Photos are optional but help movers give more accurate quotes. Include all rooms and large items.
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Digital Inventory ── */}
        {step === 3 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>What are you moving?</div>
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Select items and quantities. This becomes your digital inventory record for the move.
            </div>

            {Object.entries(INVENTORY_ITEMS).map(([category, items]) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>{category}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => {
                    const qty = inventory[item.id] || 0;
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: qty > 0 ? CL.goldSoft : CL.surface,
                        border: `1px solid ${qty > 0 ? CL.goldBorder : CL.border}`,
                        borderRadius: 12, padding: '10px 14px', transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: qty > 0 ? CL.goldSoft : CL.bg, border: `1px solid ${qty > 0 ? CL.goldBorder : CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.Icon size={15} color={qty > 0 ? CL.gold : CL.muted} strokeWidth={1.7} />
                          </div>
                          <span style={{ color: CL.text, fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateQty(item.id, -1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ color: qty > 0 ? CL.gold : CL.muted, fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${CL.goldBorder}`, background: CL.goldSoft, color: CL.gold, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {inventoryList.length > 0 && (
              <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: 16 }}>
                <div style={{ color: CL.gold, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  Selected Items ({inventoryList.reduce((s, i) => s + i.qty, 0)} total)
                </div>
                <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
                  {inventoryList.map(i => `${i.qty}x ${i.item}`).join(' · ')}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step 4: Vehicle Selection ── */}
        {step === 4 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Select Preferred Vehicle Size</div>
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Choose based on your property size. Movers may suggest a different vehicle in their quotes.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {VEHICLES.map(v => {
                const selected = vehicleType === v.id;
                return (
                  <div key={v.id} onClick={() => setVehicle(v.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: selected ? `${v.color}10` : CL.surface,
                    border: `2px solid ${selected ? v.color : CL.border}`,
                    borderRadius: 16, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${v.color}15`, border: `1px solid ${v.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Truck size={26} color={v.color} strokeWidth={1.7} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: selected ? v.color : CL.text, fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                      <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>{v.capacity} — {v.suitable}</div>
                    </div>
                    {selected && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 5: Review & Submit ── */}
        {step === 5 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 5 }}>Review Your Moving Request</div>
            <div style={{ color: CL.muted, fontSize: 13, marginBottom: 20 }}>
              Confirm the details below. Once submitted, nearby movers will send you quotations to compare.
            </div>

            <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
              {[
                { label: 'From',      value: pickup },
                { label: 'To',        value: destination },
                { label: 'Property',  value: PROPERTY_TYPES.find(p => p.id === propertyType)?.label || '—' },
                { label: 'Vehicle',   value: VEHICLES.find(v => v.id === vehicleType)?.name || '—' },
                ...(movingDate ? [{ label: 'Date', value: movingDate }] : []),
                { label: 'Photos',    value: `${photos.length} uploaded` },
              ].map((row, i, arr) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: i < arr.length - 1 ? 12 : 0, marginBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                  <span style={{ color: CL.muted, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: CL.text, fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {inventoryList.length > 0 && (
              <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
                <div style={{ color: CL.gold, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  Inventory ({inventoryList.reduce((s, i) => s + i.qty, 0)} items)
                </div>
                {inventoryList.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < inventoryList.length - 1 ? `1px solid ${CL.border}` : 'none' }}>
                    <span style={{ color: CL.muted, fontSize: 13 }}>{item.item}</span>
                    <span style={{ color: CL.text, fontSize: 13, fontWeight: 600 }}>×{item.qty}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                Additional Notes <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <FileText size={14} color={CL.muted} style={{ position: 'absolute', left: 13, top: 14 }} />
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Floor number, parking, fragile items, etc." rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 36px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.surface, color: CL.text, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <DollarSign size={16} color={CL.gold} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.6 }}>
                <strong style={{ color: CL.gold }}>No price yet — that's by design!</strong><br />
                Multiple movers will review your request and compete to offer you the best quote. You choose who to go with.
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Fixed bottom nav ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: CL.surface, borderTop: `1px solid ${CL.border}`, padding: '14px 18px', display: 'flex', gap: 12, zIndex: 50 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '13px', borderRadius: 13, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ArrowLeft size={15} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()} style={{
            flex: step > 0 ? 1 : '1 1 100%', padding: '13px', borderRadius: 13,
            background: canNext() ? CL.navy : CL.border,
            border: 'none', color: canNext() ? '#fff' : CL.muted,
            fontWeight: 800, fontSize: 14, cursor: canNext() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            Next: {STEPS[step + 1]} <ChevronRight size={15} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 1, padding: '13px', borderRadius: 13,
            background: submitting ? CL.border : CL.navy,
            border: 'none', color: submitting ? CL.muted : '#fff',
            fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {submitting ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Submit for Quotes <ChevronRight size={15} /></>}
          </button>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
