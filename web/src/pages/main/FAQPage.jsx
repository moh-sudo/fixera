import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ChevronDown, MessageCircle } from 'lucide-react';
import { getFAQs } from '../../services/contentService';

import { useCL } from '../../hooks/useCL';

const CAT_ICONS = { general: '💡', booking: '📅', payment: '💳', partner: '👷', safety: '🛡️' };

function FAQItem({ faq }) {
  const CL = useCL();
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: CL.surface, border: `1px solid ${open ? CL.gold + '60' : CL.border}`,
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
      borderLeft: open ? `3px solid ${CL.gold}` : `3px solid transparent`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', gap: 12 }}>
        <div style={{ color: CL.text, fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{faq.question}</div>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: open ? CL.goldSoft : CL.bg,
          border: `1px solid ${open ? CL.gold + '40' : CL.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <ChevronDown size={14} color={open ? CL.gold : CL.light} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ padding: '0 18px 16px', color: CL.muted, fontSize: 14, lineHeight: 1.75, borderTop: `1px solid ${CL.border}`, paddingTop: 14 }}>
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [faqs, setFaqs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activecat, setActiveCat] = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    getFAQs('customers').then(data => { setFaqs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filtered = faqs.filter(f =>
    (activecat === 'all' || f.category === activecat) &&
    (search === '' || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = filtered.reduce((acc, f) => {
    const cat = f.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Help & FAQs</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Answers to common questions</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '18px 18px 80px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={15} color={CL.light} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            style={{ width: '100%', boxSizing: 'border-box', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '12px 14px 12px 38px', color: CL.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = CL.gold}
            onBlur={e => e.target.style.borderColor = CL.border}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {categories.map(cat => {
            const isActive = activecat === cat;
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                padding: '7px 15px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: isActive ? CL.navy : CL.surface,
                color: isActive ? '#fff' : CL.muted,
                border: `1px solid ${isActive ? CL.navy : CL.border}`,
              }}>
                {cat === 'all' ? 'All Topics' : `${CAT_ICONS[cat] || '📌'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 38, height: 38, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
            <div style={{ color: CL.muted, fontSize: 14 }}>Loading FAQs…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CL.surface, borderRadius: 18, border: `1px solid ${CL.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No results found</div>
            <div style={{ color: CL.muted, fontSize: 13 }}>Try different keywords or browse all topics</div>
            {search && <button onClick={() => setSearch('')} style={{ marginTop: 16, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '8px 20px', color: CL.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Clear search</button>}
          </div>
        ) : activecat === 'all' && !search ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{CAT_ICONS[cat] || '📌'}</span> {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(faq => <FAQItem key={faq.id} faq={faq} />)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(faq => <FAQItem key={faq.id} faq={faq} />)}
          </div>
        )}

        {/* Contact CTA */}
        <div style={{ marginTop: 32, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MessageCircle size={22} color={CL.gold} />
          </div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Still have questions?</div>
          <div style={{ color: CL.muted, fontSize: 13, marginBottom: 18 }}>Our support team typically responds within 2 hours.</div>
          <button onClick={() => navigate('/support')} style={{ background: CL.navy, border: 'none', borderRadius: 12, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
}
