import { useEffect, useMemo, useState } from 'react';
import { listCatalog, submitEstimate } from '../services/materialsEstimateService';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  red: '#EF4444',
  navy: '#0A1628',
};

const CATS = [
  { id: null,         label: 'All',        icon: '📦' },
  { id: 'paint',      label: 'Paint',      icon: '🎨' },
  { id: 'cleaning',   label: 'Cleaning',   icon: '🧴' },
  { id: 'tools',      label: 'Tools',      icon: '🔨' },
  { id: 'plumbing',   label: 'Plumbing',   icon: '🪠' },
  { id: 'electrical', label: 'Electrical', icon: '💡' },
];

const addBtn = {
  padding: '7px 16px', borderRadius: 10,
  background: CL.goldSoft, color: CL.gold,
  border: `1px solid ${CL.goldBorder}`,
  fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};
const stepBtn = {
  width: 28, height: 28, borderRadius: 8,
  background: CL.bg, color: CL.text,
  border: `1px solid ${CL.border}`,
  fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};

export default function MaterialsEstimateModal({ workerId, booking, onClose, onSubmitted }) {
  const [cat, setCat]       = useState(null);
  const [products, setProds] = useState([]);
  const [loading, setLoad]  = useState(true);
  const [cart, setCart]     = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  useEffect(() => {
    setLoad(true);
    listCatalog(cat).then(setProds).catch(console.error).finally(() => setLoad(false));
  }, [cat]);

  const byId  = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);
  const items = Object.entries(cart).filter(([, q]) => q > 0)
    .map(([id, q]) => ({ ...byId[id], qty: q })).filter(i => i.id);
  const total      = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const supplierId = items[0]?.business_id;
  const mixed      = items.some(i => i.business_id !== supplierId);

  const setQty = (id, q) => setCart(c => ({ ...c, [id]: Math.max(0, q) }));

  const handleSubmit = async () => {
    setErr('');
    if (items.length === 0) { setErr('Add at least one item.'); return; }
    if (mixed) { setErr('All materials must be from one supplier.'); return; }
    setSaving(true);
    try {
      await submitEstimate(workerId, booking, items);
      onSubmitted?.();
    } catch (e) { console.error(e); setErr(e.message || 'Could not submit estimate.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: CL.surface, borderRadius: '20px 20px 0 0', padding: 20,
        width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto',
        border: `1px solid ${CL.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>🎨 Materials Estimate</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: CL.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ color: CL.muted, fontSize: 12, marginBottom: 14 }}>
          Pick what's needed from a supplier's catalog. The customer confirms, then it's delivered to site.
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {CATS.map(c => (
            <button key={c.label} onClick={() => setCat(c.id)} style={{
              padding: '7px 13px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
              background: cat === c.id ? CL.goldSoft : CL.bg,
              border: `1.5px solid ${cat === c.id ? CL.goldBorder : CL.border}`,
              color: cat === c.id ? CL.gold : CL.muted, fontSize: 12, fontWeight: 700,
            }}>{c.icon} {c.label}</button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: 'center', color: CL.muted, padding: 24 }}>Loading catalog…</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', color: CL.muted, padding: 24, fontSize: 13 }}>
            No supplier products here. Suppliers add stock in their app.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {products.map(p => {
              const q = cart[p.id] || 0;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ color: CL.muted, fontSize: 11 }}>
                      {p.supplier?.business_name || 'Supplier'} · KSh {p.price?.toLocaleString()}{p.unit ? ` / ${p.unit}` : ''}
                    </div>
                  </div>
                  {q === 0 ? (
                    <button onClick={() => setQty(p.id, 1)} style={addBtn}>Add</button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setQty(p.id, q - 1)} style={stepBtn}>−</button>
                      <span style={{ color: CL.text, fontSize: 14, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>{q}</span>
                      <button onClick={() => setQty(p.id, q + 1)} style={stepBtn}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {err && <div style={{ color: CL.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}

        {/* Summary + submit */}
        <div style={{ position: 'sticky', bottom: 0, background: CL.surface, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: CL.gold, fontSize: 16, fontWeight: 800 }}>
            <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span>KSh {total.toLocaleString()}</span>
          </div>
          <button onClick={handleSubmit} disabled={saving || items.length === 0} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: items.length ? CL.text : CL.bg,
            color: items.length ? '#fff' : CL.muted,
            border: 'none', fontSize: 14, fontWeight: 800,
            cursor: items.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}>{saving ? 'Sending to customer…' : 'Send Estimate to Customer →'}</button>
        </div>
      </div>
    </div>
  );
}
