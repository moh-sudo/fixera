import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C } from '../theme';
import { Home, CalendarClock, Wallet, User } from 'lucide-react';
import FixeraLogo from './FixeraLogo';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';
import NotificationToast from './NotificationToast';
import TermsReacceptanceModal from './TermsReacceptanceModal';

const NAV_ITEMS = [
  { path: '/home',    Icon: Home,         label: 'Home'     },
  { path: '/history', Icon: CalendarClock, label: 'Bookings' },
  { path: '/wallet',  Icon: Wallet,       label: 'Wallet'   },
  { path: '/profile', Icon: User,         label: 'Profile'  },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────
function MobileLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || profile?.full_name || user?.email?.split('@')[0] || 'Guest';
  const swipeStartX = useRef(0);

  // Swipe right-to-left to go to next tab (no reverse)
  const handleTouchStart = (e) => { swipeStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = swipeStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) {
      // Swiped left → go to next page
      const currentIdx = NAV_ITEMS.findIndex(n => pathname === n.path || pathname.startsWith(n.path + '/'));
      if (currentIdx >= 0 && currentIdx < NAV_ITEMS.length - 1) {
        navigate(NAV_ITEMS[currentIdx + 1].path);
      }
    }
    // No action for swiping right (no reverse)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.navy }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: C.navyLight, borderBottom: `1px solid ${C.navyBorder}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        <FixeraLogo size={32} showText={true} showTagline={false} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <div
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: C.navyMid, border: `1px solid ${C.navyBorder}`,
              borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
            }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={14} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ color: C.textPrimary, fontSize: 12, fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          marginTop: 60,
          marginBottom: 70,
          overflowY: 'auto',
          background: C.navy,
          minHeight: 'calc(100vh - 130px)',
        }}
      >
        {children}
      </main>

      {/* ── Bottom nav bar ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: C.navyLight,
        borderTop: `1px solid ${C.navyBorder}`,
        display: 'flex', alignItems: 'center',
        height: 70,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 4px', height: '100%',
                fontFamily: 'inherit',
              }}
            >
              <item.Icon
                size={23}
                strokeWidth={active ? 2.4 : 1.8}
                color={active ? C.gold : C.textMuted}
                style={{ transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.2s' }}
              />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? C.gold : C.textMuted,
                transition: 'color 0.2s',
              }}>{item.label}</span>
              {active && (
                <div style={{
                  position: 'absolute', bottom: 0,
                  width: 32, height: 3, borderRadius: 2,
                  background: C.gold,
                }} />
              )}
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
  const { pathname } = useLocation();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || profile?.full_name || user?.email?.split('@')[0] || 'Guest';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.navy }}>
      <style>{`
        .nav-btn:hover { background: rgba(201,160,32,0.10) !important; color: #C9A020 !important; }
        html.light-mode aside { box-shadow: 2px 0 16px rgba(0,0,0,0.07); }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        background: C.navyLight,
        borderRight: `1px solid ${C.navyBorder}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '26px 22px 20px', borderBottom: `1px solid ${C.navyBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FixeraLogo size={44} showText={true} showTagline={false} />
          </div>

          {/* User mini card */}
          <div style={{
            marginTop: 16, padding: '10px 12px', borderRadius: 12,
            background: C.navyMid, border: `1px solid ${C.navyBorder}`,
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }} onClick={() => navigate('/profile')}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={18} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>Customer</div>
            </div>
            <span style={{ color: C.textMuted, fontSize: 14 }}>›</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 12px' }}>
          <div style={{ color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, padding: '0 10px 10px', textTransform: 'uppercase' }}>
            Menu
          </div>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                className={active ? '' : 'nav-btn'}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 13, marginBottom: 3,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', fontSize: 14, transition: 'all 0.15s',
                  background: active ? 'rgba(201,160,32,0.12)' : 'transparent',
                  color: active ? C.gold : C.textSec,
                  fontWeight: active ? 700 : 500,
                  boxShadow: active ? 'inset 0 0 0 1px rgba(201,160,32,0.2)' : 'none',
                }}
              >
                <item.Icon size={19} strokeWidth={active ? 2.4 : 1.8} color={active ? C.gold : C.textSec} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Notification Bell */}
        <div style={{ padding: '0 12px 4px' }}>
          <NotificationBell />
        </div>

        {/* Emergency button */}
        <div style={{ padding: '0 12px 12px' }}>
          <button style={{
            width: '100%', padding: '12px', borderRadius: 13,
            background: 'rgba(200,50,50,0.15)',
            border: '1px solid rgba(200,80,80,0.25)',
            color: '#FC8181', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}>
            🚨 Emergency
          </button>
        </div>

        {/* Tagline */}
        <div style={{ padding: '14px 24px 22px', borderTop: `1px solid ${C.navyBorder}` }}>
          <div style={{ color: C.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 2, textAlign: 'center' }}>
            ONE CALL. WE FIX IT ALL.
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', overflowY: 'auto', background: C.navy }}>
        {children}
      </main>

      <NotificationToast />
    </div>
  );
}

// ── Main export — picks layout based on screen size ───────────────
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
