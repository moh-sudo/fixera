import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

import { useCL } from '../../hooks/useCL';

// Top-up packages (display only for now — payments wired in a later backend task)
const PACKAGES = [
  { amount: 500,   bonus: 0,  label: 'Starter' },
  { amount: 1000,  bonus: 5,  label: 'Popular' },
  { amount: 2000,  bonus: 10, label: 'Value' },
  { amount: 5000,  bonus: 18, label: 'Best deal' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' } }),
};

export default function WalletPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notice, setNotice] = useState('');

  const balance = 0; // customer credit balance — wired to backend later

  const handleTopUp = () => {
    setNotice('💳 Top-up is launching soon — secure M-Pesa & card payments are on the way.');
    setTimeout(() => setNotice(''), 3500);
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif', paddingBottom: 40 }}>
      <style>{`.w-card:hover{ transform:translateY(-3px); box-shadow:0 14px 30px rgba(10,22,40,0.10); }`}</style>

      {/* Title */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: CL.text }}>Wallet</h1>
      </motion.div>

      {/* Balance card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '16px 22px 0' }}>
        <div style={{ position: 'relative', borderRadius: 22, padding: '24px 24px 22px', overflow: 'hidden',
          background: `linear-gradient(135deg, ${CL.navy} 0%, ${CL.navyMid} 100%)` }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(201,160,32,0.12)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>👛</span>
            <span style={{ color: '#cfd6df', fontSize: 14, fontWeight: 600 }}>Fixera Credit</span>
          </div>
          <div style={{ color: '#fff', fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>
            KSh {balance.toLocaleString()}
          </div>
          <div style={{ color: '#9aa6b5', fontSize: 13, marginTop: 6, maxWidth: 280 }}>
            Top up your wallet and get bonus credit on every booking. No catch.
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleTopUp}
            style={{ marginTop: 18, background: CL.gold, color: '#fff', border: 'none', borderRadius: 12, padding: '13px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Top up wallet
          </motion.button>
        </div>
      </motion.div>

      {notice && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 22px 0' }}>
          <div style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}55`, borderRadius: 12, padding: '12px 16px', color: '#7a5e0e', fontSize: 13, fontWeight: 600 }}>
            {notice}
          </div>
        </motion.div>
      )}

      {/* Top-up packages */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
        <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Choose a top-up</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {PACKAGES.map(p => (
            <div key={p.amount} className="w-card" onClick={handleTopUp}
              style={{ background: CL.surface, border: `1px solid ${p.bonus >= 10 ? CL.gold : CL.border}`, borderRadius: 16, padding: '16px', cursor: 'pointer', transition: 'all 0.25s', position: 'relative', boxShadow: '0 4px 14px rgba(10,22,40,0.05)' }}>
              {p.bonus > 0 && (
                <span style={{ position: 'absolute', top: 12, right: 12, background: CL.goldSoft, color: '#7a5e0e', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7 }}>+{p.bonus}%</span>
              )}
              <div style={{ color: CL.light, fontSize: 12, fontWeight: 600 }}>{p.label}</div>
              <div style={{ color: CL.text, fontSize: 22, fontWeight: 800, marginTop: 4 }}>KSh {p.amount.toLocaleString()}</div>
              {p.bonus > 0 && <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700, marginTop: 4 }}>+ KSh {Math.round(p.amount * p.bonus / 100).toLocaleString()} bonus</div>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gift card */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
        <div onClick={handleTopUp} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <div style={{ fontSize: 36 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Fixera Gift Card</div>
            <div style={{ color: CL.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>Treat someone to a home service — send a gift card to family or friends.</div>
          </div>
          <div style={{ color: CL.gold, fontSize: 20, fontWeight: 800 }}>→</div>
        </div>
      </motion.div>

      {/* Transactions empty state */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ padding: '24px 22px 0' }}>
        <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Recent activity</div>
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>No transactions yet</div>
          <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>
            {user ? 'Your wallet activity will appear here once you top up.' : 'Sign in to view your wallet activity.'}
          </div>
          {!user && (
            <button onClick={() => navigate('/login')} style={{ marginTop: 16, background: CL.navy, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Log in / Sign up
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
