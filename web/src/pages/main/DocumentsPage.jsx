import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Mail, FileText, Receipt, FileCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listCustomerDocuments, buildFromListItem } from '../../services/documentService';
import { downloadDocument } from '../../utils/fixeraDocument';
import { sendDocumentEmail } from '../../services/emailService';

import { useCL } from '../../hooks/useCL';

const KIND_META = {
  receipt:   { label: 'Receipt',   Icon: Receipt,   color: '#1A7F3C', bg: '#F0FAF4' },
  invoice:   { label: 'Invoice',   Icon: FileText,  color: '#2B6CB0', bg: '#EBF8FF' },
  quotation: { label: 'Quotation', Icon: FileCheck, color: '#C9A020', bg: '#FDF8EC' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06, ease: 'easeOut' } }),
};

export default function DocumentsPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [docs, setDocs]    = useState([]);
  const [loading, setLoad] = useState(true);
  const [tab, setTab]      = useState('all');
  const [busy, setBusy]    = useState(null);

  useEffect(() => {
    if (!user) { setLoad(false); return; }
    listCustomerDocuments(user.id).then(setDocs).catch(console.error).finally(() => setLoad(false));
  }, [user]);

  const counts = {
    all:       docs.length,
    receipt:   docs.filter(d => d.kind === 'receipt').length,
    invoice:   docs.filter(d => d.kind === 'invoice').length,
    quotation: docs.filter(d => d.kind === 'quotation').length,
  };

  const filtered = useMemo(() => tab === 'all' ? docs : docs.filter(d => d.kind === tab), [docs, tab]);

  const handleDownload = async (item) => {
    setBusy(item.key + '-dl');
    try { const d = await buildFromListItem(item); if (d) downloadDocument(d); }
    catch { alert('Could not generate the document.'); }
    finally { setBusy(null); }
  };

  const handleEmail = async (item) => {
    if (!user?.email) { alert('No email on file.'); return; }
    setBusy(item.key + '-em');
    try {
      const d = await buildFromListItem(item);
      const res = await sendDocumentEmail(user.email, d);
      alert(res.success ? `Sent to ${user.email}` : 'Email could not be sent. You can still download it.');
    } catch { alert('Email failed.'); }
    finally { setBusy(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate('/profile')} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>My Documents</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 1 }}>Receipts, invoices & quotations</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '18px 18px 80px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 18, height: 88 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="sk" style={{ width: 44, height: 44, borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div className="sk" style={{ height: 13, width: '55%', marginBottom: 8, borderRadius: 6 }} />
                    <div className="sk" style={{ height: 11, width: '35%', borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            ))}
            <style>{`@keyframes shim{0%{background-position:-300px 0}100%{background-position:300px 0}}.sk{background:linear-gradient(90deg,#eceef1 25%,#f5f6f8 50%,#eceef1 75%);background-size:600px 100%;animation:shim 1.3s infinite linear}`}</style>
          </div>
        ) : docs.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '60px 24px', background: CL.surface, borderRadius: 18, border: `1px solid ${CL.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No documents yet</div>
            <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.65 }}>Your receipts, invoices and quotes will appear here after you book a service.</div>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
              {[['all','All'],['receipt','Receipts'],['invoice','Invoices'],['quotation','Quotations']].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} style={{
                  padding: '8px 15px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                  background: tab === k ? CL.navy : CL.surface,
                  border: `1px solid ${tab === k ? CL.navy : CL.border}`,
                  color: tab === k ? '#fff' : CL.muted,
                  fontSize: 13, fontWeight: tab === k ? 700 : 500, transition: 'all 0.15s',
                }}>{l} ({counts[k]})</button>
              ))}
            </div>

            {/* Doc cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((item, i) => {
                const meta = KIND_META[item.kind] || KIND_META.receipt;
                const { Icon } = meta;
                return (
                  <motion.div key={item.key} custom={i} variants={fadeUp} initial="hidden" animate="show"
                    style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: 18, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color={meta.color} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                          <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{item.status}</span>
                        </div>
                        <div style={{ color: CL.muted, fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title} · {new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ color: CL.gold, fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>KSh {item.total.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 9 }}>
                      <button onClick={() => handleDownload(item)} disabled={!!busy}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: meta.bg, border: `1px solid ${meta.color}30`, color: meta.color, fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        <Download size={13} /> {busy === item.key + '-dl' ? '…' : 'Download'}
                      </button>
                      <button onClick={() => handleEmail(item)} disabled={!!busy}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: CL.infoBg, border: `1px solid ${CL.info}30`, color: CL.info, fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        <Mail size={13} /> {busy === item.key + '-em' ? '…' : 'Email me'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
