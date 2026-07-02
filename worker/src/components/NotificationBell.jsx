import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  red: '#EF4444',
};

const TYPE_COLOR = {
  new_job:        CL.gold,
  job_update:     '#63B3ED',
  new_delivery:   '#10B981',
  delivery_update:'#10B981',
  new_order:      '#63B3ED',
  product_demand: '#F59E0B',
};
const TYPE_ICON = {
  new_job:        '🔧',
  job_update:     '📋',
  new_delivery:   '🚗',
  delivery_update:'🚗',
  new_order:      '🏪',
  product_demand: '📦',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(date).toLocaleDateString('en-KE');
}

export default function NotificationBell({ collapsed }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, clear, requestPermission, permission } = useNotifications();
  const [open, setOpen]       = useState(false);
  const ref                   = useRef(null);
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

  const handleClick = (n) => { markRead(n.id); setOpen(false); if (n.link) navigate(n.link); };

  const bellButton = (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        padding: isMobile ? '4px' : (collapsed ? '10px 0' : '10px 14px'),
        borderRadius: 10, cursor: 'pointer',
        background: open ? `${CL.gold}12` : 'transparent',
        transition: 'background 0.15s', position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 16, height: 16, borderRadius: '50%',
              background: CL.red, color: 'white',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${CL.surface}`,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && !isMobile && (
          <span style={{ color: open ? CL.gold : CL.muted, fontSize: 13, fontWeight: open ? 700 : 500 }}>
            Alerts
          </span>
        )}
      </div>
      {!collapsed && !isMobile && unreadCount > 0 && (
        <span style={{ background: `${CL.red}18`, color: CL.red, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, border: `1px solid ${CL.red}30` }}>
          {unreadCount} new
        </span>
      )}
    </div>
  );

  const notifContent = (
    <>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${CL.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>🔔 Notifications</div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, color: CL.gold, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              Mark all read
            </button>
          )}
          <button onClick={() => setOpen(false)} style={{ background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 14, fontWeight: 700, width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Permission banner */}
      {permission !== 'granted' && (
        <div style={{ margin: '12px 16px 0', padding: '12px 14px', background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>🔔 Enable notifications</div>
            <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>Get alerts even when the app is in background</div>
          </div>
          <button onClick={requestPermission} style={{ background: CL.text, color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            Allow
          </button>
        </div>
      )}

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔕</div>
            <div style={{ color: CL.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No notifications yet</div>
            <div style={{ color: CL.muted, fontSize: 12 }}>New job alerts will appear here in real-time</div>
          </div>
        ) : (
          notifications.map(n => {
            const color = TYPE_COLOR[n.type] || CL.gold;
            const icon  = TYPE_ICON[n.type]  || '🔔';
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '13px 20px',
                  borderBottom: `1px solid ${CL.border}`,
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? 'transparent' : `${color}08`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: n.read ? 600 : 800, lineHeight: 1.3 }}>{n.title}</div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />}
                  </div>
                  <div style={{ color: CL.muted, fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>
                  <div style={{ color: CL.muted, fontSize: 10, marginTop: 5, fontWeight: 600, opacity: 0.7 }}>{timeAgo(n.time)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${CL.border}`, flexShrink: 0, display: 'flex', gap: 8 }}>
        {notifications.length > 0 && (
          <button onClick={clear} style={{ flex: 1, padding: '10px', borderRadius: 10, background: `${CL.red}10`, border: `1px solid ${CL.red}25`, color: CL.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear All
          </button>
        )}
        <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Close
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {bellButton}

      {/* Mobile: bottom sheet */}
      {open && isMobile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: CL.surface, borderRadius: '20px 20px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease', border: `1px solid ${CL.border}` }}>
            <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
            <div style={{ textAlign: 'center', padding: '10px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: CL.border, margin: '0 auto' }} />
            </div>
            {notifContent}
          </div>
        </div>
      )}

      {/* Desktop: side panel */}
      {open && !isMobile && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0,
          left: collapsed ? 72 : 240, width: 340,
          background: CL.surface, borderRight: `1px solid ${CL.border}`,
          boxShadow: '4px 0 24px rgba(10,22,40,0.10)',
          zIndex: 999, display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.2s ease',
        }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {notifContent}
        </div>
      )}
    </div>
  );
}
