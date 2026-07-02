import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { getFinances } from '../../services/accountingService';
import { downloadStatement, downloadCommissionInvoice } from '../../utils/partnerStatement';
import { sendStatementEmail } from '../../services/partnerEmailService';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { Wrench, Package, Truck, Droplets, ArrowUp, Tag, ArrowDown, Settings, RefreshCw, CheckCircle2, XCircle, FileText, Download, Mail, Receipt, Inbox } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', greenSoft: '#ECFDF5',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB',
  navy: '#0A1628',
};

const PERIODS = [
  { k: 'week',  label: 'This Week' },
  { k: 'month', label: 'This Month' },
  { k: 'all',   label: 'All Time' },
];
function periodStart(k) {
  const d = new Date();
  if (k === 'week')  { const day = (d.getDay() + 6) % 7; d.setHours(0,0,0,0); d.setDate(d.getDate() - day); return d; }
  if (k === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  return new Date(0);
}

const MIN_WALLET = 500;
const PURPOSE_ICON = { service: Wrench, materials: Package, delivery: Truck, move: Truck, water: Droplets };
const WALLET_ICON  = { topup: ArrowUp, commission: Tag, payout: ArrowDown, adjustment: Settings, refund: RefreshCw };
const td = { padding: '10px', color: CL.text, fontSize: 13 };

const KEYFRAMES = `
@keyframes fadeUp { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);} }
@keyframes shimmer { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
`;

export default function EarningsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.partner_role || 'worker';
  const [fin, setFin]         = useState(null);
  const [loading, setLoad]    = useState(true);
  const [range, setRange]     = useState('daily');
  const [sortBy, setSortBy]   = useState({ k: 'date', dir: -1 });
  const [stmtPeriod, setStmtP] = useState('month');
  const [emailing, setEmailing] = useState(false);
  const [deposit, setDeposit]  = useState(null);

  function buildStatement() {
    const from = periodStart(stmtPeriod);
    const rows = (fin?.transactions || [])
      .filter(t => new Date(t.date) >= from)
      .map(t => ({ date: t.date, detail: t.customer, gross: t.amount, commission: t.commission, net: t.net, method: t.method }));
    const totals = rows.reduce((a, r) => ({
      gross: a.gross + (r.gross || 0), commission: a.commission + (r.commission || 0), net: a.net + (r.net || 0),
    }), { gross: 0, commission: 0, net: 0 });
    return {
      partnerName: profile?.business_name || profile?.full_name || 'Partner',
      role,
      periodLabel: PERIODS.find(p => p.k === stmtPeriod)?.label || 'All time',
      rows, totals, generatedAt: new Date().toISOString(),
      payoutRef: fin?.lastPayout?.mpesa_ref || null,
    };
  }
  const handleDownloadStatement = async () => { await downloadStatement(buildStatement()); };
  const handleCommissionInvoice = async () => {
    const rows = (fin?.transactions || [])
      .filter(t => t.method === 'cash')
      .map(t => ({ date: t.date, detail: t.customer, gross: t.amount, commission: t.commission }));
    await downloadCommissionInvoice({
      partnerName: profile?.business_name || profile?.full_name || 'Partner',
      role,
      periodLabel: 'All time',
      rows,
      totalOwed: rows.reduce((a, r) => a + (r.commission || 0), 0),
      generatedAt: new Date().toISOString(),
    });
  };
  const handleEmailStatement = async () => {
    if (!profile?.email) { alert('No email on file.'); return; }
    setEmailing(true);
    try {
      const res = await sendStatementEmail({ email: profile.email }, buildStatement());
      alert(res?.success ? `Statement sent to ${profile.email}` : 'Email unavailable right now — you can still download it.');
    } catch (e) { console.error(e); alert('Could not email the statement.'); }
    finally { setEmailing(false); }
  };

  useEffect(() => {
    if (!user) return;
    getFinances(user.id, role).then(setFin).catch(console.error).finally(() => setLoad(false));
    const depositRoles = ['vendor', 'mover', 'supplier', 'water_carrier'];
    if (depositRoles.includes(role)) {
      supabase.from('deposit_transactions').select('*').eq('partner_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setDeposit(data || []));
    }
  }, [user, role]);

  const sortedTx = useMemo(() => {
    if (!fin) return [];
    const rows = [...fin.transactions];
    rows.sort((a, b) => {
      const av = a[sortBy.k], bv = b[sortBy.k];
      if (av < bv) return -1 * sortBy.dir;
      if (av > bv) return  1 * sortBy.dir;
      return 0;
    });
    return rows;
  }, [fin, sortBy]);

  if (loading) return <Shimmer />;
  if (!fin) return <div style={{ padding: 40, textAlign: 'center', color: CL.muted, background: CL.bg, minHeight: '100vh' }}>No earnings data yet.</div>;

  const blockedWallet = fin.isWallet && fin.walletBalance <= MIN_WALLET;
  const lowWallet     = fin.isWallet && fin.walletBalance > MIN_WALLET && fin.walletBalance < MIN_WALLET + 500;
  const negWallet     = fin.isWallet && fin.walletBalance < 0;
  const series  = range === 'daily' ? fin.dailySeries : fin.monthlySeries;
  const alerts  = buildAlerts(fin, { blockedWallet, lowWallet, negWallet });
  const toggleSort = (k) => setSortBy(s => s.k === k ? { k, dir: -s.dir } : { k, dir: -1 });

  return (
    <div style={{ padding: '20px 16px 48px', maxWidth: 980, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{KEYFRAMES}</style>

      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 20 }}>
        <div style={{ color: CL.text, fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Earnings</div>
        <div style={{ color: CL.muted, fontSize: 13, marginTop: 2 }}>
          Live financials · auto-calculated from completed jobs
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', marginBottom: 10,
          borderRadius: 12, background: `${a.color}14`, border: `1px solid ${a.color}44`,
          animation: `fadeUp .5s ease both`, animationDelay: `${i * 60}ms`,
        }}>
          <span style={{ fontSize: 16 }}>{a.icon}</span>
          <span style={{ color: a.color, fontSize: 12.5, fontWeight: 600 }}>{a.text}</span>
        </div>
      ))}

      {/* Deposit Status Card */}
      {deposit !== null && (
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 18, animation: 'fadeUp .5s ease both' }}>
          <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Security Deposit</div>
          {deposit.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>⏳</span>
              <div>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 700 }}>Awaiting Payment</div>
                <div style={{ color: CL.muted, fontSize: 12, marginTop: 2 }}>Your security deposit has not been received yet. Please contact support.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deposit.map(d => {
                const TYPE = {
                  received:   { DIcon: CheckCircle2, label: 'Deposit Received',  color: CL.green },
                  refund:     { DIcon: RefreshCw,    label: 'Deposit Refunded',  color: CL.green },
                  forfeiture: { DIcon: XCircle,      label: 'Deposit Forfeited', color: CL.red   },
                };
                const t = TYPE[d.type] || { DIcon: FileText, label: d.type, color: CL.gold };
                const DI = t.DIcon;
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: `${t.color}10`, border: `1px solid ${t.color}30`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <DI size={18} color={t.color} strokeWidth={2} />
                      <div>
                        <div style={{ color: t.color, fontSize: 13, fontWeight: 700 }}>{t.label}</div>
                        <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
                          {new Date(d.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {d.mpesa_ref ? ` · Ref: ${d.mpesa_ref}` : ''}
                          {d.note ? ` · ${d.note}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ color: t.color, fontSize: 16, fontWeight: 800 }}>KSh {(d.amount || 0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Kpi i={0} label="Net Earnings"   value={fin.totalEarned}    hero accent={CL.green} sub={`KSh ${fin.weekEarned.toLocaleString()} this week`} />
        <Kpi i={1} label="Total Earnings" value={fin.totalGross}     accent={CL.blue}  sub={`${fin.jobs} jobs`} />
        <Kpi i={2} label="Commission Paid" value={fin.totalCommission} accent={CL.amber} sub="to Fixera" />
        {fin.isWallet
          ? <Kpi i={3} label="Wallet Balance" value={fin.walletBalance}
              accent={blockedWallet ? CL.red : lowWallet ? CL.amber : CL.blue}
              sub={blockedWallet ? '🔒 Jobs blocked — top up now' : lowWallet ? 'Top up soon' : 'Available'} />
          : <Kpi i={3} label="Outstanding" value={fin.owedToFixera} accent={CL.red} sub="owed to Fixera" />}
        {!fin.isWallet && fin.pendingPayout > 0 &&
          <Kpi i={4} label="Pending Payout" value={fin.pendingPayout} accent={CL.green} sub="Fixera owes you" />}
      </div>

      {/* Earnings chart */}
      <Panel i={1} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Earnings Analytics</div>
            <div style={{ color: CL.muted, fontSize: 11 }}>Net earnings vs commission</div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: CL.bg, borderRadius: 10, padding: 3 }}>
            {['daily', 'monthly'].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                background: range === r ? CL.green : 'transparent',
                color: range === r ? '#fff' : CL.muted,
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gEarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CL.green} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CL.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CL.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: CL.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: CL.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="earned" stroke={CL.green} strokeWidth={2.5} fill="url(#gEarn)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Commission trend */}
      <Panel i={2} style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Commission Trend</div>
        <div style={{ color: CL.muted, fontSize: 11, marginBottom: 12 }}>Fixera fee over time</div>
        <div style={{ height: 150 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CL.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: CL.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: CL.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
              <Tooltip content={<ChartTip commission />} cursor={{ fill: `${CL.amber}20` }} />
              <Bar dataKey="commission" radius={[5, 5, 0, 0]}>
                {series.map((_, i) => <Cell key={i} fill={CL.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Wallet activity */}
      {fin.isWallet && (
        <Panel i={3} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>👛 Wallet Activity</div>
            <button onClick={() => navigate('/withdraw')} style={{
              padding: '8px 14px', borderRadius: 10,
              background: `${CL.green}15`, border: `1px solid ${CL.green}50`,
              color: CL.green, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>💸 Request Withdrawal</button>
          </div>
          {fin.walletTx.length === 0 ? (
            <div style={{ color: CL.muted, fontSize: 12, padding: '10px 0' }}>No wallet activity yet.</div>
          ) : fin.walletTx.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${CL.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(() => { const WI = WALLET_ICON[tx.type]; return WI ? <WI size={15} color={CL.muted} strokeWidth={2} /> : <span style={{ width:15, height:15, display:'inline-block', borderRadius:'50%', background:CL.border }} />; })()}
                <div>
                  <div style={{ color: CL.text, fontSize: 12.5, fontWeight: 600 }}>{tx.note || tx.type}</div>
                  <div style={{ color: CL.muted, fontSize: 10.5 }}>{new Date(tx.created_at).toLocaleString('en-KE')}</div>
                </div>
              </div>
              <span style={{ color: tx.amount < 0 ? CL.red : CL.green, fontSize: 13, fontWeight: 800 }}>
                {tx.amount < 0 ? '−' : '+'}KSh {Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </Panel>
      )}

      {/* Payout Statement */}
      <Panel i={3} style={{ marginBottom: 16 }}>
        <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 2 }}>📄 Payout Statement</div>
        <div style={{ color: CL.muted, fontSize: 11, marginBottom: 12 }}>
          Your earnings record (gross → commission → net) for your books &amp; tax filing.
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {PERIODS.map(p => (
            <button key={p.k} onClick={() => setStmtP(p.k)} style={{
              flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 700,
              background: stmtPeriod === p.k ? CL.green : CL.bg,
              color: stmtPeriod === p.k ? '#fff' : CL.muted,
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleDownloadStatement} style={{
            flex: 1, padding: '11px', borderRadius: 10,
            background: `${CL.green}18`, border: `1px solid ${CL.green}50`,
            color: CL.green, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Download size={14} strokeWidth={2} /> Download PDF
          </button>
          <button onClick={handleEmailStatement} disabled={emailing} style={{
            flex: 1, padding: '11px', borderRadius: 10,
            background: CL.blueSoft, border: `1px solid ${CL.blue}40`,
            color: CL.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Mail size={14} strokeWidth={2} />{emailing ? 'Sending…' : 'Email me'}</button>
        </div>
        <button onClick={handleCommissionInvoice} style={{
          width: '100%', marginTop: 8, padding: '10px', borderRadius: 10,
          background: CL.amberSoft, border: `1px solid ${CL.amber}40`,
          color: CL.amber, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Receipt size={14} strokeWidth={2} /> Commission Invoice (cash jobs owed to Fixera)</button>
      </Panel>

      {/* Transactions table */}
      <Panel i={4}>
        <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Transactions</div>
        {sortedTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: CL.muted }}>
            <div style={{ width:52, height:52, borderRadius:16, background:`${CL.muted}12`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Inbox size={24} color={CL.muted} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 13 }}>No payments yet — completed jobs appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${CL.border}` }}>
                  {[['date','Date'],['jobId','Job'],['customer','Detail'],['amount','Paid'],['commission','Fee'],['net','Net'],['status','Status']].map(([k, lbl]) => (
                    <th key={k} onClick={() => toggleSort(k)} style={{
                      textAlign: ['amount','commission','net'].includes(k) ? 'right' : 'left',
                      padding: '8px 10px', color: CL.muted, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                    }}>{lbl}{sortBy.k === k ? (sortBy.dir < 0 ? ' ↓' : ' ↑') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTx.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${CL.border}` }}>
                    <td style={td}>{new Date(t.date).toLocaleDateString('en-KE', { day:'numeric', month:'short' })}</td>
                    <td style={{ ...td, fontFamily: 'monospace', color: CL.muted }}>#{t.jobId}</td>
                    <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(() => { const PI = PURPOSE_ICON[t.purpose]; return PI ? <PI size={12} color={CL.muted} strokeWidth={2} style={{ marginRight:4, verticalAlign:'middle' }} /> : null; })()} {t.customer}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>{t.amount.toLocaleString()}</td>
                    <td style={{ ...td, textAlign: 'right', color: CL.amber }}>−{t.commission.toLocaleString()}</td>
                    <td style={{ ...td, textAlign: 'right', color: CL.green, fontWeight: 800 }}>{t.net.toLocaleString()}</td>
                    <td style={td}>
                      <span style={{ background: `${CL.green}18`, color: CL.green, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                        {t.method === 'cash' ? '💵 Cash' : '📱 M-Pesa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Kpi({ label, value, sub, accent, hero, i }) {
  return (
    <div style={{
      background: hero ? `linear-gradient(135deg, ${accent}22, ${accent}08)` : CL.surface,
      border: `1px solid ${hero ? accent + '55' : CL.border}`,
      borderRadius: 18, padding: '16px 18px',
      animation: 'fadeUp .5s ease both', animationDelay: `${i * 70}ms`,
    }}>
      <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: hero ? accent : CL.text, fontSize: 25, fontWeight: 900, marginTop: 6, letterSpacing: -0.5 }}>
        <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>KSh </span>{Number(value || 0).toLocaleString()}
      </div>
      {sub && <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Panel({ children, style, i = 0 }) {
  return (
    <div style={{
      background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: 18,
      animation: 'fadeUp .5s ease both', animationDelay: `${i * 70}ms`, ...style,
    }}>{children}</div>
  );
}

function ChartTip({ active, payload, label, commission }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <div style={{ color: CL.muted, fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ color: commission ? CL.amber : CL.green, fontSize: 14, fontWeight: 800 }}>
        KSh {Number(v).toLocaleString()}
      </div>
    </div>
  );
}

function buildAlerts(fin, { blockedWallet, lowWallet, negWallet }) {
  const a = [];
  if (negWallet) {
    a.push({ icon: '🚨', color: CL.red, text: 'Your wallet is negative — you are blocked from all jobs. Top up immediately.' });
  } else if (blockedWallet) {
    a.push({ icon: '🔒', color: CL.red, text: `Your wallet is at KSh ${fin.walletBalance.toLocaleString()} or below — jobs are blocked. Top up above KSh ${MIN_WALLET} to resume.` });
  } else if (lowWallet) {
    a.push({ icon: '⚠️', color: CL.amber, text: `Wallet running low (KSh ${fin.walletBalance.toLocaleString()}). Top up now to avoid being blocked at KSh ${MIN_WALLET}.` });
  }
  if (!fin.isWallet && fin.owedToFixera > 0) a.push({ icon: '⚖️', color: CL.red,  text: `You owe Fixera KSh ${fin.owedToFixera.toLocaleString()} in commission on cash jobs.` });
  if (!fin.isWallet && fin.pendingPayout > 0) a.push({ icon: '⏳', color: CL.green, text: `Pending settlement: Fixera owes you KSh ${fin.pendingPayout.toLocaleString()}.` });
  return a;
}

function Shimmer() {
  const block = {
    background: `linear-gradient(90deg, ${CL.surface} 25%, ${CL.bg} 50%, ${CL.surface} 75%)`,
    backgroundSize: '800px 100%', animation: 'shimmer 1.4s infinite', borderRadius: 16,
  };
  return (
    <div style={{ padding: '20px 16px', maxWidth: 980, margin: '0 auto', background: CL.bg, minHeight: '100vh' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ ...block, height: 30, width: 160, marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px,1fr))', gap: 12, marginBottom: 18 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ ...block, height: 92 }} />)}
      </div>
      <div style={{ ...block, height: 260, marginBottom: 16 }} />
      <div style={{ ...block, height: 190 }} />
    </div>
  );
}
