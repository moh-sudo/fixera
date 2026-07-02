import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { C } from '../theme';

function Toast({ notif, onDismiss }) {
  const navigate  = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 6000);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    onDismiss();
    if (notif.link) navigate(notif.link);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: C.navyLight,
        border: `1px solid ${notif.color || C.gold}50`,
        borderLeft: `4px solid ${notif.color || C.gold}`,
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${notif.color || C.gold}15`,
        cursor: notif.link ? 'pointer' : 'default',
        maxWidth: 340, width: '100%',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 11, background: `${notif.color || C.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
        {notif.icon || '🔔'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{notif.title}</div>
        <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.4 }}>{notif.body}</div>
        {notif.link && <div style={{ color: notif.color || C.gold, fontSize: 11, fontWeight: 700, marginTop: 5 }}>Tap to view →</div>}
      </div>
      <button
        onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }}
        style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 18, cursor: 'pointer', padding: '0 0 0 4px', flexShrink: 0, lineHeight: 1 }}
      >×</button>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState([]);
  const shownRef = useRef(new Set());

  useEffect(() => {
    if (!notifications.length) return;
    const newest = notifications[0];
    if (!shownRef.current.has(newest.id)) {
      shownRef.current.add(newest.id);
      const age = Date.now() - new Date(newest.time).getTime();
      if (age < 5000) setToasts(prev => [newest, ...prev].slice(0, 4));
    }
  }, [notifications]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
      {toasts.map(t => <Toast key={t.id} notif={t} onDismiss={() => dismiss(t.id)} />)}
    </div>
  );
}
