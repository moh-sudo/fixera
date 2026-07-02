import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { Btn, Card } from '../../components/UI';
import { useAuth } from '../../hooks/useAuth';
import { listProducts, placeOrder, PRODUCT_CATEGORIES } from '../../services/supplierShopService';

export default function SupplierShopPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cart, setCart]         = useState({});      // productId → qty
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing]   = useState(false);
  const [delivery, setDelivery] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    setLoading(true);
    listProducts(category).then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, [category]);

  const productsById = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ ...productsById[id], qty }))
    .filter(i => i.id);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  // All cart items must be from ONE supplier (one order = one supplier)
  const cartSupplierId = cartItems[0]?.business_id;
  const mixedSuppliers = cartItems.some(i => i.business_id !== cartSupplierId);

  const setQty = (id, qty) => setCart(c => ({ ...c, [id]: Math.max(0, qty) }));

  const handleCheckout = async () => {
    if (!user || isGuest) {
      navigate('/signup', { state: { returnTo: '/shop' } });
      return;
    }
    if (!delivery.address.trim()) { alert('Please enter a delivery address.'); return; }
    if (mixedSuppliers) { alert('Each order must be from a single supplier. Please checkout separately.'); return; }
    setPlacing(true);
    try {
      const order = await placeOrder(user.id, cartSupplierId, cartItems, delivery);
      navigate(`/supplier-order/${order.id}`);
    } catch (err) {
      console.error(err);
      alert('Could not place the order.');
    } finally { setPlacing(false); }
  };

  return (
    <div style={{ padding: '24px 20px 100px', minHeight: '100vh', background: C.navy }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <button onClick={() => navigate('/home')} style={iconBtn}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.textPrimary, fontSize: 20, fontWeight: 900 }}>🛒 Supplies Shop</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>Order materials — delivered by Fixera riders</div>
        </div>
        <button onClick={() => setShowCart(true)} style={{ ...iconBtn, position: 'relative', width: 44 }}>
          🛒
          {cartCount > 0 && (
            <span style={{ position: 'absolute', top: -4, right: -4, background: C.gold, color: C.navy, fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{cartCount}</span>
          )}
        </button>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18, paddingBottom: 4 }}>
        <Chip active={!category} onClick={() => setCategory(null)} label="All" icon="📦" />
        {PRODUCT_CATEGORIES.map(c => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.label} icon={c.icon} />
        ))}
      </div>

      {/* Products */}
      {loading ? (
        <div style={{ textAlign: 'center', color: C.textMuted, padding: 40 }}>Loading products…</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 700 }}>No products here yet</div>
          <div style={{ color: C.textMuted, fontSize: 13, marginTop: 6 }}>Check back soon — suppliers are adding stock.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(p => {
            const qty = cart[p.id] || 0;
            return (
              <Card key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {PRODUCT_CATEGORIES.find(c => c.id === p.category)?.icon || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                  {p.supplier?.business_name && <div style={{ color: C.textMuted, fontSize: 11 }}>{p.supplier.business_name}</div>}
                  <div style={{ color: C.gold, fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                    KSh {p.price?.toLocaleString()}{p.unit && <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 400 }}> / {p.unit}</span>}
                  </div>
                </div>
                {qty === 0 ? (
                  <button onClick={() => setQty(p.id, 1)} style={addBtn}>Add</button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setQty(p.id, qty - 1)} style={stepBtn}>−</button>
                    <span style={{ color: C.textPrimary, fontSize: 14, fontWeight: 800, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setQty(p.id, qty + 1)} style={stepBtn}>+</button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky cart bar */}
      {cartCount > 0 && !showCart && (
        <div onClick={() => setShowCart(true)} style={{
          position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 560, margin: '0 auto',
          background: 'linear-gradient(135deg,#C9A020,#D4B033)', borderRadius: 14, padding: '14px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)', zIndex: 900,
        }}>
          <span style={{ color: C.navy, fontWeight: 800, fontSize: 14 }}>🛒 {cartCount} item{cartCount > 1 ? 's' : ''}</span>
          <span style={{ color: C.navy, fontWeight: 900, fontSize: 15 }}>KSh {cartTotal.toLocaleString()} →</span>
        </div>
      )}

      {/* Cart / checkout drawer */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.navyLight, borderRadius: '20px 20px 0 0', padding: '20px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Your Cart</div>
            {cartItems.length === 0 ? (
              <div style={{ color: C.textMuted, textAlign: 'center', padding: 30 }}>Cart is empty</div>
            ) : (
              <>
                {mixedSuppliers && (
                  <div style={{ background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', borderRadius: 10, padding: 12, marginBottom: 12, color: C.error, fontSize: 12 }}>
                    ⚠️ Your cart has items from different suppliers. Each order must be from one supplier.
                  </div>
                )}
                {cartItems.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.navyBorder}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>{i.name}</div>
                      <div style={{ color: C.textMuted, fontSize: 11 }}>KSh {i.price?.toLocaleString()} × {i.qty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setQty(i.id, i.qty - 1)} style={stepBtn}>−</button>
                      <span style={{ color: C.textPrimary, fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} style={stepBtn}>+</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', color: C.gold, fontSize: 16, fontWeight: 800 }}>
                  <span>Total</span><span>KSh {cartTotal.toLocaleString()}</span>
                </div>

                {/* Delivery details */}
                <div style={{ color: C.textSec, fontSize: 12, fontWeight: 700, marginTop: 8, marginBottom: 8 }}>DELIVERY DETAILS</div>
                {[
                  { k: 'name', ph: 'Your name' },
                  { k: 'phone', ph: 'Phone number' },
                  { k: 'address', ph: 'Delivery address *' },
                  { k: 'notes', ph: 'Notes (optional)' },
                ].map(f => (
                  <input key={f.k} value={delivery[f.k]} onChange={e => setDelivery(d => ({ ...d, [f.k]: e.target.value }))}
                    placeholder={f.ph}
                    style={{ width: '100%', background: C.navy, border: `1px solid ${C.navyBorder}`, borderRadius: 10, padding: '11px 13px', color: C.textPrimary, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
                ))}
                <Btn onClick={handleCheckout} disabled={placing || mixedSuppliers} style={{ width: '100%', marginTop: 6, opacity: (placing || mixedSuppliers) ? 0.5 : 1 }}>
                  {placing ? 'Placing order…' : `Place Order · KSh ${cartTotal.toLocaleString()}`}
                </Btn>
                <div style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                  🚚 Delivered to you by a Fixera rider
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.navyBorder}`,
  background: C.navyLight, color: C.textPrimary, fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const addBtn = {
  padding: '8px 18px', borderRadius: 10, background: `${C.gold}20`, color: C.gold,
  border: `1px solid ${C.gold}50`, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};
const stepBtn = {
  width: 30, height: 30, borderRadius: 8, background: C.navy, color: C.textPrimary,
  border: `1px solid ${C.navyBorder}`, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
};

function Chip({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 16px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
      background: active ? `${C.gold}20` : C.navyLight,
      border: `1.5px solid ${active ? C.gold : C.navyBorder}`,
      color: active ? C.gold : C.textSec, fontSize: 13, fontWeight: 700,
    }}>{icon} {label}</button>
  );
}
