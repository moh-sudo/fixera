import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../hooks/useAuth';
import { sendPartnerApproved, sendPartnerRejected, sendTicketStatusUpdate } from '../../services/emailService';
import AdminSettings from './AdminSettings';
import LiveOpsMap from '../../components/LiveOpsMap';
import BookingHeatmap from '../../components/BookingHeatmap';
import './admin.css';
import {
  listAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  TYPE_META, TARGET_LABELS,
} from '../../services/announcementsService';
import { listAllReviews, moderateReview } from '../../services/reviewsService';
import { listPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getPromoUses } from '../../services/promoService';
import { listAllBanners, saveBanner, deleteBanner, listAllFAQs, saveFAQ, deleteFAQ, FAQ_CATEGORIES } from '../../services/contentService';
import { listAllCategories, saveCategory, deleteCategory, listAllServices, saveService, deleteService } from '../../services/catalogService';
import { listPartnerWallets, getWalletTransactions, getWalletAdjustments, applyWalletAdjustment, getWalletStats, getDepositTransactions, recordDepositReceived, refundDeposit, forfeitDeposit } from '../../services/walletAdminService';
import { logAction } from '../../services/settingsService';
import { listAgents, createAgent, updateAgentRole, revokeAgent, AGENT_ROLES, roleLabel } from '../../services/teamService';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Radio, Siren, Navigation, ClipboardList, FileText, LifeBuoy,
  Scale, Bell, Users, BadgeCheck, TrendingUp, Store, Package, Truck, Bike, Droplets,
  Contact, CreditCard, Send, Wallet, RotateCcw, Calculator, Receipt, Briefcase,
  Megaphone, Wrench, Image as ImageIcon, Tag, Star, BarChart3, Map as MapIcon,
  LineChart as LineChartIcon, Activity, MapPin, ShieldAlert, Lock, Settings, UserCog,
  Search, Mail, HelpCircle, ChevronDown, Home, LogOut, UserRound,
} from 'lucide-react';

// ── Audit helper ─────────────────────────────────────────────────
// Non-blocking — uses the local session (no extra network call)
async function auditLog(action, detail = '') {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('admin_audit_log').insert({
      actor_id:   session.user.id,
      actor_name: session.user.email,
      action,
      detail,
    });
  } catch (_) { /* non-blocking */ }
}

// ── Nav ───────────────────────────────────────────────────────────
// Grouped: section → items
const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { id: 'overview',       label: 'Dashboard',           Icon: LayoutDashboard },
      { id: 'live_ops',       label: 'Live Operations',     Icon: Radio },
      { id: 'dispatch',       label: 'Dispatch & Tracking', Icon: Navigation },
      { id: 'alerts',         label: 'Alerts Feed',         Icon: Siren },
      { id: 'orders',         label: 'Orders',              Icon: ClipboardList },
      { id: 'quotations',     label: 'Quotations',          Icon: FileText },
      { id: 'users',          label: 'Customers',           Icon: UserRound },
    ],
  },
  {
    label: 'Support',
    items: [
      { id: 'support',        label: 'Support Center',      Icon: LifeBuoy },
      { id: 'dispute_center', label: 'Dispute Center',      Icon: Scale },
      { id: 'notifications',  label: 'Notifications',       Icon: Bell },
    ],
  },
  {
    label: 'Partners',
    items: [
      { id: 'partners',      label: 'All Partners',         Icon: Users },
      { id: 'verification',  label: 'Verification Queue',   Icon: BadgeCheck },
      { id: 'performance',   label: 'Partner Performance',  Icon: TrendingUp },
      { id: 'vendors',       label: 'Vendors',              Icon: Store },
      { id: 'suppliers',     label: 'Suppliers',            Icon: Package },
      { id: 'movers',        label: 'Movers',               Icon: Truck },
      { id: 'riders',        label: 'Riders',               Icon: Bike },
      { id: 'water',         label: 'Water Carriers',       Icon: Droplets },
      { id: 'workforce',     label: 'Workforce',            Icon: Contact },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'payments',        label: 'Payments',           Icon: CreditCard },
      { id: 'payouts',         label: 'Payouts',            Icon: Send },
      { id: 'wallets',         label: 'Wallets',            Icon: Wallet },
      { id: 'refunds',         label: 'Refund Management',  Icon: RotateCcw },
      { id: 'reconciliation',  label: 'Reconciliation',     Icon: Calculator },
      { id: 'tax_report',      label: 'Tax Report',         Icon: Receipt },
      { id: 'earnings',        label: 'Partner Earnings',   Icon: Briefcase },
      { id: 'marketing',       label: 'Marketing',          Icon: Megaphone },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'services',      label: 'Services Catalog',      Icon: Wrench },
      { id: 'content',       label: 'Content (Banners/FAQ)', Icon: ImageIcon },
      { id: 'products',      label: 'Product Approvals',     Icon: Tag },
      { id: 'reviews',       label: 'Reviews & Ratings',     Icon: Star },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'analytics',        label: 'Reports & Analytics',  Icon: BarChart3 },
      { id: 'heatmap',          label: 'Booking Heatmap',      Icon: MapIcon },
      { id: 'revenue_forecast', label: 'Revenue Forecast',     Icon: LineChartIcon },
      { id: 'availability',     label: 'Partner Availability', Icon: Activity },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'team',           label: 'Team & Agents',       Icon: UserCog },
      { id: 'announcements',  label: 'Broadcasts',          Icon: Megaphone },
      { id: 'service_areas',  label: 'Service Areas',       Icon: MapPin },
      { id: 'fraud',          label: 'Fraud & Risk',        Icon: ShieldAlert },
      { id: 'security',       label: 'Security & Audit',    Icon: Lock },
      { id: 'settings',       label: 'Settings',            Icon: Settings },
    ],
  },
];

// Sections each admin_role is allowed to see (super_admin sees all)
const ROLE_ACCESS = {
  support:    new Set([
    'overview','users','orders','quotations','support','dispute_center',
    'notifications','announcements',
  ]),
  finance:    new Set([
    'overview','payments','payouts','wallets','refunds','reconciliation',
    'tax_report','earnings','marketing','analytics','revenue_forecast',
  ]),
  operations: new Set([
    'overview','live_ops','alerts','dispatch','partners','verification',
    'performance','vendors','suppliers','movers','riders','water','workforce',
    'availability','heatmap','service_areas',
  ]),
  // Vets & approves partner credentials — sees only the verification pipeline
  verification: new Set([
    'overview','partners','verification','workforce','performance',
    'vendors','suppliers','movers','riders','water',
  ]),
  // Handles safety incidents & disputes — sees only support/dispute tooling
  trust_safety: new Set([
    'overview','support','dispute_center','alerts','fraud',
  ]),
};

function filterNavForRole(groups, adminRole) {
  if (!adminRole || adminRole === 'super_admin') return groups;
  const allowed = ROLE_ACCESS[adminRole] || new Set();
  return groups
    .map(g => ({ ...g, items: g.items.filter(i => allowed.has(i.id)) }))
    .filter(g => g.items.length > 0);
}

// Flat nav for topbar label lookup
const NAV_FLAT = NAV_GROUPS.flatMap(g => g.items);

const STATUS_MAP = {
  pending:     { cls: 'sb-badge-warning',   label: 'Pending'     },
  approved:    { cls: 'sb-badge-success',   label: 'Approved'    },
  rejected:    { cls: 'sb-badge-danger',    label: 'Rejected'    },
  suspended:   { cls: 'sb-badge-danger',    label: 'Suspended'   },
  completed:   { cls: 'sb-badge-success',   label: 'Completed'   },
  cancelled:   { cls: 'sb-badge-danger',    label: 'Cancelled'   },
  confirmed:   { cls: 'sb-badge-info',      label: 'Confirmed'   },
  in_progress: { cls: 'sb-badge-warning',   label: 'In Progress' },
  upcoming:    { cls: 'sb-badge-secondary', label: 'Upcoming'    },
  on_way:      { cls: 'sb-badge-info',      label: 'On Way'      },
  open:        { cls: 'sb-badge-warning',   label: 'Open'        },
  resolved:    { cls: 'sb-badge-success',   label: 'Resolved'    },
  paid:        { cls: 'sb-badge-success',   label: 'Paid'        },
};

const ROLE_COLOR = { worker: '#C9A020', vendor: '#17a2b8', rider: '#1cc88a', supplier: '#fd7e14', mover: '#9F7AEA', water_carrier: '#00B5D8' };
const ROLE_ICON  = { worker: '🔧', vendor: '🏪', rider: '🚗', supplier: '📦', mover: '🚚', water_carrier: '🚰' };
const ROLE_LABEL = { worker: 'Service Worker', vendor: 'Vendor', rider: 'Rider', supplier: 'Supplier', mover: 'Mover', water_carrier: 'Water Carrier' };

// ── Shared Components ─────────────────────────────────────────────
function SBBadge({ status }) {
  const m = STATUS_MAP[status] || { cls: 'sb-badge-secondary', label: status };
  return <span className={`sb-badge ${m.cls}`}>{m.label}</span>;
}

function RoleBadge({ role }) {
  return <span className="sb-badge" style={{ background: ROLE_COLOR[role] || '#6c757d', color: '#fff' }}>{ROLE_ICON[role]} {role?.toUpperCase()}</span>;
}

function Spinner() {
  return <div className="d-flex justify-content-center py-5"><div className="sb-spinner" /></div>;
}

function PageHeader({ title, sub }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
  );
}

// Professional stat card
function StatCard({ icon, label, value, sub, color = '#4e73df', onClick }) {
  return (
    <div
      className="admin-card h-100"
      onClick={onClick}
      style={{ borderTop: `3px solid ${color}`, borderRadius: 10, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
          <div className="text-xs font-weight-bold text-uppercase text-right" style={{ color, letterSpacing: '0.08rem', maxWidth: 100, lineHeight: 1.3 }}>{label}</div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#2d3748', lineHeight: 1 }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: '#a0aec0' }}>{sub}</div>}
        {onClick && <div className="text-xs mt-2 font-weight-bold" style={{ color, opacity: 0.7 }}>View report →</div>}
      </div>
    </div>
  );
}

// ── Chart Modal ───────────────────────────────────────────────────
const CHART_COLORS = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#C9A020','#fd7e14'];

function ChartModal({ type, title, onClose }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (type === 'partners') {
        const { data: ws } = await supabase.from('workers').select('partner_role, verification_status');
        const roles = { worker:0, vendor:0, rider:0, supplier:0 };
        (ws||[]).forEach(w => { const r = w.partner_role||'worker'; roles[r]=(roles[r]||0)+1; });
        setData([
          { name:'Workers',   value:roles.worker,   fill:'#C9A020' },
          { name:'Vendors',   value:roles.vendor,   fill:'#17a2b8' },
          { name:'Riders',    value:roles.rider,    fill:'#1cc88a' },
          { name:'Suppliers', value:roles.supplier, fill:'#fd7e14' },
        ]);
      }

      else if (type === 'approved') {
        const { data: ws } = await supabase.from('workers').select('verification_status');
        const s = { pending:0, approved:0, rejected:0, suspended:0 };
        (ws||[]).forEach(w => { s[w.verification_status]=(s[w.verification_status]||0)+1; });
        setData([
          { name:'Approved',  value:s.approved,  fill:'#1cc88a' },
          { name:'Pending',   value:s.pending,   fill:'#f6c23e' },
          { name:'Rejected',  value:s.rejected,  fill:'#e74a3b' },
          { name:'Suspended', value:s.suspended, fill:'#858796' },
        ]);
      }

      else if (type === 'revenue') {
        const { data: rs } = await supabase.from('receipts').select('amount, generated_at').order('generated_at');
        const monthly = {};
        (rs||[]).forEach(r => {
          const m = new Date(r.generated_at).toLocaleDateString('en-KE', { month:'short', year:'2-digit' });
          monthly[m] = (monthly[m]||0) + (r.amount||0);
        });
        setData(Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })));
      }

      else if (type === 'jobs') {
        const { data: bs } = await supabase.from('bookings').select('status');
        const s = {};
        (bs||[]).forEach(b => { s[b.status]=(s[b.status]||0)+1; });
        setData(Object.entries(s).map(([status, count]) => ({ status: status.replace(/_/g,' '), count })));
      }

      else if (type === 'customers') {
        const { data: ps } = await supabase.from('profiles').select('created_at').order('created_at');
        const monthly = {};
        (ps||[]).forEach(p => {
          const m = new Date(p.created_at).toLocaleDateString('en-KE', { month:'short', year:'2-digit' });
          monthly[m] = (monthly[m]||0) + 1;
        });
        // cumulative
        let total = 0;
        setData(Object.entries(monthly).map(([month, count]) => { total += count; return { month, new: count, total }; }));
      }

      else if (type === 'pending') {
        const { data: ws } = await supabase.from('workers').select('full_name, partner_role, created_at, email').eq('verification_status','pending').order('created_at', { ascending:false }).limit(20);
        setData(ws || []);
      }

      setLoading(false);
    };
    fetchData();
  }, [type]);

  const renderChart = () => {
    if (loading) return <div className="d-flex justify-content-center py-5"><div className="sb-spinner" /></div>;

    if (type === 'partners') return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top:10, right:20, left:0, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize:12 }} />
          <YAxis tick={{ fontSize:12 }} />
          <Tooltip />
          <Bar dataKey="value" name="Partners" radius={[6,6,0,0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    if (type === 'approved') return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name" label={({name,value}) => `${name}: ${value}`} labelLine={true}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );

    if (type === 'revenue') return data.length === 0 ? (
      <div className="text-center py-5 text-gray-500">No revenue data yet</div>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top:10, right:20, left:10, bottom:5 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1cc88a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1cc88a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} tickFormatter={v => `KSh ${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={v => [`KSh ${v.toLocaleString()}`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#1cc88a" strokeWidth={2} fill="url(#revenueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    );

    if (type === 'jobs') return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top:5, right:20, left:60, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize:11 }} />
          <YAxis type="category" dataKey="status" tick={{ fontSize:11 }} />
          <Tooltip />
          <Bar dataKey="count" name="Jobs" fill="#4e73df" radius={[0,6,6,0]} />
        </BarChart>
      </ResponsiveContainer>
    );

    if (type === 'customers') return data.length === 0 ? (
      <div className="text-center py-5 text-gray-500">No customer data yet</div>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top:10, right:20, left:10, bottom:5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize:11 }} />
          <YAxis tick={{ fontSize:11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="new"   name="New Customers"   stroke="#36b9cc" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="total" name="Total Customers"  stroke="#4e73df" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );

    if (type === 'pending') return (
      <div style={{ maxHeight: 320, overflowY:'auto' }}>
        {data.length === 0 ? <div className="text-center text-gray-500 py-4">No pending applications</div>
          : data.map((p, i) => (
          <div key={i} className="d-flex align-items-center justify-content-between py-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width:36, height:36, borderRadius:'50%', background:`${ROLE_COLOR[p.partner_role]||'#C9A020'}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                {ROLE_ICON[p.partner_role||'worker']}
              </div>
              <div className="ml-2">
                <div className="text-xs font-weight-bold text-gray-800">{p.full_name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{p.email} · {new Date(p.created_at).toLocaleDateString('en-KE')}</div>
              </div>
            </div>
            <RoleBadge role={p.partner_role || 'worker'} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:680, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'#2d3748' }}>{title}</div>
            <div className="text-xs text-gray-500 mt-1">Live data from your Fixera platform</div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline-secondary">✕ Close</button>
        </div>
        {/* Chart */}
        <div className="p-4">
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return <button onClick={onClick} className={`filter-pill ${active ? 'active' : ''}`}>{children}</button>;
}

function InfoRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: '#e3e6f0' }}>
      <span className="text-xs text-gray-500 font-weight-bold text-uppercase" style={{ letterSpacing: '0.05rem' }}>{label}</span>
      <span className="text-xs font-weight-bold text-gray-800" style={{ maxWidth: '60%', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

function ServiceDetailsView({ details }) {
  if (!details) return null;
  const skip = new Set(['role', 'termsAccepted', 'city', 'area']);
  const renderVal = (k, v) => {
    if (!v || v === false) return null;
    const label = k.replace(/([A-Z])/g, ' $1').trim();
    if (typeof v === 'boolean') return <div key={k} className="py-1 border-bottom text-xs text-success">✓ {label}</div>;
    if (typeof v === 'object' && !Array.isArray(v)) return (
      <div key={k} className="mb-2">
        <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color:'#C9A020', letterSpacing:'0.05rem' }}>{label}</div>
        <div className="pl-3 border-left">{Object.entries(v).map(([kk,vv]) => renderVal(kk,vv))}</div>
      </div>
    );
    if (Array.isArray(v)) return <div key={k} className="d-flex justify-content-between py-1 border-bottom text-xs"><span className="text-gray-500">{label}:</span><span>{v.join(', ')}</span></div>;
    if (typeof v === 'string' && v.startsWith('http')) return (
      <div key={k} className="d-flex justify-content-between py-1 border-bottom text-xs">
        <span className="text-gray-500">{label}:</span>
        <a href={v} target="_blank" rel="noreferrer" style={{color:'#C9A020'}}>📄 View →</a>
      </div>
    );
    return <div key={k} className="d-flex justify-content-between py-1 border-bottom text-xs"><span className="text-gray-500">{label}</span><span className="font-weight-bold">{String(v)}</span></div>;
  };
  return <div>{Object.entries(details).filter(([k]) => !skip.has(k)).map(([k,v]) => renderVal(k,v))}</div>;
}

// ── Inline verification panels (used inside Partner detail) ──────
function PartnerCrewPanel({ partnerId }) {
  const [crew, setCrew]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('partner_crew_members')
      .select('*')
      .eq('partner_user_id', partnerId)
      .order('default_position', { ascending: true });
    setCrew(data || []);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { load(); }, [load]);

  const toggleVerify = async (id, next) => {
    await supabase.from('partner_crew_members').update({ fixera_verified: next, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  return (
    <div className="admin-card mb-3">
      <div className="admin-card-header">👥 Registered Crew {crew.length > 0 && `(${crew.length})`}</div>
      <div className="card-body py-2">
        {loading && <p className="text-xs text-gray-500 mb-0">Loading crew…</p>}
        {!loading && crew.length === 0 && <p className="text-xs text-gray-500 mb-0">No crew registered yet.</p>}
        {!loading && crew.map(m => {
          const isLead = ['team_leader','supervisor'].includes(m.default_position);
          return (
            <div key={m.id} className="d-flex align-items-center py-2 border-bottom">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width:40, height:40, background:isLead?'#C9A02020':'#f0f0f0', border:`2px solid ${isLead?'#C9A020':'#dee2e6'}`, overflow:'hidden' }}>
                {m.photo_url
                  ? <img src={m.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:18 }}>👤</span>}
              </div>
              <div className="ml-2 flex-grow-1" style={{ minWidth: 0 }}>
                <div className="font-weight-bold text-xs text-gray-800">
                  {m.full_name}
                  {isLead && <span className="badge badge-warning ml-2" style={{ fontSize:9 }}>⭐ SUPERVISOR</span>}
                  {m.fixera_verified && <span className="badge badge-success ml-2" style={{ fontSize:9 }}>✓ VERIFIED</span>}
                </div>
                <div className="text-xs text-gray-500">{m.default_position?.replace(/_/g,' ')} · ID {m.national_id}{m.phone ? ' · ' + m.phone : ''}</div>
              </div>
              <button onClick={() => toggleVerify(m.id, !m.fixera_verified)}
                className={`btn btn-sm ${m.fixera_verified ? 'btn-outline-danger' : 'btn-success'}`}
                style={{ fontSize:11, fontWeight:700 }}>
                {m.fixera_verified ? 'Unverify' : '✓ Verify'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartnerFleetPanel({ moverId }) {
  const [fleet, setFleet]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mover_vehicles')
      .select('*')
      .eq('mover_user_id', moverId)
      .order('created_at', { ascending: false });
    setFleet(data || []);
    setLoading(false);
  }, [moverId]);

  useEffect(() => { load(); }, [load]);

  const toggleVerify = async (id, next) => {
    await supabase.from('mover_vehicles').update({ fixera_verified: next, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const insBadge = (expiry) => {
    if (!expiry) return { color:'#dc3545', label:'No insurance on file' };
    const days = Math.ceil((new Date(expiry) - new Date()) / (1000*60*60*24));
    if (days < 0)  return { color:'#dc3545', label:`Expired ${-days}d ago` };
    if (days < 30) return { color:'#fd7e14', label:`Expires in ${days}d` };
    return { color:'#28a745', label:`Valid · ${days}d left` };
  };

  return (
    <div className="admin-card mb-3">
      <div className="admin-card-header">🚚 Fleet (Registered Vehicles) {fleet.length > 0 && `(${fleet.length})`}</div>
      <div className="card-body py-2">
        {loading && <p className="text-xs text-gray-500 mb-0">Loading fleet…</p>}
        {!loading && fleet.length === 0 && <p className="text-xs text-gray-500 mb-0">No vehicles registered yet.</p>}
        {!loading && fleet.map(v => {
          const ins = insBadge(v.insurance_expiry);
          return (
            <div key={v.id} className="py-2 border-bottom">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="font-weight-bold text-xs text-gray-800">
                    {v.vehicle_type?.replace(/_/g,' ')?.toUpperCase()}
                    <span className="ml-2 px-2 py-1 d-inline-block" style={{ background:'#000', color:'#fff', fontFamily:'monospace', fontSize:11, borderRadius:4, letterSpacing:1.5 }}>{v.plate_number}</span>
                    {v.fixera_verified && <span className="badge badge-success ml-2" style={{ fontSize:9 }}>✓ VERIFIED</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {[v.year, v.make, v.model, v.color].filter(Boolean).join(' ')}
                    {v.capacity_tons && ` · ${v.capacity_tons}t`}
                  </div>
                  <div className="text-xs mt-1" style={{ color: ins.color, fontWeight:600 }}>🛡️ {ins.label}{v.insurance_provider ? ` · ${v.insurance_provider}` : ''}</div>
                </div>
                <button onClick={() => toggleVerify(v.id, !v.fixera_verified)}
                  className={`btn btn-sm ${v.fixera_verified ? 'btn-outline-danger' : 'btn-success'}`}
                  style={{ fontSize:11, fontWeight:700 }}>
                  {v.fixera_verified ? 'Unverify' : '✓ Verify'}
                </button>
              </div>
              <div className="d-flex gap-2 mt-2 flex-wrap">
                {Array.isArray(v.photo_urls) && v.photo_urls.slice(0, 4).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1px solid #dee2e6' }} />
                  </a>
                ))}
                {v.insurance_doc_url && <a href={v.insurance_doc_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning" style={{ fontSize:10 }}>📄 Insurance</a>}
                {v.logbook_url       && <a href={v.logbook_url}       target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning" style={{ fontSize:10 }}>📄 Logbook</a>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SECTION: Overview ─────────────────────────────────────────────
// Jump to another admin section (the shell listens for this event)
const goToSection = (id) => window.dispatchEvent(new CustomEvent('fixera-nav', { detail: id }));

// Bucket rows into a last-N-days count series for sparklines/charts
function daySeries(rows, days = 7, valueFn = () => 1) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => ({
    label: new Date(start.getTime() - (days - 1 - i) * 86400000), v: 0,
  }));
  (rows || []).forEach(r => {
    if (!r.created_at) return;
    const t = new Date(r.created_at); t.setHours(0, 0, 0, 0);
    const idx = buckets.findIndex(b => b.label.getTime() === t.getTime());
    if (idx >= 0) buckets[idx].v += valueFn(r);
  });
  return buckets;
}

// Tiny sparkline for stat cards
function Sparkline({ data, color }) {
  const series = (data && data.length) ? data : [{ v: 0 }, { v: 0 }];
  return (
    <ResponsiveContainer width="100%" height={38}>
      <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spk-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spk-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const ov = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
};

function OverviewSection() {
  const { profile, user } = useAuth();
  const [stats, setStats]   = useState({});
  const [recent, setRecent] = useState([]);
  const [series, setSeries] = useState({ jobs: [], revenue: [], customers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('workers').select('id, verification_status, partner_role, created_at'),
      supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }).limit(400),
      supabase.from('bookings').select('id, status, sub_service, created_at').order('created_at', { ascending: false }).limit(400),
      supabase.from('receipts').select('amount, created_at'),
      supabase.from('support_tickets').select('id, status').then(r => r, () => ({ data: [] })),
      supabase.from('refunds').select('id, status').then(r => r, () => ({ data: [] })),
    ]).then(([partners, users, jobs, receipts, tickets, refunds]) => {
      const ws = partners.data || [];
      const bk = jobs.data || [];
      const rc = receipts.data || [];
      const tk = tickets?.data || [];
      const rf = refunds?.data || [];
      setStats({
        totalPartners:    ws.length,
        pendingPartners:  ws.filter(w => w.verification_status === 'pending').length,
        approvedPartners: ws.filter(w => w.verification_status === 'approved').length,
        workers:          ws.filter(w => (w.partner_role || 'worker') === 'worker').length,
        vendors:          ws.filter(w => w.partner_role === 'vendor').length,
        riders:           ws.filter(w => w.partner_role === 'rider').length,
        suppliers:        ws.filter(w => w.partner_role === 'supplier').length,
        movers:           ws.filter(w => w.partner_role === 'mover').length,
        water:            ws.filter(w => w.partner_role === 'water_carrier').length,
        totalCustomers:   (users.count ?? (users.data || []).length) || (users.data || []).length,
        activeJobs:       bk.filter(j => ['confirmed','on_way','in_progress'].includes(j.status)).length,
        revenue:          rc.reduce((s,r) => s+(r.amount||0), 0),
        openTickets:      tk.filter(t => ['open','pending','in_progress'].includes(t.status)).length,
        pendingRefunds:   rf.filter(r => r.status === 'pending').length,
      });
      setRecent(bk.slice(0, 6));
      setSeries({
        jobs:      daySeries(bk),
        revenue:   daySeries(rc, 7, r => r.amount || 0),
        customers: daySeries(users.data, 7),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40 }}><Spinner /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = (profile?.full_name || user?.email?.split('@')[0] || 'Admin').split(' ')[0];

  // ── Needs-attention items (only surface what's > 0) ──
  const attention = [
    { key:'pending', count: stats.pendingPartners, label:'partners awaiting verification', Icon: BadgeCheck, color:'var(--amber)', to:'verification' },
    { key:'tickets', count: stats.openTickets,     label:'open support tickets',           Icon: LifeBuoy,   color:'var(--red)',   to:'support' },
    { key:'refunds', count: stats.pendingRefunds,  label:'refunds pending review',         Icon: RotateCcw,  color:'var(--blue)',  to:'refunds' },
    { key:'jobs',    count: stats.activeJobs,       label:'jobs in progress right now',     Icon: Radio,      color:'var(--green)', to:'dispatch' },
  ].filter(a => a.count > 0);

  const kpis = [
    { label:'Total Partners',    value: stats.totalPartners,   sub:`${stats.pendingPartners} pending`, Icon: Users,       color:'#3B82F6', spark: series.customers, to:'partners' },
    { label:'Approved Partners', value: stats.approvedPartners, sub:'live on platform', Icon: BadgeCheck,  color:'#16A34A', spark: series.customers, to:'partners' },
    { label:'Customers',         value: stats.totalCustomers,  sub:'registered',       Icon: UserRound,   color:'#7C6CF0', spark: series.customers, to:'users' },
    { label:'Active Jobs',       value: stats.activeJobs,      sub:'in progress',      Icon: Radio,       color:'#F59E0B', spark: series.jobs,      to:'dispatch' },
    { label:'Total Revenue',     value:`KSh ${(stats.revenue||0).toLocaleString()}`, sub:'all time', Icon: Wallet, color:'#C9A020', spark: series.revenue, to:'payments' },
    { label:'Pending Approval',  value: stats.pendingPartners, sub:'awaiting review',  Icon: BadgeCheck,  color:'#EF4444', spark: series.customers, to:'verification' },
  ];

  const donut = [
    { name:'Service Workers', value: stats.workers,   fill:'#C9A020' },
    { name:'Vendors',         value: stats.vendors,   fill:'#3B82F6' },
    { name:'Riders',          value: stats.riders,    fill:'#16A34A' },
    { name:'Suppliers',       value: stats.suppliers, fill:'#F59E0B' },
    { name:'Movers',          value: stats.movers,    fill:'#7C6CF0' },
    { name:'Water Carriers',  value: stats.water,     fill:'#06B6D4' },
  ].filter(d => d.value > 0);
  const donutTotal = donut.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* Greeting */}
      <motion.div variants={ov} custom={0} initial="hidden" animate="show"
        style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--ink)', margin:0, letterSpacing:'-.4px' }}>{greeting}, {name}</h1>
          <p style={{ fontSize:13.5, color:'var(--muted)', margin:'5px 0 0' }}>Here's what's happening across Fixera today.</p>
        </div>
        <button className="btn-navy" onClick={() => goToSection('orders')}><ClipboardList size={15} /> View Orders</button>
      </motion.div>

      {/* ── Needs attention ── */}
      <motion.div variants={ov} custom={1} initial="hidden" animate="show" style={{ marginBottom:22 }}>
        {attention.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'#ECFDF3', border:'1px solid #ABEFC6', borderRadius:'var(--radius)', padding:'16px 20px' }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center' }}><BadgeCheck size={20} color="#16A34A" /></div>
            <div><div style={{ fontWeight:800, color:'#15803D', fontSize:14 }}>All clear</div><div style={{ fontSize:12.5, color:'#3F9D6B' }}>Nothing needs your attention right now.</div></div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'.6px', textTransform:'uppercase', color:'var(--muted)', marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
              <Siren size={14} color="var(--red)" /> Needs your attention
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
              {attention.map(a => (
                <button key={a.key} onClick={() => goToSection(a.to)}
                  style={{ display:'flex', alignItems:'center', gap:14, background:'var(--surface)', border:'1px solid var(--line)', borderLeft:`4px solid ${a.color}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', boxShadow:'var(--shadow-sm)', transition:'transform .15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform=''}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`${a.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><a.Icon size={21} color={a.color} /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'var(--ink)', lineHeight:1 }}>{a.count}</div>
                    <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:3 }}>{a.label}</div>
                  </div>
                  <ChevronDown size={16} color="var(--muted)" style={{ transform:'rotate(-90deg)' }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── KPI cards with sparklines ── */}
      <motion.div variants={ov} custom={2} initial="hidden" animate="show"
        style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:22 }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card" onClick={() => goToSection(k.to)} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
              <div className="stat-ico" style={{ background:`${k.color}18` }}><k.Icon size={22} color={k.color} /></div>
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:'var(--ink)', lineHeight:1.1, letterSpacing:'-.5px' }}>{k.value}</div>
            <div style={{ fontSize:11.5, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase', color:'var(--muted)', marginTop:5 }}>{k.label}</div>
            <div style={{ fontSize:11.5, color:'var(--muted)', marginTop:2 }}>{k.sub}</div>
            <div style={{ marginTop:10, marginLeft:-4, marginRight:-4 }}><Sparkline data={k.spark} color={k.color} /></div>
          </div>
        ))}
      </motion.div>

      {/* ── Donut + Revenue + Recent ── */}
      <motion.div variants={ov} custom={3} initial="hidden" animate="show"
        style={{ display:'grid', gridTemplateColumns:'minmax(300px,1fr) minmax(300px,1.4fr)', gap:18, marginBottom:22 }}>
        {/* Donut */}
        <div className="admin-card" style={{ marginBottom:0 }}>
          <div className="admin-card-header">Partner Breakdown by Role</div>
          <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
            <div style={{ width:160, height:160, position:'relative', flexShrink:0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut.length ? donut : [{ name:'None', value:1, fill:'#EDF0F5' }]} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={donut.length > 1 ? 3 : 0} stroke="none">
                    {(donut.length ? donut : [{ fill:'#EDF0F5' }]).map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:26, fontWeight:800, color:'var(--ink)' }}>{donutTotal}</div>
                <div style={{ fontSize:10.5, color:'var(--muted)', fontWeight:600 }}>Partners</div>
              </div>
            </div>
            <div style={{ flex:1, minWidth:130, display:'grid', gap:9 }}>
              {(donut.length ? donut : [{ name:'No partners yet', value:0, fill:'#CBD5E1' }]).map(d => (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13 }}>
                  <span style={{ width:9, height:9, borderRadius:3, background:d.fill, flexShrink:0 }} />
                  <span style={{ color:'var(--ink-2)', flex:1 }}>{d.name}</span>
                  <span style={{ fontWeight:800, color:'var(--ink)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="admin-card" style={{ marginBottom:0 }}>
          <div className="admin-card-header">Recent Bookings <button onClick={() => goToSection('orders')} style={{ fontSize:12.5, fontWeight:700, color:'var(--gold)', background:'none', border:'none', cursor:'pointer' }}>View all →</button></div>
          <div style={{ overflowX:'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Booking ID</th><th>Service</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>No bookings yet</td></tr>
                ) : recent.map(j => (
                  <tr key={j.id}>
                    <td style={{ fontFamily:'ui-monospace,monospace', color:'var(--muted)', fontSize:12.5 }}>#{j.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ fontWeight:700, color:'var(--ink)' }}>{j.sub_service || '—'}</td>
                    <td style={{ color:'var(--muted)' }}>{new Date(j.created_at).toLocaleDateString('en-KE')}</td>
                    <td><SBBadge status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Jobs trend ── */}
      <motion.div variants={ov} custom={4} initial="hidden" animate="show">
        <div className="admin-card" style={{ marginBottom:0 }}>
          <div className="admin-card-header">Bookings — Last 7 Days</div>
          <div style={{ padding:'14px 12px 8px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series.jobs.map((d, i) => ({ day: d.label.toLocaleDateString('en-KE', { weekday:'short' }), v: d.v }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F5" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize:12, fill:'#7A8699' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize:12, fill:'#7A8699' }} width={28} />
                <Tooltip cursor={{ fill:'#F4F6FA' }} contentStyle={{ borderRadius:12, border:'1px solid #EDF0F5', fontSize:13 }} />
                <Bar dataKey="v" name="Bookings" radius={[6,6,0,0]} fill="#C9A020" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── SECTION: Partners ─────────────────────────────────────────────
function PartnersSection() {
  const [partners, setPartners]     = useState([]);
  const [statusFilter, setStatus]   = useState('pending');
  const [roleFilter, setRole]       = useState('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    let q = supabase.from('workers').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('verification_status', statusFilter);
    if (roleFilter !== 'all')   q = q.eq('partner_role', roleFilter);
    q.then(({ data }) => { setPartners(data || []); setLoading(false); });
  }, [statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (partnerId, status, note = '') => {
    setActing(true);
    const updates = { verification_status: status };
    if (status === 'approved')  updates.status = 'offline';
    if (status === 'suspended') updates.status = 'offline';
    if (status === 'rejected' && note) updates.rejection_reason = note;
    const { error } = await supabase.from('workers').update(updates).eq('id', partnerId);
    if (error) { alert(`Action failed: ${error.message}`); setActing(false); return; }
    const partner = partners.find(p => p.id === partnerId);
    auditLog(`partner_${status}`, `partner=${partner?.full_name||partnerId}${note ? ` reason=${note}` : ''}`);
    // Notify the partner by email (non-blocking)
    if (partner?.email) {
      try {
        if (status === 'approved') sendPartnerApproved(partner);
        else if (status === 'rejected') sendPartnerRejected(partner, note);
      } catch (_) {}
    }
    setSelected(null); setRejectNote(''); load(); setActing(false);
  };

  const filtered = partners.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    const role = selected.partner_role || 'worker';
    const sd   = selected.service_details;
    return (
      <div>
        <button onClick={() => setSelected(null)} className="btn btn-sm btn-outline-secondary mb-3">← Back to Partners</button>

        <div className="admin-card mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width:72, height:72, background:`${ROLE_COLOR[role]}15`, border:`2px solid ${ROLE_COLOR[role]}40`, fontSize:30 }}>
                {ROLE_ICON[role]}
              </div>
              <div className="ml-3 flex-grow-1">
                <h5 className="font-weight-bold mb-1 text-gray-800">{selected.full_name || 'Unknown'}</h5>
                <div className="mb-1">
                  <RoleBadge role={role} />
                  <span className="ml-2"><SBBadge status={selected.verification_status} /></span>
                  {selected.city && <span className="ml-2 text-xs text-gray-500">📍 {selected.city}</span>}
                </div>
                <div className="text-xs text-gray-500">{selected.email} · {selected.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Joined</div>
                <div className="text-xs font-weight-bold">{new Date(selected.created_at).toLocaleDateString('en-KE')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="admin-card mb-3">
              <div className="admin-card-header">👤 Personal Info</div>
              <div className="card-body py-2">
                {[['Full Name',selected.full_name],['Email',selected.email],['Phone',selected.phone],['City',selected.city],
                  ['Partner Agreement', selected.agreement_accepted_at ? `✅ Signed ${new Date(selected.agreement_accepted_at).toLocaleDateString('en-KE')}${selected.agreement_version ? ` (v${selected.agreement_version})` : ''}` : '⚠️ Not yet signed'],
                  ['Health Status',sd?.healthStatus],
                  ['Emergency Contact',sd?.emergencyContact?`${sd.emergencyContact.name} (${sd.emergencyContact.relation})`:null],
                  ['Emergency Phone',sd?.emergencyContact?.phone]].map(([l,v]) => <InfoRow key={l} label={l} value={v} />)}
              </div>
            </div>
            {sd?.payment && (
              <div className="admin-card mb-3">
                <div className="admin-card-header">💰 Payment Details</div>
                <div className="card-body py-2">
                  {[['Method',sd.payment.method],['M-Pesa',sd.payment.mpesa],['Bank',sd.payment.bank],['Account',sd.payment.bankAccount]].map(([l,v]) => <InfoRow key={l} label={l} value={v} />)}
                </div>
              </div>
            )}
            <div className="admin-card mb-3">
              <div className="admin-card-header">🪪 Identity Documents</div>
              <div className="card-body">
                {sd?.identity ? (
                  <>
                    <InfoRow label="ID Type" value={sd.identity.type} />
                    <InfoRow label="ID Number" value={sd.identity.number} />
                    <InfoRow label="KRA PIN" value={selected.tax_pin} />
                    <div className="d-flex gap-2 mt-2">
                      {sd.identity.frontUrl && <a href={sd.identity.frontUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning flex-grow-1">📄 ID Front</a>}
                      {sd.identity.backUrl  && <a href={sd.identity.backUrl}  target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning flex-grow-1">📄 ID Back</a>}
                    </div>
                  </>
                ) : selected.id_photo_url ? (
                  <a href={selected.id_photo_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning">📄 View ID Document →</a>
                ) : <p className="text-xs text-gray-500 mb-0">No documents uploaded</p>}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            {sd && (
              <div className="admin-card mb-3">
                <div className="admin-card-header">{ROLE_ICON[role]} {ROLE_LABEL[role] || role} Requirements</div>
                <div className="card-body py-2"><ServiceDetailsView details={sd} /></div>
              </div>
            )}

            {/* ── Mover / Water Carrier company info (legal §1007 + §1087) ── */}
            {(role === 'mover' || role === 'water_carrier') && (
              <div className="admin-card mb-3">
                <div className="admin-card-header">🏢 Company Information</div>
                <div className="card-body py-2">
                  <InfoRow label="Company Name"   value={selected.business_name} />
                  <InfoRow label="Owner ID #"     value={selected.owner_national_id} />
                  {role === 'mover' && (
                    <>
                      <InfoRow label="Cert. of Incorporation" value={selected.registration_number} />
                      <InfoRow label="Years in Operation"     value={selected.years_in_operation ? `${selected.years_in_operation} years` : null} />
                      {selected.years_in_operation != null && Number(selected.years_in_operation) < 2 && (
                        <div className="alert alert-warning py-2 px-3 my-2 text-xs"><strong>⚠️ Below legal minimum (2 years)</strong></div>
                      )}
                    </>
                  )}
                  {role === 'water_carrier' && (
                    <>
                      <InfoRow label="Service Areas" value={selected.service_area} />
                      <InfoRow label="Water Source"  value={selected.water_source} />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Crew (movers, vendors, water carriers, suppliers) ── */}
            {['mover','vendor','water_carrier','supplier'].includes(role) && (
              <PartnerCrewPanel partnerId={selected.id} />
            )}

            {/* ── Mover Fleet ── */}
            {role === 'mover' && (
              <PartnerFleetPanel moverId={selected.id} />
            )}
            <div className="admin-card mb-3">
              <div className="admin-card-header">⚡ Approval Actions</div>
              <div className="card-body">
                {selected.verification_status === 'pending' && (
                  <div className="alert alert-warning py-2 text-xs mb-3">⏳ Application Under Review — check documents before approving</div>
                )}
                {selected.verification_status !== 'approved' && (
                  <button onClick={() => act(selected.id,'approved')} disabled={acting} className="btn btn-success btn-block mb-2 font-weight-bold">✅ Approve Partner</button>
                )}
                {selected.verification_status !== 'rejected' && (
                  <>
                    <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Reason for rejection (shown to partner)..." className="form-control form-control-sm mb-2" rows={3} />
                    <button onClick={() => act(selected.id,'rejected',rejectNote)} disabled={acting} className="btn btn-danger btn-block mb-2 font-weight-bold">❌ Reject Application</button>
                  </>
                )}
                {selected.verification_status === 'approved' && (
                  <button onClick={() => act(selected.id,'suspended')} disabled={acting} className="btn btn-warning btn-block mb-2 font-weight-bold">🚫 Suspend Account</button>
                )}
                {selected.verification_status === 'suspended' && (
                  <button onClick={() => act(selected.id,'approved')} disabled={acting} className="btn btn-success btn-block mb-2 font-weight-bold">🔓 Reinstate Account</button>
                )}
                {selected.rejection_reason && (
                  <div className="alert alert-danger py-2 text-xs mt-2"><strong>Rejection reason:</strong> {selected.rejection_reason}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Partner Management" sub="Review applications and manage all partner accounts" />
      <div className="mb-2">
        {[{k:'all',label:'All Roles'},{k:'worker',label:'🔧 Workers'},{k:'vendor',label:'🏪 Vendors'},{k:'rider',label:'🚗 Riders'},{k:'supplier',label:'📦 Suppliers'},{k:'mover',label:'🚚 Movers'},{k:'water_carrier',label:'🚰 Water Carriers'}]
          .map(f => <FilterPill key={f.k} active={roleFilter===f.k} onClick={() => setRole(f.k)}>{f.label}</FilterPill>)}
      </div>
      <div className="mb-3">
        {[{k:'pending',label:'⏳ Pending'},{k:'approved',label:'✅ Approved'},{k:'rejected',label:'❌ Rejected'},{k:'suspended',label:'🚫 Suspended'},{k:'all',label:'All'}]
          .map(f => <FilterPill key={f.k} active={statusFilter===f.k} onClick={() => setStatus(f.k)}>{f.label}</FilterPill>)}
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or email..." className="form-control form-control-sm mb-3" style={{ maxWidth:400 }} />

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>📭</div><p className="text-gray-500 mt-2">No partners found</p></div>
      ) : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Joined</th><th>Agreement</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ cursor:'pointer' }} onClick={() => setSelected(p)}>
                    <td className="font-weight-bold text-gray-800">{p.full_name || 'Unknown'}</td>
                    <td className="text-gray-600">{p.email}</td>
                    <td><RoleBadge role={p.partner_role || 'worker'} /></td>
                    <td className="text-gray-600">{p.city || '—'}</td>
                    <td className="text-gray-600">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                    <td className="text-xs">
                      {p.agreement_accepted_at
                        ? <span style={{color:'#48BB78',fontWeight:700}}>✅ {new Date(p.agreement_accepted_at).toLocaleDateString('en-KE')}{p.agreement_version ? ` v${p.agreement_version}` : ''}</span>
                        : <span style={{color:'#FC8181',fontWeight:700}}>⚠️ Not signed</span>}
                    </td>
                    <td><SBBadge status={p.verification_status || 'pending'} /></td>
                    <td className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>Review →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Customers ────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const suspend = async (id) => {
    if (!window.confirm('Suspend this customer? They will lose access to the platform.')) return;
    const { error } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', id);
    if (error) { alert(`Failed to suspend: ${error.message}`); return; }
    auditLog('suspend_customer', `customer_id=${id}`);
    setUsers(u => u.map(x => x.id===id ? { ...x, is_suspended:true } : x));
  };
  const unsuspend = async (id) => {
    const { error } = await supabase.from('profiles').update({ is_suspended: false }).eq('id', id);
    if (error) { alert(`Failed to reinstate: ${error.message}`); return; }
    auditLog('reinstate_customer', `customer_id=${id}`);
    setUsers(u => u.map(x => x.id===id ? { ...x, is_suspended:false } : x));
  };

  const filtered = users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader title="Customer Accounts" sub="All registered customers on the platform" />
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or email..." className="form-control form-control-sm mb-3" style={{ maxWidth:400 }} />
      {loading ? <Spinner /> : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-4">No customers found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-weight-bold text-gray-800">{u.full_name || 'Customer'}</td>
                    <td className="text-gray-600">{u.email}</td>
                    <td className="text-gray-600">{u.city || 'Nairobi'}</td>
                    <td className="text-gray-600">{new Date(u.created_at).toLocaleDateString('en-KE')}</td>
                    <td>{u.is_suspended ? <span className="sb-badge sb-badge-danger">Suspended</span> : <span className="sb-badge sb-badge-success">Active</span>}</td>
                    <td>{u.is_suspended
                      ? <button onClick={() => unsuspend(u.id)} className="btn btn-sm btn-success">Reinstate</button>
                      : <button onClick={() => suspend(u.id)}   className="btn btn-sm btn-outline-danger">🚫 Suspend</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ── Job Modal ─────────────────────────────────────────────────────
function JobModal({ job, onClose, onUpdated }) {
  const [status, setStatus] = useState(job.status);
  const [price,  setPrice]  = useState(job.price || '');
  const [worker, setWorker] = useState(job.worker_name || '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const STATUS_FLOW = [
    { k:'upcoming',    label:'⏳ Upcoming'    },
    { k:'confirmed',   label:'✅ Confirmed'   },
    { k:'on_way',      label:'🚗 On The Way'  },
    { k:'in_progress', label:'🔧 In Progress' },
    { k:'completed',   label:'🎉 Completed'   },
    { k:'cancelled',   label:'❌ Cancelled'   },
  ];

  const save = async () => {
    setSaving(true);
    const updates = { status, worker_name: worker || job.worker_name };
    if (price) updates.price = parseFloat(price);
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await supabase.from('bookings').update(updates).eq('id', job.id);
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onUpdated(); }, 1200);
  };

  const price_n    = parseFloat(price) || 0;
  const commission = price_n * 0.15;
  const proEarning = price_n * 0.85;

  return (
    <div className="job-modal-overlay" onClick={onClose}>
      <div className="job-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ background:'#f8f9fc' }}>
          <div>
            <div className="font-weight-bold text-gray-800">Manage Booking</div>
            <div className="text-xs text-gray-500" style={{ fontFamily:'monospace' }}>#{job.id.slice(0,8).toUpperCase()}</div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline-secondary">✕</button>
        </div>

        <div className="p-3 flex-grow-1">
          {/* Service info */}
          <div className="admin-card mb-3">
            <div className="card-body py-2">
              <div className="font-weight-bold text-gray-800 mb-2">{job.sub_service || job.service || '—'}</div>
              {[['Address',job.address],['Date',job.booking_date||job.scheduled_date],['Time',job.booking_time||job.scheduled_time],['Notes',job.notes]]
                .map(([l,v]) => v && <InfoRow key={l} label={l} value={v} />)}
            </div>
          </div>

          {/* Worker */}
          <div className="form-group">
            <label className="text-xs font-weight-bold text-uppercase text-gray-500" style={{ letterSpacing:'0.05rem' }}>Assigned Worker</label>
            <input value={worker} onChange={e => setWorker(e.target.value)} placeholder="Enter worker name..." className="form-control form-control-sm" />
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="text-xs font-weight-bold text-uppercase text-gray-500" style={{ letterSpacing:'0.05rem' }}>Set Job Price (KSh)</label>
            <div className="input-group input-group-sm">
              <div className="input-group-prepend"><span className="input-group-text">KSh</span></div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 2500" className="form-control" />
            </div>
            {price_n > 0 && (
              <div className="mt-2 p-2 rounded" style={{ background:'#fef3cd', border:'1px solid #ffc107', fontSize:12 }}>
                <div className="d-flex justify-content-between"><span className="text-gray-600">Total fare</span><span className="font-weight-bold">KSh {price_n.toLocaleString()}</span></div>
                <div className="d-flex justify-content-between"><span className="text-gray-600">Fixera (15%)</span><span className="font-weight-bold text-gold">KSh {commission.toLocaleString('en-KE',{maximumFractionDigits:0})}</span></div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between"><span className="text-gray-600">Worker earns</span><span className="font-weight-bold text-success">KSh {proEarning.toLocaleString('en-KE',{maximumFractionDigits:0})}</span></div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="text-xs font-weight-bold text-uppercase text-gray-500" style={{ letterSpacing:'0.05rem' }}>Update Status</label>
            {STATUS_FLOW.map(s => (
              <div key={s.k} onClick={() => setStatus(s.k)} className="p-2 mb-1 rounded d-flex justify-content-between align-items-center" style={{
                cursor:'pointer', border:`1px solid ${status===s.k?'#C9A020':'#e3e6f0'}`,
                background: status===s.k ? '#fef3cd' : '#f8f9fc',
                color: status===s.k ? '#856404' : '#6e707e',
                fontWeight: status===s.k ? 700 : 400, fontSize: 13,
              }}>
                {s.label}{status===s.k && <span style={{color:'#C9A020'}}>●</span>}
              </div>
            ))}
          </div>

          {status === 'completed' && !price && (
            <div className="alert alert-warning text-xs py-2">⚠️ Please set a price before marking as completed.</div>
          )}
        </div>

        <div className="p-3 border-top">
          <button onClick={save} disabled={saving||saved} className="btn btn-block font-weight-bold" style={{ background: saved?'#1cc88a':'#C9A020', color:'#fff', border:'none' }}>
            {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SECTION: Jobs ─────────────────────────────────────────────────
function JobsSection() {
  const [jobs,     setJobs]    = useState([]);
  const [filter,   setFilter]  = useState('all');
  const [loading,  setLoading] = useState(true);
  const [selected, setSelected]= useState(null);

  const load = () => {
    setLoading(true);
    let q = supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') q = q.eq('status', filter);
    q.then(({ data }) => { setJobs(data || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <>
      <PageHeader title="Monitor Jobs" sub="Click any row to manage status, price, and worker assignment" />
      <div className="mb-3">
        {[{k:'all',label:'All'},{k:'upcoming',label:'⏳ Upcoming'},{k:'confirmed',label:'✅ Confirmed'},
          {k:'on_way',label:'🚗 On Way'},{k:'in_progress',label:'🔧 Active'},{k:'completed',label:'🎉 Completed'},{k:'cancelled',label:'❌ Cancelled'}]
          .map(f => <FilterPill key={f.k} active={filter===f.k} onClick={() => setFilter(f.k)}>{f.label}</FilterPill>)}
      </div>

      {loading ? <Spinner /> : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th><th>Service</th><th>Date</th><th>Worker</th>
                  <th>Price</th><th>Commission</th><th>Worker Earns</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-500 py-4">No jobs found</td></tr>
                ) : jobs.map(j => {
                  const price   = Number(j.price || 0);
                  const comm    = Number(j.commission_amount || price * 0.15);
                  const proEarn = Number(j.professional_earning || price * 0.85);
                  return (
                    <tr key={j.id} style={{ cursor:'pointer' }} onClick={() => setSelected(j)}>
                      <td style={{ fontFamily:'monospace', color:'#858796' }}>#{j.id.slice(0,8).toUpperCase()}</td>
                      <td className="font-weight-bold text-gray-800">{j.sub_service || j.service || '—'}</td>
                      <td className="text-gray-600">{j.booking_date || '—'}</td>
                      <td className="text-gray-600">{j.worker_name || <span className="sb-badge sb-badge-danger">Unassigned</span>}</td>
                      <td className="font-weight-bold">{price > 0 ? `KSh ${price.toLocaleString()}` : <span className="text-gray-500">— Set price</span>}</td>
                      <td className="font-weight-bold text-gold">{comm > 0 ? `KSh ${comm.toLocaleString('en-KE',{maximumFractionDigits:0})}` : '—'}</td>
                      <td className="font-weight-bold text-success">{proEarn > 0 ? `KSh ${proEarn.toLocaleString('en-KE',{maximumFractionDigits:0})}` : '—'}</td>
                      <td><SBBadge status={j.status} /></td>
                      <td className="text-xs font-weight-bold text-gold">Manage →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <JobModal job={selected} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); load(); }} />}
    </>
  );
}

// ── SECTION: Payments ─────────────────────────────────────────────
function PaymentsSection() {
  const [tab,       setTab]      = useState('payments');
  const [payments,  setPayments] = useState([]);
  const [receipts,  setReceipts] = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [statusF,   setStatusF]  = useState('all');
  const [methodF,   setMethodF]  = useState('all');
  const [search,    setSearch]   = useState('');
  const [dateFrom,  setDateFrom] = useState('');
  const [dateTo,    setDateTo]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: pays }, { data: recs }] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('receipts').select('*').order('generated_at', { ascending: false }).limit(200),
    ]);
    setPayments(pays || []);
    setReceipts(recs || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const paid    = payments.filter(p => p.status === 'paid');
  const pending = payments.filter(p => p.status === 'pending');
  const failed  = payments.filter(p => p.status === 'failed');
  const totalRev = paid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalPending = pending.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  const filteredPays = payments.filter(p => {
    if (statusF !== 'all' && p.status !== statusF) return false;
    if (methodF !== 'all' && p.payment_method !== methodF) return false;
    if (search && !`${p.booking_id}${p.mpesa_ref||''}${p.worker_name||''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && p.created_at < dateFrom) return false;
    if (dateTo   && p.created_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  const STATUS_COLOR = { paid:'#1cc88a', pending:'#F6AD55', failed:'#e74a3b', refunded:'#9F7AEA' };
  const METHOD_ICON  = { mpesa:'📱', cash:'💵', bank:'🏦', card:'💳' };

  return (
    <>
      <PageHeader title="Payments" sub="Full payment ledger — transactions, receipts, methods and status" />

      {/* KPI row */}
      <div className="row mb-3">
        {[
          { icon:'💰', label:'Total Revenue',   val:`KSh ${totalRev.toLocaleString()}`,           color:'#1cc88a' },
          { icon:'✅', label:'Paid',             val:paid.length,                                  color:'#1cc88a' },
          { icon:'⏳', label:'Pending',          val:`${pending.length} · KSh ${totalPending.toLocaleString()}`, color:'#F6AD55' },
          { icon:'❌', label:'Failed',           val:failed.length,                                color:'#e74a3b' },
          { icon:'📱', label:'M-Pesa',           val:payments.filter(p=>p.payment_method==='mpesa').length, color:'#48BB78' },
          { icon:'📄', label:'Receipts Issued',  val:receipts.length,                              color:'#C9A020' },
        ].map(s => (
          <div key={s.label} className="col-md-2 col-sm-4 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:16 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:900, color:s.color, lineHeight:1.2 }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="d-flex mb-3" style={{ gap:6, borderBottom:'2px solid #e3e6f0', paddingBottom:0 }}>
        {[
          { id:'payments', label:`💳 Payments (${payments.length})` },
          { id:'receipts', label:`📄 Receipts (${receipts.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight:700, color:tab===t.id?'#C9A020':'#6c757d',
              borderBottom:tab===t.id?'3px solid #C9A020':'3px solid transparent', marginBottom:-2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {tab === 'payments' && (
            <>
              {/* Filters */}
              <div className="d-flex flex-wrap mb-3" style={{ gap:8 }}>
                <input className="form-control form-control-sm" placeholder="🔍 Search booking ID, M-Pesa ref, worker…"
                  value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize:12, maxWidth:260 }} />
                <select className="form-control form-control-sm" value={statusF} onChange={e => setStatusF(e.target.value)} style={{ fontSize:12, width:'auto' }}>
                  <option value="all">All Status</option>
                  {['paid','pending','failed','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="form-control form-control-sm" value={methodF} onChange={e => setMethodF(e.target.value)} style={{ fontSize:12, width:'auto' }}>
                  <option value="all">All Methods</option>
                  {['mpesa','cash','bank','card'].map(m => <option key={m} value={m}>{METHOD_ICON[m]} {m}</option>)}
                </select>
                <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ fontSize:12, width:'auto' }} title="From date" />
                <input type="date" className="form-control form-control-sm" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ fontSize:12, width:'auto' }} title="To date" />
                {(search||statusF!=='all'||methodF!=='all'||dateFrom||dateTo) &&
                  <button className="btn btn-sm btn-outline-secondary" style={{ fontSize:11 }}
                    onClick={() => { setSearch(''); setStatusF('all'); setMethodF('all'); setDateFrom(''); setDateTo(''); }}>
                    ✕ Clear
                  </button>}
                <span className="text-xs text-gray-500 align-self-center ml-auto">{filteredPays.length} of {payments.length}</span>
              </div>

              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Date</th><th>Booking ID</th><th>Worker</th><th>Method</th><th>M-Pesa Ref</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {filteredPays.length === 0
                        ? <tr><td colSpan={7} className="text-center text-gray-500 py-4">No payments match your filters</td></tr>
                        : filteredPays.map(p => (
                          <tr key={p.id}>
                            <td className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</td>
                            <td className="text-xs font-weight-bold" style={{ fontFamily:'monospace', color:'#4e73df' }}>
                              {p.booking_id ? p.booking_id.slice(0,8).toUpperCase() : '—'}
                            </td>
                            <td className="text-xs text-gray-700">{p.worker_name || '—'}</td>
                            <td className="text-xs">
                              <span style={{ fontWeight:700 }}>{METHOD_ICON[p.payment_method] || '—'} {p.payment_method || '—'}</span>
                            </td>
                            <td className="text-xs" style={{ fontFamily:'monospace', color:'#48BB78' }}>{p.mpesa_ref || '—'}</td>
                            <td className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>KSh {(parseFloat(p.amount)||0).toLocaleString()}</td>
                            <td>
                              <span style={{ background:`${STATUS_COLOR[p.status]||'#aaa'}18`, color:STATUS_COLOR[p.status]||'#aaa',
                                border:`1px solid ${STATUS_COLOR[p.status]||'#aaa'}40`, borderRadius:999, padding:'2px 10px', fontSize:11, fontWeight:800 }}>
                                {p.status || '—'}
                              </span>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'receipts' && (
            <div className="admin-card">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead><tr><th>Receipt No</th><th>Service</th><th>Worker</th><th>Date</th><th>Amount</th><th>PDF</th></tr></thead>
                  <tbody>
                    {receipts.length === 0
                      ? <tr><td colSpan={6} className="text-center text-gray-500 py-4">No receipts yet</td></tr>
                      : receipts.map(r => (
                        <tr key={r.id}>
                          <td className="font-weight-bold" style={{ fontFamily:'monospace', color:'#C9A020' }}>{r.receipt_no}</td>
                          <td className="text-xs text-gray-800">{r.sub_service || r.service || '—'}</td>
                          <td className="text-xs text-gray-600">{r.worker_name || '—'}</td>
                          <td className="text-xs text-gray-500">{new Date(r.generated_at).toLocaleDateString('en-KE')}</td>
                          <td className="font-weight-bold text-xs" style={{ color:'#1cc88a' }}>KSh {(r.amount||0).toLocaleString()}</td>
                          <td>{r.pdf_url
                            ? <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-xs" style={{ color:'#C9A020', fontWeight:700 }}>📄 Download</a>
                            : <span className="text-gray-500">—</span>}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Analytics ────────────────────────────────────────────
function AnalyticsSection() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('bookings').select('status, service, created_at'),
      supabase.from('workers').select('partner_role, verification_status, rating'),
      supabase.from('receipts').select('amount, generated_at'),
      supabase.from('profiles').select('created_at'),
    ]).then(([bookings, workers, receipts, profiles]) => {
      const bs = bookings.data||[], ws = workers.data||[], rs = receipts.data||[], ps = profiles.data||[];

      // Bookings by service
      const svcMap = {};
      bs.forEach(b => { if(b.service) svcMap[b.service]=(svcMap[b.service]||0)+1; });
      const serviceData = Object.entries(svcMap).sort(([,a],[,b])=>b-a).map(([service,count]) => ({ service, count }));

      // Job status breakdown
      const stMap = {};
      bs.forEach(b => { if(b.status) stMap[b.status]=(stMap[b.status]||0)+1; });
      const statusData = Object.entries(stMap).map(([status,count]) => ({ status: status.replace(/_/g,' '), count }));

      // Partners by role
      const roleMap = {};
      ws.forEach(w => { const r=w.partner_role||'worker'; roleMap[r]=(roleMap[r]||0)+1; });
      const roleData = Object.entries(roleMap).map(([name,value]) => ({ name, value }));

      // Monthly revenue
      const revMap = {};
      rs.forEach(r => {
        const m = new Date(r.generated_at).toLocaleDateString('en-KE',{month:'short',year:'2-digit'});
        revMap[m]=(revMap[m]||0)+(r.amount||0);
      });
      const revenueData = Object.entries(revMap).map(([month,revenue]) => ({ month, revenue }));

      // Customer growth
      const custMap = {};
      ps.forEach(p => {
        const m = new Date(p.created_at).toLocaleDateString('en-KE',{month:'short',year:'2-digit'});
        custMap[m]=(custMap[m]||0)+1;
      });
      let total = 0;
      const customerData = Object.entries(custMap).map(([month,count]) => { total+=count; return { month, new:count, total }; });

      const avgRating = ws.length ? (ws.reduce((s,w)=>s+(w.rating||0),0)/ws.length).toFixed(1) : 0;

      setData({ serviceData, statusData, roleData, revenueData, customerData, avgRating });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const PIE_COLORS = ['#C9A020','#17a2b8','#1cc88a','#fd7e14','#4e73df','#e74a3b'];

  return (
    <>
      <PageHeader title="Analytics" sub="Platform performance and insights — all charts are live data" />

      {/* Row 1: Revenue + Customer Growth */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4">
          <div className="admin-card h-100">
            <div className="admin-card-header">💰 Monthly Revenue Overview (KSh)</div>
            <div className="card-body">
              {data.revenueData.length === 0 ? (
                <div className="text-center py-5 text-gray-500">No revenue data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.revenueData} margin={{ top:10, right:20, left:10, bottom:5 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1cc88a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1cc88a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`KSh ${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#1cc88a" strokeWidth={2.5} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="admin-card h-100">
            <div className="admin-card-header">👥 Partners by Role</div>
            <div className="card-body">
              {data.roleData.length === 0 ? (
                <div className="text-center py-5 text-gray-500">No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                        {data.roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2">
                    {data.roleData.map((r, i) => (
                      <div key={r.name} className="d-flex justify-content-between align-items-center py-1">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width:10, height:10, borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }} />
                          <span className="text-xs text-gray-600 ml-1 text-capitalize">{r.name}</span>
                        </div>
                        <span className="text-xs font-weight-bold">{r.value}</span>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                      <span className="text-xs text-gray-500">Avg Rating</span>
                      <span className="text-xs font-weight-bold text-gold">⭐ {data.avgRating}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Bookings by Service + Job Status */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <div className="admin-card h-100">
            <div className="admin-card-header">📊 Bookings by Service</div>
            <div className="card-body">
              {data.serviceData.length === 0 ? (
                <div className="text-center py-5 text-gray-500">No booking data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.serviceData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="service" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Bookings" fill="#C9A020" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="admin-card h-100">
            <div className="admin-card-header">📋 Job Status Breakdown</div>
            <div className="card-body">
              {data.statusData.length === 0 ? (
                <div className="text-center py-5 text-gray-500">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.statusData} layout="vertical" margin={{ top:5, right:20, left:70, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize:11 }} />
                    <YAxis type="category" dataKey="status" tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Jobs" fill="#4e73df" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Customer Growth */}
      <div className="row">
        <div className="col-12 mb-4">
          <div className="admin-card">
            <div className="admin-card-header">🧑 Customer Growth Over Time</div>
            <div className="card-body">
              {data.customerData.length === 0 ? (
                <div className="text-center py-5 text-gray-500">No customer data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.customerData} margin={{ top:10, right:20, left:10, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="new"   name="New Customers"   stroke="#36b9cc" strokeWidth={2} dot={{ r:4 }} />
                    <Line type="monotone" dataKey="total" name="Total Customers"  stroke="#4e73df" strokeWidth={2} dot={{ r:4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── SECTION: Disputes ─────────────────────────────────────────────
function WorkforceSection() {
  const [tab, setTab]       = useState('crew'); // crew | vehicles
  const [crew, setCrew]     = useState([]);
  const [fleet, setFleet]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [roleF, setRoleF]   = useState('all');
  const [verF, setVerF]     = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoad(true);
    Promise.all([
      supabase.from('partner_crew_members').select('*, partner:partner_user_id(business_name, full_name, partner_role)').order('created_at', { ascending: false }),
      supabase.from('mover_vehicles').select('*, owner:mover_user_id(business_name, full_name)').order('created_at', { ascending: false }),
    ]).then(([c, v]) => { setCrew(c.data || []); setFleet(v.data || []); setLoad(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const verifyCrew = async (id, next) => { await supabase.from('partner_crew_members').update({ fixera_verified: next }).eq('id', id); load(); };
  const verifyVeh  = async (id, next) => { await supabase.from('mover_vehicles').update({ fixera_verified: next }).eq('id', id); load(); };

  const insBadge = (expiry) => {
    if (!expiry) return { c:'#e74a3b', t:'No insurance' };
    const d = Math.ceil((new Date(expiry) - new Date()) / 86400000);
    if (d < 0) return { c:'#e74a3b', t:`Expired ${-d}d` };
    if (d < 30) return { c:'#fd7e14', t:`${d}d left` };
    return { c:'#1cc88a', t:`Valid ${d}d` };
  };

  const crewFiltered = crew.filter(m =>
    (roleF === 'all' || m.partner_type === roleF || m.partner?.partner_role === roleF) &&
    (verF === 'all' || (verF === 'yes' ? m.fixera_verified : !m.fixera_verified)) &&
    (!search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || (m.national_id||'').includes(search))
  );
  const fleetFiltered = fleet.filter(v =>
    (verF === 'all' || (verF === 'yes' ? v.fixera_verified : !v.fixera_verified)) &&
    (!search || v.plate_number?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Workforce Directory" sub="Every crew member & vehicle across all partners — Fixera's permanent record" />

      <div className="mb-2">
        <FilterPill active={tab==='crew'} onClick={() => setTab('crew')}>👥 Crew ({crew.length})</FilterPill>
        <FilterPill active={tab==='vehicles'} onClick={() => setTab('vehicles')}>🚚 Vehicles ({fleet.length})</FilterPill>
      </div>
      <div className="mb-2">
        {[{k:'all',l:'All'},{k:'yes',l:'✓ Verified'},{k:'no',l:'Unverified'}].map(f =>
          <FilterPill key={f.k} active={verF===f.k} onClick={() => setVerF(f.k)}>{f.l}</FilterPill>)}
      </div>
      {tab === 'crew' && (
        <div className="mb-2">
          {[{k:'all',l:'All types'},{k:'mover',l:'🚚 Mover'},{k:'vendor',l:'🏪 Vendor'},{k:'water_carrier',l:'🚰 Water'},{k:'supplier',l:'📦 Supplier'}].map(f =>
            <FilterPill key={f.k} active={roleF===f.k} onClick={() => setRoleF(f.k)}>{f.l}</FilterPill>)}
        </div>
      )}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab==='crew'?'🔍 Name or ID…':'🔍 Plate…'} className="form-control form-control-sm mb-3" style={{ maxWidth: 360 }} />

      {loading ? <Spinner /> : tab === 'crew' ? (
        crewFiltered.length === 0 ? <Empty /> : (
          <div className="admin-card"><div className="table-responsive"><table className="admin-table">
            <thead><tr><th>Worker</th><th>Partner</th><th>Position</th><th>ID</th><th>Verified</th><th></th></tr></thead>
            <tbody>{crewFiltered.map(m => {
              const lead = ['team_leader','supervisor'].includes(m.default_position);
              return (
                <tr key={m.id}>
                  <td className="d-flex align-items-center" style={{ gap: 8 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {m.photo_url ? <img src={m.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
                    </div>
                    <span className="font-weight-bold text-xs">{m.full_name}{lead && ' ⭐'}</span>
                  </td>
                  <td className="text-xs">{m.partner?.business_name || m.partner?.full_name || '—'}<div className="text-gray-500">{(m.partner_type||m.partner?.partner_role||'').replace(/_/g,' ')}</div></td>
                  <td className="text-xs">{(m.default_position||'').replace(/_/g,' ')}</td>
                  <td className="text-xs">{m.national_id || '—'}</td>
                  <td>{m.fixera_verified ? <span className="sb-badge sb-badge-success">✓</span> : <span className="sb-badge sb-badge-secondary">—</span>}</td>
                  <td><button onClick={() => verifyCrew(m.id, !m.fixera_verified)} className={`btn btn-sm ${m.fixera_verified?'btn-outline-danger':'btn-success'}`} style={{fontSize:11}}>{m.fixera_verified?'Unverify':'Verify'}</button></td>
                </tr>
              );
            })}</tbody>
          </table></div></div>
        )
      ) : (
        fleetFiltered.length === 0 ? <Empty /> : (
          <div className="admin-card"><div className="table-responsive"><table className="admin-table">
            <thead><tr><th>Vehicle</th><th>Mover</th><th>Plate</th><th>Insurance</th><th>Verified</th><th></th></tr></thead>
            <tbody>{fleetFiltered.map(v => { const ins = insBadge(v.insurance_expiry); return (
              <tr key={v.id}>
                <td className="text-xs">{(v.vehicle_type||'').replace(/_/g,' ').toUpperCase()}<div className="text-gray-500">{[v.year,v.make,v.model].filter(Boolean).join(' ')}</div></td>
                <td className="text-xs">{v.owner?.business_name || v.owner?.full_name || '—'}</td>
                <td><span style={{ background:'#000', color:'#fff', fontFamily:'monospace', fontSize:11, padding:'2px 8px', borderRadius:4, letterSpacing:1 }}>{v.plate_number}</span></td>
                <td><span style={{ color: ins.c, fontSize:11, fontWeight:700 }}>🛡️ {ins.t}</span></td>
                <td>{v.fixera_verified ? <span className="sb-badge sb-badge-success">✓</span> : <span className="sb-badge sb-badge-secondary">—</span>}</td>
                <td><button onClick={() => verifyVeh(v.id, !v.fixera_verified)} className={`btn btn-sm ${v.fixera_verified?'btn-outline-danger':'btn-success'}`} style={{fontSize:11}}>{v.fixera_verified?'Unverify':'Verify'}</button></td>
              </tr>
            );})}</tbody>
          </table></div></div>
        )
      )}
    </>
  );

  function Empty() { return <div className="text-center py-5"><div style={{fontSize:48}}>🪪</div><p className="text-gray-500 mt-2">None found.</p></div>; }
}

function ProductApprovalsSection() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [tab, setTab]       = useState('pending'); // pending | price | all
  const [note, setNote]     = useState({});

  const load = useCallback(() => {
    setLoad(true);
    supabase.from('vendor_products')
      .select('*, supplier:business_id(full_name, business_name)')
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => { setRows(data || []); setLoad(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending     = rows.filter(r => r.status === 'pending');
  const priceChange = rows.filter(r => r.pending_price != null && r.status === 'approved');
  const list = tab === 'pending' ? pending : tab === 'price' ? priceChange : rows;

  const approve = async (r) => {
    const updates = { status: 'approved', rejection_reason: null };
    if (r.pending_price != null) { updates.price = r.pending_price; updates.pending_price = null; }
    await supabase.from('vendor_products').update(updates).eq('id', r.id);
    load();
  };
  const reject = async (r) => {
    await supabase.from('vendor_products')
      .update({ status: 'rejected', rejection_reason: note[r.id] || 'Not approved', pending_price: null })
      .eq('id', r.id);
    load();
  };

  return (
    <>
      <PageHeader title="Product Approvals" sub="New products & price changes from suppliers" />
      <div className="mb-3">
        {[{k:'pending',label:`🆕 New (${pending.length})`},{k:'price',label:`💲 Price Changes (${priceChange.length})`},{k:'all',label:'All'}]
          .map(f => <FilterPill key={f.k} active={tab===f.k} onClick={() => setTab(f.k)}>{f.label}</FilterPill>)}
      </div>

      {loading ? <Spinner /> : list.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>🏷️</div><p className="text-gray-500 mt-2">Nothing to review.</p></div>
      ) : list.map(r => (
        <div key={r.id} className="admin-card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="font-weight-bold text-gray-800">{r.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {r.supplier?.business_name || r.supplier?.full_name || 'Supplier'} · {r.category || '—'}
                </div>
              </div>
              <span className="sb-badge" style={{ background: r.status==='pending'?'#F6AD5522':r.status==='rejected'?'#e74a3b22':'#1cc88a22', color: r.status==='pending'?'#F6AD55':r.status==='rejected'?'#e74a3b':'#1cc88a' }}>
                {r.status}
              </span>
            </div>
            {r.description && <div className="text-xs text-gray-600 mb-2">{r.description}</div>}
            <div className="d-flex align-items-center mb-3" style={{ gap: 8 }}>
              {r.pending_price != null ? (
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  <span style={{ color:'#9ca3af', textDecoration:'line-through' }}>KSh {r.price?.toLocaleString()}</span>
                  {' → '}
                  <span style={{ color:'#1cc88a' }}>KSh {Number(r.pending_price).toLocaleString()}</span>
                  <span className="text-xs text-gray-500"> {r.unit ? `/ ${r.unit}` : ''}</span>
                </span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color:'#C9A020' }}>KSh {r.price?.toLocaleString()} {r.unit ? `/ ${r.unit}` : ''}</span>
              )}
            </div>
            {(r.status === 'pending' || r.pending_price != null) && (
              <div className="d-flex" style={{ gap: 8 }}>
                <input value={note[r.id]||''} onChange={e => setNote(n=>({...n,[r.id]:e.target.value}))} placeholder="Rejection reason (optional)" className="form-control form-control-sm" />
                <button onClick={() => approve(r)} className="btn btn-success btn-sm" style={{ whiteSpace:'nowrap' }}>✅ Approve</button>
                <button onClick={() => reject(r)} className="btn btn-outline-danger btn-sm" style={{ whiteSpace:'nowrap' }}>Reject</button>
              </div>
            )}
            {r.status === 'rejected' && r.rejection_reason && (
              <div className="alert alert-danger py-2 text-xs mb-0">Rejected: {r.rejection_reason}</div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function DisputesSection() {
  const { user, profile } = useAuth();
  const [disputes, setDisputes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('open');
  const [deptFilter, setDept]       = useState('all');
  const [roleTixFilter, setRoleTix] = useState('all');
  const [note, setNote]             = useState({});
  const [updating, setUpdating]     = useState({});
  const [ticketNotes, setTicketNotes] = useState({});
  const [notesOpen, setNotesOpen]     = useState({});
  const [newNote, setNewNote]         = useState({});
  const [addingNote, setAddingNote]   = useState({});
  const [assigning, setAssigning]     = useState({});
  const [assignSel, setAssignSel]     = useState({}); // ticketId → selected agent id
  const [agents, setAgents]           = useState([]);

  // Load the staff/agent roster once, so tickets can be assigned to a real person
  useEffect(() => {
    supabase.from('profiles').select('id, full_name, admin_role').eq('is_admin', true).order('full_name')
      .then(({ data }) => setAgents(data || []));
  }, []);

  const loadNotes = async (ticketId) => {
    const { data } = await supabase.from('ticket_notes').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setTicketNotes(n => ({ ...n, [ticketId]: data || [] }));
  };

  const toggleNotes = (ticketId) => {
    const opening = !notesOpen[ticketId];
    setNotesOpen(o => ({ ...o, [ticketId]: opening }));
    if (opening && !ticketNotes[ticketId]) loadNotes(ticketId);
  };

  const addNote = async (ticketId) => {
    if (!newNote[ticketId]?.trim()) return;
    setAddingNote(a => ({ ...a, [ticketId]: true }));
    await supabase.from('ticket_notes').insert({
      ticket_id:  ticketId,
      admin_id:   user.id,
      admin_name: profile?.full_name || user?.email?.split('@')[0] || 'Admin',
      note:       newNote[ticketId].trim(),
    });
    setNewNote(n => ({ ...n, [ticketId]: '' }));
    await loadNotes(ticketId);
    setAddingNote(a => ({ ...a, [ticketId]: false }));
  };

  const assignTicket = async (ticketId) => {
    const agentId = assignSel[ticketId];
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    setAssigning(a => ({ ...a, [ticketId]: true }));
    // SLA deadline: 24 hours from now by default
    const sla_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('support_tickets').update({ assigned_name: agent.full_name || 'Agent', assigned_to: agent.id, sla_deadline }).eq('id', ticketId);
    setAssigning(a => ({ ...a, [ticketId]: false }));
    load();
  };

  const DEPT_META = {
    finance:         { label: '💰 Finance',         color: '#1cc88a', sla_hours: 24 },
    operations:      { label: '🛠️ Operations',      color: '#4e73df', sla_hours: 8  },
    trust_safety:    { label: '🛡️ Trust & Safety',  color: '#e74a3b', sla_hours: 1  },
    accounts:        { label: '🔐 Accounts',         color: '#C9A020', sla_hours: 48 },
    technical:       { label: '📱 Technical',        color: '#9F7AEA', sla_hours: 24 },
    partner_success: { label: '🤝 Partner Success',  color: '#fd7e14', sla_hours: 48 },
  };

  const PRIORITY_META = {
    urgent: { label: '🚨 URGENT', bg: 'rgba(231,74,59,0.12)', color: '#e74a3b', border: 'rgba(231,74,59,0.4)' },
    high:   { label: '🔶 HIGH',   bg: 'rgba(246,173,85,0.12)', color: '#F6AD55', border: 'rgba(246,173,85,0.4)' },
    normal: { label: '🔵 NORMAL', bg: 'rgba(78,115,223,0.10)', color: '#4e73df', border: 'rgba(78,115,223,0.3)' },
  };

  const STATUS_FLOW = {
    open:        { next: 'in_review',    label: '▶ Mark In Review',   btnClass: 'btn-primary'  },
    in_review:   { next: 'in_progress',  label: '▶ Mark In Progress', btnClass: 'btn-warning'  },
    in_progress: { next: 'resolved',     label: '✅ Resolve',          btnClass: 'btn-success'  },
    resolved:    { next: 'open',         label: '↩ Reopen',            btnClass: 'btn-secondary'},
  };

  const slaStatus = (ticket) => {
    if (ticket.status === 'resolved') return null;
    const dept    = DEPT_META[ticket.department];
    if (!dept) return null;
    const hoursElapsed = (Date.now() - new Date(ticket.created_at).getTime()) / 3_600_000;
    const ratio        = hoursElapsed / dept.sla_hours;
    if (ratio >= 1)   return { label: `⏰ SLA BREACHED (${Math.round(hoursElapsed)}h)`, color: '#e74a3b', bg: 'rgba(231,74,59,0.12)' };
    if (ratio >= 0.75) return { label: `⚠️ SLA at risk (${Math.round(hoursElapsed)}h/${dept.sla_hours}h)`, color: '#F6AD55', bg: 'rgba(246,173,85,0.1)' };
    return null;
  };

  const load = useCallback(() => {
    setLoading(true);
    let q = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (filter !== 'all')        q = q.eq('status', filter);
    if (deptFilter !== 'all')    q = q.eq('department', deptFilter);
    if (roleTixFilter !== 'all') q = q.eq('user_type', roleTixFilter);
    q.then(({ data }) => {
      const order  = { urgent: 0, high: 1, normal: 2 };
      const sorted = (data || []).sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2));
      setDisputes(sorted);
      setLoading(false);
    });
  }, [filter, deptFilter, roleTixFilter]);

  useEffect(() => { load(); }, [load]);

  const advanceStatus = async (ticket) => {
    const flow = STATUS_FLOW[ticket.status];
    if (!flow) return;
    setUpdating(u => ({ ...u, [ticket.id]: true }));
    const updates = { status: flow.next };
    if (flow.next === 'resolved' && note[ticket.id]) updates.admin_note = note[ticket.id];
    if (flow.next === 'resolved') updates.resolved_at = new Date().toISOString();
    await supabase.from('support_tickets').update(updates).eq('id', ticket.id);
    sendTicketStatusUpdate({ ...ticket, admin_note: updates.admin_note || ticket.admin_note }, flow.next);
    setUpdating(u => ({ ...u, [ticket.id]: false }));
    load();
  };

  const saveNote = async (id) => {
    if (!note[id]?.trim()) return;
    await supabase.from('support_tickets').update({ admin_note: note[id] }).eq('id', id);
    load();
  };

  return (
    <>
      <PageHeader title="Support Center" sub="Unified ticket queue — department-routed, priority-sorted, SLA-tracked" />

      {/* Status filter */}
      <div className="mb-2">
        {[
          { k: 'open',        label: '🔴 Open'        },
          { k: 'in_review',   label: '🔵 In Review'   },
          { k: 'in_progress', label: '🟡 In Progress' },
          { k: 'resolved',    label: '✅ Resolved'     },
          { k: 'all',         label: 'All'             },
        ].map(f => <FilterPill key={f.k} active={filter === f.k} onClick={() => setFilter(f.k)}>{f.label}</FilterPill>)}
      </div>

      {/* Department filter */}
      <div className="mb-2">
        <FilterPill active={deptFilter === 'all'} onClick={() => setDept('all')}>All Departments</FilterPill>
        {Object.entries(DEPT_META).map(([k, m]) =>
          <FilterPill key={k} active={deptFilter === k} onClick={() => setDept(k)}>{m.label}</FilterPill>)}
      </div>

      {/* User type filter */}
      <div className="mb-3">
        {[
          { k: 'all',          label: 'Everyone'          },
          { k: 'customer',     label: '🧑 Customers'      },
          { k: 'worker',       label: '🔧 Workers'        },
          { k: 'vendor',       label: '🏪 Vendors'        },
          { k: 'rider',        label: '🚗 Riders'         },
          { k: 'supplier',     label: '📦 Suppliers'      },
          { k: 'mover',        label: '🚚 Movers'         },
          { k: 'water_carrier',label: '🚰 Water Carriers' },
        ].map(f => <FilterPill key={f.k} active={roleTixFilter === f.k} onClick={() => setRoleTix(f.k)}>{f.label}</FilterPill>)}
      </div>

      {loading ? <Spinner /> : disputes.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: 48 }}>🕊️</div>
          <p className="text-gray-500 mt-2">No tickets — all clear!</p>
        </div>
      ) : disputes.map(d => {
        const dept    = DEPT_META[d.department] || DEPT_META.partner_success;
        const pri     = PRIORITY_META[d.priority] || PRIORITY_META.normal;
        const flow    = STATUS_FLOW[d.status] || STATUS_FLOW.open;
        const sla     = slaStatus(d);
        const isUrgentOpen = d.priority === 'urgent' && d.status !== 'resolved';

        return (
          <div key={d.id} className="admin-card mb-3" style={isUrgentOpen ? { borderLeft: '4px solid #e74a3b' } : {}}>
            <div className="card-body">

              {/* Header row */}
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-start" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{ROLE_ICON[d.user_type] || '📋'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-weight-bold text-gray-800" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span>{d.subject || 'Support Request'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      #{d.id.slice(0, 8).toUpperCase()} · {new Date(d.created_at).toLocaleDateString('en-KE')} · {(ROLE_LABEL[d.user_type] || d.user_type || 'User').toUpperCase()}
                      {d.user_name && <> · <strong>{d.user_name}</strong></>}
                      {d.user_email && <> · {d.user_email}</>}
                    </div>
                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}>
                        {pri.label}
                      </span>
                      <span className="sb-badge" style={{ background: `${dept.color}18`, color: dept.color, border: `1px solid ${dept.color}50`, fontSize: 10 }}>
                        {dept.label}
                      </span>
                      {d.category && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.06)', color: '#6c757d', border: '1px solid #e3e6f0' }}>
                          {d.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right" style={{ flexShrink: 0, marginLeft: 12 }}>
                  <SBBadge status={d.status || 'open'} />
                </div>
              </div>

              {/* SLA warning */}
              {sla && (
                <div style={{ background: sla.bg, border: `1px solid ${sla.color}40`, borderRadius: 6, padding: '5px 10px', marginBottom: 10, fontSize: 11, fontWeight: 700, color: sla.color }}>
                  {sla.label}
                </div>
              )}

              {/* Message */}
              <div className="p-2 rounded text-xs text-gray-600 mb-3" style={{ background: '#f8f9fc', border: '1px solid #e3e6f0' }}>
                {d.message || '—'}
              </div>

              {/* Admin note input */}
              <div className="input-group input-group-sm mb-2">
                <input
                  value={note[d.id] || ''}
                  onChange={e => setNote(n => ({ ...n, [d.id]: e.target.value }))}
                  placeholder="Add or update admin note…"
                  className="form-control"
                />
                <div className="input-group-append">
                  <button onClick={() => saveNote(d.id)} className="btn btn-outline-secondary btn-sm">💾 Save Note</button>
                </div>
              </div>

              {/* Status action button */}
              <button
                onClick={() => advanceStatus(d)}
                disabled={!!updating[d.id]}
                className={`btn btn-sm ${flow.btnClass}`}
                style={{ opacity: updating[d.id] ? 0.6 : 1 }}
              >
                {updating[d.id] ? '…' : flow.label}
              </button>

              {/* Assign + SLA */}
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {d.assigned_name ? (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(78,115,223,0.1)', border: '1px solid rgba(78,115,223,0.3)', color: '#4e73df', fontWeight: 700 }}>
                    👤 {d.assigned_name}
                  </span>
                ) : null}
                {d.sla_deadline ? (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: new Date(d.sla_deadline) < new Date() ? 'rgba(231,74,59,0.1)' : 'rgba(246,173,85,0.1)', border: `1px solid ${new Date(d.sla_deadline) < new Date() ? 'rgba(231,74,59,0.3)' : 'rgba(246,173,85,0.3)'}`, color: new Date(d.sla_deadline) < new Date() ? '#e74a3b' : '#F6AD55', fontWeight: 700 }}>
                    ⏰ Due {new Date(d.sla_deadline).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
                <div style={{ display: 'flex', gap: 4 }}>
                  <select
                    value={assignSel[d.id] || ''}
                    onChange={e => setAssignSel(n => ({ ...n, [d.id]: e.target.value }))}
                    style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #d0d8f0', borderRadius: 6, outline: 'none', fontFamily: 'inherit', width: 160, background: '#fff' }}
                  >
                    <option value="">{d.assigned_name ? `Reassign (${d.assigned_name})…` : 'Assign to…'}</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.full_name || 'Agent'} · {roleLabel(a.admin_role)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignTicket(d.id)}
                    disabled={assigning[d.id] || !assignSel[d.id]}
                    style={{ padding: '4px 10px', borderRadius: 6, background: '#4e73df', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: assignSel[d.id] ? 'pointer' : 'not-allowed', opacity: assignSel[d.id] ? 1 : 0.5 }}
                  >
                    {assigning[d.id] ? '…' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Existing admin note */}
              {d.admin_note && (
                <div className="alert alert-success py-2 text-xs mt-2 mb-0">📝 {d.admin_note}</div>
              )}

              {/* ── Internal Notes Thread ── */}
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => toggleNotes(d.id)}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#4e73df', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  🔒 Internal Notes {ticketNotes[d.id] ? `(${ticketNotes[d.id].length})` : ''} {notesOpen[d.id] ? '▲' : '▼'}
                </button>

                {notesOpen[d.id] && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#f0f4ff', border: '1px solid #d0d8f0', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#4e73df', marginBottom: 8, letterSpacing: 1 }}>
                      🔒 INTERNAL — NOT VISIBLE TO CUSTOMER
                    </div>

                    {/* Notes thread */}
                    {(ticketNotes[d.id] || []).length === 0 ? (
                      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>No internal notes yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        {(ticketNotes[d.id] || []).map(n => (
                          <div key={n.id} style={{ background: '#fff', border: '1px solid #dde3f5', borderRadius: 6, padding: '8px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#4e73df' }}>{n.admin_name}</span>
                              <span style={{ fontSize: 10, color: '#aaa' }}>{new Date(n.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{n.note}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note input */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={newNote[d.id] || ''}
                        onChange={e => setNewNote(n => ({ ...n, [d.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addNote(d.id)}
                        placeholder="Add internal note…"
                        style={{ flex: 1, fontSize: 12, padding: '6px 10px', border: '1px solid #d0d8f0', borderRadius: 6, outline: 'none', fontFamily: 'inherit' }}
                      />
                      <button
                        onClick={() => addNote(d.id)}
                        disabled={addingNote[d.id]}
                        style={{ padding: '6px 12px', borderRadius: 6, background: '#4e73df', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: addingNote[d.id] ? 0.6 : 1 }}
                      >
                        {addingNote[d.id] ? '…' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </>
  );
}

// ── SECTION: Payouts ──────────────────────────────────────────────
function PayoutsSection() {
  const [payouts,  setPayouts] = useState([]);
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState('pending');
  const [saving,   setSaving]  = useState(null);
  const [stats,    setStats]   = useState({ pending:0, approved:0, paid:0, total:0 });

  const load = useCallback(() => {
    setLoading(true);
    let q = supabase.from('payouts').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    q.then(({ data }) => { setPayouts(data || []); setLoading(false); });
    supabase.from('payouts').select('status, amount').then(({ data }) => {
      const all = data || [];
      setStats({
        pending:  all.filter(p=>p.status==='pending').length,
        approved: all.filter(p=>p.status==='approved').length,
        paid:     all.filter(p=>p.status==='paid').length,
        total:    all.filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0),
      });
    });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setSaving(id);
    const updates = { status, processed_at: new Date().toISOString() };
    if (status === 'paid') {
      const ref = window.prompt('Enter the M-Pesa / bank transfer reference for this payout:', '');
      if (ref === null) { setSaving(null); return; }
      updates.mpesa_ref = ref.trim() || null;
    }
    const { error } = await supabase.from('payouts').update(updates).eq('id', id);
    if (error) { alert(`Failed to update payout: ${error.message}`); setSaving(null); return; }
    auditLog(`payout_${status}`, `payout_id=${id}${updates.mpesa_ref ? ` ref=${updates.mpesa_ref}` : ''}`);
    setSaving(null); load();
  };

  const BORDER = { pending:'border-left-warning', approved:'border-left-info', paid:'border-left-success', rejected:'border-left-danger' };

  return (
    <>
      <PageHeader title="Payout Requests" sub="Worker withdrawal requests via M-Pesa" />
      <div className="row mb-4">
        <div className="col-md-3 mb-3"><StatCard icon="⏳" label="Pending"    value={stats.pending}  color="#f6c23e" /></div>
        <div className="col-md-3 mb-3"><StatCard icon="✅" label="Approved"   value={stats.approved} color="#36b9cc" /></div>
        <div className="col-md-3 mb-3"><StatCard icon="💚" label="Paid Out"   value={stats.paid}     color="#1cc88a" /></div>
        <div className="col-md-3 mb-3"><StatCard icon="💰" label="Total Paid" value={`KSh ${(stats.total||0).toLocaleString()}`} color="#C9A020" /></div>
      </div>

      <div className="mb-3">
        {[{k:'pending',label:'⏳ Pending'},{k:'approved',label:'✅ Approved'},{k:'paid',label:'💚 Paid'},{k:'rejected',label:'❌ Rejected'},{k:'all',label:'All'}]
          .map(f => <FilterPill key={f.k} active={filter===f.k} onClick={() => setFilter(f.k)}>{f.label}</FilterPill>)}
      </div>

      {loading ? <Spinner /> : payouts.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>💸</div><p className="text-gray-500 mt-2">No {filter !== 'all' ? filter : ''} payout requests</p></div>
      ) : payouts.map(p => (
        <div key={p.id} className={`admin-card mb-3 ${BORDER[p.status] || 'border-left-warning'}`}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="h5 font-weight-bold text-gray-800 mb-1">KSh {(p.amount||0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Requested {new Date(p.created_at).toLocaleString('en-KE',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <SBBadge status={p.status} />
            </div>

            <div className="row mb-3">
              {[['Worker ID',p.worker_id?.slice(0,8)+'...'],['M-Pesa Phone',p.phone||p.phone_number||'—'],['Method',p.method||'M-Pesa'],['Processed',p.processed_at?new Date(p.processed_at).toLocaleDateString('en-KE'):'—']]
                .map(([l,v]) => (
                <div key={l} className="col-md-3 col-6 mb-2">
                  <div className="p-2 rounded" style={{ background:'#f8f9fc', border:'1px solid #e3e6f0' }}>
                    <div className="text-xs text-gray-500 text-uppercase" style={{ letterSpacing:'0.05rem', fontSize:'0.65rem' }}>{l}</div>
                    <div className="text-xs font-weight-bold text-gray-800 mt-1">{v}</div>
                  </div>
                </div>
              ))}
            </div>

            {p.status === 'pending' && (
              <div>
                <button disabled={saving===p.id} onClick={() => updateStatus(p.id,'approved')} className="btn btn-info btn-sm mr-2 font-weight-bold">
                  {saving===p.id ? '...' : '✅ Approve'}
                </button>
                <button disabled={saving===p.id} onClick={() => updateStatus(p.id,'rejected')} className="btn btn-danger btn-sm font-weight-bold">
                  {saving===p.id ? '...' : '❌ Reject'}
                </button>
              </div>
            )}
            {p.status === 'approved' && (
              <button disabled={saving===p.id} onClick={() => updateStatus(p.id,'paid')} className="btn btn-success btn-sm font-weight-bold">
                {saving===p.id ? 'Processing...' : '💚 Mark as Paid (M-Pesa Sent)'}
              </button>
            )}
            {p.status === 'rejected' && (
              <button onClick={() => updateStatus(p.id,'pending')} className="btn btn-warning btn-sm font-weight-bold">↩️ Move Back to Pending</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── SECTION: Announcements ────────────────────────────────────────
const BLANK = { title:'', body:'', type:'info', target:'all', is_pinned:false, publish_at:'', expires_at:'' };

function AnnouncementsSection() {
  const { user } = useAuth();
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null); // null | { ...fields } editing
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const load  = () => { setLoading(true); listAllAnnouncements().then(d => { setList(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) { alert('Title and message are required.'); return; }
    setSaving(true);
    try {
      const payload = {
        title:      form.title.trim(),
        body:       form.body.trim(),
        type:       form.type,
        target:     form.target,
        is_pinned:  form.is_pinned,
        publish_at: form.publish_at  || new Date().toISOString(),
        expires_at: form.expires_at  || null,
        created_by: user?.id,
      };
      if (form.id) {
        await updateAnnouncement(form.id, payload);
        flash('Announcement updated ✓');
      } else {
        await createAnnouncement(payload);
        flash('Announcement published ✓');
      }
      setForm(null); load();
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await deleteAnnouncement(id);
    flash('Deleted'); load();
  };

  const emailBroadcast = async (item) => {
    if (!window.confirm(`Send this announcement by email to: "${TARGET_LABELS[item.target] || item.target}"?\n\nThis will email every matching user.`)) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/broadcast-announcement', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ announcementId: item.id, title: item.title, body: item.body, type: item.type, target: item.target }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      flash(`📧 Email sent to ${data.sent} user${data.sent !== 1 ? 's' : ''}${data.failed ? ` (${data.failed} failed)` : ''} ✓`);
    } catch(e) { alert('Broadcast failed: ' + e.message); }
    setSaving(false);
  };

  const togglePin = async (item) => {
    await updateAnnouncement(item.id, { is_pinned: !item.is_pinned });
    load();
  };

  const now = new Date().toISOString();
  const isLive    = (a) => a.publish_at <= now && (!a.expires_at || a.expires_at > now);
  const isExpired = (a) => a.expires_at && a.expires_at <= now;
  const isScheduled = (a) => a.publish_at > now;

  return (
    <>
      <PageHeader title="Announcements" sub="Broadcast messages to customers and partners" />

      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="mb-4 d-flex justify-content-end">
        <button className="btn btn-warning font-weight-bold"
          style={{ background:'#C9A020', border:'none', color:'#0A0E1A' }}
          onClick={() => setForm({ ...BLANK })}>
          + New Announcement
        </button>
      </div>

      {/* ── Form ── */}
      {form && (
        <div className="admin-card mb-4" style={{ borderLeft:'4px solid #C9A020' }}>
          <div className="card-body">
            <h6 className="font-weight-bold text-gray-700 mb-3">{form.id ? 'Edit Announcement' : 'New Announcement'}</h6>
            <div className="row">
              <div className="col-12 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Title *</label>
                <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Short, clear headline" />
              </div>
              <div className="col-12 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Message *</label>
                <textarea className="form-control" rows={3} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Full announcement text…" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Type</label>
                <select className="form-control" value={form.type} onChange={e => set('type', e.target.value)}>
                  {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Audience</label>
                <select className="form-control" value={form.target} onChange={e => set('target', e.target.value)}>
                  {Object.entries(TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3 d-flex align-items-end">
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="pin-check" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)} />
                  <label className="form-check-label text-sm font-weight-bold" htmlFor="pin-check">📌 Pin to top</label>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Publish Date (leave blank = now)</label>
                <input type="datetime-local" className="form-control" value={form.publish_at ? form.publish_at.slice(0,16) : ''} onChange={e => set('publish_at', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="text-xs font-weight-bold text-gray-600 text-uppercase" style={{ letterSpacing:'0.05rem' }}>Expiry Date (leave blank = never)</label>
                <input type="datetime-local" className="form-control" value={form.expires_at ? form.expires_at.slice(0,16) : ''} onChange={e => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : '')} />
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-warning font-weight-bold" style={{ background:'#C9A020', border:'none', color:'#0A0E1A' }}
                  disabled={saving} onClick={save}>{saving ? 'Saving…' : form.id ? 'Update' : '📢 Publish'}</button>
                <button className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancel</button>
              </div>
            </div>

            {/* Live preview */}
            <div className="mt-4">
              <div className="text-xs font-weight-bold text-gray-500 text-uppercase mb-2" style={{ letterSpacing:'0.05rem' }}>Preview</div>
              <AnnouncementCard item={{ ...form, publish_at: form.publish_at || now }} preview />
            </div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? <Spinner /> : list.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize:48 }}>📢</div>
          <p className="text-gray-500 mt-2">No announcements yet. Create your first one.</p>
        </div>
      ) : (
        <div>
          {list.map(item => {
            const live      = isLive(item);
            const expired   = isExpired(item);
            const scheduled = isScheduled(item);
            return (
              <div key={item.id} className="admin-card mb-3" style={{ borderLeft: `4px solid ${TYPE_META[item.type]?.color || '#4A90D9'}`, opacity: expired ? 0.6 : 1 }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ flex:1 }}>
                      <div className="d-flex align-items-center gap-2 mb-1" style={{ gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:18 }}>{TYPE_META[item.type]?.icon}</span>
                        <span className="font-weight-bold text-gray-800" style={{ fontSize:15 }}>{item.title}</span>
                        {item.is_pinned && <span className="sb-badge sb-badge-warning">📌 Pinned</span>}
                        {live      && <span className="sb-badge sb-badge-success">🟢 Live</span>}
                        {scheduled && <span className="sb-badge sb-badge-info">🕐 Scheduled</span>}
                        {expired   && <span className="sb-badge sb-badge-secondary">⏹ Expired</span>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2" style={{ maxWidth:600 }}>{item.body}</p>
                      <div className="d-flex gap-3 text-xs text-gray-500" style={{ gap:12, flexWrap:'wrap' }}>
                        <span>🎯 {TARGET_LABELS[item.target] || item.target}</span>
                        <span>📅 {new Date(item.publish_at).toLocaleString('en-KE', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        {item.expires_at && <span>⏰ Expires {new Date(item.expires_at).toLocaleString('en-KE', { day:'numeric', month:'short', year:'numeric' })}</span>}
                      </div>
                    </div>
                    <div className="d-flex gap-2 ml-3" style={{ gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => togglePin(item)} title={item.is_pinned ? 'Unpin' : 'Pin to top'}>
                        {item.is_pinned ? '📌' : '📍'}
                      </button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => emailBroadcast(item)} disabled={saving} title="Send email to target audience">
                        📧 Email
                      </button>
                      <button className="btn btn-sm btn-outline-success" disabled={saving} title="SMS broadcast — coming soon" onClick={() => alert('📱 SMS broadcast\n\nThis will send an SMS to all matching users via Africa\'s Talking or Twilio.\n\nIntegration coming soon — wire AFRICASTALKING_KEY in your .env to enable.')}>
                        📱 SMS
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" disabled={saving} title="Push notification — coming soon" onClick={() => alert('🔔 Push Notifications\n\nThis will send a push notification via FCM to all users with the Fixera app installed.\n\nIntegration coming soon — wire FIREBASE_SERVER_KEY in your .env to enable.')}>
                        🔔 Push
                      </button>
                      <button className="btn btn-sm btn-outline-warning" onClick={() => setForm({ ...item })}>✏️ Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => del(item.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function AnnouncementCard({ item, preview }) {
  const meta = TYPE_META[item?.type] || TYPE_META.info;
  if (!item?.title) return null;
  return (
    <div style={{ background: meta.bg, border: `1px solid ${meta.color}40`, borderLeft: `4px solid ${meta.color}`, borderRadius: 10, padding: '12px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
      <span style={{ fontSize:22, flexShrink:0 }}>{meta.icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:800, color: meta.color, fontSize:14, marginBottom:2 }}>
          {item.is_pinned && '📌 '}{item.title}
        </div>
        <div style={{ fontSize:13, color:'#4a5568', lineHeight:1.5 }}>{item.body}</div>
        {!preview && <div style={{ fontSize:11, color:'#718096', marginTop:6 }}>{TARGET_LABELS[item.target] || item.target}</div>}
      </div>
    </div>
  );
}

// ── SECTION: Quotations ───────────────────────────────────────────
function QuotationsSection() {
  const [tab,          setTab]          = useState('inspections');
  const [inspections,  setInspections]  = useState([]);
  const [quotations,   setQuotations]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ins }, { data: quot }] = await Promise.all([
      supabase.from('inspections').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('quotations').select('*, inspections(service_type, address)').order('created_at', { ascending: false }).limit(100),
    ]);
    setInspections(ins || []);
    setQuotations(quot || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const INS_STATUSES  = ['all', 'under_review', 'quotation_ready', 'approved', 'declined'];
  const QUOT_STATUSES = ['all', 'pending_approval', 'approved', 'declined', 'expired'];

  const filteredIns  = inspections.filter(i  => statusFilter === 'all' || i.status  === statusFilter);
  const filteredQuot = quotations.filter(q  => statusFilter === 'all' || q.status  === statusFilter);

  const statuses = tab === 'inspections' ? INS_STATUSES : QUOT_STATUSES;
  const total    = tab === 'inspections' ? inspections.length : quotations.length;
  const pending  = tab === 'inspections'
    ? inspections.filter(i => i.status === 'under_review').length
    : quotations.filter(q => q.status === 'pending_approval').length;

  return (
    <>
      <PageHeader title="Quotations" sub="Inspection requests and quote pipeline" />
      <div className="row mb-3">
        <div className="col-md-3 mb-2"><StatCard icon="🔍" label="Total Inspections"  value={inspections.length}                                            color="#4e73df"/></div>
        <div className="col-md-3 mb-2"><StatCard icon="⏳" label="Awaiting Review"    value={inspections.filter(i=>i.status==='under_review').length}       color="#f6c23e"/></div>
        <div className="col-md-3 mb-2"><StatCard icon="📄" label="Total Quotations"   value={quotations.length}                                             color="#C9A020"/></div>
        <div className="col-md-3 mb-2"><StatCard icon="⏰" label="Pending Approval"   value={quotations.filter(q=>q.status==='pending_approval').length}    color="#e74a3b"/></div>
      </div>

      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap" style={{gap:8}}>
        <div>
          {['inspections','quotations'].map(t => (
            <FilterPill key={t} active={tab===t} onClick={()=>{setTab(t);setStatusFilter('all');}}>
              {t==='inspections'?'🔍 Inspections':'📄 Quotations'}
            </FilterPill>
          ))}
        </div>
        <div>
          {statuses.map(s => (
            <FilterPill key={s} active={statusFilter===s} onClick={()=>setStatusFilter(s)}>
              {s==='all'?'All':s.replace(/_/g,' ')}
            </FilterPill>
          ))}
        </div>
      </div>

      {loading ? <Spinner/> : tab === 'inspections' ? (
        filteredIns.length === 0
          ? <div className="text-center py-5"><div style={{fontSize:48}}>🔍</div><p className="text-gray-500 mt-2">No inspections found.</p></div>
          : (
            <table className="admin-table">
              <thead><tr><th>Service</th><th>Address</th><th>Status</th><th>Photos</th><th>Date</th></tr></thead>
              <tbody>
                {filteredIns.map(i => (
                  <tr key={i.id}>
                    <td className="text-xs font-weight-bold">{i.service_type || '—'}</td>
                    <td className="text-xs text-gray-600" style={{maxWidth:200}}>{i.address || '—'}</td>
                    <td><SBBadge status={i.status}/></td>
                    <td className="text-xs">{(i.photo_urls||[]).length > 0
                      ? <div className="d-flex gap-1" style={{gap:4}}>
                          {(i.photo_urls||[]).slice(0,3).map((url,idx)=>(
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" style={{width:32,height:32,objectFit:'cover',borderRadius:4,border:'1px solid #e3e6f0'}}/>
                            </a>
                          ))}
                          {(i.photo_urls||[]).length > 3 && <span className="text-gray-500">+{(i.photo_urls||[]).length-3}</span>}
                        </div>
                      : <span className="text-gray-400">None</span>}
                    </td>
                    <td className="text-xs text-gray-500">{new Date(i.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      ) : (
        filteredQuot.length === 0
          ? <div className="text-center py-5"><div style={{fontSize:48}}>📄</div><p className="text-gray-500 mt-2">No quotations found.</p></div>
          : (
            <table className="admin-table">
              <thead><tr><th>Service</th><th>Amount</th><th>Status</th><th>Expires</th><th>Date</th></tr></thead>
              <tbody>
                {filteredQuot.map(q => (
                  <tr key={q.id}>
                    <td className="text-xs font-weight-bold">{q.inspections?.service_type || q.service_type || '—'}</td>
                    <td className="text-xs font-weight-bold" style={{color:'#C9A020'}}>
                      {q.amount ? `KSh ${Number(q.amount).toLocaleString()}` : q.price_range || '—'}
                    </td>
                    <td><SBBadge status={q.status}/></td>
                    <td className="text-xs text-gray-500">
                      {q.expires_at
                        ? (new Date(q.expires_at) < new Date()
                          ? <span className="text-danger">Expired</span>
                          : new Date(q.expires_at).toLocaleDateString('en-KE'))
                        : '—'}
                    </td>
                    <td className="text-xs text-gray-500">{new Date(q.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      )}
    </>
  );
}

// ── SECTION: Unified Orders ───────────────────────────────────────
function OrdersSection() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [type,     setType]     = useState('all');
  const [statusF,  setStatusF]  = useState('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const TYPE_ICON  = { booking:'🔧', moving:'🚚', supplier:'📦' };
  const TYPE_COLOR = { booking:'#C9A020', moving:'#9F7AEA', supplier:'#fd7e14' };
  const STATUS_NEXT = {
    pending:     { next:'confirmed',   label:'✅ Confirm' },
    confirmed:   { next:'in_progress', label:'▶ Start' },
    in_progress: { next:'completed',   label:'✅ Complete' },
    completed:   { label:null },
    cancelled:   { label:null },
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: bookings }, { data: moving }, { data: supplier }] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at',{ascending:false}).limit(100),
      supabase.from('moving_requests').select('*').order('created_at',{ascending:false}).limit(60),
      supabase.from('supplier_orders').select('*').order('created_at',{ascending:false}).limit(60),
    ]);
    const all = [
      ...(bookings ||[]).map(b => ({ ...b, _type:'booking',  _label:b.sub_service||b.service||'Booking', _amount:b.amount })),
      ...(moving   ||[]).map(m => ({ ...m, _type:'moving',   _label:`Move: ${m.pickup_address||'—'}`,    _amount:m.amount })),
      ...(supplier ||[]).map(s => ({ ...s, _type:'supplier', _label:`Supplies (${(s.items||[]).length} items)`, _amount:s.total })),
    ].sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    setOrders(all);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const advanceStatus = async (order) => {
    const info = STATUS_NEXT[order.status];
    if (!info?.next) return;
    setUpdating(true);
    const table = order._type === 'booking' ? 'bookings' : order._type === 'moving' ? 'moving_requests' : 'supplier_orders';
    const { error } = await supabase.from(table).update({ status: info.next, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) { alert(`Failed: ${error.message}`); setUpdating(false); return; }
    auditLog('order_status_advanced', `${order._type}=${order.id} ${order.status}→${info.next}`);
    setUpdating(false);
    setSelected(prev => prev ? { ...prev, status: info.next } : null);
    load();
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel this ${order._type}? This cannot be undone.`)) return;
    setUpdating(true);
    const table = order._type === 'booking' ? 'bookings' : order._type === 'moving' ? 'moving_requests' : 'supplier_orders';
    const { error } = await supabase.from(table).update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) { alert(`Failed: ${error.message}`); setUpdating(false); return; }
    auditLog('order_cancelled', `${order._type}=${order.id} label="${order._label}"`);
    setUpdating(false);
    setSelected(prev => prev ? { ...prev, status: 'cancelled' } : null);
    load();
  };

  const filtered = orders.filter(o =>
    (type    === 'all' || o._type  === type) &&
    (statusF === 'all' || o.status === statusF) &&
    (!search  || o._label?.toLowerCase().includes(search.toLowerCase()) ||
      (o.address||o.pickup_address||'').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Orders" sub="Unified view — bookings, moves, supplier orders — with status actions" />

      {/* KPI row */}
      <div className="row mb-3">
        {[
          { icon:'📋', label:'Total',     val:orders.length,                                      color:'#4e73df' },
          { icon:'🔧', label:'Bookings',  val:orders.filter(o=>o._type==='booking').length,        color:'#C9A020' },
          { icon:'🚚', label:'Moves',     val:orders.filter(o=>o._type==='moving').length,         color:'#9F7AEA' },
          { icon:'📦', label:'Supplies',  val:orders.filter(o=>o._type==='supplier').length,       color:'#fd7e14' },
          { icon:'⏳', label:'Pending',   val:orders.filter(o=>o.status==='pending').length,       color:'#F6AD55' },
          { icon:'✅', label:'Completed', val:orders.filter(o=>o.status==='completed').length,     color:'#1cc88a' },
        ].map(s => (
          <div key={s.label} className="col-md-2 col-sm-4 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:16 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap mb-3" style={{ gap:8 }}>
        <input className="form-control form-control-sm" placeholder="🔍 Search service or address…"
          value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize:12, maxWidth:240 }} />
        <div className="d-flex flex-wrap" style={{ gap:4 }}>
          {['all','booking','moving','supplier'].map(t =>
            <FilterPill key={t} active={type===t} onClick={()=>setType(t)}>
              {t==='all'?'All Types':`${TYPE_ICON[t]||''} ${t.charAt(0).toUpperCase()+t.slice(1)}s`}
            </FilterPill>)}
        </div>
        <div className="d-flex flex-wrap" style={{ gap:4 }}>
          {['all','pending','confirmed','in_progress','completed','cancelled'].map(s =>
            <FilterPill key={s} active={statusF===s} onClick={()=>setStatusF(s)}>
              {s==='all'?'All Status':s.replace(/_/g,' ')}
            </FilterPill>)}
        </div>
        <span className="text-xs text-gray-500 align-self-center ml-auto">{filtered.length} of {orders.length}</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="row">
          {/* Order list */}
          <div className={selected ? 'col-md-7' : 'col-12'}>
            <div className="admin-card">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>Type</th><th>Description</th><th>Address</th><th>Worker</th><th>Status</th><th>Amount</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={7} className="text-center text-gray-500 py-4">No orders match</td></tr>
                      : filtered.map(o => (
                        <tr key={o.id+o._type}
                          onClick={() => setSelected(selected?.id===o.id && selected?._type===o._type ? null : o)}
                          style={{ cursor:'pointer', background: selected?.id===o.id && selected?._type===o._type ? '#f0f4ff' : undefined }}>
                          <td>
                            <span style={{ background:TYPE_COLOR[o._type]+'22', color:TYPE_COLOR[o._type], fontWeight:800,
                              fontSize:11, padding:'2px 8px', borderRadius:999 }}>
                              {TYPE_ICON[o._type]} {o._type}
                            </span>
                          </td>
                          <td className="font-weight-bold text-xs text-gray-800">{o._label}</td>
                          <td className="text-xs text-gray-500" style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {o.address || o.pickup_address || '—'}
                          </td>
                          <td className="text-xs text-gray-600">{o.worker_name || '—'}</td>
                          <td><SBBadge status={o.status}/></td>
                          <td className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>
                            {o._amount ? `KSh ${Number(o._amount).toLocaleString()}` : '—'}
                          </td>
                          <td className="text-xs text-gray-500">
                            {new Date(o.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short'})}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="col-md-5">
              <div className="admin-card" style={{ position:'sticky', top:0 }}>
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <span>{TYPE_ICON[selected._type]} Order Detail</span>
                  <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa' }}>×</button>
                </div>
                <div className="card-body">
                  {/* Header */}
                  <div className="mb-3">
                    <div style={{ fontWeight:900, fontSize:15, color:'#2d3748', marginBottom:4 }}>{selected._label}</div>
                    <div className="d-flex align-items-center gap-2" style={{ gap:8 }}>
                      <span style={{ background:TYPE_COLOR[selected._type]+'22', color:TYPE_COLOR[selected._type], fontWeight:800, fontSize:11, padding:'2px 8px', borderRadius:999 }}>
                        {TYPE_ICON[selected._type]} {selected._type}
                      </span>
                      <SBBadge status={selected.status} />
                    </div>
                  </div>

                  {/* Fields */}
                  {[
                    ['📍 Address',     selected.address || selected.pickup_address || '—'],
                    selected._type==='moving' && ['🏁 Destination', selected.destination_address || '—'],
                    ['📅 Date',        selected.booking_date || new Date(selected.created_at).toLocaleDateString('en-KE')],
                    selected.booking_time && ['⏰ Time',        selected.booking_time],
                    ['👤 Worker',      selected.worker_name || '—'],
                    ['💰 Amount',      selected._amount ? `KSh ${Number(selected._amount).toLocaleString()}` : '—'],
                    selected.notes && ['📝 Notes',       selected.notes],
                    selected.cancellation_reason && ['❌ Cancel Reason', selected.cancellation_reason],
                    ['🆔 ID',          selected.id?.slice(0,8).toUpperCase()],
                    ['📅 Created',     new Date(selected.created_at).toLocaleString('en-KE')],
                  ].filter(Boolean).map(([label, val]) => (
                    <div key={label} className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-weight-bold text-gray-800" style={{ maxWidth:'55%', textAlign:'right' }}>{val}</span>
                    </div>
                  ))}

                  {/* Supplier items */}
                  {selected._type==='supplier' && selected.items?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-weight-bold text-gray-600 mb-1">📦 Items</div>
                      {selected.items.map((item, i) => (
                        <div key={i} className="text-xs text-gray-700 py-1 border-bottom d-flex justify-content-between">
                          <span>{item.name || item.product_name || `Item ${i+1}`}</span>
                          <span className="font-weight-bold">×{item.qty||item.quantity||1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 d-flex flex-column" style={{ gap:8 }}>
                    {STATUS_NEXT[selected.status]?.next && (
                      <button className="btn btn-success btn-sm" style={{ fontWeight:700 }}
                        disabled={updating} onClick={() => advanceStatus(selected)}>
                        {updating ? '…' : STATUS_NEXT[selected.status].label}
                      </button>
                    )}
                    {!['completed','cancelled'].includes(selected.status) && (
                      <button className="btn btn-outline-danger btn-sm" style={{ fontWeight:700 }}
                        disabled={updating} onClick={() => cancelOrder(selected)}>
                        {updating ? '…' : '❌ Cancel Order'}
                      </button>
                    )}
                    {selected.status === 'completed' && (
                      <div className="text-center text-xs py-2" style={{ color:'#1cc88a', fontWeight:700 }}>✅ Order completed</div>
                    )}
                    {selected.status === 'cancelled' && (
                      <div className="text-center text-xs py-2" style={{ color:'#e74a3b', fontWeight:700 }}>❌ Order cancelled</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── SECTION: Dedicated Partner Type ──────────────────────────────
function PartnerTypeSection({ role, label, icon, color }) {
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('workers').select('*').eq('partner_role', role).order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('verification_status', filter);
    q.then(({data}) => { setPartners(data||[]); setLoading(false); });
  }, [role, filter]);

  return (
    <>
      <PageHeader title={`${icon} ${label}`} sub={`All ${label} registered on Fixera`} />
      <div className="mb-3">
        {['all','pending','approved','rejected','suspended'].map(f=>(
          <FilterPill key={f} active={filter===f} onClick={()=>setFilter(f)}>{f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}</FilterPill>
        ))}
      </div>
      {loading ? <Spinner/> : partners.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>{icon}</div><p className="text-gray-500 mt-2">No {label} yet.</p></div>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Business</th><th>Status</th><th>Wallet</th><th>Joined</th></tr></thead>
          <tbody>
            {partners.map(p=>(
              <tr key={p.id}>
                <td className="text-xs font-weight-bold">{p.full_name||'—'}</td>
                <td className="text-xs text-gray-600">{p.business_name||p.company_name||'—'}</td>
                <td><SBBadge status={p.verification_status||'pending'}/></td>
                <td className="text-xs">KSh {(p.wallet_balance||0).toLocaleString()}</td>
                <td className="text-xs text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-KE') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── SECTION: Notifications History ───────────────────────────────
function NotificationsSection() {
  const [tab,          setTab]          = useState('broadcasts');
  const [broadcasts,   setBroadcasts]   = useState([]);
  const [readStats,    setReadStats]    = useState({});
  const [tickets,      setTickets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [ticketF,      setTicketF]      = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ann }, { data: reads }, { data: tix }] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('announcement_reads').select('announcement_id'),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(150),
    ]);
    setBroadcasts(ann || []);
    // build read count map
    const counts = {};
    (reads || []).forEach(r => { counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1; });
    setReadStats(counts);
    setTickets(tix || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const TYPE_COLOR = { info:'#4A90D9', warning:'#F6AD55', alert:'#FC8181', promo:'#48BB78', update:'#9F7AEA' };
  const TYPE_ICON  = { info:'ℹ️', warning:'⚠️', alert:'🚨', promo:'🎁', update:'🔄' };
  const TARGET_LABEL = { all:'Everyone', customers:'Customers only', partners:'Partners only', riders:'Riders only', vendors:'Vendors only' };
  const PRIORITY_COLOR = { urgent:'#e74a3b', high:'#F6AD55', normal:'#4e73df' };

  const openTickets  = tickets.filter(t => t.status === 'open').length;
  const urgentTickets= tickets.filter(t => t.priority === 'urgent').length;
  const totalReads   = Object.values(readStats).reduce((a,b) => a+b, 0);

  const filteredTickets = ticketF === 'all' ? tickets : tickets.filter(t => t.status === ticketF);

  const TABS = [
    { id:'broadcasts', label:`📢 Broadcasts (${broadcasts.length})` },
    { id:'tickets',    label:`🎫 Support Tickets (${tickets.length})` },
  ];

  return (
    <>
      <PageHeader title="Notifications & Comms" sub="Broadcast reach stats and all support ticket communications" />

      {/* KPI row */}
      <div className="row mb-3">
        {[
          { icon:'📢', label:'Broadcasts Sent', val:broadcasts.length,  color:'#4A90D9' },
          { icon:'👁️', label:'Total Reads',     val:totalReads,         color:'#48BB78' },
          { icon:'🎫', label:'Open Tickets',    val:openTickets,         color:'#F6AD55' },
          { icon:'🚨', label:'Urgent Tickets',  val:urgentTickets,       color: urgentTickets > 0 ? '#e74a3b' : '#6c757d' },
        ].map(s => (
          <div key={s.label} className="col-md-3 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Realtime status bar */}
      <div className="admin-card mb-3" style={{ borderLeft:'4px solid #1cc88a' }}>
        <div className="card-body py-2 d-flex align-items-center" style={{ gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#1cc88a', display:'inline-block', flexShrink:0 }} />
          <span className="text-xs font-weight-bold text-gray-700">Realtime Active</span>
          <span className="text-xs text-gray-500">— Bookings · Announcements · Support Tickets broadcasting via Supabase Realtime</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="d-flex mb-3" style={{ gap:6, borderBottom:'2px solid #e3e6f0', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight:700, color:tab===t.id?'#C9A020':'#6c757d',
              borderBottom:tab===t.id?'3px solid #C9A020':'3px solid transparent', marginBottom:-2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── Broadcasts tab ── */}
          {tab === 'broadcasts' && (
            broadcasts.length === 0
              ? <div className="text-center py-5"><div style={{fontSize:48}}>📢</div><p className="text-gray-500 mt-2">No broadcasts sent yet</p></div>
              : broadcasts.map(b => {
                const reads = readStats[b.id] || 0;
                const color = TYPE_COLOR[b.type] || '#aaa';
                return (
                  <div key={b.id} className="admin-card mb-3"
                    style={{ borderLeft:`4px solid ${color}` }}>
                    <div className="card-body py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ flex:1 }}>
                          <div className="d-flex align-items-center mb-1" style={{ gap:8 }}>
                            <span style={{ fontSize:16 }}>{TYPE_ICON[b.type] || 'ℹ️'}</span>
                            <span className="font-weight-bold text-gray-800" style={{ fontSize:14 }}>{b.title}</span>
                            {b.is_pinned && <span style={{ fontSize:10, fontWeight:800, background:'#ffe4b5', color:'#b7791f', padding:'2px 6px', borderRadius:4 }}>📌 Pinned</span>}
                          </div>
                          <p className="text-xs text-gray-600 mb-2" style={{ lineHeight:1.6 }}>{b.body}</p>
                          <div className="d-flex flex-wrap" style={{ gap:8 }}>
                            <span style={{ fontSize:10, fontWeight:700, background:`${color}18`, color, padding:'2px 8px', borderRadius:999 }}>
                              {b.type?.toUpperCase()}
                            </span>
                            <span style={{ fontSize:10, fontWeight:700, background:'#f0f0f0', color:'#6c757d', padding:'2px 8px', borderRadius:999 }}>
                              👥 {TARGET_LABEL[b.target] || b.target || 'All'}
                            </span>
                            <span style={{ fontSize:10, fontWeight:700, background:'rgba(72,187,120,0.1)', color:'#48BB78', padding:'2px 8px', borderRadius:999 }}>
                              👁️ {reads} read{reads!==1?'s':''}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 ml-3" style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                          {new Date(b.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
          )}

          {/* ── Support Tickets tab ── */}
          {tab === 'tickets' && (
            <>
              <div className="mb-3 d-flex flex-wrap" style={{ gap:4 }}>
                {['all','open','in_review','in_progress','resolved'].map(f => (
                  <FilterPill key={f} active={ticketF===f} onClick={() => setTicketF(f)}>
                    {f === 'all' ? 'All' : f.replace(/_/g,' ')}
                  </FilterPill>
                ))}
              </div>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Priority</th><th>Subject</th><th>From</th><th>Department</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0
                        ? <tr><td colSpan={6} className="text-center text-gray-500 py-4">No tickets</td></tr>
                        : filteredTickets.map(t => (
                          <tr key={t.id}>
                            <td>
                              <span style={{ fontSize:10, fontWeight:800,
                                background:`${PRIORITY_COLOR[t.priority]||'#aaa'}18`,
                                color:PRIORITY_COLOR[t.priority]||'#aaa',
                                border:`1px solid ${PRIORITY_COLOR[t.priority]||'#aaa'}40`,
                                borderRadius:999, padding:'2px 8px' }}>
                                {t.priority==='urgent'?'🚨':t.priority==='high'?'🔶':'🔵'} {(t.priority||'normal').toUpperCase()}
                              </span>
                            </td>
                            <td className="font-weight-bold text-xs text-gray-800">{t.subject || t.category || 'Support ticket'}</td>
                            <td>
                              <span style={{ fontSize:10, fontWeight:700, background:'#e3e6f0', color:'#495057', padding:'2px 8px', borderRadius:999 }}>
                                {t.user_type || 'customer'}
                              </span>
                            </td>
                            <td className="text-xs text-gray-600">{t.department || '—'}</td>
                            <td><SBBadge status={t.status || 'open'} /></td>
                            <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short'})}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Rider Operations ─────────────────────────────────────
function RiderOpsSection() {
  const [tab,        setTab]        = useState('dispatch');
  const [legs,       setLegs]       = useState([]);
  const [riders,     setRiders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [statusF,    setStatusF]    = useState('all');
  const [selected,   setSelected]   = useState(null);   // leg selected for assignment
  const [riderSearch,setRiderSearch]= useState('');
  const [assigning,  setAssigning]  = useState(null);
  const [queueRider, setQueueRider] = useState(null);   // rider selected in Rider Queue tab

  const LEG_STATUS = {
    pending:           { label:'⏳ Pending',         color:'#6c757d' },
    rider_assigned:    { label:'🚗 Assigned',        color:'#63B3ED' },
    picked_up:         { label:'📦 Picked Up',       color:'#F6AD55' },
    at_station:        { label:'🏪 At Station',      color:'#C9A020' },
    out_for_delivery:  { label:'🚀 Out Delivering',  color:'#9F7AEA' },
    delivered:         { label:'✅ Delivered',        color:'#48BB78' },
    cancelled:         { label:'❌ Cancelled',        color:'#FC8181' },
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      supabase.from('delivery_tracking')
        .select('*, bookings(sub_service, address, booking_date), rider:rider_id(id, full_name, phone, vehicle_type, status)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('workers')
        .select('id, full_name, phone, vehicle_type, status, wallet_balance, can_receive_jobs, total_jobs, verification_status, created_at')
        .eq('partner_role', 'rider')
        .order('created_at', { ascending: false }),
    ]).then(([{ data: l }, { data: r }]) => {
      setLegs(l || []);
      setRiders(r || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // realtime refresh
  useEffect(() => {
    const ch = supabase.channel('rider-ops-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_tracking' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  const assignRider = async (legId, riderId, riderName, riderBlocked) => {
    if (riderBlocked) {
      alert(`Cannot assign ${riderName} — their wallet balance is below the KSh 500 minimum. They need to top up first.`);
      return;
    }
    setAssigning(legId);
    const { error } = await supabase.from('delivery_tracking').update({
      rider_id: riderId,
      status:   'rider_assigned',
    }).eq('id', legId);
    if (error) { alert(`Assignment failed: ${error.message}`); setAssigning(null); return; }
    auditLog('rider_assigned', `leg=${legId} rider=${riderName}`);
    setAssigning(null);
    setSelected(null);
    load();
  };

  const unassignRider = async (legId) => {
    const { error } = await supabase.from('delivery_tracking').update({ rider_id: null, status: 'pending' }).eq('id', legId);
    if (error) { alert(`Failed to unassign: ${error.message}`); return; }
    auditLog('rider_unassigned', `leg=${legId}`);
    load();
  };

  const unassigned  = legs.filter(l => !l.rider_id && l.status === 'pending');
  const activeLeg   = legs.filter(l => !['delivered','cancelled'].includes(l.status)).length;
  const filtered    = statusF === 'all' ? legs : legs.filter(l => l.status === statusF);
  const filteredRiders = riders.filter(r =>
    r.verification_status === 'approved' &&
    (!riderSearch || r.full_name?.toLowerCase().includes(riderSearch.toLowerCase()) || r.phone?.includes(riderSearch))
  );

  const LegStatusBadge = ({ status }) => {
    const meta = LEG_STATUS[status] || { label: status, color: '#aaa' };
    return (
      <span style={{ background:`${meta.color}18`, color:meta.color, border:`1px solid ${meta.color}40`,
        borderRadius:999, padding:'2px 10px', fontSize:11, fontWeight:800, whiteSpace:'nowrap' }}>
        {meta.label}
      </span>
    );
  };

  const TABS = [
    { id:'dispatch',   label:`📡 Dispatch`,       badge: unassigned.length,  badgeColor:'#e74a3b' },
    { id:'legs',       label:`📦 All Legs`,        badge: legs.length,        badgeColor:'#4e73df' },
    { id:'queue',      label:`👤 Rider Queue`,     badge: null },
    { id:'riders',     label:`👥 Riders`,          badge: riders.length,      badgeColor:'#48BB78' },
  ];

  return (
    <>
      <PageHeader title="🚗 Rider Dispatch & Ops" sub="Assign riders to delivery legs, monitor queues and track live status" />

      {/* KPI bar */}
      <div className="row mb-3">
        {[
          { icon:'📡', label:'Unassigned',  val:unassigned.length,                                           color:'#e74a3b' },
          { icon:'🔧', label:'Active Legs', val:activeLeg,                                                   color:'#F6AD55' },
          { icon:'✅', label:'Delivered',   val:legs.filter(l=>l.status==='delivered').length,               color:'#48BB78' },
          { icon:'🚗', label:'Riders',      val:riders.filter(r=>r.verification_status==='approved').length, color:'#63B3ED' },
        ].map(s => (
          <div key={s.label} className="col-md-3 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="d-flex mb-3 flex-wrap" style={{ gap:6, borderBottom:'2px solid #e3e6f0', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
            style={{ background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight:700, color:tab===t.id?'#C9A020':'#6c757d',
              borderBottom:tab===t.id?'3px solid #C9A020':'3px solid transparent', marginBottom:-2,
              display:'flex', alignItems:'center', gap:6 }}>
            {t.label}
            {t.badge != null && (
              <span style={{ background:t.badgeColor+'20', color:t.badgeColor, border:`1px solid ${t.badgeColor}40`,
                fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:999 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── TAB: Dispatch ── */}
          {tab === 'dispatch' && (
            <div className="row">
              <div className="col-md-5">
                <div className="font-weight-bold text-xs text-gray-600 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                  Unassigned Delivery Legs ({unassigned.length})
                </div>
                {unassigned.length === 0
                  ? <div className="admin-card p-4 text-center text-gray-500 text-xs">✅ All legs are assigned!</div>
                  : unassigned.map(leg => {
                    const ageHrs = Math.round((new Date() - new Date(leg.created_at)) / 3600000);
                    return (
                      <div key={leg.id} className="admin-card mb-2"
                        onClick={() => setSelected(selected?.id === leg.id ? null : leg)}
                        style={{ borderLeft:`4px solid ${selected?.id===leg.id?'#C9A020':ageHrs>2?'#e74a3b':'#e3e6f0'}`,
                          cursor:'pointer', background:selected?.id===leg.id?'#fffbea':'#fff' }}>
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="font-weight-bold text-gray-800 text-xs">
                              {leg.leg_type==='return'?'🔄 Return':'📦 Pickup'} · {leg.bookings?.sub_service||'Delivery'}
                            </div>
                            {ageHrs > 2 && (
                              <span style={{ fontSize:9, fontWeight:800, background:'#ffe4e4', color:'#e74a3b', padding:'2px 6px', borderRadius:4 }}>
                                ⏰ {ageHrs}h old
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">📍 {leg.pickup_address||leg.bookings?.address||'—'}</div>
                          <div className="text-xs text-gray-500">🏁 {leg.dropoff_address||'—'}</div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>
                              KSh {(leg.amount||0).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {ageHrs < 1 ? 'Just now' : `${ageHrs}h ago`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              <div className="col-md-7">
                {selected ? (
                  <div className="admin-card" style={{ position:'sticky', top:0 }}>
                    <div className="admin-card-header d-flex justify-content-between align-items-center">
                      <span>🚗 Assign Rider — {selected.bookings?.sub_service||'Delivery'}</span>
                      <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa' }}>×</button>
                    </div>
                    <div className="card-body">
                      <div className="mb-3 p-3" style={{ background:'#f8f9fc', borderRadius:8, fontSize:12 }}>
                        <div><strong>{selected.leg_type==='return'?'🔄 Return leg':'📦 Pickup leg'}</strong></div>
                        <div className="mt-1"><strong>📍 From:</strong> {selected.pickup_address||selected.bookings?.address||'—'}</div>
                        <div><strong>🏁 To:</strong> {selected.dropoff_address||'—'}</div>
                        <div><strong>💰 Amount:</strong> KSh {(selected.amount||0).toLocaleString()}</div>
                      </div>
                      <input className="form-control form-control-sm mb-3"
                        placeholder="Search rider by name or phone…"
                        value={riderSearch} onChange={e => setRiderSearch(e.target.value)}
                        style={{ fontSize:12 }} />
                      <div style={{ maxHeight:360, overflowY:'auto' }}>
                        {filteredRiders.length === 0
                          ? <div className="text-xs text-gray-500 py-3">No approved riders found.</div>
                          : filteredRiders.map(r => {
                            const activeLegCount = legs.filter(l => l.rider_id === r.id && !['delivered','cancelled'].includes(l.status)).length;
                            return (
                              <div key={r.id} className="d-flex align-items-center py-2 border-bottom">
                                <div className="flex-grow-1" style={{ minWidth:0 }}>
                                  <div className="font-weight-bold text-xs text-gray-800">{r.full_name}</div>
                                  <div className="text-xs text-gray-500">
                                    🚲 {r.vehicle_type||'—'} · 📱 {r.phone||'—'}
                                  </div>
                                  <div className="text-xs" style={{ color: activeLegCount > 0 ? '#F6AD55' : '#48BB78' }}>
                                    {activeLegCount > 0 ? `${activeLegCount} active leg${activeLegCount>1?'s':''}` : '✅ Free'}
                                  </div>
                                </div>
                                <span className="text-xs mr-2 font-weight-bold" style={{ color: r.status==='online'?'#1cc88a':'#aaa', whiteSpace:'nowrap' }}>
                                  {r.status==='online'?'🟢 Online':'⚫ Offline'}
                                </span>
                                {r.can_receive_jobs === false && (
                                  <span className="badge badge-danger text-xs mr-1" title={`Wallet KSh ${r.wallet_balance||0} — at or below KSh 500 minimum, jobs blocked`}>🔒 Blocked</span>
                                )}
                                <button className="btn btn-sm btn-warning" style={{ fontSize:11, fontWeight:800, color:'#0A0E1A', whiteSpace:'nowrap', opacity: r.can_receive_jobs === false ? 0.45 : 1 }}
                                  disabled={assigning === selected.id}
                                  onClick={() => assignRider(selected.id, r.id, r.full_name, r.can_receive_jobs === false)}>
                                  {assigning === selected.id ? '…' : 'Assign'}
                                </button>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="admin-card" style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#a0aec0' }}>
                    <div className="text-center"><div style={{ fontSize:40, marginBottom:8 }}>👈</div><div>Select a leg to assign a rider</div></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: All Legs ── */}
          {tab === 'legs' && (
            <>
              <div className="mb-3">
                {['all','pending','rider_assigned','picked_up','at_station','out_for_delivery','delivered','cancelled'].map(s => (
                  <FilterPill key={s} active={statusF===s} onClick={() => setStatusF(s)}>
                    {s==='all' ? 'All' : (LEG_STATUS[s]?.label || s)}
                  </FilterPill>
                ))}
              </div>
              {filtered.length === 0
                ? <div className="text-center py-5"><div style={{fontSize:48}}>📭</div><p className="text-gray-500 mt-2">No legs found</p></div>
                : (
                  <div className="admin-card">
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr><th>Service</th><th>Type</th><th>Rider</th><th>Pickup</th><th>Dropoff</th><th>Amount</th><th>Status</th><th>Action</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {filtered.map(leg => (
                            <tr key={leg.id}>
                              <td className="font-weight-bold text-xs">{leg.bookings?.sub_service||'Delivery'}</td>
                              <td className="text-xs">{leg.leg_type==='return'?'🔄 Return':'📦 Pickup'}</td>
                              <td className="text-xs">{leg.rider?.full_name || <span className="text-gray-400">Unassigned</span>}</td>
                              <td className="text-xs text-gray-600" style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{leg.pickup_address||leg.bookings?.address||'—'}</td>
                              <td className="text-xs text-gray-600" style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{leg.dropoff_address||'—'}</td>
                              <td className="text-xs font-weight-bold" style={{color:'#C9A020'}}>KSh {(leg.amount||0).toLocaleString()}</td>
                              <td><LegStatusBadge status={leg.status} /></td>
                              <td>
                                {leg.rider_id && !['delivered','cancelled'].includes(leg.status) && (
                                  <button className="btn btn-xs btn-outline-danger" style={{ fontSize:10, fontWeight:700, padding:'2px 8px' }}
                                    onClick={() => unassignRider(leg.id)}>
                                    Unassign
                                  </button>
                                )}
                                {!leg.rider_id && leg.status === 'pending' && (
                                  <button className="btn btn-xs btn-outline-warning" style={{ fontSize:10, fontWeight:700, padding:'2px 8px' }}
                                    onClick={() => { setTab('dispatch'); setSelected(leg); }}>
                                    Assign
                                  </button>
                                )}
                              </td>
                              <td className="text-xs text-gray-500">{leg.created_at ? new Date(leg.created_at).toLocaleDateString('en-KE') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              }
            </>
          )}

          {/* ── TAB: Rider Queue ── */}
          {tab === 'queue' && (
            <div className="row">
              <div className="col-md-4">
                <div className="font-weight-bold text-xs text-gray-600 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                  Select a Rider
                </div>
                {riders.filter(r => r.verification_status === 'approved').map(r => {
                  const riderLegs   = legs.filter(l => l.rider_id === r.id);
                  const activeCount = riderLegs.filter(l => !['delivered','cancelled'].includes(l.status)).length;
                  return (
                    <div key={r.id} className="admin-card mb-2"
                      onClick={() => setQueueRider(queueRider?.id === r.id ? null : r)}
                      style={{ cursor:'pointer', borderLeft:`4px solid ${queueRider?.id===r.id?'#C9A020':'#e3e6f0'}`,
                        background: queueRider?.id===r.id?'#fffbea':'#fff' }}>
                      <div className="card-body py-2">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <div className="font-weight-bold text-xs text-gray-800">{r.full_name}</div>
                            <div className="text-xs text-gray-500">🚲 {r.vehicle_type||'—'} · 📱 {r.phone||'—'}</div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontSize:11, fontWeight:800, color: r.status==='online'?'#1cc88a':'#aaa' }}>
                              {r.status==='online'?'🟢 Online':'⚫ Offline'}
                            </div>
                            <div style={{ fontSize:11, fontWeight:700, color: activeCount>0?'#F6AD55':'#6c757d' }}>
                              {activeCount} active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {riders.filter(r=>r.verification_status==='approved').length === 0 &&
                  <div className="text-xs text-gray-500">No approved riders yet.</div>}
              </div>

              <div className="col-md-8">
                {!queueRider ? (
                  <div className="admin-card" style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#a0aec0' }}>
                    <div className="text-center"><div style={{ fontSize:40, marginBottom:8 }}>👈</div><div>Select a rider to view their queue</div></div>
                  </div>
                ) : (() => {
                  const riderLegs   = legs.filter(l => l.rider_id === queueRider.id);
                  const activeLegs  = riderLegs.filter(l => !['delivered','cancelled'].includes(l.status));
                  const doneLegs    = riderLegs.filter(l => ['delivered','cancelled'].includes(l.status));
                  return (
                    <div>
                      {/* Rider summary card */}
                      <div className="admin-card mb-3">
                        <div className="card-body py-3">
                          <div className="d-flex align-items-center gap-3 mb-3">
                            <div style={{ width:48, height:48, borderRadius:24, background:'rgba(201,160,32,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🚗</div>
                            <div>
                              <div className="font-weight-bold text-gray-800">{queueRider.full_name}</div>
                              <div className="text-xs text-gray-500">🚲 {queueRider.vehicle_type||'—'} · 📱 {queueRider.phone||'—'}</div>
                              <span style={{ fontSize:11, fontWeight:800, color: queueRider.status==='online'?'#1cc88a':'#aaa' }}>
                                {queueRider.status==='online'?'🟢 Online':'⚫ Offline'}
                              </span>
                            </div>
                            <div className="ml-auto d-flex" style={{ gap:12 }}>
                              {[
                                { label:'Active', val:activeLegs.length, color:'#F6AD55' },
                                { label:'Done',   val:doneLegs.length,   color:'#48BB78' },
                                { label:'Total',  val:riderLegs.length,  color:'#4e73df' },
                              ].map(s => (
                                <div key={s.label} className="text-center">
                                  <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
                                  <div style={{ fontSize:10, color:'#6c757d', fontWeight:700 }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active legs */}
                      {activeLegs.length > 0 && (
                        <>
                          <div className="font-weight-bold text-xs text-gray-600 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                            Active Legs ({activeLegs.length})
                          </div>
                          {activeLegs.map(leg => (
                            <div key={leg.id} className="admin-card mb-2">
                              <div className="card-body py-2">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="font-weight-bold text-xs text-gray-800">
                                    {leg.leg_type==='return'?'🔄 Return':'📦 Pickup'} · {leg.bookings?.sub_service||'Delivery'}
                                  </div>
                                  <LegStatusBadge status={leg.status} />
                                </div>
                                <div className="text-xs text-gray-500">📍 {leg.pickup_address||leg.bookings?.address||'—'}</div>
                                <div className="text-xs text-gray-500">🏁 {leg.dropoff_address||'—'}</div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                  <span className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>KSh {(leg.amount||0).toLocaleString()}</span>
                                  <button className="btn btn-xs btn-outline-danger" style={{ fontSize:10, fontWeight:700, padding:'2px 8px' }}
                                    onClick={() => unassignRider(leg.id)}>
                                    Unassign
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Past legs */}
                      {doneLegs.length > 0 && (
                        <>
                          <div className="font-weight-bold text-xs text-gray-600 mt-3 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                            Completed / Cancelled ({doneLegs.length})
                          </div>
                          <div className="admin-card">
                            <div className="table-responsive">
                              <table className="admin-table">
                                <thead><tr><th>Service</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                  {doneLegs.map(leg => (
                                    <tr key={leg.id}>
                                      <td className="text-xs font-weight-bold">{leg.bookings?.sub_service||'Delivery'}</td>
                                      <td className="text-xs">{leg.leg_type==='return'?'🔄 Return':'📦 Pickup'}</td>
                                      <td className="text-xs" style={{color:'#C9A020',fontWeight:700}}>KSh {(leg.amount||0).toLocaleString()}</td>
                                      <td><LegStatusBadge status={leg.status} /></td>
                                      <td className="text-xs text-gray-500">{new Date(leg.created_at).toLocaleDateString('en-KE')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}

                      {riderLegs.length === 0 &&
                        <div className="admin-card p-4 text-center text-gray-500 text-xs">No delivery legs assigned to this rider yet.</div>}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ── TAB: Riders ── */}
          {tab === 'riders' && (
            <div className="admin-card">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Vehicle</th><th>Status</th><th>Active Legs</th><th>Wallet</th><th>Verification</th><th>Joined</th></tr></thead>
                  <tbody>
                    {riders.map(r => {
                      const active = legs.filter(l => l.rider_id === r.id && !['delivered','cancelled'].includes(l.status)).length;
                      return (
                        <tr key={r.id}>
                          <td className="font-weight-bold">{r.full_name||'—'}</td>
                          <td className="text-xs text-gray-600">🚲 {r.vehicle_type||'—'}</td>
                          <td className="text-xs font-weight-bold" style={{ color: r.status==='online'?'#1cc88a':'#aaa' }}>
                            {r.status==='online'?'🟢 Online':'⚫ Offline'}
                          </td>
                          <td className="text-xs font-weight-bold" style={{ color: active>0?'#F6AD55':'#6c757d' }}>
                            {active > 0 ? `${active} active` : '—'}
                          </td>
                          <td className="text-xs">KSh {(r.wallet_balance||0).toLocaleString()}</td>
                          <td><SBBadge status={r.verification_status||'pending'} /></td>
                          <td className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-KE') : '—'}</td>
                        </tr>
                      );
                    })}
                    {riders.length === 0 && <tr><td colSpan={7} className="text-xs text-gray-500 text-center py-3">No riders yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Water Carrier Operations ─────────────────────────────
function WaterOpsSection() {
  const [tab,      setTab]      = useState('deliveries');
  const [orders,   setOrders]   = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [statusF,  setStatusF]  = useState('all');

  const ORDER_STATUS = {
    pending:    { label:'⏳ Pending',    color:'#6c757d' },
    confirmed:  { label:'✅ Confirmed',  color:'#63B3ED' },
    departed:   { label:'🚰 Departed',   color:'#F6AD55' },
    arrived:    { label:'🏠 Arrived',    color:'#C9A020' },
    delivered:  { label:'✅ Delivered',  color:'#48BB78' },
    cancelled:  { label:'❌ Cancelled',  color:'#FC8181' },
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('bookings')
        .select('id,created_at,status,address,booking_date,service,amount,carrier_user_id,confirmed_at,departed_at,arrived_at,delivered_at,user_id,driver_snapshot,cancellation_reason')
        .eq('service_id','water-carriers')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('workers').select('*').eq('partner_role','water_carrier').order('created_at', { ascending: false }),
    ]).then(([{ data: o }, { data: c }]) => {
      setOrders(o || []);
      setCarriers(c || []);
      setLoading(false);
    });
  }, []);

  const statusMap = (b) => {
    if (b.delivered_at) return 'delivered';
    if (b.arrived_at)   return 'arrived';
    if (b.departed_at)  return 'departed';
    if (b.confirmed_at) return 'confirmed';
    if (b.status === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const filtered = statusF === 'all' ? orders : orders.filter(o => statusMap(o) === statusF);

  return (
    <>
      <PageHeader title="🚰 Water Carriers" sub="Water carrier profiles and delivery order monitoring" />
      <div className="mb-3 d-flex" style={{ gap:8 }}>
        {[{id:'deliveries',label:`🚰 Water Orders (${orders.length})`},{id:'carriers',label:`👥 Carriers (${carriers.length})`}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn btn-sm ${tab===t.id?'btn-warning':'btn-outline-secondary'}`} style={tab===t.id?{background:'#C9A020',borderColor:'#C9A020',color:'#0A0E1A',fontWeight:800}:{fontWeight:700}}>{t.label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : tab === 'carriers' ? (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Business</th><th>Status</th><th>Wallet</th><th>Joined</th></tr></thead>
              <tbody>
                {carriers.map(c => (
                  <tr key={c.id}>
                    <td className="font-weight-bold">{c.full_name||'—'}</td>
                    <td className="text-xs text-gray-600">{c.business_name||c.company_name||'—'}</td>
                    <td><SBBadge status={c.verification_status||'pending'} /></td>
                    <td className="text-xs">KSh {(c.wallet_balance||0).toLocaleString()}</td>
                    <td className="text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-KE') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="row mb-3">
            {[
              {label:'Total Orders', val:orders.length, color:'#4A90D9'},
              {label:'Pending',      val:orders.filter(o=>statusMap(o)==='pending').length, color:'#6c757d'},
              {label:'In Transit',   val:orders.filter(o=>['confirmed','departed','arrived'].includes(statusMap(o))).length, color:'#F6AD55'},
              {label:'Delivered',    val:orders.filter(o=>statusMap(o)==='delivered').length, color:'#48BB78'},
            ].map(s => (
              <div key={s.label} className="col-md-3 mb-2">
                <div className="admin-card"><div className="card-body py-3 text-center">
                  <div className="text-xs font-weight-bold text-gray-500 text-uppercase mb-1">{s.label}</div>
                  <div style={{fontSize:26,fontWeight:900,color:s.color}}>{s.val}</div>
                </div></div>
              </div>
            ))}
          </div>

          <div className="mb-3">
            {['all','pending','confirmed','departed','arrived','delivered','cancelled'].map(s => (
              <FilterPill key={s} active={statusF===s} onClick={()=>setStatusF(s)}>
                {s==='all' ? 'All' : (ORDER_STATUS[s]?.label || s)}
              </FilterPill>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-5"><div style={{fontSize:48}}>🚰</div><p className="text-gray-500 mt-2">No water delivery orders found</p></div>
          ) : (
            <div className="admin-card">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>Date</th><th>Address</th><th>Carrier</th><th>Amount</th><th>Status</th><th>Delivered</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(o => {
                      const st = statusMap(o);
                      const meta = ORDER_STATUS[st] || {};
                      const carrier = o.driver_snapshot;
                      return (
                        <tr key={o.id}>
                          <td className="text-xs text-gray-600">{o.booking_date || new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                          <td className="text-xs" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.address||'—'}</td>
                          <td className="text-xs">{carrier?.name || (o.carrier_user_id ? 'Assigned' : <span className="text-gray-400">Unassigned</span>)}</td>
                          <td className="text-xs font-weight-bold" style={{color:'#C9A020'}}>KSh {(o.amount||0).toLocaleString()}</td>
                          <td><span style={{background:`${meta.color}18`,color:meta.color,border:`1px solid ${meta.color}40`,borderRadius:999,padding:'2px 10px',fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>{meta.label||st}</span></td>
                          <td className="text-xs text-gray-500">{o.delivered_at ? new Date(o.delivered_at).toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Security & Audit ─────────────────────────────────────
function SecuritySection() {
  const [tab,     setTab]     = useState('audit');
  const [rows,    setRows]    = useState([]);
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionF, setActionF] = useState('all');
  const [actorF,  setActorF]  = useState('all');
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: log }, { data: profiles }] = await Promise.all([
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('id,full_name,email,is_admin,created_at').eq('is_admin', true),
    ]);
    setRows(log || []);
    setAdmins(profiles || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const actionTypes = [...new Set(rows.map(r => r.action).filter(Boolean))].sort();
  const actors      = [...new Set(rows.map(r => r.actor_name).filter(Boolean))].sort();

  const filtered = rows.filter(r =>
    (actionF === 'all' || r.action === actionF) &&
    (actorF  === 'all' || r.actor_name === actorF) &&
    (!search  || (r.detail||'').toLowerCase().includes(search.toLowerCase()) ||
      (r.action||'').toLowerCase().includes(search.toLowerCase()))
  );

  const today      = new Date().toISOString().slice(0,10);
  const todayCount = rows.filter(r => r.created_at?.slice(0,10) === today).length;

  const ACTION_COLOR = {
    login:'#48BB78', logout:'#6c757d', grant_admin:'#e74a3b', revoke_admin:'#e74a3b',
    update_settings:'#F6AD55', approve_partner:'#48BB78', reject_partner:'#FC8181',
    approve_payout:'#1cc88a', reject_payout:'#e74a3b', moderate_review:'#9F7AEA',
  };

  return (
    <>
      <PageHeader title="Security & Audit" sub="Admin team, access control and full audit trail" />

      {/* KPI row */}
      <div className="row mb-3">
        {[
          { icon:'👥', label:'Admin Users',    val:admins.length,  color:'#4e73df' },
          { icon:'🗒️', label:'Audit Events',   val:rows.length,    color:'#C9A020' },
          { icon:'📅', label:'Events Today',   val:todayCount,     color: todayCount > 20 ? '#e74a3b' : '#1cc88a' },
          { icon:'🛡️', label:'RLS Status',     val:'Active',       color:'#1cc88a' },
        ].map(s => (
          <div key={s.label} className="col-md-3 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="d-flex mb-3" style={{ gap:6, borderBottom:'2px solid #e3e6f0', paddingBottom:0 }}>
        {[
          { id:'audit',  label:`🗒️ Audit Log (${rows.length})` },
          { id:'admins', label:`👥 Admin Team (${admins.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight:700, color:tab===t.id?'#C9A020':'#6c757d',
              borderBottom:tab===t.id?'3px solid #C9A020':'3px solid transparent', marginBottom:-2 }}>
            {t.label}
          </button>
        ))}
        <a href="#settings" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('fixera-nav', { detail:'settings' })); }}
          style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#C9A020', alignSelf:'center', cursor:'pointer', textDecoration:'none' }}>
          ⚙️ Manage 2FA & Admins →
        </a>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── Audit Log ── */}
          {tab === 'audit' && (
            <>
              <div className="d-flex flex-wrap mb-3" style={{ gap:8 }}>
                <input className="form-control form-control-sm" placeholder="🔍 Search action or detail…"
                  value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize:12, maxWidth:220 }} />
                <select className="form-control form-control-sm" value={actionF} onChange={e => setActionF(e.target.value)} style={{ fontSize:12, width:'auto' }}>
                  <option value="all">All Actions</option>
                  {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="form-control form-control-sm" value={actorF} onChange={e => setActorF(e.target.value)} style={{ fontSize:12, width:'auto' }}>
                  <option value="all">All Admins</option>
                  {actors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {(search||actionF!=='all'||actorF!=='all') &&
                  <button className="btn btn-sm btn-outline-secondary" style={{ fontSize:11 }}
                    onClick={() => { setSearch(''); setActionF('all'); setActorF('all'); }}>✕ Clear</button>}
                <span className="text-xs text-gray-500 align-self-center ml-auto">{filtered.length} of {rows.length}</span>
              </div>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Detail</th></tr></thead>
                    <tbody>
                      {filtered.length === 0
                        ? <tr><td colSpan={4} className="text-center text-gray-500 py-4">No audit events match</td></tr>
                        : filtered.map(r => {
                          const color = ACTION_COLOR[r.action] || '#6c757d';
                          return (
                            <tr key={r.id}>
                              <td className="text-xs text-gray-500" style={{ whiteSpace:'nowrap' }}>
                                {new Date(r.created_at).toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                              </td>
                              <td className="text-xs font-weight-bold text-gray-800">{r.actor_name || '—'}</td>
                              <td>
                                <span style={{ fontSize:10, fontWeight:800, background:`${color}18`, color,
                                  border:`1px solid ${color}40`, borderRadius:999, padding:'2px 8px', whiteSpace:'nowrap' }}>
                                  {r.action || '—'}
                                </span>
                              </td>
                              <td className="text-xs text-gray-600" style={{ maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {r.detail || '—'}
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Admin Team ── */}
          {tab === 'admins' && (
            <>
              <div className="mb-3 p-3" style={{ background:'rgba(201,160,32,0.08)', border:'1px solid rgba(201,160,32,0.2)', borderRadius:10, fontSize:12, color:'#b7791f' }}>
                ⚙️ To grant or revoke admin access and manage 2FA, go to <strong>Settings → Admin Team</strong> and <strong>Settings → Security & 2FA</strong>.
              </div>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Actions Today</th><th>Total Actions</th><th>Admin Since</th></tr></thead>
                    <tbody>
                      {admins.length === 0
                        ? <tr><td colSpan={5} className="text-center text-gray-500 py-4">No admin profiles found</td></tr>
                        : admins.map(a => {
                          const myRows     = rows.filter(r => r.actor_id === a.id || r.actor_name === a.full_name);
                          const myToday    = myRows.filter(r => r.created_at?.slice(0,10) === today).length;
                          return (
                            <tr key={a.id}>
                              <td className="font-weight-bold text-xs text-gray-800">
                                {a.full_name || '—'}
                                <span style={{ marginLeft:6, fontSize:9, fontWeight:800, background:'rgba(231,74,59,0.1)', color:'#e74a3b', padding:'1px 6px', borderRadius:999 }}>ADMIN</span>
                              </td>
                              <td className="text-xs text-gray-600">{a.email || '—'}</td>
                              <td className="text-xs font-weight-bold" style={{ color: myToday > 0 ? '#C9A020' : '#6c757d' }}>{myToday}</td>
                              <td className="text-xs font-weight-bold" style={{ color:'#4e73df' }}>{myRows.length}</td>
                              <td className="text-xs text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleDateString('en-KE') : '—'}</td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Reviews & Ratings ────────────────────────────────────
function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [saving,  setSaving]  = useState(null);

  const load = () => { setLoading(true); listAllReviews({ status: filter }).then(d => { setReviews(d); setLoading(false); }); };
  useEffect(() => { load(); }, [filter]);

  const act = async (id, status, note) => {
    setSaving(id);
    await moderateReview(id, status, note);
    setSaving(null); load();
  };

  const STARS = (n) => '⭐'.repeat(n) + '☆'.repeat(5-n);

  return (
    <>
      <PageHeader title="Reviews & Ratings" sub="Moderate customer reviews across all partner types" />
      <div className="mb-3">
        {['all','published','flagged','removed'].map(f=>(
          <FilterPill key={f} active={filter===f} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</FilterPill>
        ))}
      </div>
      {loading ? <Spinner/> : reviews.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>⭐</div><p className="text-gray-500 mt-2">No reviews yet.</p></div>
      ) : reviews.map(r => (
        <div key={r.id} className="admin-card mb-3" style={{borderLeft:`4px solid ${r.status==='flagged'?'#f6c23e':r.status==='removed'?'#e74a3b':'#1cc88a'}`}}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div style={{flex:1}}>
                <div className="d-flex align-items-center gap-2 mb-1" style={{gap:10}}>
                  <span style={{fontSize:18}}>{STARS(r.rating)}</span>
                  <span className="sb-badge" style={{background:ROLE_COLOR[r.reviewee_type]||'#888',color:'#fff'}}>{ROLE_ICON[r.reviewee_type]} {r.reviewee_type}</span>
                  <SBBadge status={r.status}/>
                </div>
                <p className="text-sm text-gray-700 mb-1" style={{maxWidth:500}}>{r.comment||<em className="text-gray-400">No comment</em>}</p>
                <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})}</div>
                {r.admin_note && <div className="text-xs text-warning mt-1">Admin note: {r.admin_note}</div>}
              </div>
              <div className="d-flex gap-2" style={{gap:6,flexShrink:0}}>
                {r.status !== 'published' && <button className="btn btn-sm btn-outline-success" disabled={saving===r.id} onClick={()=>act(r.id,'published',null)}>✓ Publish</button>}
                {r.status !== 'flagged'   && <button className="btn btn-sm btn-outline-warning" disabled={saving===r.id} onClick={()=>act(r.id,'flagged',null)}>🚩 Flag</button>}
                {r.status !== 'removed'   && <button className="btn btn-sm btn-outline-danger"  disabled={saving===r.id} onClick={()=>{const n=prompt('Reason for removal:');if(n!==null)act(r.id,'removed',n);}}>🗑️ Remove</button>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── SECTION: Marketing / Promo Codes ────────────────────────────
const BLANK_PROMO = { code:'', description:'', discount_type:'percent', discount_value:'', min_order:'', max_discount:'', max_uses:'', valid_from:'', valid_until:'', target_service:'', is_active:true };

function MarketingSection() {
  const { user } = useAuth();
  const [codes,   setCodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');
  const [uses,    setUses]    = useState({});

  const flash = (m) => { setToast(m); setTimeout(()=>setToast(''),2500); };
  const load  = () => { setLoading(true); listPromoCodes().then(d=>{setCodes(d);setLoading(false);}); };
  useEffect(()=>{ load(); },[]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.code||!form.discount_value) { alert('Code and discount value are required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, discount_value: Number(form.discount_value), min_order: Number(form.min_order)||0, max_uses: form.max_uses?Number(form.max_uses):null, max_discount: form.max_discount?Number(form.max_discount):null, valid_from: form.valid_from||new Date().toISOString(), valid_until: form.valid_until||null, created_by: user?.id };
      if (form.id) { const {id,...p}=payload; await updatePromoCode(form.id,p); flash('Updated ✓'); }
      else { await createPromoCode(payload); flash('Promo code created ✓'); }
      setForm(null); load();
    } catch(e){ alert(e.message); }
    setSaving(false);
  };

  const loadUses = async (id) => {
    if (uses[id]) return;
    const data = await getPromoUses(id);
    setUses(u=>({...u,[id]:data}));
  };

  const isExpired = (c) => c.valid_until && new Date(c.valid_until) < new Date();
  const isMaxed   = (c) => c.max_uses && c.used_count >= c.max_uses;

  return (
    <>
      <PageHeader title="Marketing" sub="Promo codes and discount campaigns" />
      {toast && <div className="alert alert-success py-2">{toast}</div>}
      <div className="mb-4 d-flex justify-content-end">
        <button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} onClick={()=>setForm({...BLANK_PROMO})}>+ New Promo Code</button>
      </div>

      {form && (
        <div className="admin-card mb-4" style={{borderLeft:'4px solid #C9A020'}}>
          <div className="card-body">
            <h6 className="font-weight-bold mb-3">{form.id?'Edit Promo Code':'New Promo Code'}</h6>
            <div className="row">
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Code *</label><input className="form-control" value={form.code} onChange={e=>set('code',e.target.value.toUpperCase())} placeholder="e.g. SAVE20" /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Discount Type</label><select className="form-control" value={form.discount_type} onChange={e=>set('discount_type',e.target.value)}><option value="percent">Percentage (%)</option><option value="fixed">Fixed (KSh)</option></select></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Discount Value *</label><input type="number" className="form-control" value={form.discount_value} onChange={e=>set('discount_value',e.target.value)} placeholder={form.discount_type==='percent'?'e.g. 20 (%)':'e.g. 200 (KSh)'} /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Min Order (KSh)</label><input type="number" className="form-control" value={form.min_order} onChange={e=>set('min_order',e.target.value)} placeholder="0 = no minimum" /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Max Discount (KSh)</label><input type="number" className="form-control" value={form.max_discount} onChange={e=>set('max_discount',e.target.value)} placeholder="Cap for % discounts" /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Max Uses</label><input type="number" className="form-control" value={form.max_uses} onChange={e=>set('max_uses',e.target.value)} placeholder="Leave blank = unlimited" /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Valid From</label><input type="datetime-local" className="form-control" value={form.valid_from?form.valid_from.slice(0,16):''} onChange={e=>set('valid_from',e.target.value?new Date(e.target.value).toISOString():'')} /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Valid Until</label><input type="datetime-local" className="form-control" value={form.valid_until?form.valid_until.slice(0,16):''} onChange={e=>set('valid_until',e.target.value?new Date(e.target.value).toISOString():'')} /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Target Service</label><input className="form-control" value={form.target_service} onChange={e=>set('target_service',e.target.value)} placeholder="Leave blank = all services" /></div>
              <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase text-gray-600" style={{letterSpacing:'0.05rem'}}>Description</label><input className="form-control" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Internal note" /></div>
              <div className="col-md-4 mb-3 d-flex align-items-end"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="active-check" checked={form.is_active} onChange={e=>set('is_active',e.target.checked)}/><label className="form-check-label text-sm font-weight-bold" htmlFor="active-check">Active</label></div></div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} disabled={saving} onClick={save}>{saving?'Saving…':form.id?'Update':'Create Code'}</button><button className="btn btn-outline-secondary" onClick={()=>setForm(null)}>Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner/> : codes.length === 0 ? (
        <div className="text-center py-5"><div style={{fontSize:48}}>🎯</div><p className="text-gray-500 mt-2">No promo codes yet.</p></div>
      ) : codes.map(c=>(
        <div key={c.id} className="admin-card mb-3" style={{borderLeft:`4px solid ${c.is_active&&!isExpired(c)&&!isMaxed(c)?'#1cc88a':'#aaa'}`}}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div style={{flex:1}}>
                <div className="d-flex align-items-center gap-2 mb-1" style={{gap:8,flexWrap:'wrap'}}>
                  <code style={{fontSize:18,fontWeight:900,color:'#C9A020',background:'#fffbeb',padding:'2px 10px',borderRadius:8,border:'1px solid #f6c23e'}}>{c.code}</code>
                  <span className="sb-badge" style={{background:c.discount_type==='percent'?'#EBF4FF':'#F0FFF4',color:c.discount_type==='percent'?'#4A90D9':'#1cc88a',fontWeight:700}}>{c.discount_type==='percent'?`${c.discount_value}% OFF`:`KSh ${c.discount_value} OFF`}</span>
                  {!c.is_active && <span className="sb-badge sb-badge-secondary">Inactive</span>}
                  {isExpired(c) && <span className="sb-badge sb-badge-danger">Expired</span>}
                  {isMaxed(c) && <span className="sb-badge sb-badge-warning">Maxed Out</span>}
                  {c.is_active && !isExpired(c) && !isMaxed(c) && <span className="sb-badge sb-badge-success">🟢 Active</span>}
                </div>
                <div className="text-xs text-gray-600 mb-1">{c.description||'—'}</div>
                <div className="d-flex gap-3 text-xs text-gray-500" style={{gap:12,flexWrap:'wrap'}}>
                  <span>📊 Used: {c.used_count}{c.max_uses?` / ${c.max_uses}`:' / ∞'}</span>
                  {c.min_order>0 && <span>Min: KSh {c.min_order.toLocaleString()}</span>}
                  {c.target_service && <span>🎯 {c.target_service}</span>}
                  {c.valid_until && <span>⏰ Expires {new Date(c.valid_until).toLocaleDateString('en-KE')}</span>}
                </div>
              </div>
              <div className="d-flex gap-2" style={{gap:6,flexShrink:0}}>
                <button className="btn btn-sm btn-outline-info" onClick={()=>loadUses(c.id)}>📊 Uses</button>
                <button className="btn btn-sm btn-outline-warning" onClick={()=>setForm({...c,valid_from:c.valid_from?.slice(0,16)||'',valid_until:c.valid_until?.slice(0,16)||''})}>✏️</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={async()=>{await updatePromoCode(c.id,{is_active:!c.is_active});load();}}>{c.is_active?'Pause':'Resume'}</button>
                <button className="btn btn-sm btn-outline-danger" onClick={async()=>{if(confirm('Delete?')){await deletePromoCode(c.id);load();}}}>🗑️</button>
              </div>
            </div>
            {uses[c.id] && (
              <div className="mt-3 pt-3" style={{borderTop:'1px solid #e3e6f0'}}>
                <div className="text-xs font-weight-bold text-gray-700 mb-2">Recent Uses ({uses[c.id].length})</div>
                {uses[c.id].length===0 ? <p className="text-xs text-gray-500">No uses yet.</p> : uses[c.id].slice(0,5).map(u=>(
                  <div key={u.id} className="text-xs text-gray-600 mb-1">• KSh {u.discount_applied} saved — {new Date(u.used_at).toLocaleDateString('en-KE')}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── SECTION: Services Catalog ─────────────────────────────────────
function ServicesCatalogSection() {
  const [cats,    setCats]    = useState([]);
  const [svcs,    setSvcs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [selCat,  setSelCat]  = useState(null);
  const [catForm, setCatForm] = useState(null);
  const [svcForm, setSvcForm] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  const flash = (m) => { setToast(m); setTimeout(()=>setToast(''),2500); };

  const loadCats = async () => { const d = await listAllCategories(); setCats(d); setLoading(false); };
  const loadSvcs = async (cid) => { const d = await listAllServices(cid); setSvcs(d); };

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { if(selCat) loadSvcs(selCat); }, [selCat]);

  const saveCat = async () => {
    if (!catForm.name||!catForm.slug) { alert('Name and slug required'); return; }
    setSaving(true);
    try { await saveCategory(catForm); flash('Category saved ✓'); setCatForm(null); loadCats(); }
    catch(e){ alert(e.message); } setSaving(false);
  };

  const saveSvc = async () => {
    if (!svcForm.name||!svcForm.slug||!svcForm.category_id) { alert('Name, slug and category required'); return; }
    setSaving(true);
    try { await saveService(svcForm); flash('Service saved ✓'); setSvcForm(null); loadSvcs(selCat); }
    catch(e){ alert(e.message); } setSaving(false);
  };

  const BLANK_CAT = { name:'', slug:'', icon:'🔧', color:'#C9A020', description:'', sort_order:0, is_active:true };
  const BLANK_SVC = { name:'', slug:'', category_id:selCat||'', description:'', price_min:'', price_max:'', price_label:'', is_quotation:false, duration_est:'', icon:'', sort_order:0, is_active:true, is_featured:false };

  return (
    <>
      <PageHeader title="Services Catalog" sub="Manage service categories and individual services" />
      {toast && <div className="alert alert-success py-2">{toast}</div>}
      <div className="row">
        {/* Categories column */}
        <div className="col-md-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="font-weight-bold text-gray-700 mb-0">Categories</h6>
            <button className="btn btn-sm btn-warning" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} onClick={()=>setCatForm({...BLANK_CAT})}>+ Add</button>
          </div>
          {loading ? <Spinner/> : cats.map(c=>(
            <div key={c.id} onClick={()=>setSelCat(c.id)} className="admin-card mb-2" style={{cursor:'pointer',borderLeft:`4px solid ${selCat===c.id?c.color:'transparent'}`,transition:'border 0.15s'}}>
              <div className="card-body py-2 d-flex justify-content-between align-items-center">
                <div><span style={{fontSize:18}}>{c.icon}</span> <span className="text-sm font-weight-bold">{c.name}</span> {!c.is_active&&<span className="sb-badge sb-badge-secondary ml-1">off</span>}</div>
                <div className="d-flex gap-1" style={{gap:4}} onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-sm btn-outline-warning" onClick={()=>setCatForm(c)}>✏️</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={async()=>{if(confirm('Delete category + all its services?')){await deleteCategory(c.id);loadCats();if(selCat===c.id)setSelCat(null);}}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Services column */}
        <div className="col-md-8">
          {selCat ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="font-weight-bold text-gray-700 mb-0">Services in {cats.find(c=>c.id===selCat)?.name}</h6>
                <button className="btn btn-sm btn-warning" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} onClick={()=>setSvcForm({...BLANK_SVC,category_id:selCat})}>+ Add Service</button>
              </div>
              {svcs.length===0 ? <p className="text-gray-500 text-sm">No services in this category yet.</p> : svcs.map(s=>(
                <div key={s.id} className="admin-card mb-2">
                  <div className="card-body py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-sm font-weight-bold">{s.icon} {s.name} {!s.is_active&&<span className="sb-badge sb-badge-secondary">off</span>} {s.is_featured&&<span className="sb-badge sb-badge-warning">⭐ Featured</span>}</div>
                      <div className="text-xs text-gray-500">{s.is_quotation?'Quote on inspection':s.price_label||`KSh ${s.price_min||'?'}–${s.price_max||'?'}`}</div>
                    </div>
                    <div className="d-flex gap-1" style={{gap:4}}>
                      <button className="btn btn-sm btn-outline-warning" onClick={()=>setSvcForm(s)}>✏️</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={async()=>{if(confirm('Delete?')){await deleteService(s.id);loadSvcs(selCat);}}}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : <div className="text-center py-5 text-gray-500 text-sm">← Select a category to manage its services</div>}
        </div>
      </div>

      {/* Category form modal */}
      {catForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setCatForm(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:480}}>
            <h6 className="font-weight-bold mb-3">{catForm.id?'Edit Category':'New Category'}</h6>
            <div className="row">
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Name</label><input className="form-control" value={catForm.name} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Slug</label><input className="form-control" value={catForm.slug} onChange={e=>setCatForm(f=>({...f,slug:e.target.value}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Icon</label><input className="form-control" value={catForm.icon} onChange={e=>setCatForm(f=>({...f,icon:e.target.value}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Color</label><input type="color" className="form-control" value={catForm.color} onChange={e=>setCatForm(f=>({...f,color:e.target.value}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Sort</label><input type="number" className="form-control" value={catForm.sort_order} onChange={e=>setCatForm(f=>({...f,sort_order:Number(e.target.value)}))}/></div>
              <div className="col-12 mb-3"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Description</label><input className="form-control" value={catForm.description||''} onChange={e=>setCatForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} disabled={saving} onClick={saveCat}>{saving?'…':'Save'}</button><button className="btn btn-outline-secondary" onClick={()=>setCatForm(null)}>Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Service form modal */}
      {svcForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setSvcForm(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:28,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
            <h6 className="font-weight-bold mb-3">{svcForm.id?'Edit Service':'New Service'}</h6>
            <div className="row">
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Name</label><input className="form-control" value={svcForm.name} onChange={e=>setSvcForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Slug</label><input className="form-control" value={svcForm.slug} onChange={e=>setSvcForm(f=>({...f,slug:e.target.value}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Price Min (KSh)</label><input type="number" className="form-control" value={svcForm.price_min||''} onChange={e=>setSvcForm(f=>({...f,price_min:Number(e.target.value)}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Price Max (KSh)</label><input type="number" className="form-control" value={svcForm.price_max||''} onChange={e=>setSvcForm(f=>({...f,price_max:Number(e.target.value)}))}/></div>
              <div className="col-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Icon</label><input className="form-control" value={svcForm.icon||''} onChange={e=>setSvcForm(f=>({...f,icon:e.target.value}))}/></div>
              <div className="col-12 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Price Label (overrides min/max)</label><input className="form-control" value={svcForm.price_label||''} onChange={e=>setSvcForm(f=>({...f,price_label:e.target.value}))} placeholder="e.g. Quote on inspection"/></div>
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Duration</label><input className="form-control" value={svcForm.duration_est||''} onChange={e=>setSvcForm(f=>({...f,duration_est:e.target.value}))} placeholder="e.g. 2–3 hours"/></div>
              <div className="col-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Sort Order</label><input type="number" className="form-control" value={svcForm.sort_order||0} onChange={e=>setSvcForm(f=>({...f,sort_order:Number(e.target.value)}))}/></div>
              <div className="col-12 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Description</label><textarea className="form-control" rows={2} value={svcForm.description||''} onChange={e=>setSvcForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="col-12 mb-3 d-flex gap-3" style={{gap:16}}>
                <div className="form-check"><input className="form-check-input" type="checkbox" id="svc-active" checked={svcForm.is_active} onChange={e=>setSvcForm(f=>({...f,is_active:e.target.checked}))}/><label className="form-check-label text-sm" htmlFor="svc-active">Active</label></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" id="svc-quote" checked={svcForm.is_quotation} onChange={e=>setSvcForm(f=>({...f,is_quotation:e.target.checked}))}/><label className="form-check-label text-sm" htmlFor="svc-quote">Quotation-based</label></div>
                <div className="form-check"><input className="form-check-input" type="checkbox" id="svc-feat" checked={svcForm.is_featured} onChange={e=>setSvcForm(f=>({...f,is_featured:e.target.checked}))}/><label className="form-check-label text-sm" htmlFor="svc-feat">Featured</label></div>
              </div>
              <div className="col-12 d-flex gap-2"><button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} disabled={saving} onClick={saveSvc}>{saving?'…':'Save'}</button><button className="btn btn-outline-secondary" onClick={()=>setSvcForm(null)}>Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Content Management ───────────────────────────────────
function ContentSection() {
  const [tab,     setTab]     = useState('banners');
  const [banners, setBanners] = useState([]);
  const [faqs,    setFaqs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');

  const flash = (m) => { setToast(m); setTimeout(()=>setToast(''),2500); };
  const loadBanners = () => listAllBanners().then(setBanners);
  const loadFAQs    = () => listAllFAQs().then(setFaqs);
  useEffect(()=>{ Promise.all([loadBanners(),loadFAQs()]).finally(()=>setLoading(false)); },[]);

  const BLANK_BANNER = { title:'', subtitle:'', tag:'', bg:'linear-gradient(135deg,#C9A020,#D4B033)', text_color:'#0A0E1A', emoji:'🎉', promo_code:'', link_path:'', sort_order:0, is_active:true };
  const BLANK_FAQ    = { question:'', answer:'', category:'general', audience:'customers', sort_order:0, is_active:true };

  const saveCurrent = async () => {
    setSaving(true);
    try {
      if (tab === 'banners') { await saveBanner(form); flash('Banner saved ✓'); loadBanners(); }
      else { await saveFAQ(form); flash('FAQ saved ✓'); loadFAQs(); }
      setForm(null);
    } catch(e){ alert(e.message); }
    setSaving(false);
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <>
      <PageHeader title="Content Management" sub="Homepage banners and FAQ management" />
      {toast && <div className="alert alert-success py-2">{toast}</div>}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>{['banners','faqs'].map(t=><FilterPill key={t} active={tab===t} onClick={()=>{setTab(t);setForm(null);}}>{t==='banners'?'🖼️ Banners':'❓ FAQs'}</FilterPill>)}</div>
        <button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} onClick={()=>setForm(tab==='banners'?{...BLANK_BANNER}:{...BLANK_FAQ})}>+ Add {tab==='banners'?'Banner':'FAQ'}</button>
      </div>

      {form && (
        <div className="admin-card mb-4" style={{borderLeft:'4px solid #C9A020'}}>
          <div className="card-body">
            <h6 className="font-weight-bold mb-3">{form.id?'Edit':'New'} {tab==='banners'?'Banner':'FAQ'}</h6>
            {tab === 'banners' ? (
              <div className="row">
                <div className="col-md-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Title</label><input className="form-control" value={form.title} onChange={e=>f('title',e.target.value)}/></div>
                <div className="col-md-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Tag (e.g. NEW SERVICE)</label><input className="form-control" value={form.tag||''} onChange={e=>f('tag',e.target.value)}/></div>
                <div className="col-md-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Subtitle</label><input className="form-control" value={form.subtitle||''} onChange={e=>f('subtitle',e.target.value)}/></div>
                <div className="col-md-3 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Emoji</label><input className="form-control" value={form.emoji} onChange={e=>f('emoji',e.target.value)}/></div>
                <div className="col-md-3 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Text Color</label><input type="color" className="form-control" value={form.text_color} onChange={e=>f('text_color',e.target.value)}/></div>
                <div className="col-md-6 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Background (CSS gradient or color)</label><input className="form-control" value={form.bg} onChange={e=>f('bg',e.target.value)}/></div>
                <div className="col-md-3 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Promo Code</label><input className="form-control" value={form.promo_code||''} onChange={e=>f('promo_code',e.target.value)}/></div>
                <div className="col-md-3 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Link Path</label><input className="form-control" value={form.link_path||''} onChange={e=>f('link_path',e.target.value)} placeholder="/movers"/></div>
                <div className="col-md-3 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Sort</label><input type="number" className="form-control" value={form.sort_order} onChange={e=>f('sort_order',Number(e.target.value))}/></div>
                <div className="col-md-3 mb-3 d-flex align-items-end"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" id="b-active" checked={form.is_active} onChange={e=>f('is_active',e.target.checked)}/><label className="form-check-label text-sm" htmlFor="b-active">Active</label></div></div>
              </div>
            ) : (
              <div className="row">
                <div className="col-12 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Question</label><input className="form-control" value={form.question} onChange={e=>f('question',e.target.value)}/></div>
                <div className="col-12 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Answer</label><textarea className="form-control" rows={3} value={form.answer} onChange={e=>f('answer',e.target.value)}/></div>
                <div className="col-md-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Category</label><select className="form-control" value={form.category} onChange={e=>f('category',e.target.value)}>{FAQ_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="col-md-4 mb-2"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Audience</label><select className="form-control" value={form.audience} onChange={e=>f('audience',e.target.value)}><option value="customers">Customers</option><option value="partners">Partners</option><option value="all">All</option></select></div>
                <div className="col-md-4 mb-3"><label className="text-xs font-weight-bold text-uppercase" style={{letterSpacing:'0.05rem'}}>Sort</label><input type="number" className="form-control" value={form.sort_order} onChange={e=>f('sort_order',Number(e.target.value))}/></div>
              </div>
            )}
            <div className="d-flex gap-2"><button className="btn btn-warning font-weight-bold" style={{background:'#C9A020',border:'none',color:'#0A0E1A'}} disabled={saving} onClick={saveCurrent}>{saving?'…':'Save'}</button><button className="btn btn-outline-secondary" onClick={()=>setForm(null)}>Cancel</button></div>
          </div>
        </div>
      )}

      {loading ? <Spinner/> : tab === 'banners' ? (
        banners.map(b=>(
          <div key={b.id} className="admin-card mb-2" style={{borderLeft:'4px solid #C9A020'}}>
            <div className="card-body py-2 d-flex justify-content-between align-items-center">
              <div style={{flex:1}}>
                <div style={{background:b.bg,color:b.text_color,borderRadius:8,padding:'8px 14px',display:'inline-block',maxWidth:'100%'}}>
                  <span style={{fontSize:16}}>{b.emoji}</span> <strong>{b.title}</strong>{b.subtitle&&<span style={{opacity:0.8}}> · {b.subtitle}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">{b.tag&&<span className="sb-badge sb-badge-warning mr-2">{b.tag}</span>}{b.promo_code&&<code className="mr-2">{b.promo_code}</code>}{!b.is_active&&<span className="sb-badge sb-badge-secondary">Inactive</span>}</div>
              </div>
              <div className="d-flex gap-2 ml-2" style={{gap:6,flexShrink:0}}>
                <button className="btn btn-sm btn-outline-warning" onClick={()=>setForm(b)}>✏️</button>
                <button className="btn btn-sm btn-outline-danger" onClick={async()=>{if(confirm('Delete?')){await deleteBanner(b.id);loadBanners();}}}>🗑️</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        faqs.map(q=>(
          <div key={q.id} className="admin-card mb-2" style={{borderLeft:'4px solid #4A90D9'}}>
            <div className="card-body py-2 d-flex justify-content-between align-items-center">
              <div style={{flex:1}}>
                <div className="text-sm font-weight-bold text-gray-800">{q.question}</div>
                <div className="text-xs text-gray-600 mt-1" style={{maxWidth:500}}>{q.answer.slice(0,100)}{q.answer.length>100?'…':''}</div>
                <div className="mt-1"><span className="sb-badge sb-badge-info mr-1">{q.category}</span><span className="sb-badge sb-badge-secondary">{q.audience}</span></div>
              </div>
              <div className="d-flex gap-2 ml-2" style={{gap:6,flexShrink:0}}>
                <button className="btn btn-sm btn-outline-warning" onClick={()=>setForm(q)}>✏️</button>
                <button className="btn btn-sm btn-outline-danger" onClick={async()=>{if(confirm('Delete?')){await deleteFAQ(q.id);loadFAQs();}}}>🗑️</button>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ── SECTION: Wallets & Security Deposits ─────────────────────────
const DEPOSIT_STATUS_META = {
  not_paid:  { label: 'Not Paid',  color: '#e74a3b', bg: '#fde8e8' },
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7' },
  held:      { label: 'Held ✓',    color: '#1cc88a', bg: '#d1fae5' },
  refunded:  { label: 'Refunded',  color: '#4e73df', bg: '#e8eeff' },
  forfeited: { label: 'Forfeited', color: '#6c757d', bg: '#f0f0f0' },
};

function WalletsSection() {
  const { user } = useAuth();
  const [tab,      setTab]      = useState('wallets');   // 'wallets' | 'deposits'
  const [partners, setPartners] = useState([]);
  const [stats,    setStats]    = useState({});
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState({ txns:[], adjs:[], deposits:[] });
  const [adjForm,  setAdjForm]  = useState(null);
  const [depForm,  setDepForm]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState('');
  const [search,   setSearch]   = useState('');
  const [alerts,   setAlerts]   = useState([]);   // real-time wallet alerts for admin

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const dismissAlert = (id) => setAlerts(a => a.filter(x => x.id !== id));

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listPartnerWallets(), getWalletStats()])
      .then(([p, s]) => { setPartners(p); setStats(s); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Real-time wallet monitoring ──────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('admin-wallet-monitor')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'workers',
      }, payload => {
        const w = payload.new;
        if (!['worker', 'rider'].includes(w.partner_role)) return;
        const bal    = w.wallet_balance ?? 0;
        const oldBal = payload.old?.wallet_balance ?? bal;
        if (bal >= oldBal) return;   // balance went up — no alert needed

        let level = null;
        if (bal <= 500)                       level = 'blocked';
        else if (bal <= 1000 && oldBal > 1000) level = 'critical';
        else if (bal <= 2000 && oldBal > 2000) level = 'low';
        if (!level) return;

        const meta = {
          blocked:  { color: '#e74a3b', icon: '🔒', label: 'BLOCKED',   msg: `Wallet at KSh ${bal.toLocaleString()} — jobs blocked` },
          critical: { color: '#f59e0b', icon: '🚨', label: 'CRITICAL',  msg: `Wallet at KSh ${bal.toLocaleString()} — almost at block limit` },
          low:      { color: '#C9A020', icon: '⚠️', label: 'LOW',       msg: `Wallet at KSh ${bal.toLocaleString()} — running low` },
        }[level];

        setAlerts(prev => [{
          id:    `${w.id}-${Date.now()}`,
          partnerId: w.id,
          name:  w.full_name || 'Partner',
          role:  w.partner_role,
          bal,
          level,
          ...meta,
          time:  new Date(),
        }, ...prev.slice(0, 19)]);   // keep last 20 alerts

        // Also refresh the list so balance updates instantly
        load();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  const walletPartners  = partners.filter(p => ['worker','rider'].includes(p.partner_role));
  const depositPartners = partners.filter(p => ['vendor','supplier','mover','water_carrier'].includes(p.partner_role));

  const filterList = (list) => search
    ? list.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))
    : list;

  const selectPartner = async (p) => {
    setSelected(p);
    setAdjForm(null);
    setDepForm(null);
    const isWallet = ['worker','rider'].includes(p.partner_role);
    const [txns, adjs, deposits] = await Promise.all([
      isWallet ? getWalletTransactions(p.id) : Promise.resolve([]),
      isWallet ? getWalletAdjustments(p.id)  : Promise.resolve([]),
      !isWallet ? getDepositTransactions(p.id) : Promise.resolve([]),
    ]);
    setDetail({ txns, adjs, deposits });
  };

  // ── Wallet adjustment ──
  const applyAdj = async () => {
    if (!adjForm.amount || !adjForm.reason) { alert('Amount and reason required'); return; }
    setSaving(true);
    try {
      const newBal = await applyWalletAdjustment(selected.id, user.id, Number(adjForm.amount), adjForm.reason);
      flash(`Wallet updated — new balance: KSh ${newBal.toLocaleString()} ✓`);
      setAdjForm(null);
      load();
      await selectPartner({ ...selected, wallet_balance: newBal });
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  // ── Deposit actions ──
  const applyDeposit = async () => {
    if (!depForm.action) return;
    if (!depForm.amount && depForm.action !== 'forfeit') { alert('Amount required'); return; }
    if (!depForm.reason && depForm.action === 'forfeit') { alert('Reason required for forfeiture'); return; }
    setSaving(true);
    try {
      if (depForm.action === 'received') {
        await recordDepositReceived(selected.id, user.id, { amount: Number(depForm.amount), mpesaRef: depForm.ref, note: depForm.reason });
        flash(`Deposit of KSh ${Number(depForm.amount).toLocaleString()} recorded ✓`);
      } else if (depForm.action === 'refund') {
        await refundDeposit(selected.id, user.id, { amount: Number(depForm.amount), mpesaRef: depForm.ref, note: depForm.reason });
        flash(`Refund of KSh ${Number(depForm.amount).toLocaleString()} recorded ✓`);
      } else if (depForm.action === 'forfeit') {
        if (!window.confirm(`Forfeit the entire deposit for ${selected.full_name}? This cannot be undone.`)) { setSaving(false); return; }
        await forfeitDeposit(selected.id, user.id, depForm.reason);
        flash(`Deposit forfeited for ${selected.full_name}`);
      }
      setDepForm(null);
      load();
      await selectPartner(selected);
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const blocked = stats.blockedPartners || 0;

  return (
    <>
      <PageHeader title="Wallets & Deposits" sub="Monitor partner wallet balances and security deposits" />
      {toast && <div className="alert alert-success py-2 mb-3">{toast}</div>}

      {/* ── Live wallet alerts ── */}
      {alerts.length > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="text-xs font-weight-bold text-gray-700">
              🔔 Live Wallet Alerts <span className="badge badge-danger ml-1">{alerts.length}</span>
            </div>
            <button className="btn btn-xs btn-outline-secondary" style={{fontSize:10}}
              onClick={() => setAlerts([])}>Dismiss all</button>
          </div>
          {alerts.map(a => (
            <div key={a.id} className="d-flex align-items-center justify-content-between mb-1 px-3 py-2"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}44`, borderRadius: 8 }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{fontSize:15}}>{a.icon}</span>
                <div>
                  <span className="text-xs font-weight-bold" style={{color: a.color}}>{a.label}</span>
                  <span className="text-xs text-gray-700 ml-2">{a.name}</span>
                  <span className="text-xs text-gray-500 ml-1">({a.role})</span>
                  <span className="text-xs text-gray-500 ml-2">— {a.msg}</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-xs text-gray-400">{a.time.toLocaleTimeString('en-KE', {hour:'2-digit',minute:'2-digit'})}</span>
                <button className="btn btn-xs btn-outline-secondary" style={{fontSize:10, padding:'1px 6px'}}
                  onClick={() => dismissAlert(a.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="row mb-3">
        <div className="col-6 col-md-3 mb-2">
          <StatCard icon="🔒" label="Blocked Partners" value={blocked} color={blocked > 0 ? '#e74a3b' : '#1cc88a'} />
        </div>
        <div className="col-6 col-md-3 mb-2">
          <StatCard icon="💰" label="Wallet Balance (total)" value={`KSh ${(stats.totalWalletBalance||0).toLocaleString()}`} color="#C9A020" />
        </div>
        <div className="col-6 col-md-3 mb-2">
          <StatCard icon="🛡️" label="Deposits Held" value={`KSh ${(stats.totalDepositsHeld||0).toLocaleString()}`} color="#4e73df" />
        </div>
        <div className="col-6 col-md-3 mb-2">
          <StatCard icon="⚠️" label="Deposits Not Paid" value={stats.depositNotPaid||0} color={stats.depositNotPaid > 0 ? '#f59e0b' : '#1cc88a'} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link${tab==='wallets'?' active':''}`} onClick={()=>{ setTab('wallets'); setSelected(null); }}>
            👛 Wallets — Workers & Riders
            {(stats.walletBelowMin||0) > 0 && <span className="badge badge-danger ml-1">{stats.walletBelowMin}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab==='deposits'?' active':''}`} onClick={()=>{ setTab('deposits'); setSelected(null); }}>
            🛡️ Security Deposits
            {(stats.depositNotPaid||0) > 0 && <span className="badge badge-warning ml-1">{stats.depositNotPaid}</span>}
          </button>
        </li>
      </ul>

      {/* ── Search ── */}
      <div className="mb-3">
        <input className="form-control form-control-sm" style={{maxWidth:300}}
          placeholder="Search by name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }} />
      </div>

      <div className="row">
        {/* ── LEFT: partner list ── */}
        <div className="col-md-5" style={{maxHeight:640, overflowY:'auto'}}>
          {loading ? <Spinner /> : tab === 'wallets' ? (
            filterList(walletPartners).length === 0
              ? <p className="text-xs text-gray-500">No wallet partners found.</p>
              : filterList(walletPartners).map(p => {
                const blocked = p.can_receive_jobs === false;
                return (
                  <div key={p.id} onClick={() => selectPartner(p)}
                    className="admin-card mb-2"
                    style={{ cursor:'pointer', borderLeft:`4px solid ${selected?.id===p.id ? '#C9A020' : blocked ? '#e74a3b' : 'transparent'}`, transition:'border 0.15s' }}>
                    <div className="card-body py-2 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          {blocked && <span className="badge badge-danger" style={{fontSize:10}}>🔒 BLOCKED</span>}
                          <div className="text-sm font-weight-bold">{p.full_name||'—'}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1"><RoleBadge role={p.partner_role} /></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-weight-bold" style={{color: blocked ? '#e74a3b' : '#1cc88a'}}>
                          KSh {(p.wallet_balance||0).toLocaleString()}
                        </div>
                        {blocked
                          ? <div className="text-xs text-danger">Top up needed</div>
                          : <div className="text-xs text-gray-400">Min KSh 500</div>}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            filterList(depositPartners).length === 0
              ? <p className="text-xs text-gray-500">No deposit partners found.</p>
              : filterList(depositPartners).map(p => {
                const meta = DEPOSIT_STATUS_META[p.security_deposit_status||'not_paid'];
                const blocked = p.can_receive_jobs === false;
                return (
                  <div key={p.id} onClick={() => selectPartner(p)}
                    className="admin-card mb-2"
                    style={{ cursor:'pointer', borderLeft:`4px solid ${selected?.id===p.id ? '#C9A020' : blocked ? '#e74a3b' : 'transparent'}`, transition:'border 0.15s' }}>
                    <div className="card-body py-2 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-sm font-weight-bold">{p.full_name||'—'}</div>
                        <div className="text-xs text-gray-500 mt-1"><RoleBadge role={p.partner_role} /></div>
                      </div>
                      <div className="text-right">
                        <span className="badge" style={{background:meta.bg, color:meta.color, fontSize:10}}>{meta.label}</span>
                        {(p.security_deposit||0) > 0 && (
                          <div className="text-xs text-gray-500 mt-1">KSh {(p.security_deposit||0).toLocaleString()} held</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* ── RIGHT: detail panel ── */}
        <div className="col-md-7">
          {!selected ? (
            <div className="text-center py-5 text-gray-400 text-sm">← Select a partner to view details</div>
          ) : tab === 'wallets' ? (
            // ── Wallet detail ──
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="font-weight-bold mb-0">{selected.full_name}</h6>
                  <div className="text-xs text-gray-500"><RoleBadge role={selected.partner_role} /></div>
                </div>
                <button className="btn btn-sm btn-warning font-weight-bold"
                  style={{background:'#C9A020',border:'none',color:'#0A0E1A'}}
                  onClick={() => setAdjForm({ amount:'', reason:'' })}>
                  💰 Adjust Wallet
                </button>
              </div>

              {/* Balance card */}
              <div className="admin-card mb-3" style={{borderLeft:`4px solid ${selected.can_receive_jobs===false?'#e74a3b':'#1cc88a'}`}}>
                <div className="card-body py-3">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="text-xs text-gray-500 font-weight-bold text-uppercase mb-1">Current Balance</div>
                      <div className="font-weight-bold" style={{fontSize:22, color: selected.can_receive_jobs===false ? '#e74a3b' : '#1cc88a'}}>
                        KSh {(selected.wallet_balance||0).toLocaleString()}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-xs text-gray-500 font-weight-bold text-uppercase mb-1">Job Access</div>
                      <div className="font-weight-bold" style={{fontSize:14, color: selected.can_receive_jobs===false ? '#e74a3b' : '#1cc88a'}}>
                        {selected.can_receive_jobs===false ? '🔒 Blocked' : '✅ Active'}
                      </div>
                      {selected.can_receive_jobs===false && (
                        <div className="text-xs text-danger mt-1">Must top up above KSh 500</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjustment form */}
              {adjForm && (
                <div className="admin-card mb-3" style={{borderLeft:'4px solid #C9A020'}}>
                  <div className="card-body py-3">
                    <div className="text-xs font-weight-bold text-gray-600 mb-2">
                      Positive = top-up &nbsp;·&nbsp; Negative = deduction
                    </div>
                    <div className="row">
                      <div className="col-6">
                        <input type="number" className="form-control mb-2" placeholder="Amount (e.g. 1000 or -200)"
                          value={adjForm.amount} onChange={e => setAdjForm(f => ({...f, amount: e.target.value}))} />
                      </div>
                      <div className="col-6">
                        <input className="form-control mb-2" placeholder="Reason (required)"
                          value={adjForm.reason} onChange={e => setAdjForm(f => ({...f, reason: e.target.value}))} />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning font-weight-bold"
                        style={{background:'#C9A020',border:'none',color:'#0A0E1A'}}
                        disabled={saving} onClick={applyAdj}>{saving ? '…' : 'Apply'}</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setAdjForm(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div className="text-xs font-weight-bold text-gray-700 mb-2">Transaction History</div>
              {detail.txns.length === 0 ? <p className="text-xs text-gray-500">No transactions yet.</p> : (
                <div style={{maxHeight:200, overflowY:'auto'}}>
                  <table className="admin-table">
                    <thead><tr><th>Type</th><th>Amount</th><th>Balance After</th><th>Note</th><th>Date</th></tr></thead>
                    <tbody>
                      {detail.txns.map(t => (
                        <tr key={t.id}>
                          <td><span className="sb-badge sb-badge-info">{t.type}</span></td>
                          <td className="text-xs font-weight-bold"
                            style={{color: ['commission','payout'].includes(t.type) ? '#e74a3b' : '#1cc88a'}}>
                            {['commission','payout'].includes(t.type) ? '−' : '+'}KSh {(t.amount||0).toLocaleString()}
                          </td>
                          <td className="text-xs">KSh {(t.balance_after||0).toLocaleString()}</td>
                          <td className="text-xs text-gray-500">{t.note||'—'}</td>
                          <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('en-KE')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Admin adjustments */}
              {detail.adjs.length > 0 && (
                <>
                  <div className="text-xs font-weight-bold text-gray-700 mt-3 mb-2">Admin Adjustments</div>
                  <table className="admin-table">
                    <thead><tr><th>Amount</th><th>Reason</th><th>Date</th></tr></thead>
                    <tbody>
                      {detail.adjs.map(a => (
                        <tr key={a.id}>
                          <td className="text-xs font-weight-bold" style={{color: a.amount>0?'#1cc88a':'#e74a3b'}}>
                            KSh {a.amount>0?'+':''}{a.amount.toLocaleString()}
                          </td>
                          <td className="text-xs">{a.reason}</td>
                          <td className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString('en-KE')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : (
            // ── Deposit detail ──
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="font-weight-bold mb-0">{selected.full_name}</h6>
                  <div className="text-xs text-gray-500"><RoleBadge role={selected.partner_role} /></div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success font-weight-bold"
                    onClick={() => setDepForm({ action:'received', amount:'', ref:'', reason:'' })}>
                    + Record Payment
                  </button>
                  {selected.security_deposit_status === 'held' && (
                    <>
                      <button className="btn btn-sm btn-info font-weight-bold"
                        onClick={() => setDepForm({ action:'refund', amount: String(selected.security_deposit||''), ref:'', reason:'' })}>
                        ↩ Refund
                      </button>
                      <button className="btn btn-sm btn-danger font-weight-bold"
                        onClick={() => setDepForm({ action:'forfeit', amount:'', ref:'', reason:'' })}>
                        ✕ Forfeit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Deposit status card */}
              {(() => {
                const meta = DEPOSIT_STATUS_META[selected.security_deposit_status||'not_paid'];
                return (
                  <div className="admin-card mb-3" style={{borderLeft:`4px solid ${meta.color}`}}>
                    <div className="card-body py-3">
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="text-xs text-gray-500 font-weight-bold text-uppercase mb-1">Status</div>
                          <span className="badge" style={{background:meta.bg, color:meta.color, fontSize:12}}>{meta.label}</span>
                        </div>
                        <div className="col-4">
                          <div className="text-xs text-gray-500 font-weight-bold text-uppercase mb-1">Amount Held</div>
                          <div className="font-weight-bold" style={{fontSize:18, color:meta.color}}>
                            KSh {(selected.security_deposit||0).toLocaleString()}
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-xs text-gray-500 font-weight-bold text-uppercase mb-1">Job Access</div>
                          <div className="font-weight-bold" style={{fontSize:13, color: selected.can_receive_jobs===false ? '#e74a3b' : '#1cc88a'}}>
                            {selected.can_receive_jobs===false ? '🔒 Blocked' : '✅ Active'}
                          </div>
                        </div>
                      </div>
                      {selected.security_deposit_paid_at && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Paid on {new Date(selected.security_deposit_paid_at).toLocaleDateString('en-KE')}
                          {selected.security_deposit_ref && ` · Ref: ${selected.security_deposit_ref}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Deposit action form */}
              {depForm && (
                <div className="admin-card mb-3" style={{borderLeft:`4px solid ${depForm.action==='received'?'#1cc88a':depForm.action==='refund'?'#17a2b8':'#e74a3b'}`}}>
                  <div className="card-body py-3">
                    <div className="text-xs font-weight-bold text-gray-600 mb-2">
                      {depForm.action==='received' ? '💵 Record deposit payment received' : depForm.action==='refund' ? '↩ Refund deposit to partner' : '✕ Forfeit deposit (permanent)'}
                    </div>
                    {depForm.action !== 'forfeit' && (
                      <div className="row">
                        <div className="col-4">
                          <input type="number" className="form-control mb-2" placeholder="Amount (KSh)"
                            value={depForm.amount} onChange={e => setDepForm(f => ({...f, amount: e.target.value}))} />
                        </div>
                        <div className="col-4">
                          <input className="form-control mb-2" placeholder="M-Pesa ref (optional)"
                            value={depForm.ref} onChange={e => setDepForm(f => ({...f, ref: e.target.value}))} />
                        </div>
                        <div className="col-4">
                          <input className="form-control mb-2" placeholder="Note (optional)"
                            value={depForm.reason} onChange={e => setDepForm(f => ({...f, reason: e.target.value}))} />
                        </div>
                      </div>
                    )}
                    {depForm.action === 'forfeit' && (
                      <input className="form-control mb-2" placeholder="Reason for forfeiture (required)"
                        value={depForm.reason} onChange={e => setDepForm(f => ({...f, reason: e.target.value}))} />
                    )}
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm font-weight-bold"
                        style={{background: depForm.action==='received'?'#1cc88a':depForm.action==='refund'?'#17a2b8':'#e74a3b', border:'none', color:'#fff'}}
                        disabled={saving} onClick={applyDeposit}>{saving ? '…' : 'Confirm'}</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setDepForm(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit transaction history */}
              <div className="text-xs font-weight-bold text-gray-700 mb-2">Deposit History</div>
              {detail.deposits.length === 0 ? <p className="text-xs text-gray-500">No deposit transactions yet.</p> : (
                <div style={{maxHeight:260, overflowY:'auto'}}>
                  <table className="admin-table">
                    <thead><tr><th>Type</th><th>Amount</th><th>Method</th><th>Ref</th><th>Note</th><th>Date</th></tr></thead>
                    <tbody>
                      {detail.deposits.map(d => {
                        const typeColor = { received:'#1cc88a', refund:'#17a2b8', forfeiture:'#e74a3b', adjustment:'#f59e0b' };
                        return (
                          <tr key={d.id}>
                            <td><span className="sb-badge" style={{background:`${typeColor[d.type]}20`,color:typeColor[d.type]}}>{d.type}</span></td>
                            <td className="text-xs font-weight-bold" style={{color:typeColor[d.type]}}>KSh {(d.amount||0).toLocaleString()}</td>
                            <td className="text-xs">{d.method||'—'}</td>
                            <td className="text-xs text-gray-500">{d.mpesa_ref||'—'}</td>
                            <td className="text-xs text-gray-500">{d.note||'—'}</td>
                            <td className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString('en-KE')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── SECTION: Alerts Feed ──────────────────────────────────────────
function AlertsFeedSection() {
  const [urgentTickets,  setUrgentTickets]  = useState([]);
  const [stuckBookings,  setStuckBookings]  = useState([]);
  const [pendingVerify,  setPendingVerify]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const channelRef = useRef(null);

  const DEPT_COLOR = {
    trust_safety: '#ef4444', finance: '#10b981', operations: '#3b82f6',
    accounts: '#C9A020', technical: '#a78bfa', partner_success: '#f59e0b',
  };

  const load = useCallback(async () => {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

    const [{ data: tickets }, { data: bookings }, { data: pending }] = await Promise.all([
      supabase
        .from('support_tickets')
        .select('*')
        .eq('priority', 'urgent')
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('bookings')
        .select('id,service,address,status,created_at,worker_id')
        .eq('status', 'confirmed')
        .lt('created_at', cutoff)
        .order('created_at', { ascending: true })
        .limit(10),
      supabase
        .from('workers')
        .select('id,full_name,partner_role,created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    setUrgentTickets(tickets || []);
    setStuckBookings(bookings || []);
    setPendingVerify(pending || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    channelRef.current = supabase
      .channel('admin-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' },
        (payload) => { if (payload.new?.priority === 'urgent') load(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, load)
      .subscribe();
    const interval = setInterval(load, 30_000);
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(interval);
    };
  }, [load]);

  const totalAlerts = urgentTickets.length + stuckBookings.length + pendingVerify.length;

  const timeAgo = (iso) => {
    const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <>
      <PageHeader
        title="Alerts Feed"
        sub="Real-time alerts — urgent tickets, stuck bookings, pending verifications"
      />

      {/* Summary row */}
      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <StatCard icon="🚨" label="Urgent Tickets" value={urgentTickets.length} color="#ef4444" />
        </div>
        <div className="col-md-4 mb-2">
          <StatCard icon="⏰" label="Stuck Bookings (>1h)" value={stuckBookings.length} color="#f59e0b" />
        </div>
        <div className="col-md-4 mb-2">
          <StatCard icon="🔐" label="Pending Verification" value={pendingVerify.length} color="#C9A020" />
        </div>
      </div>

      {loading ? <Spinner /> : totalAlerts === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: 52 }}>✅</div>
          <p className="text-gray-500 mt-3 font-weight-bold">All clear — no active alerts</p>
          <p className="text-gray-400 text-sm">This feed auto-refreshes every 30 seconds</p>
        </div>
      ) : (
        <>
          {/* ── Urgent Tickets ── */}
          {urgentTickets.length > 0 && (
            <div className="mb-4">
              <h6 className="font-weight-bold mb-3" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
                URGENT SUPPORT TICKETS
              </h6>
              {urgentTickets.map(t => {
                const deptColor = DEPT_COLOR[t.department] || '#6b7280';
                const slaHours  = t.department === 'trust_safety' ? 1 : t.department === 'operations' ? 8 : 24;
                const hoursOld  = (Date.now() - new Date(t.created_at)) / 3_600_000;
                const breached  = hoursOld > slaHours;
                return (
                  <div key={t.id} className="admin-card mb-2" style={{ borderLeft: `4px solid ${breached ? '#ef4444' : '#f59e0b'}` }}>
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="font-weight-bold text-gray-800 mb-1">
                            {breached && <span className="badge badge-danger mr-2" style={{ fontSize: 9 }}>⏰ SLA BREACHED</span>}
                            {t.subject || 'Urgent Ticket'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t.user_name || 'Customer'} · {(t.user_type || 'user').toUpperCase()} · {timeAgo(t.created_at)}
                          </div>
                          <div className="mt-1">
                            <span className="sb-badge mr-1" style={{ background: `${deptColor}18`, color: deptColor, border: `1px solid ${deptColor}40`, fontSize: 10 }}>
                              {t.department?.replace(/_/g, ' ').toUpperCase() || 'GENERAL'}
                            </span>
                            <span className="sb-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 10 }}>
                              🚨 URGENT
                            </span>
                          </div>
                        </div>
                        <SBBadge status={t.status} />
                      </div>
                      {t.message && (
                        <div className="text-xs text-gray-500 mt-2 p-2 rounded" style={{ background: '#f8f9fc', border: '1px solid #e3e6f0' }}>
                          {t.message.length > 100 ? t.message.slice(0, 100) + '…' : t.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Stuck Bookings ── */}
          {stuckBookings.length > 0 && (
            <div className="mb-4">
              <h6 className="font-weight-bold mb-3" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                STUCK BOOKINGS — CONFIRMED BUT NO PARTNER RESPONDED (&gt;1 HOUR)
              </h6>
              {stuckBookings.map(b => (
                <div key={b.id} className="admin-card mb-2" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="card-body py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="font-weight-bold text-gray-800">{b.service || 'Booking'}</div>
                      <div className="text-xs text-gray-500 mt-1">{b.address || '—'}</div>
                      <div className="text-xs mt-1" style={{ color: '#f59e0b', fontWeight: 700 }}>
                        ⏰ Stuck for {timeAgo(b.created_at)} — no partner on the way
                      </div>
                    </div>
                    <span className="sb-badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                      ⚠️ Stuck
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pending Verifications ── */}
          {pendingVerify.length > 0 && (
            <div className="mb-4">
              <h6 className="font-weight-bold mb-3" style={{ color: '#C9A020', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A020', display: 'inline-block' }} />
                PARTNERS WAITING FOR VERIFICATION
              </h6>
              {pendingVerify.map(p => (
                <div key={p.id} className="admin-card mb-2" style={{ borderLeft: '4px solid #C9A020' }}>
                  <div className="card-body py-2 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="font-weight-bold text-gray-800">{p.full_name || 'Partner'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <RoleBadge role={p.partner_role} /> · Applied {timeAgo(p.created_at)}
                      </div>
                    </div>
                    <span className="sb-badge" style={{ background: 'rgba(201,160,32,0.12)', color: '#C9A020', border: '1px solid rgba(201,160,32,0.3)' }}>
                      🔐 Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── SECTION: Verification Queue ───────────────────────────────────
function VerificationQueueSection() {
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);
  const [notes,    setNotes]    = useState({});
  const [filter,   setFilter]   = useState('pending');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase.from('workers').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q.eq('verification_status', filter);
    const { data } = await q;
    setPartners(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, status) => {
    setActing(id);
    const { error } = await supabase.from('workers').update({ verification_status: status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert(`Failed: ${error.message}`); setActing(null); return; }
    const partner = partners.find(p => p.id === id);
    auditLog(`verification_${status}`, `partner=${partner?.full_name||id}`);
    if (status === 'approved')  await sendPartnerApproved(partner);
    if (status === 'rejected')  await sendPartnerRejected(partner, notes[id] || 'Documents did not meet our requirements.');
    setActing(null);
    setSelected(null);
    load();
  };

  const counts = { pending: 0, approved: 0, rejected: 0 };
  partners.forEach(p => { if (counts[p.verification_status] !== undefined) counts[p.verification_status]++; });

  const DOC_FIELDS = [
    { key: 'national_id_url',    label: 'National ID'       },
    { key: 'certificate_url',    label: 'Certificate'       },
    { key: 'profile_photo_url',  label: 'Profile Photo'     },
    { key: 'police_clearance_url', label: 'Police Clearance' },
    { key: 'business_permit_url',  label: 'Business Permit'  },
  ];

  return (
    <>
      <PageHeader title="Verification Queue" sub="Review partner identity documents and approve or reject applications" />
      <div className="row mb-4">
        <div className="col-md-4 mb-2"><StatCard icon="⏳" label="Pending Review" value={counts.pending}  color="#f6c23e" /></div>
        <div className="col-md-4 mb-2"><StatCard icon="✅" label="Approved"       value={counts.approved} color="#1cc88a" /></div>
        <div className="col-md-4 mb-2"><StatCard icon="❌" label="Rejected"       value={counts.rejected} color="#e74a3b" /></div>
      </div>

      <div className="mb-3">
        {['all','pending','approved','rejected'].map(f => (
          <FilterPill key={f} active={filter===f} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </FilterPill>
        ))}
      </div>

      {loading ? <Spinner /> : partners.length === 0 ? (
        <div className="text-center py-5 text-gray-500">No partners in this queue.</div>
      ) : (
        <div className="row">
          {/* List */}
          <div className="col-md-5">
            {partners.map(p => (
              <div key={p.id} className="admin-card mb-2" onClick={() => setSelected(p)}
                style={{ borderLeft: `4px solid ${ROLE_COLOR[p.partner_role]||'#aaa'}`, cursor:'pointer', background: selected?.id===p.id?'#f8f9fc':'#fff' }}>
                <div className="card-body py-2">
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ width:38,height:38,borderRadius:'50%',overflow:'hidden',border:'2px solid #dee2e6',flexShrink:0 }}>
                      {p.profile_photo_url
                        ? <img src={p.profile_photo_url} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                        : <div style={{ width:'100%',height:'100%',background:'#e3e6f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>👤</div>}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth:0 }}>
                      <div className="font-weight-bold text-gray-800 text-xs">{p.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">{p.email} · <RoleBadge role={p.partner_role} /></div>
                    </div>
                    <SBBadge status={p.verification_status} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Applied {new Date(p.created_at).toLocaleDateString('en-KE')}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="col-md-7">
            {!selected ? (
              <div className="admin-card" style={{ minHeight:300,display:'flex',alignItems:'center',justifyContent:'center',color:'#a0aec0' }}>
                <div className="text-center"><div style={{ fontSize:40,marginBottom:8 }}>👈</div><div>Select a partner to review their documents</div></div>
              </div>
            ) : (
              <div className="admin-card">
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <span>📋 {selected.full_name} — Document Review</span>
                  <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#aaa' }}>×</button>
                </div>
                <div className="card-body">
                  {/* Basic info */}
                  <div className="row mb-3">
                    {[
                      ['Phone',    selected.phone],
                      ['Email',    selected.email],
                      ['Role',     selected.partner_role],
                      ['Status',   selected.verification_status],
                      ['Location', selected.county || '—'],
                      ['ID Number',selected.national_id_number || '—'],
                    ].map(([k,v]) => (
                      <div key={k} className="col-6 mb-2">
                        <div className="text-xs text-gray-500">{k}</div>
                        <div className="text-xs font-weight-bold text-gray-800">{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                  {/* Documents */}
                  <div className="font-weight-bold text-xs text-gray-800 mb-2">DOCUMENTS</div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {DOC_FIELDS.map(({ key, label }) => selected[key] ? (
                      <a key={key} href={selected[key]} target="_blank" rel="noreferrer"
                        className="btn btn-sm btn-outline-primary" style={{ fontSize:11 }}>
                        📄 {label}
                      </a>
                    ) : (
                      <span key={key} className="btn btn-sm btn-outline-secondary disabled" style={{ fontSize:11,opacity:0.5 }}>
                        ✗ {label}
                      </span>
                    ))}
                  </div>
                  {/* Reject note */}
                  {selected.verification_status !== 'approved' && (
                    <textarea
                      className="form-control mb-3"
                      rows={2}
                      placeholder="Rejection reason (required if rejecting)…"
                      style={{ fontSize:12,resize:'none' }}
                      value={notes[selected.id]||''}
                      onChange={e => setNotes(n => ({ ...n, [selected.id]: e.target.value }))}
                    />
                  )}
                  {/* Actions */}
                  {selected.verification_status === 'pending' && (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        style={{ fontWeight:700 }}
                        disabled={acting===selected.id}
                        onClick={() => act(selected.id, 'approved')}>
                        ✅ Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ fontWeight:700 }}
                        disabled={acting===selected.id || !notes[selected.id]?.trim()}
                        onClick={() => act(selected.id, 'rejected')}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {selected.verification_status === 'approved' && (
                    <button className="btn btn-outline-danger btn-sm" onClick={() => act(selected.id,'rejected')} disabled={acting===selected.id}>
                      ↩ Revoke Approval
                    </button>
                  )}
                  {selected.verification_status === 'rejected' && (
                    <button className="btn btn-success btn-sm" onClick={() => act(selected.id,'approved')} disabled={acting===selected.id}>
                      ✅ Re-approve
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Refund Management ────────────────────────────────────
function RefundManagementSection() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);
  const [notes,    setNotes]    = useState({});
  const [filter,   setFilter]   = useState('open');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .in('category', ['refund_request', 'payment_failed'])
      .order('created_at', { ascending: false });
    const all = data || [];
    setTickets(filter === 'all' ? all : all.filter(t => t.status === filter || (filter === 'open' && ['open','in_review','in_progress'].includes(t.status))));
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (ticket, decision) => {
    setActing(ticket.id);
    const updates = {
      status:      'resolved',
      admin_note:  notes[ticket.id] || (decision === 'approved' ? 'Refund approved by admin.' : 'Refund declined by admin.'),
      resolved_at: new Date().toISOString(),
      refund_decision: decision,
    };
    await supabase.from('support_tickets').update(updates).eq('id', ticket.id);
    sendTicketStatusUpdate({ ...ticket, admin_note: updates.admin_note }, 'resolved');
    setActing(null);
    setSelected(null);
    load();
  };

  const PRIORITY_COLOR = { urgent: '#e74a3b', high: '#fd7e14', normal: '#6c757d' };

  return (
    <>
      <PageHeader title="Refund Management" sub="Review and action customer refund requests" />
      <div className="mb-3">
        {['open','resolved','all'].map(f => (
          <FilterPill key={f} active={filter===f} onClick={() => setFilter(f)}>
            {f === 'open' ? 'Pending' : f.charAt(0).toUpperCase()+f.slice(1)}
          </FilterPill>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="row">
          {/* List */}
          <div className="col-md-5">
            {tickets.length === 0
              ? <div className="text-center py-5 text-gray-500">No refund requests in this queue.</div>
              : tickets.map(t => (
                <div key={t.id} className="admin-card mb-2" onClick={() => setSelected(t)}
                  style={{ borderLeft:`4px solid ${PRIORITY_COLOR[t.priority]||'#aaa'}`, cursor:'pointer', background: selected?.id===t.id?'#f8f9fc':'#fff' }}>
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="font-weight-bold text-gray-800 text-xs">{t.subject || 'Refund Request'}</div>
                        <div className="text-xs text-gray-500 mt-1">{t.user_name || t.user_email} · {new Date(t.created_at).toLocaleDateString('en-KE')}</div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <SBBadge status={t.status} />
                        {t.refund_decision && (
                          <span className="sb-badge" style={{ background: t.refund_decision==='approved'?'rgba(28,200,138,0.12)':'rgba(231,74,59,0.12)', color: t.refund_decision==='approved'?'#1cc88a':'#e74a3b', border:`1px solid ${t.refund_decision==='approved'?'rgba(28,200,138,0.3)':'rgba(231,74,59,0.3)'}` }}>
                            {t.refund_decision === 'approved' ? '✅ Approved' : '❌ Declined'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Detail */}
          <div className="col-md-7">
            {!selected ? (
              <div className="admin-card" style={{ minHeight:300,display:'flex',alignItems:'center',justifyContent:'center',color:'#a0aec0' }}>
                <div className="text-center"><div style={{ fontSize:40,marginBottom:8 }}>👈</div><div>Select a request to review</div></div>
              </div>
            ) : (
              <div className="admin-card">
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <span>💳 Refund Request #{selected.id?.slice(0,8)}</span>
                  <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#aaa' }}>×</button>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    {[
                      ['Customer',  selected.user_name || '—'],
                      ['Email',     selected.user_email || '—'],
                      ['Category',  selected.category?.replace(/_/g,' ')],
                      ['Priority',  selected.priority],
                      ['Submitted', new Date(selected.created_at).toLocaleString('en-KE')],
                      ['Status',    selected.status],
                    ].map(([k,v]) => (
                      <div key={k} className="col-6 mb-2">
                        <div className="text-xs text-gray-500">{k}</div>
                        <div className="text-xs font-weight-bold text-gray-800">{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">CUSTOMER MESSAGE</div>
                    <div className="admin-card" style={{ background:'#f8f9fc',padding:'10px 14px' }}>
                      <div className="text-xs text-gray-800">{selected.message || '—'}</div>
                    </div>
                  </div>
                  {selected.admin_note && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">PREVIOUS ADMIN NOTE</div>
                      <div className="text-xs text-gray-600">{selected.admin_note}</div>
                    </div>
                  )}
                  {!selected.refund_decision && (
                    <>
                      <textarea
                        className="form-control mb-3"
                        rows={2}
                        placeholder="Admin note (reason for approval or decline)…"
                        style={{ fontSize:12,resize:'none' }}
                        value={notes[selected.id]||''}
                        onChange={e => setNotes(n => ({ ...n, [selected.id]: e.target.value }))}
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-success btn-sm" style={{ fontWeight:700 }}
                          disabled={acting===selected.id} onClick={() => act(selected,'approved')}>
                          ✅ Approve Refund
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ fontWeight:700 }}
                          disabled={acting===selected.id} onClick={() => act(selected,'declined')}>
                          ❌ Decline
                        </button>
                      </div>
                    </>
                  )}
                  {selected.refund_decision && (
                    <div className="text-xs font-weight-bold" style={{ color: selected.refund_decision==='approved'?'#1cc88a':'#e74a3b' }}>
                      {selected.refund_decision === 'approved' ? '✅ Refund was approved' : '❌ Refund was declined'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Partner Performance ──────────────────────────────────
function PartnerPerformanceSection() {
  const [partners, setPartners] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState('rating');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: workers }, { data: bookings }, { data: reviews }] = await Promise.all([
        supabase.from('workers').select('id,full_name,partner_role,verification_status,created_at').eq('verification_status','approved'),
        supabase.from('bookings').select('worker_id,status'),
        supabase.from('reviews').select('worker_id,rating'),
      ]);

      const stats = {};
      (workers||[]).forEach(w => {
        stats[w.id] = { ...w, total:0, completed:0, cancelled:0, rating_sum:0, rating_count:0 };
      });
      (bookings||[]).forEach(b => {
        if (!stats[b.worker_id]) return;
        stats[b.worker_id].total++;
        if (b.status === 'completed') stats[b.worker_id].completed++;
        if (b.status === 'cancelled') stats[b.worker_id].cancelled++;
      });
      (reviews||[]).forEach(r => {
        if (!stats[r.worker_id]) return;
        stats[r.worker_id].rating_sum += r.rating || 0;
        stats[r.worker_id].rating_count++;
      });

      const result = Object.values(stats).map(s => ({
        ...s,
        avg_rating:       s.rating_count > 0 ? (s.rating_sum / s.rating_count).toFixed(1) : null,
        completion_rate:  s.total > 0 ? Math.round((s.completed / s.total) * 100) : null,
        cancellation_rate: s.total > 0 ? Math.round((s.cancelled / s.total) * 100) : null,
      }));
      setPartners(result);
      setLoading(false);
    };
    load();
  }, []);

  const sorted = [...partners]
    .filter(p => roleFilter === 'all' || p.partner_role === roleFilter)
    .sort((a, b) => {
      if (sort === 'rating')      return (parseFloat(b.avg_rating)||0) - (parseFloat(a.avg_rating)||0);
      if (sort === 'completion')  return (b.completion_rate||0) - (a.completion_rate||0);
      if (sort === 'jobs')        return (b.total||0) - (a.total||0);
      if (sort === 'cancellation')return (a.cancellation_rate||0) - (b.cancellation_rate||0);
      return 0;
    });

  const ROLES = ['all','worker','vendor','rider','supplier','mover','water_carrier'];

  const ratingBar = (val) => {
    const pct = val ? (parseFloat(val) / 5) * 100 : 0;
    const color = pct >= 80 ? '#1cc88a' : pct >= 60 ? '#f6c23e' : '#e74a3b';
    return (
      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
        <div style={{ flex:1,height:6,background:'#e3e6f0',borderRadius:3,overflow:'hidden' }}>
          <div style={{ width:`${pct}%`,height:'100%',background:color,borderRadius:3 }} />
        </div>
        <span className="text-xs font-weight-bold" style={{ color, minWidth:28 }}>{val||'—'}</span>
      </div>
    );
  };

  const pctBadge = (val, invert = false) => {
    if (val === null) return <span className="text-xs text-gray-500">—</span>;
    const good = invert ? val < 10 : val >= 80;
    const warn = invert ? val < 20 : val >= 60;
    const color = good ? '#1cc88a' : warn ? '#f6c23e' : '#e74a3b';
    return <span className="text-xs font-weight-bold" style={{ color }}>{val}%</span>;
  };

  return (
    <>
      <PageHeader title="Partner Performance" sub="Ratings, completion rates and cancellation rates across all approved partners" />
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <div>
          <span className="text-xs text-gray-500 mr-2">Role:</span>
          {ROLES.map(r => (
            <FilterPill key={r} active={roleFilter===r} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : ROLE_LABEL[r] || r}
            </FilterPill>
          ))}
        </div>
        <div className="ml-auto">
          <span className="text-xs text-gray-500 mr-1">Sort:</span>
          <select className="form-control form-control-sm d-inline-block" style={{ width:'auto',fontSize:12 }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="rating">Highest Rating</option>
            <option value="completion">Best Completion</option>
            <option value="jobs">Most Jobs</option>
            <option value="cancellation">Lowest Cancellations</option>
          </select>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Role</th>
              <th>Avg Rating</th>
              <th>Completion</th>
              <th>Cancellation</th>
              <th>Total Jobs</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="font-weight-bold text-gray-800 text-xs">{p.full_name || '—'}</div>
                  <div className="text-xs text-gray-500">Since {new Date(p.created_at).toLocaleDateString('en-KE')}</div>
                </td>
                <td><RoleBadge role={p.partner_role} /></td>
                <td style={{ minWidth:120 }}>{ratingBar(p.avg_rating)}</td>
                <td>{pctBadge(p.completion_rate)}</td>
                <td>{pctBadge(p.cancellation_rate, true)}</td>
                <td className="font-weight-bold text-gray-800">{p.total}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-4">No approved partners found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </>
  );
}

// ── SECTION: Financial Reconciliation ────────────────────────────
function ReconciliationSection() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [summary,  setSummary]  = useState({ revenue:0, payouts:0, refunds:0, net:0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - 30);
      const iso = since.toISOString();

      const [{ data: payments }, { data: payouts }, { data: refunds }] = await Promise.all([
        supabase.from('payments').select('amount,created_at,status').eq('status','paid').gte('created_at', iso),
        supabase.from('payouts').select('amount,created_at,status').in('status',['completed','paid']).gte('created_at', iso),
        supabase.from('support_tickets').select('created_at').eq('refund_decision','approved').gte('created_at', iso),
      ]);

      // Daily bucketing
      const days = {};
      const addDay = (dateStr, key, val) => {
        const d = dateStr?.slice(0,10);
        if (!d) return;
        if (!days[d]) days[d] = { date:d, revenue:0, payouts:0, refunds:0 };
        days[d][key] += val || 0;
      };

      (payments||[]).forEach(p => addDay(p.created_at, 'revenue', parseFloat(p.amount)||0));
      (payouts||[]).forEach(p  => addDay(p.created_at, 'payouts', parseFloat(p.amount)||0));
      (refunds||[]).forEach(r  => addDay(r.created_at, 'refunds', 0)); // count only — amounts TBD per your schema

      const sorted = Object.values(days).sort((a,b) => a.date.localeCompare(b.date)).map(d => ({
        ...d,
        net: d.revenue - d.payouts,
        label: new Date(d.date).toLocaleDateString('en-KE', { month:'short', day:'numeric' }),
      }));

      const totRev   = (payments||[]).reduce((s,p) => s + (parseFloat(p.amount)||0), 0);
      const totPay   = (payouts||[]).reduce((s,p)  => s + (parseFloat(p.amount)||0), 0);
      const totRef   = (refunds||[]).length;
      setSummary({ revenue: totRev, payouts: totPay, refunds: totRef, net: totRev - totPay });
      setRows(sorted);
      setLoading(false);
    };
    load();
  }, []);

  const fmt = v => `KES ${Number(v).toLocaleString('en-KE', { maximumFractionDigits:0 })}`;

  return (
    <>
      <PageHeader title="Financial Reconciliation" sub="30-day revenue vs payouts — daily breakdown" />
      <div className="row mb-4">
        <div className="col-md-3 mb-2"><StatCard icon="💰" label="Total Revenue"  value={fmt(summary.revenue)} color="#1cc88a" /></div>
        <div className="col-md-3 mb-2"><StatCard icon="💸" label="Total Payouts"  value={fmt(summary.payouts)} color="#e74a3b" /></div>
        <div className="col-md-3 mb-2"><StatCard icon="↩️" label="Refunds Approved" value={summary.refunds}   color="#f6c23e" /></div>
        <div className="col-md-3 mb-2"><StatCard icon="🏦" label="Net Position"   value={fmt(summary.net)}    color={summary.net >= 0 ? '#4e73df' : '#e74a3b'} /></div>
      </div>
      {loading ? <Spinner /> : rows.length === 0 ? (
        <div className="text-center py-5 text-gray-500">No payment data in the last 30 days.</div>
      ) : (
        <>
          <div className="admin-card mb-4">
            <div className="admin-card-header">Revenue vs Payouts (last 30 days)</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={rows} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1cc88a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1cc88a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e74a3b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e74a3b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                  <XAxis dataKey="label" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, n) => [fmt(v), n === 'revenue' ? 'Revenue' : 'Payouts']} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#1cc88a" fill="url(#rev)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="payouts" stroke="#e74a3b" fill="url(#pay)" strokeWidth={2} name="Payouts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header">Daily Breakdown</div>
            <table className="admin-table">
              <thead><tr><th>Date</th><th>Revenue</th><th>Payouts</th><th>Net</th></tr></thead>
              <tbody>
                {[...rows].reverse().map(r => (
                  <tr key={r.date}>
                    <td className="text-xs text-gray-600">{r.label}</td>
                    <td className="text-xs font-weight-bold" style={{ color:'#1cc88a' }}>{fmt(r.revenue)}</td>
                    <td className="text-xs font-weight-bold" style={{ color:'#e74a3b' }}>{fmt(r.payouts)}</td>
                    <td className="text-xs font-weight-bold" style={{ color: r.net >= 0 ? '#4e73df' : '#e74a3b' }}>{fmt(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── SECTION: Fraud & Risk ────────────────────────────────────────
function FraudRiskSection() {
  const [flagged,   setFlagged]   = useState([]);
  const [repeaters, setRepeaters] = useState([]);
  const [suspended, setSuspended] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: tickets }, { data: workers }] = await Promise.all([
      supabase.from('support_tickets')
        .select('user_id,user_name,user_email,category,created_at')
        .in('category', ['refund_request','safety_incident','damage_claim'])
        .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString()),
      supabase.from('workers').select('id,full_name,partner_role,verification_status,created_at,email').in('verification_status',['rejected','suspended']),
    ]);

    // Count tickets per user
    const counts = {};
    (tickets||[]).forEach(t => {
      const key = t.user_id || t.user_email;
      if (!key) return;
      if (!counts[key]) counts[key] = { user_id: t.user_id, user_name: t.user_name, user_email: t.user_email, count: 0, categories: [] };
      counts[key].count++;
      if (!counts[key].categories.includes(t.category)) counts[key].categories.push(t.category);
    });
    const reps = Object.values(counts).filter(c => c.count >= 3).sort((a,b) => b.count - a.count);

    setRepeaters(reps);
    setSuspended(workers || []);
    setFlagged((tickets||[]).filter(t => t.category === 'safety_incident'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const suspendPartner = async (id) => {
    if (!window.confirm('Suspend this partner? They will be removed from dispatch and cannot accept jobs.')) return;
    setActing(id);
    const { error } = await supabase.from('workers').update({ verification_status:'suspended', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert(`Failed: ${error.message}`); setActing(null); return; }
    auditLog('partner_suspended', `partner_id=${id}`);
    setActing(null);
    load();
  };

  const reinstatePartner = async (id) => {
    setActing(id);
    const { error } = await supabase.from('workers').update({ verification_status:'approved', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert(`Failed: ${error.message}`); setActing(null); return; }
    auditLog('partner_reinstated', `partner_id=${id}`);
    setActing(null);
    load();
  };

  return (
    <>
      <PageHeader title="Fraud & Risk" sub="Safety incidents, repeat claimants, and suspended partners" />
      <div className="row mb-4">
        <div className="col-md-4 mb-2"><StatCard icon="🚨" label="Safety Incidents (30d)" value={flagged.length}    color="#e74a3b" /></div>
        <div className="col-md-4 mb-2"><StatCard icon="⚠️" label="Repeat Claimants"     value={repeaters.length}  color="#f6c23e" /></div>
        <div className="col-md-4 mb-2"><StatCard icon="🚫" label="Suspended Partners"   value={suspended.length}  color="#9F7AEA" /></div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Safety Incidents */}
          {flagged.length > 0 && (
            <div className="admin-card mb-4">
              <div className="admin-card-header" style={{ background:'rgba(231,74,59,0.08)', color:'#e74a3b', borderLeft:'4px solid #e74a3b' }}>
                🚨 Safety Incidents (last 30 days)
              </div>
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Email</th><th>Date</th></tr></thead>
                <tbody>
                  {flagged.map((t,i) => (
                    <tr key={i}>
                      <td className="font-weight-bold text-xs text-gray-800">{t.user_name||'—'}</td>
                      <td className="text-xs text-gray-500">{t.user_email||'—'}</td>
                      <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('en-KE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Repeat claimants */}
          {repeaters.length > 0 && (
            <div className="admin-card mb-4">
              <div className="admin-card-header" style={{ background:'rgba(246,194,62,0.08)', color:'#C9A020', borderLeft:'4px solid #f6c23e' }}>
                ⚠️ Repeat Claimants — 3+ tickets in 30 days
              </div>
              <table className="admin-table">
                <thead><tr><th>Customer</th><th>Email</th><th>Tickets</th><th>Categories</th></tr></thead>
                <tbody>
                  {repeaters.map((r,i) => (
                    <tr key={i}>
                      <td className="font-weight-bold text-xs text-gray-800">{r.user_name||'—'}</td>
                      <td className="text-xs text-gray-500">{r.user_email||'—'}</td>
                      <td><span className="sb-badge sb-badge-danger">{r.count}</span></td>
                      <td className="text-xs text-gray-600">{r.categories.map(c => c.replace(/_/g,' ')).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Suspended / rejected partners */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ background:'rgba(159,122,234,0.08)', color:'#9F7AEA', borderLeft:'4px solid #9F7AEA' }}>
              🚫 Suspended & Rejected Partners
            </div>
            {suspended.length === 0
              ? <div className="card-body text-xs text-gray-500">No suspended or rejected partners.</div>
              : (
                <table className="admin-table">
                  <thead><tr><th>Partner</th><th>Role</th><th>Status</th><th>Since</th><th>Action</th></tr></thead>
                  <tbody>
                    {suspended.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-weight-bold text-xs text-gray-800">{p.full_name||'—'}</div>
                          <div className="text-xs text-gray-500">{p.email}</div>
                        </td>
                        <td><RoleBadge role={p.partner_role} /></td>
                        <td><SBBadge status={p.verification_status} /></td>
                        <td className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                        <td>
                          {p.verification_status === 'suspended' ? (
                            <button className="btn btn-sm btn-success" style={{ fontSize:11,fontWeight:700 }}
                              disabled={acting===p.id} onClick={() => reinstatePartner(p.id)}>
                              ✅ Reinstate
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-danger" style={{ fontSize:11,fontWeight:700 }}
                              disabled={acting===p.id} onClick={() => suspendPartner(p.id)}>
                              🚫 Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}
    </>
  );
}

// ── SECTION: Dispute Center ───────────────────────────────────────
const RULING_OPTIONS = [
  { value: 'customer_wins', label: '🏆 Customer Wins',  color: '#1cc88a' },
  { value: 'partner_wins',  label: '🏆 Partner Wins',   color: '#4A90D9' },
  { value: 'split',         label: '🤝 Split Decision', color: '#f6c23e' },
  { value: 'dismissed',     label: '🚫 Dismissed',      color: '#6c757d' },
  { value: 'no_fault',      label: '⚖️ No Fault Found', color: '#9F7AEA' },
];
const COMP_OPTIONS = [
  { value: 'full_refund',    label: 'Full Refund to Customer' },
  { value: 'partial_refund', label: 'Partial Refund' },
  { value: 'payout_held',   label: 'Hold Partner Payout' },
  { value: 'none',           label: 'No Compensation' },
];
const DISPUTE_STATUS_FLOW = {
  pending:          { next: 'under_review',  btn: '▶ Start Review',       cls: 'btn-primary'   },
  awaiting_customer:{ next: 'under_review',  btn: '▶ Mark Under Review',  cls: 'btn-warning'   },
  awaiting_partner: { next: 'under_review',  btn: '▶ Mark Under Review',  cls: 'btn-warning'   },
  under_review:     { next: null,            btn: null,                    cls: ''              },
  resolved:         { next: 'under_review',  btn: '↩ Reopen',             cls: 'btn-secondary' },
};

function DisputeCenterSection() {
  const [disputes,  setDisputes]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [ruling,    setRuling]    = useState('');
  const [comp,      setComp]      = useState('none');
  const [note,      setNote]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [newForm,   setNewForm]   = useState({ booking_ref:'', service:'', customer_name:'', customer_email:'', partner_name:'', partner_role:'worker', customer_statement:'', partner_statement:'' });

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase.from('disputes').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q.eq('status', filter);
    const { data } = await q;
    setDisputes(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const selectDispute = (d) => {
    setSelected(d);
    setRuling(d.ruling || '');
    setComp(d.compensation_action || 'none');
    setNote(d.admin_ruling_note || '');
  };

  const advanceStatus = async (d) => {
    const flow = DISPUTE_STATUS_FLOW[d.status];
    if (!flow?.next) return;
    await supabase.from('disputes').update({ status: flow.next, updated_at: new Date().toISOString() }).eq('id', d.id);
    load(); setSelected(null);
  };

  const resolve = async () => {
    if (!ruling) return;
    setSaving(true);
    await supabase.from('disputes').update({
      ruling, compensation_action: comp,
      admin_ruling_note: note,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSaving(false);
    setSelected(null);
    load();
  };

  const createDispute = async () => {
    if (!newForm.booking_ref) return;
    await supabase.from('disputes').insert({
      ...newForm,
      status: newForm.customer_statement && newForm.partner_statement ? 'under_review'
            : newForm.customer_statement ? 'awaiting_partner'
            : 'awaiting_customer',
      customer_submitted_at: newForm.customer_statement ? new Date().toISOString() : null,
      partner_submitted_at:  newForm.partner_statement  ? new Date().toISOString() : null,
    });
    setShowNew(false);
    setNewForm({ booking_ref:'', service:'', customer_name:'', customer_email:'', partner_name:'', partner_role:'worker', customer_statement:'', partner_statement:'' });
    load();
  };

  const STATUS_COLOR = {
    pending:'#f6c23e', awaiting_customer:'#fd7e14', awaiting_partner:'#4A90D9',
    under_review:'#9F7AEA', resolved:'#1cc88a',
  };

  const counts = {};
  disputes.forEach(d => { counts[d.status] = (counts[d.status]||0)+1; });

  return (
    <>
      <PageHeader title="Dispute Center" sub="Two-sided dispute resolution — review both parties, issue a ruling" />

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label:'Pending',       val: counts.pending||0,           color:'#f6c23e' },
          { label:'Awaiting Party',val: (counts.awaiting_customer||0)+(counts.awaiting_partner||0), color:'#fd7e14' },
          { label:'Under Review',  val: counts.under_review||0,      color:'#9F7AEA' },
          { label:'Resolved',      val: counts.resolved||0,          color:'#1cc88a' },
        ].map(s => (
          <div key={s.label} className="col-md-3 mb-2">
            <StatCard icon="⚖️" label={s.label} value={s.val} color={s.color} />
          </div>
        ))}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          {['all','pending','awaiting_customer','awaiting_partner','under_review','resolved'].map(f => (
            <FilterPill key={f} active={filter===f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.replace(/_/g,' ')}
            </FilterPill>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ fontWeight:700 }} onClick={() => setShowNew(true)}>
          + New Dispute
        </button>
      </div>

      {/* New dispute modal */}
      {showNew && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="admin-card" style={{ width:640, maxHeight:'90vh', overflowY:'auto', borderRadius:12 }}>
            <div className="admin-card-header d-flex justify-content-between">
              <span>⚖️ Open New Dispute</span>
              <button onClick={() => setShowNew(false)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#aaa' }}>×</button>
            </div>
            <div className="card-body">
              <div className="row">
                {[['Booking Reference', 'booking_ref'],['Service', 'service'],['Customer Name','customer_name'],['Customer Email','customer_email'],['Partner Name','partner_name']].map(([lbl,key]) => (
                  <div key={key} className="col-md-6 mb-3">
                    <label className="text-xs font-weight-bold text-gray-600">{lbl}</label>
                    <input className="form-control form-control-sm" value={newForm[key]} onChange={e => setNewForm(f=>({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div className="col-md-6 mb-3">
                  <label className="text-xs font-weight-bold text-gray-600">Partner Role</label>
                  <select className="form-control form-control-sm" value={newForm.partner_role} onChange={e => setNewForm(f=>({...f,partner_role:e.target.value}))}>
                    {['worker','vendor','rider','supplier','mover','water_carrier'].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs font-weight-bold text-gray-600">Customer Statement</label>
                <textarea className="form-control" rows={3} style={{ fontSize:12,resize:'none' }} value={newForm.customer_statement} onChange={e => setNewForm(f=>({...f,customer_statement:e.target.value}))} placeholder="Customer's version of events…" />
              </div>
              <div className="mb-3">
                <label className="text-xs font-weight-bold text-gray-600">Partner Statement</label>
                <textarea className="form-control" rows={3} style={{ fontSize:12,resize:'none' }} value={newForm.partner_statement} onChange={e => setNewForm(f=>({...f,partner_statement:e.target.value}))} placeholder="Partner's version of events…" />
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-primary btn-sm" style={{ fontWeight:700 }} onClick={createDispute}>Open Dispute</button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="row">
          {/* List */}
          <div className="col-md-5">
            {disputes.length === 0
              ? <div className="text-center py-5 text-gray-500">No disputes in this view.</div>
              : disputes.map(d => (
                <div key={d.id} className="admin-card mb-2" onClick={() => selectDispute(d)}
                  style={{ borderLeft:`4px solid ${STATUS_COLOR[d.status]||'#aaa'}`, cursor:'pointer', background: selected?.id===d.id?'#f8f9fc':'#fff' }}>
                  <div className="card-body py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="font-weight-bold text-gray-800 text-xs">{d.booking_ref || `Dispute #${d.id.slice(0,8)}`}</div>
                        <div className="text-xs text-gray-500 mt-1">{d.service||'—'} · {d.customer_name||'—'} vs {d.partner_name||'—'}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(d.created_at).toLocaleDateString('en-KE')}</div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <span className="sb-badge" style={{ background:`${STATUS_COLOR[d.status]}18`, color:STATUS_COLOR[d.status], border:`1px solid ${STATUS_COLOR[d.status]}40` }}>
                          {d.status.replace(/_/g,' ')}
                        </span>
                        {d.ruling && (
                          <span className="text-xs" style={{ color: RULING_OPTIONS.find(r=>r.value===d.ruling)?.color }}>
                            {RULING_OPTIONS.find(r=>r.value===d.ruling)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-2">
                      <span className="text-xs" style={{ color: d.customer_submitted_at?'#1cc88a':'#e74a3b' }}>
                        {d.customer_submitted_at?'✅':'⏳'} Customer
                      </span>
                      <span className="text-xs" style={{ color: d.partner_submitted_at?'#1cc88a':'#e74a3b' }}>
                        {d.partner_submitted_at?'✅':'⏳'} Partner
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Detail */}
          <div className="col-md-7">
            {!selected ? (
              <div className="admin-card" style={{ minHeight:400, display:'flex', alignItems:'center', justifyContent:'center', color:'#a0aec0' }}>
                <div className="text-center"><div style={{ fontSize:48, marginBottom:8 }}>⚖️</div><div>Select a dispute to review both sides</div></div>
              </div>
            ) : (
              <div className="admin-card">
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <span>⚖️ {selected.booking_ref || `Dispute #${selected.id.slice(0,8)}`}</span>
                  <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#aaa' }}>×</button>
                </div>
                <div className="card-body">
                  {/* Meta */}
                  <div className="row mb-3">
                    {[['Service',selected.service||'—'],['Customer',selected.customer_name||'—'],['Partner',`${selected.partner_name||'—'} (${selected.partner_role||'—'})`],['Status',selected.status.replace(/_/g,' ')]].map(([k,v])=>(
                      <div key={k} className="col-6 mb-2">
                        <div className="text-xs text-gray-500">{k}</div>
                        <div className="text-xs font-weight-bold text-gray-800">{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two-sided statements */}
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ width:8,height:8,borderRadius:'50%',background:'#1cc88a',display:'inline-block' }}/>
                        <span className="text-xs font-weight-bold" style={{ color:'#1cc88a' }}>CUSTOMER — {selected.customer_name||'—'}</span>
                      </div>
                      <div style={{ background:'rgba(28,200,138,0.05)', border:'1px solid rgba(28,200,138,0.2)', borderRadius:8, padding:'10px 12px', minHeight:100 }}>
                        {selected.customer_statement
                          ? <div className="text-xs text-gray-700" style={{ whiteSpace:'pre-wrap' }}>{selected.customer_statement}</div>
                          : <div className="text-xs text-gray-400 font-italic">No statement submitted yet.</div>}
                      </div>
                      {selected.customer_submitted_at && <div className="text-xs text-gray-400 mt-1">Submitted {new Date(selected.customer_submitted_at).toLocaleString('en-KE')}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ width:8,height:8,borderRadius:'50%',background:'#4A90D9',display:'inline-block' }}/>
                        <span className="text-xs font-weight-bold" style={{ color:'#4A90D9' }}>PARTNER — {selected.partner_name||'—'}</span>
                      </div>
                      <div style={{ background:'rgba(74,144,217,0.05)', border:'1px solid rgba(74,144,217,0.2)', borderRadius:8, padding:'10px 12px', minHeight:100 }}>
                        {selected.partner_statement
                          ? <div className="text-xs text-gray-700" style={{ whiteSpace:'pre-wrap' }}>{selected.partner_statement}</div>
                          : <div className="text-xs text-gray-400 font-italic">No statement submitted yet.</div>}
                      </div>
                      {selected.partner_submitted_at && <div className="text-xs text-gray-400 mt-1">Submitted {new Date(selected.partner_submitted_at).toLocaleString('en-KE')}</div>}
                    </div>
                  </div>

                  {/* Advance status */}
                  {DISPUTE_STATUS_FLOW[selected.status]?.btn && selected.status !== 'under_review' && (
                    <button className={`btn btn-sm ${DISPUTE_STATUS_FLOW[selected.status].cls} mb-3`}
                      style={{ fontWeight:700 }} onClick={() => advanceStatus(selected)}>
                      {DISPUTE_STATUS_FLOW[selected.status].btn}
                    </button>
                  )}

                  {/* Ruling panel */}
                  {selected.status !== 'resolved' && (
                    <div style={{ background:'#f8f9fc', border:'1px solid #e3e6f0', borderRadius:8, padding:'14px' }}>
                      <div className="font-weight-bold text-xs text-gray-800 mb-3">ISSUE RULING</div>
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 d-block">Decision</label>
                        <div className="d-flex flex-wrap gap-2">
                          {RULING_OPTIONS.map(r => (
                            <button key={r.value} onClick={() => setRuling(r.value)}
                              className="btn btn-sm" style={{ fontSize:11, fontWeight:700, background: ruling===r.value?r.color:'transparent', color: ruling===r.value?'#fff':r.color, border:`1.5px solid ${r.color}` }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 d-block">Compensation Action</label>
                        <select className="form-control form-control-sm" value={comp} onChange={e => setComp(e.target.value)} style={{ fontSize:12 }}>
                          {COMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="text-xs text-gray-500 mb-1 d-block">Admin Note (visible to both parties)</label>
                        <textarea className="form-control" rows={3} style={{ fontSize:12,resize:'none' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain your ruling…" />
                      </div>
                      <button className="btn btn-success btn-sm" style={{ fontWeight:700 }} disabled={!ruling || saving} onClick={resolve}>
                        ⚖️ {saving ? 'Saving…' : 'Issue Ruling & Resolve'}
                      </button>
                    </div>
                  )}

                  {/* Show existing ruling */}
                  {selected.status === 'resolved' && selected.ruling && (
                    <div style={{ background:'rgba(28,200,138,0.06)', border:'1px solid rgba(28,200,138,0.2)', borderRadius:8, padding:'14px' }}>
                      <div className="font-weight-bold text-xs mb-2" style={{ color:'#1cc88a' }}>RULING ISSUED</div>
                      <div className="text-xs font-weight-bold text-gray-800">{RULING_OPTIONS.find(r=>r.value===selected.ruling)?.label}</div>
                      {selected.compensation_action && <div className="text-xs text-gray-600 mt-1">Action: {COMP_OPTIONS.find(o=>o.value===selected.compensation_action)?.label}</div>}
                      {selected.admin_ruling_note && <div className="text-xs text-gray-600 mt-2">{selected.admin_ruling_note}</div>}
                      <div className="text-xs text-gray-400 mt-2">Resolved {new Date(selected.resolved_at).toLocaleString('en-KE')}</div>
                      <button className="btn btn-outline-secondary btn-sm mt-2" style={{ fontSize:11 }} onClick={() => advanceStatus(selected)}>↩ Reopen</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Dispatch & Tracking Center ───────────────────────────
function DispatchSection() {
  const [tab,       setTab]       = useState('queue');
  const [bookings,  setBookings]  = useState([]);
  const [active,    setActive]    = useState([]);
  const [partners,  setPartners]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [search,    setSearch]    = useState('');
  const [roleF,     setRoleF]     = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: unassigned }, { data: inProgress }, { data: wk }] = await Promise.all([
      supabase.from('bookings')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .is('worker_id', null)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase.from('bookings')
        .select('*')
        .in('status', ['confirmed', 'on_way', 'in_progress', 'arrived'])
        .not('worker_id', 'is', null)
        .order('booking_date', { ascending: true })
        .limit(200),
      supabase.from('workers')
        .select('id,full_name,partner_role,status,city,rating,total_jobs,current_lat,current_lng,can_receive_jobs,wallet_balance,security_deposit_status')
        .eq('verification_status', 'approved')
        .order('rating', { ascending: false }),
    ]);
    setBookings(unassigned || []);
    setActive(inProgress || []);
    setPartners(wk || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── realtime: re-fetch when bookings change ──
  useEffect(() => {
    const ch = supabase.channel('dispatch-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  const assignPartner = async (bookingId, partnerId, partnerName, partnerBlocked) => {
    if (partnerBlocked) {
      alert(`Cannot assign ${partnerName} — their wallet/deposit is below the minimum required. Ask them to top up first.`);
      return;
    }
    setAssigning(bookingId);
    const { error } = await supabase.from('bookings').update({
      worker_id:   partnerId,
      worker_name: partnerName,
      status:      'confirmed',
      updated_at:  new Date().toISOString(),
    }).eq('id', bookingId);
    if (error) { alert(`Assignment failed: ${error.message}`); setAssigning(null); return; }
    auditLog('booking_assigned', `booking=${bookingId} partner=${partnerName}`);
    setAssigning(null);
    setSelected(null);
    load();
  };

  // delayed = past booking_date + not completed/cancelled + assigned
  const now = new Date();
  const delayed = active.filter(b => {
    if (!b.booking_date) return false;
    const scheduled = new Date(`${b.booking_date}T${b.booking_time || '23:59'}:00`);
    return scheduled < now && !['completed','cancelled'].includes(b.status);
  });

  const ROLE_COLORS = { worker:'#4A90D9', vendor:'#F6AD55', rider:'#48BB78', supplier:'#FC8181', mover:'#9F7AEA', water_carrier:'#00B5D8' };
  const ROLE_ICONS  = { worker:'🔧', vendor:'🏪', rider:'🚗', supplier:'📦', mover:'🚚', water_carrier:'🚰' };

  // workforce stats
  const online   = partners.filter(p => p.status === 'online').length;
  const busy     = partners.filter(p => ['on_way','in_progress','confirmed'].includes(p.status)).length;
  const offline  = partners.filter(p => !['online','on_way','in_progress','confirmed'].includes(p.status)).length;

  // analytics
  const totalDispatched = active.length + bookings.length;
  const completionRate  = totalDispatched > 0
    ? Math.round((active.filter(b => b.status === 'completed').length / totalDispatched) * 100)
    : 0;
  const byRole = Object.entries(ROLE_ICONS).map(([role, icon]) => ({
    role, icon,
    color:    ROLE_COLORS[role],
    online:   partners.filter(p => p.partner_role === role && p.status === 'online').length,
    busy:     partners.filter(p => p.partner_role === role && ['on_way','in_progress','confirmed'].includes(p.status)).length,
    total:    partners.filter(p => p.partner_role === role).length,
    jobs:     active.filter(b => b.worker_id && partners.find(p => p.id === b.worker_id && p.partner_role === role)).length,
  })).filter(r => r.total > 0);

  // partner picker (shared between queue + reassign)
  const filteredPartners = partners.filter(p =>
    (roleF === 'all' || p.partner_role === roleF) &&
    (!search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  const PartnerPicker = ({ booking, onClose }) => (
    <div className="admin-card" style={{ position:'sticky', top:0 }}>
      <div className="admin-card-header d-flex justify-content-between align-items-center">
        <span>📡 {booking.worker_id ? 'Reassign' : 'Assign'} — {booking.service || booking.sub_service || 'Booking'}</span>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa' }}>×</button>
      </div>
      <div className="card-body">
        <div className="mb-3 p-3" style={{ background:'#f8f9fc', borderRadius:8, fontSize:12 }}>
          <div><strong>📍</strong> {booking.address || '—'}</div>
          <div><strong>📅</strong> {booking.booking_date || '—'} {booking.booking_time ? `at ${booking.booking_time}` : ''}</div>
          {booking.worker_name && <div className="mt-1"><strong>Current:</strong> {booking.worker_name}</div>}
          {booking.notes && <div className="text-gray-500 mt-1">Note: {booking.notes}</div>}
        </div>
        <div className="d-flex gap-2 mb-2">
          <input className="form-control form-control-sm flex-grow-1" placeholder="Search name or city…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize:12 }} />
          <select className="form-control form-control-sm" style={{ fontSize:12, width:'auto' }}
            value={roleF} onChange={e => setRoleF(e.target.value)}>
            <option value="all">All roles</option>
            {Object.entries(ROLE_ICONS).map(([r,i]) => <option key={r} value={r}>{i} {r}</option>)}
          </select>
        </div>
        <div style={{ maxHeight:340, overflowY:'auto' }}>
          {filteredPartners.length === 0
            ? <div className="text-xs text-gray-500 py-3">No partners match.</div>
            : filteredPartners.map(p => (
              <div key={p.id} className="d-flex align-items-center py-2 border-bottom">
                <div style={{ width:8, height:8, borderRadius:'50%', background:ROLE_COLORS[p.partner_role]||'#aaa', marginRight:8, flexShrink:0 }} />
                <div className="flex-grow-1" style={{ minWidth:0 }}>
                  <div className="font-weight-bold text-xs text-gray-800">{p.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {ROLE_ICONS[p.partner_role]} {p.city||'—'} · ⭐{p.rating||'—'} · {p.total_jobs||0} jobs
                  </div>
                </div>
                <span className="text-xs mr-2 font-weight-bold" style={{ color: p.status==='online'?'#1cc88a': ['on_way','in_progress'].includes(p.status)?'#F6AD55':'#aaa', whiteSpace:'nowrap' }}>
                  {p.status==='online'?'🟢 Free': ['on_way','in_progress'].includes(p.status)?'🟡 Busy':'⚫ Offline'}
                </span>
                {p.can_receive_jobs === false && (
                  <span className="badge badge-danger text-xs mr-1" title="Wallet/deposit below minimum">🔒</span>
                )}
                <button className="btn btn-sm btn-primary" style={{ fontSize:11, fontWeight:700, whiteSpace:'nowrap', opacity: p.can_receive_jobs === false ? 0.45 : 1 }}
                  disabled={assigning === booking.id}
                  onClick={() => assignPartner(booking.id, p.id, p.full_name, p.can_receive_jobs === false)}>
                  {assigning === booking.id ? '…' : booking.worker_id ? 'Reassign' : 'Assign'}
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  const TABS = [
    { id:'queue',     label:`📋 Queue`,          badge: bookings.length,         badgeColor:'#e74a3b' },
    { id:'active',    label:`🔧 Active Jobs`,     badge: active.length,           badgeColor:'#1cc88a' },
    { id:'delayed',   label:`⚠️ Delayed`,         badge: delayed.length,          badgeColor: delayed.length > 0 ? '#e74a3b' : '#6c757d' },
    { id:'workforce', label:`👥 Workforce`,        badge: `${online} online`,      badgeColor:'#1cc88a', badgeText:true },
    { id:'analytics', label:`📊 Analytics`,        badge: null },
  ];

  return (
    <>
      <PageHeader title="📡 Dispatch & Tracking Center" sub="Real-time job assignment, workforce monitoring and dispatch analytics" />

      {/* KPI bar */}
      <div className="row mb-3">
        {[
          { icon:'📋', label:'Queue',          val:bookings.length,  color:'#e74a3b' },
          { icon:'🔧', label:'Active Jobs',    val:active.length,    color:'#1cc88a' },
          { icon:'⚠️', label:'Delayed',        val:delayed.length,   color: delayed.length > 0 ? '#e74a3b' : '#6c757d' },
          { icon:'🟢', label:'Online Partners',val:online,           color:'#1cc88a' },
          { icon:'🟡', label:'Busy Partners',  val:busy,             color:'#F6AD55' },
          { icon:'👥', label:'Total Partners', val:partners.length,  color:'#4e73df' },
        ].map(s => (
          <div key={s.label} className="col-md-2 col-sm-4 mb-2">
            <div className="admin-card"><div className="card-body py-2 text-center">
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="d-flex mb-3 flex-wrap" style={{ gap:6, borderBottom:'2px solid #e3e6f0', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
            style={{
              background:'none', border:'none', fontFamily:'inherit', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight:700, color: tab===t.id?'#C9A020':'#6c757d',
              borderBottom: tab===t.id?'3px solid #C9A020':'3px solid transparent',
              marginBottom:-2, display:'flex', alignItems:'center', gap:6,
            }}>
            {t.label}
            {t.badge != null && (
              <span style={{ background:t.badgeColor+'20', color:t.badgeColor, border:`1px solid ${t.badgeColor}40`,
                fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:999 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
        <button onClick={() => window.dispatchEvent(new CustomEvent('fixera-nav', { detail:'live_ops' }))}
          style={{ marginLeft:'auto', background:'#0A0E1A', border:'1px solid rgba(255,255,255,0.15)',
            color:'#48BB78', fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:8,
            cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
          🗺️ Live Map
        </button>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ── TAB: Queue ── */}
          {tab === 'queue' && (
            <div className="row">
              <div className="col-md-5">
                <div className="font-weight-bold text-xs text-gray-600 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                  Unassigned Bookings ({bookings.length})
                </div>
                {bookings.length === 0
                  ? <div className="admin-card p-4 text-center text-gray-500 text-xs">✅ All bookings are assigned!</div>
                  : bookings.map(b => {
                    const ageHrs = Math.round((now - new Date(b.created_at)) / 3600000);
                    return (
                      <div key={b.id} className="admin-card mb-2" onClick={() => setSelected(b)}
                        style={{ borderLeft:`4px solid ${selected?.id===b.id?'#4e73df':ageHrs>4?'#e74a3b':'#e3e6f0'}`, cursor:'pointer', background:selected?.id===b.id?'#f0f4ff':'#fff' }}>
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="font-weight-bold text-gray-800 text-xs">{b.service || b.sub_service || 'Booking'}</div>
                            {ageHrs > 4 && <span style={{ fontSize:9, fontWeight:800, background:'#ffe4e4', color:'#e74a3b', padding:'2px 6px', borderRadius:4 }}>⏰ {ageHrs}h old</span>}
                          </div>
                          <div className="text-xs text-gray-500">📍 {b.address || '—'}</div>
                          <div className="text-xs text-gray-500">📅 {b.booking_date || '—'} {b.booking_time ? `at ${b.booking_time}` : ''}</div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <SBBadge status={b.status} />
                            <span className="text-xs" style={{ color:ageHrs>4?'#e74a3b':'#aaa' }}>
                              {ageHrs < 1 ? 'Just now' : `${ageHrs}h ago`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="col-md-7">
                {selected
                  ? <PartnerPicker booking={selected} onClose={() => setSelected(null)} />
                  : <div className="admin-card" style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#a0aec0' }}>
                      <div className="text-center"><div style={{ fontSize:40, marginBottom:8 }}>👈</div><div>Select a booking to assign a partner</div></div>
                    </div>
                }
              </div>
            </div>
          )}

          {/* ── TAB: Active Jobs ── */}
          {tab === 'active' && (
            <div className="row">
              <div className={selected ? 'col-md-6' : 'col-12'}>
                {active.length === 0
                  ? <div className="text-center py-5"><div style={{fontSize:48}}>✅</div><p className="text-gray-500 mt-2">No active jobs right now</p></div>
                  : (
                    <div className="admin-card">
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead>
                            <tr><th>Service</th><th>Address</th><th>Partner</th><th>Date</th><th>Status</th><th>Action</th></tr>
                          </thead>
                          <tbody>
                            {active.map(b => {
                              const partner = partners.find(p => p.id === b.worker_id);
                              return (
                                <tr key={b.id} style={{ background: selected?.id===b.id ? '#f0f4ff' : undefined }}>
                                  <td className="font-weight-bold text-xs">{b.service || b.sub_service || '—'}</td>
                                  <td className="text-xs text-gray-600" style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.address||'—'}</td>
                                  <td className="text-xs">
                                    {partner
                                      ? <span><span style={{ color:ROLE_COLORS[partner.partner_role]||'#aaa' }}>{ROLE_ICONS[partner.partner_role]}</span> {partner.full_name}</span>
                                      : <span className="text-gray-400">{b.worker_name || '—'}</span>}
                                  </td>
                                  <td className="text-xs text-gray-500">{b.booking_date||'—'}</td>
                                  <td><SBBadge status={b.status} /></td>
                                  <td>
                                    <button className="btn btn-xs btn-outline-warning" style={{ fontSize:10, fontWeight:700, padding:'2px 8px' }}
                                      onClick={() => setSelected(selected?.id===b.id ? null : b)}>
                                      {selected?.id===b.id ? 'Close' : '↔ Reassign'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }
              </div>
              {selected && (
                <div className="col-md-6">
                  <PartnerPicker booking={selected} onClose={() => setSelected(null)} />
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Delayed Jobs ── */}
          {tab === 'delayed' && (
            <div className="row">
              <div className={selected ? 'col-md-6' : 'col-12'}>
                {delayed.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize:48 }}>✅</div>
                    <p className="text-gray-500 mt-2 font-weight-bold">No delayed jobs!</p>
                    <p className="text-gray-400 text-xs">Jobs past their scheduled time appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 p-3" style={{ background:'#fff5f5', border:'1px solid #fed7d7', borderRadius:10 }}>
                      <div className="font-weight-bold text-xs" style={{ color:'#e74a3b' }}>
                        ⚠️ {delayed.length} job{delayed.length!==1?'s':''} past their scheduled time and still in progress.
                      </div>
                    </div>
                    <div className="admin-card">
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead>
                            <tr><th>Service</th><th>Scheduled</th><th>Partner</th><th>Status</th><th>Overdue</th><th>Action</th></tr>
                          </thead>
                          <tbody>
                            {delayed.map(b => {
                              const scheduled = new Date(`${b.booking_date}T${b.booking_time || '23:59'}:00`);
                              const hrsLate   = Math.round((now - scheduled) / 3600000);
                              const partner   = partners.find(p => p.id === b.worker_id);
                              return (
                                <tr key={b.id} style={{ background: selected?.id===b.id ? '#fff0f0' : undefined }}>
                                  <td className="font-weight-bold text-xs">{b.service || b.sub_service || '—'}</td>
                                  <td className="text-xs text-gray-600">{b.booking_date} {b.booking_time||''}</td>
                                  <td className="text-xs">{partner?.full_name || b.worker_name || <span className="text-gray-400">Unassigned</span>}</td>
                                  <td><SBBadge status={b.status} /></td>
                                  <td>
                                    <span style={{ background:'#ffe4e4', color:'#e74a3b', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:999 }}>
                                      {hrsLate}h late
                                    </span>
                                  </td>
                                  <td>
                                    <button className="btn btn-xs btn-outline-danger" style={{ fontSize:10, fontWeight:700, padding:'2px 8px' }}
                                      onClick={() => setSelected(selected?.id===b.id ? null : b)}>
                                      {selected?.id===b.id ? 'Close' : '↔ Reassign'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {selected && (
                <div className="col-md-6">
                  <PartnerPicker booking={selected} onClose={() => setSelected(null)} />
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Workforce Status ── */}
          {tab === 'workforce' && (
            <>
              {/* Summary by role */}
              <div className="row mb-4">
                {byRole.map(r => (
                  <div key={r.role} className="col-md-4 col-sm-6 mb-3">
                    <div className="admin-card">
                      <div className="card-body py-3">
                        <div className="d-flex align-items-center mb-2">
                          <span style={{ fontSize:22, marginRight:8 }}>{r.icon}</span>
                          <div>
                            <div className="font-weight-bold text-gray-800 text-sm">{ROLE_LABEL[r.role]||r.role}</div>
                            <div className="text-xs text-gray-500">{r.total} total partners</div>
                          </div>
                        </div>
                        <div className="d-flex" style={{ gap:8 }}>
                          <div style={{ flex:1, textAlign:'center', padding:'8px 6px', background:'rgba(28,200,138,0.08)', borderRadius:8, border:'1px solid rgba(28,200,138,0.2)' }}>
                            <div style={{ color:'#1cc88a', fontSize:20, fontWeight:900 }}>{r.online}</div>
                            <div style={{ fontSize:9, color:'#6c757d', fontWeight:700 }}>ONLINE</div>
                          </div>
                          <div style={{ flex:1, textAlign:'center', padding:'8px 6px', background:'rgba(246,173,85,0.08)', borderRadius:8, border:'1px solid rgba(246,173,85,0.2)' }}>
                            <div style={{ color:'#F6AD55', fontSize:20, fontWeight:900 }}>{r.busy}</div>
                            <div style={{ fontSize:9, color:'#6c757d', fontWeight:700 }}>BUSY</div>
                          </div>
                          <div style={{ flex:1, textAlign:'center', padding:'8px 6px', background:'rgba(231,74,59,0.06)', borderRadius:8, border:'1px solid rgba(231,74,59,0.15)' }}>
                            <div style={{ color:'#e74a3b', fontSize:20, fontWeight:900 }}>{r.jobs}</div>
                            <div style={{ fontSize:9, color:'#6c757d', fontWeight:700 }}>JOBS</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full partner grid */}
              <div className="font-weight-bold text-xs text-gray-600 mb-2 text-uppercase" style={{ letterSpacing:1 }}>
                All Partners ({partners.length})
              </div>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Role</th><th>Status</th><th>City</th><th>Rating</th><th>Jobs Done</th><th>GPS</th></tr>
                    </thead>
                    <tbody>
                      {partners.map(p => {
                        const statusColor = p.status==='online'?'#1cc88a': ['on_way','in_progress','confirmed'].includes(p.status)?'#F6AD55':'#aaa';
                        const statusLabel = p.status==='online'?'🟢 Free': p.status==='on_way'?'🚗 On Way': p.status==='in_progress'?'🔧 On Job': p.status==='confirmed'?'✅ Assigned':'⚫ Offline';
                        return (
                          <tr key={p.id}>
                            <td className="font-weight-bold text-xs text-gray-800">{p.full_name||'—'}</td>
                            <td><RoleBadge role={p.partner_role||'worker'} /></td>
                            <td><span style={{ fontSize:11, fontWeight:700, color:statusColor }}>{statusLabel}</span></td>
                            <td className="text-xs text-gray-600">{p.city||'—'}</td>
                            <td className="text-xs text-gray-600">⭐ {p.rating||'—'}</td>
                            <td className="text-xs text-gray-600">{p.total_jobs||0}</td>
                            <td className="text-xs">
                              {p.current_lat
                                ? <span style={{ color:'#1cc88a', fontWeight:700 }}>✅ Active</span>
                                : <span style={{ color:'#aaa' }}>No GPS</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: Analytics ── */}
          {tab === 'analytics' && (() => {
            const statusCounts = ['pending','confirmed','on_way','in_progress','completed','cancelled'].map(s => ({
              status: s,
              count:  [...bookings, ...active].filter(b => b.status === s).length,
            }));
            const avgAgeHrs = bookings.length > 0
              ? Math.round(bookings.reduce((sum, b) => sum + (now - new Date(b.created_at)) / 3600000, 0) / bookings.length)
              : 0;
            const topPartners = partners
              .filter(p => p.total_jobs > 0)
              .sort((a, b) => b.total_jobs - a.total_jobs)
              .slice(0, 10);

            return (
              <>
                <div className="row mb-4">
                  {[
                    { icon:'📋', label:'In Queue',           val:bookings.length,  color:'#e74a3b', sub:'Awaiting assignment' },
                    { icon:'🔧', label:'Active Right Now',   val:active.length,    color:'#1cc88a', sub:'Confirmed + in progress' },
                    { icon:'⚠️', label:'Delayed',            val:delayed.length,   color:delayed.length>0?'#e74a3b':'#6c757d', sub:'Past scheduled time' },
                    { icon:'⏱️', label:'Avg Queue Age',      val:`${avgAgeHrs}h`,  color:avgAgeHrs>2?'#e74a3b':'#4e73df', sub:'Time unassigned' },
                    { icon:'🟢', label:'Partners Available', val:online,           color:'#1cc88a', sub:'Online & free' },
                    { icon:'📊', label:'Workforce Capacity', val:`${partners.length>0?Math.round((online/partners.length)*100):0}%`, color:'#4e73df', sub:'Online / total' },
                  ].map(s => (
                    <div key={s.label} className="col-md-4 col-sm-6 mb-3">
                      <div className="admin-card"><div className="card-body py-3">
                        <div className="d-flex align-items-center mb-1">
                          <span style={{ fontSize:20, marginRight:8 }}>{s.icon}</span>
                          <div className="text-xs text-gray-500 text-uppercase font-weight-bold" style={{ letterSpacing:0.8 }}>{s.label}</div>
                        </div>
                        <div style={{ fontSize:28, fontWeight:900, color:s.color }}>{s.val}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
                      </div></div>
                    </div>
                  ))}
                </div>

                <div className="row">
                  {/* Job status breakdown */}
                  <div className="col-md-6 mb-3">
                    <div className="admin-card">
                      <div className="admin-card-header">Jobs by Status</div>
                      <div className="card-body">
                        {statusCounts.filter(s=>s.count>0).map(s => {
                          const total = statusCounts.reduce((a,c)=>a+c.count,0)||1;
                          const pct   = Math.round((s.count/total)*100);
                          const color = {pending:'#6c757d',confirmed:'#63B3ED',on_way:'#48BB78',in_progress:'#F6AD55',completed:'#1cc88a',cancelled:'#e74a3b'}[s.status]||'#aaa';
                          return (
                            <div key={s.status} className="mb-2">
                              <div className="d-flex justify-content-between text-xs mb-1">
                                <span className="font-weight-bold text-gray-700">{s.status.replace('_',' ')}</span>
                                <span style={{ color }}>{s.count} ({pct}%)</span>
                              </div>
                              <div style={{ background:'#e9ecef', borderRadius:4, height:8 }}>
                                <div style={{ background:color, width:`${pct}%`, height:8, borderRadius:4, transition:'width 0.4s' }} />
                              </div>
                            </div>
                          );
                        })}
                        {statusCounts.every(s=>s.count===0) && <div className="text-xs text-gray-500">No job data</div>}
                      </div>
                    </div>
                  </div>

                  {/* Role coverage */}
                  <div className="col-md-6 mb-3">
                    <div className="admin-card">
                      <div className="admin-card-header">Workforce by Role</div>
                      <div className="card-body">
                        {byRole.map(r => (
                          <div key={r.role} className="d-flex align-items-center mb-2 py-1 border-bottom">
                            <span style={{ width:24, fontSize:16 }}>{r.icon}</span>
                            <div className="flex-grow-1 text-xs text-gray-700 font-weight-bold ml-2">{ROLE_LABEL[r.role]||r.role}</div>
                            <span style={{ fontSize:10, fontWeight:700, color:'#1cc88a', background:'rgba(28,200,138,0.1)', padding:'2px 8px', borderRadius:4, marginRight:4 }}>{r.online} free</span>
                            <span style={{ fontSize:10, fontWeight:700, color:'#F6AD55', background:'rgba(246,173,85,0.1)', padding:'2px 8px', borderRadius:4, marginRight:4 }}>{r.busy} busy</span>
                            <span style={{ fontSize:10, fontWeight:700, color:'#6c757d' }}>{r.total} total</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top partners by jobs */}
                  <div className="col-12">
                    <div className="admin-card">
                      <div className="admin-card-header">🏆 Top Partners by Jobs Completed</div>
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead><tr><th>#</th><th>Name</th><th>Role</th><th>City</th><th>Jobs</th><th>Rating</th><th>Status</th></tr></thead>
                          <tbody>
                            {topPartners.map((p, i) => (
                              <tr key={p.id}>
                                <td className="text-xs font-weight-bold text-gray-400">#{i+1}</td>
                                <td className="font-weight-bold text-xs text-gray-800">{p.full_name}</td>
                                <td><RoleBadge role={p.partner_role} /></td>
                                <td className="text-xs text-gray-600">{p.city||'—'}</td>
                                <td className="font-weight-bold text-xs" style={{ color:'#4e73df' }}>{p.total_jobs}</td>
                                <td className="text-xs">⭐ {p.rating||'—'}</td>
                                <td className="text-xs font-weight-bold" style={{ color: p.status==='online'?'#1cc88a':'#aaa' }}>
                                  {p.status==='online'?'🟢':p.status==='on_way'?'🚗':p.status==='in_progress'?'🔧':'⚫'}
                                </td>
                              </tr>
                            ))}
                            {topPartners.length===0 && <tr><td colSpan={7} className="text-xs text-gray-500 text-center py-3">No data yet</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </>
  );
}

// ── SECTION: Partner Earnings Statements ──────────────────────────
function PartnerEarningsSection() {
  const [partners,  setPartners]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [monthly,   setMonthly]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: wk }, { data: py }] = await Promise.all([
        supabase.from('workers').select('id,full_name,partner_role,email,city,rating').eq('verification_status','approved'),
        supabase.from('payouts').select('worker_id,amount,status,created_at').in('status',['completed','paid']),
      ]);
      const earningsMap = {};
      (py||[]).forEach(p => {
        if (!earningsMap[p.worker_id]) earningsMap[p.worker_id] = 0;
        earningsMap[p.worker_id] += parseFloat(p.amount)||0;
      });
      const result = (wk||[]).map(w => ({ ...w, total_earned: earningsMap[w.id]||0 }))
        .sort((a,b) => b.total_earned - a.total_earned);
      setPartners(result);
      setLoading(false);
    };
    load();
  }, []);

  const loadDetail = async (partner) => {
    setSelected(partner);
    setDetailLoading(true);
    const { data } = await supabase.from('payouts').select('amount,status,created_at,reference')
      .eq('worker_id', partner.id).order('created_at', { ascending: false });
    // Bucket by month
    const months = {};
    (data||[]).forEach(p => {
      const m = p.created_at?.slice(0,7);
      if (!m) return;
      if (!months[m]) months[m] = { month:m, paid:0, pending:0, count:0 };
      months[m].count++;
      if (['completed','paid'].includes(p.status)) months[m].paid += parseFloat(p.amount)||0;
      else months[m].pending += parseFloat(p.amount)||0;
    });
    setMonthly(Object.values(months).sort((a,b) => b.month.localeCompare(a.month)));
    setDetailLoading(false);
  };

  const fmt = v => `KES ${Number(v||0).toLocaleString('en-KE',{maximumFractionDigits:0})}`;
  const filtered = partners.filter(p => roleFilter==='all' || p.partner_role===roleFilter);

  return (
    <>
      <PageHeader title="Partner Earnings" sub="Total earnings and monthly payout statements per partner" />
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {['all','worker','vendor','rider','supplier','mover','water_carrier'].map(r => (
          <FilterPill key={r} active={roleFilter===r} onClick={() => setRoleFilter(r)}>
            {r==='all'?'All':ROLE_LABEL[r]||r}
          </FilterPill>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="row">
          {/* Partner list */}
          <div className="col-md-5">
            {filtered.map((p,i) => (
              <div key={p.id} className="admin-card mb-2" onClick={() => loadDetail(p)}
                style={{ borderLeft:`4px solid ${ROLE_COLOR[p.partner_role]||'#aaa'}`, cursor:'pointer', background:selected?.id===p.id?'#f8f9fc':'#fff' }}>
                <div className="card-body py-2 d-flex align-items-center justify-content-between">
                  <div>
                    <div className="font-weight-bold text-gray-800 text-xs">
                      <span className="text-gray-400 mr-1">#{i+1}</span>{p.full_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1"><RoleBadge role={p.partner_role} /> · {p.city||'—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-weight-bold text-xs" style={{ color: ROLE_COLOR[p.partner_role]||'#4e73df' }}>{fmt(p.total_earned)}</div>
                    <div className="text-xs text-gray-400">total paid out</div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-5 text-gray-500 text-xs">No partners found.</div>}
          </div>

          {/* Earnings detail */}
          <div className="col-md-7">
            {!selected ? (
              <div className="admin-card" style={{ minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', color:'#a0aec0' }}>
                <div className="text-center"><div style={{ fontSize:40, marginBottom:8 }}>💼</div><div>Select a partner to view their earnings statement</div></div>
              </div>
            ) : (
              <div className="admin-card">
                <div className="admin-card-header d-flex justify-content-between align-items-center">
                  <span>💼 {selected.full_name} — Earnings Statement</span>
                  <button onClick={() => setSelected(null)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#aaa' }}>×</button>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-6 mb-2"><div className="text-xs text-gray-500">Role</div><div className="text-xs font-weight-bold"><RoleBadge role={selected.partner_role} /></div></div>
                    <div className="col-6 mb-2"><div className="text-xs text-gray-500">Email</div><div className="text-xs font-weight-bold text-gray-800">{selected.email||'—'}</div></div>
                    <div className="col-6 mb-2"><div className="text-xs text-gray-500">Total Earned</div><div className="font-weight-bold" style={{ color:'#1cc88a' }}>{fmt(selected.total_earned)}</div></div>
                    <div className="col-6 mb-2"><div className="text-xs text-gray-500">Rating</div><div className="text-xs font-weight-bold text-gray-800">⭐ {selected.rating||'—'}</div></div>
                  </div>
                  {detailLoading ? <Spinner /> : (
                    <>
                      {monthly.length === 0
                        ? <div className="text-xs text-gray-500">No payout records found.</div>
                        : (
                          <>
                            <div className="admin-card mb-3">
                              <div className="card-body p-2">
                                <ResponsiveContainer width="100%" height={180}>
                                  <BarChart data={[...monthly].reverse()} margin={{ top:8, right:8, left:0, bottom:0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                                    <XAxis dataKey="month" tick={{ fontSize:10 }} />
                                    <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                                    <Tooltip formatter={v => fmt(v)} />
                                    <Bar dataKey="paid" fill="#1cc88a" name="Paid Out" radius={[3,3,0,0]} />
                                    <Bar dataKey="pending" fill="#f6c23e" name="Pending" radius={[3,3,0,0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <table className="admin-table">
                              <thead><tr><th>Month</th><th>Paid Out</th><th>Pending</th><th>Transactions</th></tr></thead>
                              <tbody>
                                {monthly.map(m => (
                                  <tr key={m.month}>
                                    <td className="text-xs font-weight-bold text-gray-700">{m.month}</td>
                                    <td className="text-xs font-weight-bold" style={{ color:'#1cc88a' }}>{fmt(m.paid)}</td>
                                    <td className="text-xs" style={{ color:'#f6c23e' }}>{fmt(m.pending)}</td>
                                    <td className="text-xs text-gray-600">{m.count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── SECTION: Tax Report ───────────────────────────────────────────
const VAT_RATE = 0.16;

function TaxReportSection() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('this_year');
  const [totals,  setTotals]  = useState({ gross:0, vat:0, net:0, commission:0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const now = new Date();
      let from, to;
      if (period === 'this_year') {
        from = new Date(now.getFullYear(),0,1).toISOString();
        to   = new Date(now.getFullYear(),11,31,23,59,59).toISOString();
      } else if (period === 'last_year') {
        from = new Date(now.getFullYear()-1,0,1).toISOString();
        to   = new Date(now.getFullYear()-1,11,31,23,59,59).toISOString();
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        to   = now.toISOString();
      }

      const { data } = await supabase.from('payments').select('amount,created_at,status').eq('status','paid').gte('created_at',from).lte('created_at',to);

      // Monthly buckets
      const months = {};
      (data||[]).forEach(p => {
        const m = p.created_at?.slice(0,7);
        if (!m) return;
        if (!months[m]) months[m] = { month:m, gross:0, count:0 };
        months[m].gross  += parseFloat(p.amount)||0;
        months[m].count++;
      });

      const result = Object.values(months).sort((a,b) => a.month.localeCompare(b.month)).map(m => ({
        ...m,
        vat:        m.gross * VAT_RATE,
        net:        m.gross * (1 - VAT_RATE),
        commission: m.gross * 0.15, // 15% platform commission — adjust as needed
      }));

      const tot = result.reduce((s,m) => ({ gross:s.gross+m.gross, vat:s.vat+m.vat, net:s.net+m.net, commission:s.commission+m.commission }), { gross:0,vat:0,net:0,commission:0 });

      setRows(result);
      setTotals(tot);
      setLoading(false);
    };
    load();
  }, [period]);

  const fmt = v => `KES ${Number(v||0).toLocaleString('en-KE',{maximumFractionDigits:0})}`;

  return (
    <>
      <PageHeader title="Tax Report" sub={`VAT @ ${VAT_RATE*100}% · Platform commission @ 15% · Select period below`} />
      <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
        {[['this_month','This Month'],['this_year','This Year'],['last_year','Last Year']].map(([val,lbl]) => (
          <FilterPill key={val} active={period===val} onClick={() => setPeriod(val)}>{lbl}</FilterPill>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <>
          <div className="row mb-4">
            <div className="col-md-3 mb-2"><StatCard icon="💰" label="Gross Revenue"    value={fmt(totals.gross)}      color="#4e73df" /></div>
            <div className="col-md-3 mb-2"><StatCard icon="🧾" label={`VAT (${VAT_RATE*100}%)`} value={fmt(totals.vat)} color="#e74a3b" sub="Collected on behalf of KRA" /></div>
            <div className="col-md-3 mb-2"><StatCard icon="🏦" label="Net Revenue"      value={fmt(totals.net)}        color="#1cc88a" sub="After VAT" /></div>
            <div className="col-md-3 mb-2"><StatCard icon="📊" label="Platform Commission (15%)" value={fmt(totals.commission)} color="#C9A020" /></div>
          </div>

          <div className="admin-card mb-4">
            <div className="admin-card-header">Monthly Tax Breakdown</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rows} margin={{ top:8,right:8,left:0,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                  <XAxis dataKey="month" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Legend />
                  <Bar dataKey="gross"      name="Gross"      fill="#4e73df" radius={[3,3,0,0]} />
                  <Bar dataKey="vat"        name="VAT"        fill="#e74a3b" radius={[3,3,0,0]} />
                  <Bar dataKey="commission" name="Commission" fill="#C9A020" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header d-flex justify-content-between align-items-center">
              <span>Monthly Detail</span>
              <span className="text-xs text-gray-500">VAT rate: {VAT_RATE*100}% · Commission: 15%</span>
            </div>
            <table className="admin-table">
              <thead><tr><th>Month</th><th>Transactions</th><th>Gross</th><th>VAT ({VAT_RATE*100}%)</th><th>Net (ex-VAT)</th><th>Commission (15%)</th></tr></thead>
              <tbody>
                {[...rows].reverse().map(r => (
                  <tr key={r.month}>
                    <td className="font-weight-bold text-xs text-gray-700">{r.month}</td>
                    <td className="text-xs text-gray-600">{r.count}</td>
                    <td className="text-xs font-weight-bold text-gray-800">{fmt(r.gross)}</td>
                    <td className="text-xs font-weight-bold" style={{ color:'#e74a3b' }}>{fmt(r.vat)}</td>
                    <td className="text-xs font-weight-bold" style={{ color:'#1cc88a' }}>{fmt(r.net)}</td>
                    <td className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>{fmt(r.commission)}</td>
                  </tr>
                ))}
                <tr style={{ background:'#f8f9fc', fontWeight:900 }}>
                  <td className="text-xs font-weight-bold">TOTAL</td>
                  <td className="text-xs">—</td>
                  <td className="text-xs font-weight-bold text-gray-800">{fmt(totals.gross)}</td>
                  <td className="text-xs font-weight-bold" style={{ color:'#e74a3b' }}>{fmt(totals.vat)}</td>
                  <td className="text-xs font-weight-bold" style={{ color:'#1cc88a' }}>{fmt(totals.net)}</td>
                  <td className="text-xs font-weight-bold" style={{ color:'#C9A020' }}>{fmt(totals.commission)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── SECTION: Service Areas ────────────────────────────────────────
const PHASE_META = {
  launch:    { label: '🚀 Launch',    color: '#1cc88a', bg: '#d4f5e9' },
  expansion: { label: '📈 Expansion', color: '#4A90D9', bg: '#ddeeff' },
  future:    { label: '🔮 Future',    color: '#9F7AEA', bg: '#ede9ff' },
};

function PhaseBadge({ phase }) {
  const m = PHASE_META[phase] || PHASE_META.future;
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10,
      color:m.color, background:m.bg, whiteSpace:'nowrap' }}>
      {m.label}
    </span>
  );
}

function ReadinessBar({ value = 0 }) {
  const color = value >= 70 ? '#1cc88a' : value >= 40 ? '#f6c23e' : '#e74a3b';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:100 }}>
      <div style={{ flex:1, height:4, background:'#e3e6f0', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${value}%`, height:'100%', background:color, borderRadius:2, transition:'width 0.4s' }} />
      </div>
      <span style={{ fontSize:10, color, fontWeight:700, minWidth:26 }}>{value}%</span>
    </div>
  );
}

function ServiceAreasSection() {
  const [areas,      setAreas]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [bulkSaving, setBulkSaving] = useState(null);  // county or metro key being saved
  const [toggling,   setToggling]   = useState(null);
  const [expanded,   setExpanded]   = useState(null);  // expanded metro key
  const [search,     setSearch]     = useState('');
  const [tab,        setTab]        = useState('all'); // all | launch | expansion | future

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('service_areas')
      .select('*')
      .order('sort_order')
      .order('county')
      .order('sub_county');
    setAreas(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleOne = async (id, current) => {
    setToggling(id);
    await supabase.from('service_areas')
      .update({ is_active: !current, updated_at: new Date().toISOString() })
      .eq('id', id);
    setToggling(null);
    load();
  };

  const bulkToggleByKey = async (key, field, value, activate) => {
    setBulkSaving(key);
    let q = supabase.from('service_areas')
      .update({ is_active: activate, updated_at: new Date().toISOString() });
    // Supabase .eq() does not match NULL — must use .is() for null values
    q = value === null ? q.is(field, null) : q.eq(field, value);
    await q;
    setBulkSaving(null);
    load();
  };

  const bulkToggleMetro = (metroKey, subs, activate) => {
    const metro = subs[0]?.metro;
    if (metro) {
      bulkToggleByKey(metroKey, 'metro', metro, activate);
    } else {
      // No metro set — toggle by county (single-county groups only)
      bulkToggleByKey(metroKey, 'county', subs[0]?.county, activate);
    }
  };

  // Group by metro (fall back to county when metro is null)
  const metroGroups = {};
  areas.forEach(a => {
    const key = a.metro || `${a.county} County`;
    if (!metroGroups[key]) metroGroups[key] = [];
    metroGroups[key].push(a);
  });

  // Derive phase of each metro group from first item
  const metroPhase = {};
  Object.entries(metroGroups).forEach(([key, list]) => {
    metroPhase[key] = list[0]?.launch_phase || 'future';
  });

  const searchLower   = search.toLowerCase();
  const allMetros     = Object.keys(metroGroups).sort((a, b) => {
    const order = { launch:0, expansion:1, future:2 };
    return (order[metroPhase[a]] ?? 2) - (order[metroPhase[b]] ?? 2) || a.localeCompare(b);
  });

  const visibleMetros = allMetros.filter(key => {
    const phaseMatch = tab === 'all' || metroPhase[key] === tab;
    const searchMatch = !search ||
      key.toLowerCase().includes(searchLower) ||
      metroGroups[key].some(a =>
        a.sub_county?.toLowerCase().includes(searchLower) ||
        a.county?.toLowerCase().includes(searchLower)
      );
    return phaseMatch && searchMatch;
  });

  const totalActive     = areas.filter(a => a.is_active).length;
  const launchAreas     = areas.filter(a => a.launch_phase === 'launch').length;
  const expansionAreas  = areas.filter(a => a.launch_phase === 'expansion').length;
  const futureAreas     = areas.filter(a => a.launch_phase === 'future').length;

  const TABS = [
    { id:'all',       label:`All (${areas.length})` },
    { id:'launch',    label:`🚀 Launch (${launchAreas})` },
    { id:'expansion', label:`📈 Expansion (${expansionAreas})` },
    { id:'future',    label:`🔮 Future (${futureAreas})` },
  ];

  return (
    <>
      <PageHeader
        title="Service Areas"
        sub="Neighbourhood-level coverage across Kenya. Toggle any area active — partners in that area receive jobs immediately."
      />

      {/* Stats */}
      <div className="row mb-3">
        <div className="col-6 col-md-3 mb-2"><StatCard icon="✅" label="Active Areas"    value={totalActive}            color="#1cc88a" /></div>
        <div className="col-6 col-md-3 mb-2"><StatCard icon="🚀" label="Launch Areas"    value={launchAreas}            color="#1cc88a" /></div>
        <div className="col-6 col-md-3 mb-2"><StatCard icon="📈" label="Expansion Areas" value={expansionAreas}         color="#4A90D9" /></div>
        <div className="col-6 col-md-3 mb-2"><StatCard icon="🔮" label="Future Areas"    value={futureAreas}            color="#9F7AEA" /></div>
      </div>

      {/* Phase tabs + search */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab===t.id ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize:12 }}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
        <input
          className="form-control form-control-sm"
          style={{ maxWidth:240, fontSize:12, marginLeft:'auto' }}
          placeholder="🔍 Search area…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <Spinner /> : (
        <div>
          {visibleMetros.map(metroKey => {
            const subs        = metroGroups[metroKey];
            const activeCount = subs.filter(a => a.is_active).length;
            const allActive   = activeCount === subs.length;
            const noneActive  = activeCount === 0;
            const isOpen      = expanded === metroKey;
            const phase       = metroPhase[metroKey];
            const avgReady    = Math.round(subs.reduce((s, a) => s + (a.expansion_readiness || 0), 0) / subs.length);
            const statusColor = noneActive ? '#6c757d' : allActive ? '#1cc88a' : '#f6c23e';

            // Group by county within this metro
            const countyMap = {};
            subs.forEach(a => {
              const c = a.county;
              if (!countyMap[c]) countyMap[c] = [];
              countyMap[c].push(a);
            });
            const counties = Object.keys(countyMap);

            const visibleSubs = search
              ? subs.filter(a =>
                  metroKey.toLowerCase().includes(searchLower) ||
                  a.county?.toLowerCase().includes(searchLower) ||
                  a.sub_county?.toLowerCase().includes(searchLower)
                )
              : subs;

            return (
              <div key={metroKey} className="admin-card mb-2" style={{ overflow:'hidden' }}>
                {/* Metro header */}
                <div
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
                    cursor:'pointer', userSelect:'none', background: isOpen ? '#f8f9fc' : '#fff' }}
                  onClick={() => setExpanded(isOpen ? null : metroKey)}
                >
                  <span style={{ fontSize:11, color:'#aaa', transition:'transform 0.2s', display:'inline-block',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>

                  {/* Name + phase badge */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#2d3748' }}>{metroKey}</span>
                      <PhaseBadge phase={phase} />
                      {counties.length > 1 && (
                        <span style={{ fontSize:10, color:'#888' }}>
                          {counties.join(' · ')}
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
                      <span style={{ fontSize:11, color:statusColor, fontWeight:600 }}>
                        {activeCount}/{subs.length} active
                      </span>
                      {phase !== 'launch' && (
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:10, color:'#888' }}>Readiness</span>
                          <ReadinessBar value={avgReady} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active coverage bar */}
                  <div style={{ width:70, textAlign:'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ width:'100%', height:5, background:'#e3e6f0', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${subs.length ? (activeCount/subs.length)*100 : 0}%`,
                        height:'100%', background:statusColor, borderRadius:3, transition:'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Bulk buttons */}
                  <div className="d-flex gap-2" onClick={e => e.stopPropagation()}>
                    {!allActive && (
                      <button
                        className="btn btn-sm btn-success"
                        style={{ fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}
                        disabled={bulkSaving === metroKey}
                        onClick={() => bulkToggleMetro(metroKey, subs, true)}
                      >
                        {bulkSaving === metroKey ? '…' : '✅ Activate All'}
                      </button>
                    )}
                    {!noneActive && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}
                        disabled={bulkSaving === metroKey}
                        onClick={() => bulkToggleMetro(metroKey, subs, false)}
                      >
                        {bulkSaving === metroKey ? '…' : '⏸ Pause All'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-county rows */}
                {(isOpen || search) && (
                  <div style={{ borderTop:'1px solid #e3e6f0', background:'#fafbfc' }}>
                    {visibleSubs.map((a, i) => (
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10,
                        padding:'8px 16px 8px 36px',
                        borderBottom: i < visibleSubs.length-1 ? '1px solid #f0f0f5' : 'none' }}>

                        {/* Name + county label (when metro spans multiple counties) */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <span style={{ fontSize:12, color:'#2d3748' }}>{a.sub_county}</span>
                          {counties.length > 1 && (
                            <span style={{ fontSize:10, color:'#aaa', marginLeft:6 }}>{a.county}</span>
                          )}
                        </div>

                        {/* Radius */}
                        {a.service_radius_km && (
                          <span style={{ fontSize:10, color:'#888', whiteSpace:'nowrap' }}>
                            📍 {a.service_radius_km}km
                          </span>
                        )}

                        {/* Phase badge (only if different from group phase) */}
                        {a.launch_phase !== phase && (
                          <PhaseBadge phase={a.launch_phase} />
                        )}

                        {/* Status dot */}
                        <span style={{ fontSize:11, color: a.is_active ? '#1cc88a' : '#bbb', fontWeight:600, minWidth:56 }}>
                          {a.is_active ? '● Active' : '○ Off'}
                        </span>

                        {/* Toggle switch */}
                        <div
                          onClick={() => toggling !== a.id && toggleOne(a.id, a.is_active)}
                          style={{
                            width:36, height:20, borderRadius:10, cursor:'pointer',
                            background: a.is_active ? '#1cc88a' : '#dee2e6',
                            position:'relative', transition:'background 0.2s',
                            opacity: toggling === a.id ? 0.5 : 1, flexShrink:0,
                          }}
                        >
                          <div style={{
                            position:'absolute', top:2, left: a.is_active ? 18 : 2,
                            width:16, height:16, borderRadius:'50%', background:'#fff',
                            boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {visibleMetros.length === 0 && (
            <div className="text-center py-5 text-gray-500">No areas match your filters.</div>
          )}
        </div>
      )}
    </>
  );
}

// ── SECTION: Revenue Forecast ─────────────────────────────────────
function RevenueForecastSection() {
  const [weekly,   setWeekly]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({ thisMonth:0, lastMonth:0, momGrowth:null, weeklyAvg:0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Last 16 weeks of payments
      const since = new Date(Date.now() - 16 * 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from('payments').select('amount,created_at').eq('status','paid').gte('created_at', since);

      // Bucket by week number
      const weeks = {};
      (data || []).forEach(p => {
        const d = new Date(p.created_at);
        // ISO week start (Monday)
        const day = d.getDay() || 7;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - day + 1);
        weekStart.setHours(0,0,0,0);
        const key = weekStart.toISOString().slice(0,10);
        weeks[key] = (weeks[key] || 0) + (parseFloat(p.amount) || 0);
      });

      const sorted = Object.entries(weeks)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([date, actual]) => ({
          date,
          actual: Math.round(actual),
          label: new Date(date).toLocaleDateString('en-KE', { month:'short', day:'numeric' }),
        }));

      // Linear trend forecast for next 4 weeks
      const n = sorted.length;
      if (n >= 2) {
        const xs = sorted.map((_,i) => i);
        const ys = sorted.map(w => w.actual);
        const xMean = xs.reduce((a,b) => a+b, 0) / n;
        const yMean = ys.reduce((a,b) => a+b, 0) / n;
        const slope = xs.reduce((s,x,i) => s + (x-xMean)*(ys[i]-yMean), 0) /
                      xs.reduce((s,x) => s + (x-xMean)**2, 0);
        const intercept = yMean - slope * xMean;

        for (let i = 1; i <= 4; i++) {
          const forecastX   = n - 1 + i;
          const forecastDate = new Date(sorted[n-1].date);
          forecastDate.setDate(forecastDate.getDate() + i * 7);
          sorted.push({
            date:     forecastDate.toISOString().slice(0,10),
            actual:   null,
            forecast: Math.max(0, Math.round(intercept + slope * forecastX)),
            label:    forecastDate.toLocaleDateString('en-KE', { month:'short', day:'numeric' }),
          });
        }

        // Target = rolling 4-week avg × 1.10
        const last4 = ys.slice(-4);
        const rollingAvg = last4.reduce((a,b) => a+b, 0) / last4.length;
        const target = Math.round(rollingAvg * 1.10);
        sorted.forEach(w => { if (!w.forecast) w.target = target; });
      }

      // MoM stats
      const now      = new Date();
      const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart  = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString();
      const thisM  = (data||[]).filter(p => p.created_at >= thisMonthStart).reduce((s,p) => s+(parseFloat(p.amount)||0), 0);
      const lastM  = (data||[]).filter(p => p.created_at >= lastMonthStart && p.created_at < thisMonthStart).reduce((s,p) => s+(parseFloat(p.amount)||0), 0);
      const momGrowth = lastM > 0 ? (((thisM - lastM) / lastM) * 100).toFixed(1) : null;
      const weeklyAvg = n > 0 ? Math.round(sorted.filter(w=>w.actual).reduce((s,w)=>s+w.actual,0)/sorted.filter(w=>w.actual).length) : 0;

      setWeekly(sorted);
      setStats({ thisMonth: Math.round(thisM), lastMonth: Math.round(lastM), momGrowth, weeklyAvg });
      setLoading(false);
    };
    load();
  }, []);

  const fmt = v => `KES ${Number(v||0).toLocaleString('en-KE',{maximumFractionDigits:0})}`;
  const momColor = stats.momGrowth === null ? '#aaa' : parseFloat(stats.momGrowth) >= 0 ? '#1cc88a' : '#e74a3b';

  return (
    <>
      <PageHeader title="Revenue Forecast" sub="Weekly actuals, 10% growth target, and 4-week linear forecast" />
      <div className="row mb-4">
        <div className="col-md-3 mb-2">
          <StatCard icon="📅" label="This Month"    value={fmt(stats.thisMonth)}  color="#4e73df" />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="📆" label="Last Month"    value={fmt(stats.lastMonth)}  color="#36b9cc" />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="📈" label="MoM Growth"
            value={stats.momGrowth !== null ? `${parseFloat(stats.momGrowth) >= 0 ? '+' : ''}${stats.momGrowth}%` : '—'}
            color={momColor}
            sub={parseFloat(stats.momGrowth) >= 0 ? 'Growing' : 'Declining'}
          />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="📊" label="Weekly Avg"   value={fmt(stats.weeklyAvg)}  color="#C9A020" />
        </div>
      </div>

      {loading ? <Spinner /> : weekly.length === 0 ? (
        <div className="text-center py-5 text-gray-500">No payment data found for the last 16 weeks.</div>
      ) : (
        <>
          {/* Main chart */}
          <div className="admin-card mb-4">
            <div className="admin-card-header d-flex justify-content-between align-items-center">
              <span>Weekly Revenue — Actual vs Target vs Forecast</span>
              <div style={{ display:'flex', gap:16, fontSize:11 }}>
                <span style={{ color:'#4e73df' }}>■ Actual</span>
                <span style={{ color:'#f6c23e' }}>— Target (+10%)</span>
                <span style={{ color:'#FC8181' }}>--- Forecast</span>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={weekly} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4e73df" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4e73df" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e6f0" />
                  <XAxis dataKey="label" tick={{ fontSize:10 }} interval={1} />
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v, name) => [v ? fmt(v) : '—', name]}
                    labelStyle={{ fontWeight:700 }}
                  />
                  <Line type="monotone" dataKey="actual"   stroke="#4e73df" strokeWidth={2.5} dot={{ r:3 }}   connectNulls={false} name="Actual" />
                  <Line type="monotone" dataKey="target"   stroke="#f6c23e" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Target" connectNulls />
                  <Line type="monotone" dataKey="forecast" stroke="#FC8181" strokeWidth={2}   strokeDasharray="8 4" dot={{ r:3, fill:'#FC8181' }} connectNulls={false} name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Week table */}
          <div className="admin-card">
            <div className="admin-card-header">Weekly Breakdown</div>
            <table className="admin-table">
              <thead>
                <tr><th>Week of</th><th>Actual</th><th>Target</th><th>Forecast</th><th>vs Target</th></tr>
              </thead>
              <tbody>
                {[...weekly].reverse().map((w, i) => {
                  const diff = w.actual && w.target ? w.actual - w.target : null;
                  return (
                    <tr key={i} style={{ opacity: w.actual === null ? 0.55 : 1 }}>
                      <td className="text-xs text-gray-600">
                        {w.label}
                        {w.actual === null && <span className="sb-badge sb-badge-secondary ml-2" style={{ fontSize:9 }}>FORECAST</span>}
                      </td>
                      <td className="text-xs font-weight-bold" style={{ color: w.actual ? '#4e73df' : '#aaa' }}>
                        {w.actual ? fmt(w.actual) : '—'}
                      </td>
                      <td className="text-xs text-gray-600">{w.target ? fmt(w.target) : '—'}</td>
                      <td className="text-xs" style={{ color:'#FC8181' }}>{w.forecast ? fmt(w.forecast) : '—'}</td>
                      <td className="text-xs font-weight-bold" style={{ color: diff === null ? '#aaa' : diff >= 0 ? '#1cc88a' : '#e74a3b' }}>
                        {diff === null ? '—' : `${diff >= 0 ? '+' : ''}${fmt(Math.abs(diff))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── SECTION: Partner Availability ─────────────────────────────────
function PartnerAvailabilitySection() {
  const [partners, setPartners]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const channelRef = useRef(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('workers')
      .select('id,full_name,partner_role,status,city,county,current_lat,current_lng,rating')
      .eq('verification_status','approved');
    setPartners(data || []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    channelRef.current = supabase.channel('admin-availability')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'workers' }, load)
      .subscribe();
    const interval = setInterval(load, 30_000);
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(interval);
    };
  }, [load]);

  const ROLES = [
    { key:'worker',        icon:'🔧', label:'Workers',        color:'#C9A020' },
    { key:'rider',         icon:'🚗', label:'Riders',         color:'#48BB78' },
    { key:'vendor',        icon:'🏪', label:'Vendors',        color:'#fd7e14' },
    { key:'mover',         icon:'🚚', label:'Movers',         color:'#9F7AEA' },
    { key:'water_carrier', icon:'🚰', label:'Water Carriers', color:'#00B5D8' },
    { key:'supplier',      icon:'📦', label:'Suppliers',      color:'#FC8181' },
  ];

  const byRole = {};
  ROLES.forEach(r => {
    const all     = partners.filter(p => p.partner_role === r.key);
    const online  = all.filter(p => p.status === 'online');
    const cities  = {};
    all.forEach(p => {
      const area = p.city || p.county || 'Unknown';
      if (!cities[area]) cities[area] = { total:0, online:0 };
      cities[area].total++;
      if (p.status === 'online') cities[area].online++;
    });
    byRole[r.key] = { total: all.length, online: online.length, cities };
  });

  const totalOnline  = partners.filter(p => p.status === 'online').length;
  const totalAll     = partners.length;
  const coveragePct  = totalAll > 0 ? Math.round((totalOnline / totalAll) * 100) : 0;
  const coverageColor = coveragePct >= 50 ? '#1cc88a' : coveragePct >= 25 ? '#f6c23e' : '#e74a3b';

  return (
    <>
      <PageHeader title="Partner Availability" sub="Live online/offline status across all approved partners — refreshes every 30 seconds" />

      {/* Summary bar */}
      <div className="row mb-4">
        <div className="col-md-3 mb-2">
          <StatCard icon="🟢" label="Online Now"  value={totalOnline}            color="#1cc88a" sub="Active partners" />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="⚫" label="Offline"     value={totalAll - totalOnline} color="#6c757d" sub="Not taking jobs" />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="📊" label="Coverage"    value={`${coveragePct}%`}      color={coverageColor} sub="Of approved partners" />
        </div>
        <div className="col-md-3 mb-2">
          <StatCard icon="🕐" label="Last Refresh"
            value={lastRefresh ? lastRefresh.toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : '—'}
            color="#36b9cc" sub="Auto-refreshes 30s"
          />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Role cards grid */}
          <div className="row mb-4">
            {ROLES.map(role => {
              const d = byRole[role.key];
              const pct = d.total > 0 ? Math.round((d.online / d.total) * 100) : 0;
              const statusColor = pct >= 50 ? '#1cc88a' : pct >= 20 ? '#f6c23e' : '#e74a3b';
              return (
                <div key={role.key} className="col-md-4 col-lg-2 mb-3">
                  <div className="admin-card h-100" style={{ borderTop: `3px solid ${role.color}` }}>
                    <div className="card-body p-3">
                      <div style={{ fontSize:24, marginBottom:6 }}>{role.icon}</div>
                      <div className="text-xs font-weight-bold text-gray-800 mb-1">{role.label}</div>
                      <div style={{ fontSize:22, fontWeight:900, color: role.color }}>{d.online}</div>
                      <div className="text-xs text-gray-500">/ {d.total} total</div>
                      <div style={{ marginTop:8, height:5, background:'#e3e6f0', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:statusColor, borderRadius:3 }} />
                      </div>
                      <div className="text-xs mt-1 font-weight-bold" style={{ color: statusColor }}>{pct}% online</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Area breakdown */}
          <div className="admin-card">
            <div className="admin-card-header">Coverage by Area</div>
            <div className="card-body p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Area</th>
                    {ROLES.map(r => <th key={r.key}>{r.icon} {r.label.split(' ')[0]}</th>)}
                    <th>Total Online</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Collect all unique areas
                    const allAreas = new Set();
                    Object.values(byRole).forEach(d => Object.keys(d.cities).forEach(a => allAreas.add(a)));
                    return [...allAreas].sort().map(area => {
                      const rowOnline = ROLES.reduce((s, r) => s + (byRole[r.key].cities[area]?.online || 0), 0);
                      const rowTotal  = ROLES.reduce((s, r) => s + (byRole[r.key].cities[area]?.total  || 0), 0);
                      return (
                        <tr key={area}>
                          <td className="font-weight-bold text-gray-800 text-xs">{area}</td>
                          {ROLES.map(role => {
                            const city = byRole[role.key].cities[area];
                            if (!city) return <td key={role.key} className="text-xs text-gray-300">—</td>;
                            const c = city.online === 0 ? '#e74a3b' : city.online < city.total / 2 ? '#f6c23e' : '#1cc88a';
                            return (
                              <td key={role.key}>
                                <span className="font-weight-bold text-xs" style={{ color: c }}>{city.online}</span>
                                <span className="text-xs text-gray-400">/{city.total}</span>
                              </td>
                            );
                          })}
                          <td>
                            <span className="font-weight-bold text-xs" style={{ color: rowOnline === 0 ? '#e74a3b' : '#1cc88a' }}>
                              {rowOnline}
                            </span>
                            <span className="text-xs text-gray-400">/{rowTotal}</span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Team & Agents (super_admin only) ──────────────────────────────
function TeamManagementSection() {
  const { user } = useAuth();
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', admin_role: 'support' });

  const load = async () => {
    setLoading(true); setErr('');
    try { setAgents(await listAgents()); }
    catch (e) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      setErr('Fill name, email, and a password of at least 8 characters.'); return;
    }
    setSaving(true); setErr('');
    try {
      await createAgent(form);
      setForm({ full_name: '', email: '', password: '', admin_role: 'support' });
      setShowAdd(false);
      await load();
      auditLog('agent_created', `${form.email} as ${form.admin_role}`);
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const handleRoleChange = async (id, admin_role) => {
    try { await updateAgentRole(id, admin_role); setAgents(a => a.map(x => x.id === id ? { ...x, admin_role } : x)); auditLog('agent_role_changed', `${id} → ${admin_role}`); }
    catch (e) { alert(e.message); }
  };

  const handleRevoke = async (a) => {
    if (!confirm(`Remove ${a.full_name || a.email} from the team? They will lose all dashboard access (their login stays, but is no longer staff).`)) return;
    try { await revokeAgent(a.id); setAgents(list => list.filter(x => x.id !== a.id)); auditLog('agent_revoked', a.email); }
    catch (e) { alert(e.message); }
  };

  const inputSt = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #d9dee7', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Team &amp; Agents</h2>
          <p style={{ margin: '4px 0 0', color: '#858796', fontSize: 13 }}>Create staff accounts and assign each one to a department. Agents only see the tools for their department.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(s => !s); setErr(''); }}>
          {showAdd ? 'Cancel' : '+ Add Agent'}
        </button>
      </div>

      {err && <div style={{ background: 'rgba(231,74,59,0.08)', border: '1px solid rgba(231,74,59,0.3)', color: '#e74a3b', padding: '10px 14px', borderRadius: 8, fontSize: 13, margin: '12px 0' }}>{err}</div>}

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #e3e6f0', borderRadius: 12, padding: 18, margin: '14px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a5c69' }}>Full name</label>
              <input style={inputSt} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Jane Wanjiru" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a5c69' }}>Email</label>
              <input style={inputSt} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="agent@fixera.africa" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a5c69' }}>Temporary password</label>
              <input style={inputSt} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="min 8 characters" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a5c69' }}>Department</label>
              <select style={inputSt} value={form.admin_role} onChange={e => setForm(f => ({ ...f, admin_role: e.target.value }))}>
                {AGENT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <p style={{ color: '#858796', fontSize: 12, margin: '10px 0 0' }}>{AGENT_ROLES.find(r => r.value === form.admin_role)?.desc}</p>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" disabled={saving} onClick={handleCreate}>{saving ? 'Creating…' : 'Create Agent'}</button>
          </div>
          <p style={{ color: '#858796', fontSize: 11, margin: '10px 0 0' }}>The agent logs in at <strong>/admin/login</strong> with this email + password. Ask them to reset their password after first login.</p>
        </div>
      )}

      {loading ? <p style={{ color: '#858796' }}>Loading team…</p> : (
        <div style={{ background: '#fff', border: '1px solid #e3e6f0', borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fc', textAlign: 'left', color: '#5a5c69' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 20, color: '#858796', textAlign: 'center' }}>No staff accounts yet. Add your first agent above.</td></tr>
              ) : agents.map(a => {
                const isMe = a.id === user?.id;
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid #eaecf4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{a.full_name || '—'}{isMe && <span style={{ marginLeft: 8, fontSize: 10, color: '#4e73df', fontWeight: 700 }}>(you)</span>}</td>
                    <td style={{ padding: '12px 16px', color: '#5a5c69' }}>{a.email || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isMe ? (
                        <span style={{ fontWeight: 700 }}>{roleLabel(a.admin_role)}</span>
                      ) : (
                        <select value={a.admin_role || 'support'} onChange={e => handleRoleChange(a.id, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d9dee7', fontSize: 12, fontFamily: 'inherit' }}>
                          {AGENT_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {!isMe && <button className="btn btn-sm" style={{ color: '#e74a3b', border: '1px solid rgba(231,74,59,0.3)', background: 'rgba(231,74,59,0.06)' }} onClick={() => handleRevoke(a)}>Remove</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Shell ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [active,       setActive]      = useState('overview');
  const [showDropdown, setShowDropdown]= useState(false);
  const [collapsed,    setCollapsed]   = useState({}); // sidebar group label → collapsed?
  const { logout, user, profile } = useAuth();
  const navigate         = useNavigate();
  const adminRole        = profile?.admin_role || 'super_admin';
  const visibleNav       = filterNavForRole(NAV_GROUPS, adminRole);
  const activeItem       = NAV_FLAT.find(n => n.id === active);
  const displayName      = profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const avatarUrl        = profile?.avatar_url || profile?.profile_photo_url || null;
  const toggleGroup      = (label) => setCollapsed(c => ({ ...c, [label]: !c[label] }));

  useEffect(() => {
    const handler = e => setActive(e.detail);
    window.addEventListener('fixera-nav', handler);
    return () => window.removeEventListener('fixera-nav', handler);
  }, []);

  const SECTIONS = {
    // ── Command Center ───────────────────────────────────────
    live_ops:      <LiveOpsMap />,
    alerts:        <AlertsFeedSection />,
    // ── Operations ──────────────────────────────────────────
    overview:      <OverviewSection />,
    partners:      <PartnersSection />,
    users:         <UsersSection />,
    jobs:          <JobsSection />,
    payments:      <PaymentsSection />,
    analytics:     <AnalyticsSection />,
    workforce:     <WorkforceSection />,
    products:      <ProductApprovalsSection />,
    disputes:      <DisputesSection />,
    payouts:       <PayoutsSection />,
    announcements: <AnnouncementsSection />,
    settings:      <AdminSettings />,
    orders:        <OrdersSection />,
    quotations:    <QuotationsSection />,
    support:       <DisputesSection />,
    notifications: <NotificationsSection />,
    // ── Partner types ────────────────────────────────────────
    vendors:       <PartnerTypeSection role="vendor"        label="Vendors"        icon="🏪" color="#fd7e14" />,
    suppliers:     <PartnerTypeSection role="supplier"      label="Suppliers"      icon="📦" color="#20c997" />,
    movers:        <PartnerTypeSection role="mover"         label="Movers"         icon="🚚" color="#9F7AEA" />,
    riders:        <RiderOpsSection />,
    water:         <WaterOpsSection />,
    // ── Monitoring sections ──────────────────────────────────
    verification:    <VerificationQueueSection />,
    performance:     <PartnerPerformanceSection />,
    refunds:         <RefundManagementSection />,
    reconciliation:  <ReconciliationSection />,
    fraud:           <FraudRiskSection />,
    heatmap:         <BookingHeatmap />,
    revenue_forecast:<RevenueForecastSection />,
    availability:    <PartnerAvailabilitySection />,
    // ── Remaining admin sections ─────────────────────────────
    dispute_center:  <DisputeCenterSection />,
    dispatch:        <DispatchSection />,
    earnings:        <PartnerEarningsSection />,
    tax_report:      <TaxReportSection />,
    service_areas:   <ServiceAreasSection />,
    // ── Finance & catalog ────────────────────────────────────
    wallets:       <WalletsSection />,
    marketing:     <MarketingSection />,
    services:      <ServicesCatalogSection />,
    content:       <ContentSection />,
    reviews:       <ReviewsSection />,
    security:      <SecuritySection />,
    team:          <TeamManagementSection />,
  };

  return (
    <div className="admin-shell">

      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Wrench size={20} color="#C9A020" strokeWidth={2.2} />
          </div>
          <div>
            <div className="sidebar-brand-name">FIXERA</div>
            <div className="sidebar-brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-scroll">
          {visibleNav.map((group) => {
            const isCollapsed = !!collapsed[group.label];
            return (
              <div key={group.label} className={`sidebar-group ${isCollapsed ? 'collapsed' : ''}`}>
                <button className="sidebar-group-header" onClick={() => toggleGroup(group.label)}>
                  <span className="sidebar-group-title">{group.label}</span>
                  <ChevronDown size={13} className="sidebar-group-chev" />
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => setActive(item.id)}
                          className={`sidebar-nav-link ${active === item.id ? 'active' : ''}`}>
                          <span className="nav-ico">{item.Icon && <item.Icon size={17} strokeWidth={2} />}</span>
                          <span className="nav-label">{item.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Profile card */}
        <div className="sidebar-foot">
          <div className="sidebar-profile">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="sidebar-avatar" />
              : <div className="sidebar-avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}><UserRound size={18} color="#fff" /></div>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize:10.5, color:'var(--muted)', fontWeight:600, textTransform:'capitalize' }}>{(adminRole || 'super_admin').replace('_',' ')}</div>
            </div>
            <button onClick={async () => { await logout(); navigate('/admin/login'); }} title="Log out"
              style={{ width:30, height:30, borderRadius:8, border:'1px solid var(--line)', background:'#fff', color:'var(--red)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="admin-content">
        {/* Topbar */}
        <div className="admin-topbar">
          <div style={{ minWidth:0 }}>
            <div className="topbar-title" style={{ display:'flex', alignItems:'center', gap:9 }}>
              {activeItem?.Icon && <activeItem.Icon size={19} color="var(--gold)" strokeWidth={2.2} />}
              {activeItem?.label || 'Dashboard'}
            </div>
            <div className="topbar-sub">Fixera Operations · {new Date().toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
          </div>

          <div style={{ flex:1 }} />

          <label className="topbar-search">
            <Search size={16} />
            <input placeholder="Search anything…" />
            <span className="topbar-kbd">⌘K</span>
          </label>

          <button className="topbar-icon-btn" title="Alerts"><Bell size={18} /><span className="topbar-dot">3</span></button>
          <button className="topbar-icon-btn" title="Messages"><Mail size={18} /></button>
          <button className="topbar-icon-btn" title="Help"><HelpCircle size={18} /></button>

          <div style={{ position:'relative' }}>
            <div onClick={() => setShowDropdown(d => !d)} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', paddingLeft:6 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width:38, height:38, borderRadius:11, objectFit:'cover' }} />
                : <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,var(--navy),var(--navy-2))', display:'flex', alignItems:'center', justifyContent:'center' }}><UserRound size={18} color="#fff" /></div>}
              <div style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--ink)' }}>{displayName}</div>
                <div style={{ fontSize:10.5, color:'var(--muted)', fontWeight:600, textTransform:'capitalize' }}>{(adminRole || 'super_admin').replace('_',' ')}</div>
              </div>
              <ChevronDown size={16} color="var(--muted)" />
            </div>
            {showDropdown && (
              <div style={{ position:'absolute', right:0, top:52, background:'#fff', border:'1px solid var(--line)', borderRadius:12, boxShadow:'var(--shadow)', minWidth:190, zIndex:200, overflow:'hidden' }}>
                <button onClick={() => { setShowDropdown(false); navigate('/home'); }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', fontSize:13, color:'var(--ink-2)', cursor:'pointer', fontWeight:600 }}>
                  <Home size={15} /> Customer App
                </button>
                <div style={{ height:1, background:'var(--line)' }} />
                <button onClick={async () => { await logout(); navigate('/admin/login'); }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', fontSize:13, color:'var(--red)', cursor:'pointer', fontWeight:700 }}>
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className="admin-container" style={['live_ops','heatmap'].includes(active) ? { padding: 0, overflow: 'hidden' } : {}}>
          {SECTIONS[active]}
        </div>
      </div>
    </div>
  );
}
