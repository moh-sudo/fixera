import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import VerificationBanner from '../../components/VerificationBanner';
import { listSupplierOrders, SUPPLIER_STEPS } from '../../services/supplierService';
import { addProduct as svcAddProduct, proposePrice, toggleStock as svcToggleStock } from '../../services/supplierProductService';
import { motion } from 'framer-motion';
import { Package, CheckCircle2, XCircle, Bell, MapPin, User, Inbox } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB', amberBorder: '#FDE68A',
  navy: '#0A1628',
};

const SUPPLIER_AMBER = '#F59E0B';
const CATEGORY_ICON = { paint: 'Paint', cleaning: 'Cleaning', tools: 'Tools', plumbing: 'Plumbing', electrical: 'Electrical' };
const miniBtn = {
  flex: 1, padding: '8px 14px', borderRadius: 10,
  background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted,
  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

export default function SupplierDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts]     = useState([]);
  const [orders, setOrders]         = useState([]);
  const [view, setView]             = useState('orders');
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', unit: '', in_stock: true });
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetchData(); }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    const [{ data }, ords] = await Promise.all([
      supabase.from('vendor_products').select('*').eq('business_id', user.id).order('created_at', { ascending: false }),
      listSupplierOrders(user.id).catch(() => []),
    ]);
    setProducts(data || []);
    setOrders(ords || []);
    setLoading(false);
  }

  const pendingOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  async function addProduct(e) {
    e.preventDefault();
    setSaving(true);
    await svcAddProduct(user.id, profile?.product_category, newProduct);
    setNewProduct({ name: '', description: '', price: '', unit: '', in_stock: true });
    setShowAdd(false); setSaving(false); fetchData();
  }

  async function toggleStock(id, current) {
    await svcToggleStock(id, !current);
    fetchData();
  }

  async function editPrice(p) {
    const v = prompt(`New price for "${p.name}" (current KSh ${p.price}). Change needs Fixera approval.`, p.price);
    if (v === null) return;
    const n = parseFloat(v);
    if (!n || n <= 0) { alert('Enter a valid price.'); return; }
    await proposePrice(p.id, n);
    fetchData();
  }

  const catLabel = CATEGORY_ICON[profile?.product_category] || 'Products';
  const inStock  = products.filter(p => p.in_stock).length;
  const outStock = products.filter(p => !p.in_stock).length;

  return (
    <div style={{ padding: '20px 16px 32px', maxWidth: 600, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      <VerificationBanner />

      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>Supplier Hub</div>
          <div style={{ color: SUPPLIER_AMBER, fontSize: 13, marginTop: 4, fontWeight: 600 }}>
            {profile?.product_category ? profile.product_category.charAt(0).toUpperCase() + profile.product_category.slice(1) : 'Supplier'} · {profile?.full_name}
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '10px 16px', borderRadius: 12, background: CL.text,
          border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Add Product</button>
      </motion.div>

      {/* Stats */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',    val: products.length, color: CL.gold,  Icon: Package },
          { label: 'In Stock', val: inStock,          color: CL.green, Icon: CheckCircle2 },
          { label: 'Out',      val: outStock,         color: CL.red,   Icon: XCircle },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} style={{
            background: CL.surface, border: `1px solid ${CL.border}`,
            borderRadius: 14, padding: '14px', textAlign: 'center',
          }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px' }}>
              <Icon size={18} color={color} strokeWidth={2} />
            </div>
            <div style={{ color: CL.text, fontSize: 24, fontWeight: 900 }}>{val}</div>
            <div style={{ color: color, fontSize: 10, fontWeight: 700, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* View toggle */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 4, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[
          { id: 'orders',   label: `Orders (${pendingOrders.length})` },
          { id: 'products', label: `Products (${products.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: view === t.id ? SUPPLIER_AMBER : 'transparent',
            color: view === t.id ? '#fff' : CL.muted,
            border: 'none',
          }}>{t.label}</button>
        ))}
      </motion.div>

      {/* Orders view */}
      {view === 'orders' && (
        loading ? null : orders.length === 0 ? (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Bell size={28} color={CL.muted} strokeWidth={1.5} />
            </div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 700 }}>No orders yet</div>
            <div style={{ color: CL.muted, fontSize: 13, marginTop: 6 }}>Customer orders will appear here.</div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {orders.map((o, i) => {
              const stageMeta = SUPPLIER_STEPS.find(s => s.id === o.fulfillment_stage);
              const isNew = o.status === 'pending';
              const items = Array.isArray(o.items) ? o.items : [];
              return (
                <motion.div key={o.id} custom={3 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" onClick={() => navigate(`/supplier/order/${o.id}`)} style={{
                  background: CL.surface,
                  border: `1px solid ${isNew ? SUPPLIER_AMBER : CL.border}`,
                  borderRadius: 16, padding: '16px', borderLeft: `3px solid ${SUPPLIER_AMBER}`, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ color: CL.text, fontSize: 14, fontWeight: 800 }}>
                      {items.length} item{items.length !== 1 ? 's' : ''} · KSh {Number(o.total || 0).toLocaleString()}
                    </div>
                    <span style={{
                      background: isNew ? CL.amberSoft : CL.blueSoft,
                      color: isNew ? SUPPLIER_AMBER : CL.blue,
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                    }}>
                      {isNew ? 'NEW' : (stageMeta ? stageMeta.label : o.status)}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, color: CL.muted, fontSize: 12 }}>
                    <User size={12} strokeWidth={2} />{o.customer_name || 'Customer'}
                    <span style={{ margin:'0 2px' }}>·</span>
                    <MapPin size={12} strokeWidth={2} />{o.delivery_address || '—'}
                  </div>
                  <div style={{ color: SUPPLIER_AMBER, fontSize: 12, fontWeight: 700, marginTop: 10, textAlign: 'right' }}>
                    {isNew ? 'Tap to accept →' : 'Manage →'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Add Product Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: CL.surface, border: `1px solid ${CL.border}`,
            borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: 500,
            maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: CL.border, margin: '0 auto' }} />
            </div>
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800, marginBottom: 20, marginTop: 12 }}>Add New Product</div>
            <form onSubmit={addProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'name',        label: 'Product Name', placeholder: 'e.g. Crown Silk White 4L' },
                { key: 'description', label: 'Description',  placeholder: 'Brief description' },
                { key: 'unit',        label: 'Unit / Size',  placeholder: 'e.g. per litre, per pack' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>{f.label}</label>
                  <input value={newProduct[f.key]} onChange={e => setNewProduct(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} required={f.key !== 'description'}
                    style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '13px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              ))}
              <div>
                <label style={{ color: CL.muted, fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Price (KSh)</label>
                <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 1200" required
                  style={{ width: '100%', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '13px 14px', color: CL.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div onClick={() => setNewProduct(p => ({ ...p, in_stock: !p.in_stock }))} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${newProduct.in_stock ? CL.gold : CL.border}`, background: newProduct.in_stock ? CL.gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>
                  {newProduct.in_stock && '✓'}
                </div>
                <span style={{ color: CL.text, fontSize: 13 }}>Currently in stock</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, background: 'none', border: `1px solid ${CL.border}`, color: CL.muted, fontWeight: 600, fontSize: 14, borderRadius: 12, padding: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, background: CL.text, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products */}
      {view === 'products' && (loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${SUPPLIER_AMBER}30`, borderTopColor: SUPPLIER_AMBER, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : products.length === 0 ? (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ width:60, height:60, borderRadius:18, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Package size={28} color={CL.muted} strokeWidth={1.5} />
          </div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No products yet</div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 20 }}>Add your products so customers can order them.</div>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '14px 28px', borderRadius: 12, background: CL.text,
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Add First Product</button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((p, i) => {
            const pending  = p.status === 'pending';
            const rejected = p.status === 'rejected';
            const approved = !pending && !rejected;
            const borderColor = pending ? SUPPLIER_AMBER : rejected ? CL.red : p.in_stock ? CL.green : CL.red;
            return (
              <motion.div key={p.id} custom={3 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{
                background: CL.surface, border: `1px solid ${CL.border}`,
                borderRadius: 16, padding: '16px', borderLeft: `3px solid ${borderColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                  <span style={{
                    background: pending ? CL.amberSoft : rejected ? CL.redSoft : p.in_stock ? CL.greenSoft : CL.redSoft,
                    color: pending ? SUPPLIER_AMBER : rejected ? CL.red : p.in_stock ? CL.green : CL.red,
                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>
                    {pending ? 'Pending Approval' : rejected ? 'Rejected' : p.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {p.description && <div style={{ color: CL.muted, fontSize: 12, marginBottom: 8 }}>{p.description}</div>}
                {rejected && p.rejection_reason && (
                  <div style={{ background: CL.redSoft, border: `1px solid #FECACA`, borderRadius: 8, padding: '8px 10px', color: CL.red, fontSize: 11, marginBottom: 8 }}>
                    Reason: {p.rejection_reason}
                  </div>
                )}
                {p.pending_price != null && (
                  <div style={{ background: CL.amberSoft, border: `1px solid ${CL.amberBorder}`, borderRadius: 8, padding: '8px 10px', color: SUPPLIER_AMBER, fontSize: 11, marginBottom: 8 }}>
                    Price change pending: KSh {p.price?.toLocaleString()} → <strong>KSh {Number(p.pending_price).toLocaleString()}</strong> (awaiting approval)
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <span style={{ color: CL.gold, fontSize: 17, fontWeight: 800 }}>KSh {p.price?.toLocaleString()}</span>
                    {p.unit && <span style={{ color: CL.muted, fontSize: 11, marginLeft: 6 }}>/ {p.unit}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => editPrice(p)} style={miniBtn}>Edit Price</button>
                  {approved && (
                    <button onClick={() => toggleStock(p.id, p.in_stock)} style={miniBtn}>
                      {p.in_stock ? 'Mark Out' : 'Mark In'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Tip */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" style={{ marginTop: 24, padding: '14px 16px', background: CL.amberSoft, border: `1px solid ${CL.amberBorder}`, borderRadius: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Inbox size={18} color={CL.amber} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>
          Your products are recommended to customers who book related services. Keep your inventory updated for the best visibility.
        </div>
      </motion.div>
    </div>
  );
}
