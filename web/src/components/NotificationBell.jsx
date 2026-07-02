import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { C } from '../theme';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-KE');
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, clear, requestPermission, permission } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  const handleClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  // ── Shared notification content ──
  const notifContent = (
    <>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.navyBorder}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ color: C.textPrimary, fontSize: 16, fontWeight: 800 }}>🔔 Notifications</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✓'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'rgba(201,160,32,0.12)', border: `1px solid rgba(201,160,32,0.3)`, color: C.gold, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                Mark all read
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'var(--bg-mid)', border: `1px solid ${C.navyBorder}`, color: C.textSec, fontSize: 14, fontWeight: 700, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        </div>

        {permission !== 'granted' && (
          <div style={{ padding: '11px 14px', background: 'rgba(201,160,32,0.08)', border: `1px solid rgba(201,160,32,0.2)`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.gold, fontSize: 12, fontWeight: 700 }}>Enable push alerts</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>Get notified even when Fixera is in background</div>
            </div>
            <button onClick={requestPermission} style={{ background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: '#0A0E1A', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              Allow
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔕</div>
            <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No notifications yet</div>
            <div style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6 }}>
              You'll get real-time alerts here when your booking is confirmed, your worker is on the way, and when the job is done.
            </div>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${C.navyBorder}`,
                cursor: n.link ? 'pointer' : 'default',
                background: n.read ? 'transparent' : `${n.color || C.gold}10`,
                display: 'flex', gap: 13, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `${n.color || C.gold}18`,
                border: `1px solid ${n.color || C.gold}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {n.icon || '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: n.read ? 600 : 800, lineHeight: 1.3 }}>{n.title}</div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color || C.gold, flexShrink: 0, marginTop: 4 }} />}
                </div>
                <div style={{ color: C.textSec, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ color: C.textMuted, fontSize: 10, marginTop: 5, fontWeight: 600 }}>{timeAgo(n.time)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.navyBorder}`, flexShrink: 0, display: 'flex', gap: 8 }}>
        {notifications.length > 0 && (
          <button onClick={clear} style={{ flex: 1, padding: '11px', borderRadius: 11, background: 'rgba(252,129,129,0.08)', border: '1px solid rgba(252,129,129,0.2)', color: '#FC8181', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear All
          </button>
        )}
        <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: 11, background: 'rgba(122,139,160,0.1)', border: `1px solid ${C.navyBorder}`, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Bell button */}
      {isMobile ? (
        <div onClick={() => setOpen(o => !o)} style={{ position: 'relative', cursor: 'pointer', padding: 4 }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#FC8181', color: 'white',
              fontSize: 9, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg-light)',
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 13, marginBottom: 3,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'left', fontSize: 14, transition: 'all 0.15s',
            background: open ? 'rgba(201,160,32,0.12)' : 'transparent',
            color: open ? C.gold : C.textSec,
            fontWeight: open ? 700 : 500,
          }}
        >
          <span style={{ fontSize: 18, width: 22, textAlign: 'center', position: 'relative', display: 'inline-block' }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#FC8181', color: 'white',
                fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${C.navyLight}`,
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </span>
          <span style={{ flex: 1 }}>Notifications</span>
          {unreadCount > 0 && (
            <div style={{ background: C.gold, color: '#1A2815', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 7px', minWidth: 18, textAlign: 'center' }}>{unreadCount}</div>
          )}
        </button>
      )}

      {/* Mobile: bottom sheet overlay */}
      {open && isMobile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }} onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.navyLight,
              borderRadius: '20px 20px 0 0',
              maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
            <div style={{ textAlign: 'center', padding: '10px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.navyBorder, margin: '0 auto' }} />
            </div>
            {notifContent}
          </div>
        </div>
      )}

      {/* Desktop: slide-in side panel */}
      {open && !isMobile && (
        <div style={{
          position: 'fixed',
          top: 0, bottom: 0,
          left: 240,
          width: 360,
          background: C.navyLight,
          borderRight: `1px solid ${C.navyBorder}`,
          boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {notifContent}
        </div>
      )}
    </div>
  );
}
