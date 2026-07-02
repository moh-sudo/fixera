import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';
import { Briefcase, Clock, Wallet, Headphones, User, Zap, Truck, Users, Package, BarChart2, Navigation, Droplets, Map, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import NotificationToast from './NotificationToast';
import AnnouncementBanner from './AnnouncementBanner';
import BrandLogo from './BrandLogo';
import Avatar from './Avatar';
import TermsReacceptanceModal from './TermsReacceptanceModal';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  navy: '#0A1628',
};

const NAV_BY_ROLE = {
  worker: [
    { icon: Briefcase,  label: 'Jobs',     path: '/dashboard' },
    { icon: Clock,      label: 'History',  path: '/history' },
    { icon: Wallet,     label: 'Earnings', path: '/earnings' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  vendor: [
    { icon: BarChart2,  label: 'Overview', path: '/vendor/dashboard' },
    { icon: Users,      label: 'Crew',     path: '/crew' },
    { icon: Wallet,     label: 'Earnings', path: '/earnings' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  rider: [
    { icon: Map,        label: 'Rides',    path: '/rider/dashboard' },
    { icon: Clock,      label: 'History',  path: '/history' },
    { icon: Wallet,     label: 'Earnings', path: '/earnings' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  supplier: [
    { icon: Package,    label: 'Products', path: '/supplier/dashboard' },
    { icon: Users,      label: 'Crew',     path: '/crew' },
    { icon: Wallet,     label: 'Earnings', path: '/earnings' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  mover: [
    { icon: Package,    label: 'Requests', path: '/mover/dashboard' },
    { icon: Truck,      label: 'Fleet',    path: '/fleet' },
    { icon: Users,      label: 'Crew',     path: '/crew' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  water_carrier: [
    { icon: Droplets,   label: 'Deliveries', path: '/water/dashboard' },
    { icon: Truck,      label: 'Fleet',      path: '/fleet' },
    { icon: Users,      label: 'Crew',       path: '/crew' },
    { icon: Headphones, label: 'Support',    path: '/support' },
  ],
};

const FULL_NAV_BY_ROLE = {
  worker: [
    { icon: Briefcase,  label: 'Jobs',     path: '/dashboard' },
    { icon: Zap,        label: 'Active',   path: '/active/current' },
    { icon: Clock,      label: 'History',  path: '/history' },
    { icon: Wallet,     label: 'Earnings', path: '/earnings' },
    { icon: User,       label: 'Profile',  path: '/profile' },
    { icon: Headphones, label: 'Support',  path: '/support' },
  ],
  vendor:        NAV_BY_ROLE.vendor,
  rider:         NAV_BY_ROLE.rider,
  supplier:      NAV_BY_ROLE.supplier,
  mover:         NAV_BY_ROLE.mover,
  water_carrier: NAV_BY_ROLE.water_carrier,
};

const ROLE_META = {
  worker:        { label: 'Service Worker', color: '#C9A020' },
  vendor:        { label: 'Vendor',         color: '#3B82F6' },
  rider:         { label: 'Rider',          color: '#10B981' },
  supplier:      { label: 'Supplier',       color: '#F59E0B' },
  mover:         { label: 'Mover',          color: '#8B5CF6' },
  water_carrier: { label: 'Water Carrier',  color: '#06B6D4' },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function OnlineToggle({ compact }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);

  const toggle = async () => {
    const next = !online;
    setOnline(next);
    if (user) await supabase.from('workers').update({ status: next ? 'online' : 'offline' }).eq('id', user.id);
  };

  return (
    <div onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{ width: compact ? 8 : 10, height: compact ? 8 : 10, borderRadius: '50%', background: online ? '#10B981' : '#9CA3AF', flexShrink: 0 }} />
      {!compact && <span style={{ fontSize: 12, color: online ? '#10B981' : CL.muted, fontWeight: 600 }}>{online ? 'Online' : 'Offline'}</span>}
      <div style={{ width: compact ? 32 : 36, height: compact ? 18 : 20, borderRadius: 10, padding: 2, background: online ? '#10B981' : CL.border, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: online ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
        <div style={{ width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} />
      </div>
    </div>
  );
}

// ── Mobile Layout ─────────────────────────────────────────────────
function MobileLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();

  const partnerRole = profile?.partner_role || 'worker';
  const NAV = NAV_BY_ROLE[partnerRole] || NAV_BY_ROLE.worker;
  const meta = ROLE_META[partnerRole] || ROLE_META.worker;
  const allNav = [...NAV, { icon: User, label: 'Profile', path: '/profile' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: CL.bg }}>

      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/logo-mark.png" alt="Fixera" style={{ height: 24, width: 'auto' }} />
          </div>
          <div>
            <div style={{ color: CL.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em' }}>FIXERA</div>
            <div style={{ color: meta.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>{meta.label.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <OnlineToggle compact />
          <NotificationBell />
          <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <Avatar url={profile?.profile_picture_url} name={profile?.full_name} size={34} ring ringColor={CL.goldBorder} />
          </div>
        </div>
      </div>

      {/* Page content */}
      <main style={{ flex: 1, marginTop: 60, marginBottom: 70, overflowY: 'auto', background: CL.bg }}>
        <AnnouncementBanner role={partnerRole} />
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: CL.surface, borderTop: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', height: 70, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {allNav.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', height: '100%', fontFamily: 'inherit', position: 'relative' }}>
              <Icon size={22} color={active ? CL.gold : CL.muted} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? CL.gold : CL.muted, transition: 'color 0.2s' }}>{item.label}</span>
              {active && <div style={{ position: 'absolute', bottom: 0, width: 32, height: 3, borderRadius: 2, background: CL.gold }} />}
            </button>
          );
        })}
      </nav>

      <NotificationToast />
    </div>
  );
}

// ── Desktop Sidebar Layout ────────────────────────────────────────
function DesktopLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const partnerRole = profile?.partner_role || 'worker';
  const NAV = FULL_NAV_BY_ROLE[partnerRole] || FULL_NAV_BY_ROLE.worker;
  const meta = ROLE_META[partnerRole] || ROLE_META.worker;

  const handleLogout = async () => { await logout(); navigate('/signin'); };

  return (
    <div style={{ display: 'flex', height: '100vh', background: CL.bg, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: collapsed ? 72 : 240, flexShrink: 0, background: CL.surface, borderRight: `1px solid ${CL.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 18px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: `1px solid ${CL.border}`, minHeight: 70 }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo-mark.png" alt="Fixera" style={{ height: 26, width: 'auto' }} />
              </div>
              <div>
                <div style={{ color: CL.gold, fontSize: 13, fontWeight: 800, letterSpacing: '0.15em' }}>FIXERA</div>
                <div style={{ color: meta.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>PARTNER · {meta.label.toUpperCase()}</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo-mark.png" alt="Fixera" style={{ height: 26, width: 'auto' }} />
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: CL.muted, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Profile card */}
        {!collapsed && (
          <div style={{ margin: '14px 12px 0', padding: '12px 14px', background: CL.bg, borderRadius: 12, border: `1px solid ${CL.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar url={profile?.profile_picture_url} name={profile?.full_name} size={38} ring ringColor={CL.goldBorder} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: CL.text, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'Partner'}</div>
                <div style={{ color: meta.color, fontSize: 11, fontWeight: 600 }}>{profile?.business_name || profile?.service || meta.label}</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}><OnlineToggle /></div>
          </div>
        )}

        {/* Notification Bell */}
        <div style={{ padding: '6px 8px 0' }}>
          <NotificationBell collapsed={collapsed} />
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = location.pathname === item.path || (item.path === '/active/current' && location.pathname.startsWith('/active'));
            const Icon = item.icon;
            return (
              <div key={item.path} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '12px 0' : '11px 14px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 10, cursor: 'pointer', background: active ? CL.goldSoft : 'transparent', border: active ? `1px solid ${CL.goldBorder}` : '1px solid transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = CL.bg; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <Icon size={18} color={active ? CL.gold : CL.muted} strokeWidth={active ? 2.5 : 1.8} />
                {!collapsed && <span style={{ color: active ? CL.gold : CL.muted, fontSize: 13, fontWeight: active ? 700 : 500 }}>{item.label}</span>}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '8px', borderTop: `1px solid ${CL.border}` }}>
          <div onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '12px 0' : '11px 14px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FDF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={18} color="#C0392B" strokeWidth={1.8} />
            {!collapsed && <span style={{ color: '#C0392B', fontSize: 13, fontWeight: 600 }}>Log Out</span>}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnnouncementBanner role={partnerRole} />
        {children}
      </div>

      <NotificationToast />
    </div>
  );
}

export default function Layout({ children }) {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile
        ? <MobileLayout>{children}</MobileLayout>
        : <DesktopLayout>{children}</DesktopLayout>}
      <TermsReacceptanceModal />
    </>
  );
}
