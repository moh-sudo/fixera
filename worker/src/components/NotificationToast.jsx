import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const CL = {
  surface: '#FFFFFF', text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
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

function Toast({ notif, onDismiss }) {
  const navigate = useNavigate();
  const color    = TYPE_COLOR[notif.type] || CL.gold;
  const icon     = TYPE_ICON[notif.type]  || '🔔';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 6000);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => { onDismiss(); if (notif.link) navigate(notif.link); };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        background: CL.surface,
        border: `1px solid ${color}40`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 14,
        padding: '14px 16px',
        boxShadow: `0 8px 32px rgba(10,22,40,0.12), 0 0 0 1px ${color}15`,
        cursor: notif.link ? 'pointer' : 'default',
        maxWidth: 340,
        width: '100%',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: CL.text, fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{notif.title}</div>
        <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.4 }}>{notif.body}</div>
        {notif.link && (
          <div style={{ color, fontSize: 11, fontWeight: 700, marginTop: 5 }}>Tap to view →</div>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }}
        style={{ background: 'none', border: 'none', color: CL.muted, fontSize: 16, cursor: 'pointer', padding: '0 0 0 4px', flexShrink: 0, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications }               = useNotifications();
  const [toasts, setToasts]             = useState([]);
  const shownIdsRef                     = useRef(new Set());

  useEffect(() => {
    if (notifications.length === 0) return;
    const newest = notifications[0];
    if (!shownIdsRef.current.has(newest.id)) {
      shownIdsRef.current.add(newest.id);
      const age = Date.now() - new Date(newest.time).getTime();
      if (age < 5000) {
        setToasts(prev => [newest, ...prev].slice(0, 4));
      }
    }
  }, [notifications]);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
      {toasts.map(t => (
        <Toast key={t.id} notif={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
