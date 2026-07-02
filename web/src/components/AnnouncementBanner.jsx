import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getActiveAnnouncements, getReadIds, markAnnouncementRead, TYPE_META } from '../services/announcementsService';

export default function AnnouncementBanner({ audience = 'customers' }) {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [idx,     setIdx]     = useState(0);

  useEffect(() => {
    getActiveAnnouncements(audience).then(setItems);
  }, [audience]);

  useEffect(() => {
    if (user?.id) getReadIds(user.id).then(setReadIds);
  }, [user?.id]);

  const visible = items.filter(a => !readIds.includes(a.id));
  if (visible.length === 0) return null;

  const item = visible[idx % visible.length];
  const meta = TYPE_META[item.type] || TYPE_META.info;

  const dismiss = async (id) => {
    const next = [...readIds, id];
    setReadIds(next);
    setIdx(0);
    if (user?.id) await markAnnouncementRead(user.id, id);
  };

  return (
    <div style={{
      background: meta.bg,
      border: `1px solid ${meta.color}40`,
      borderLeft: `4px solid ${meta.color}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: meta.color, fontSize: 13, marginBottom: 2 }}>
          {item.is_pinned && '📌 '}{item.title}
        </div>
        <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>{item.body}</div>
      </div>

      {visible.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => setIdx(i => (i - 1 + visible.length) % visible.length)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: meta.color, fontSize: 16, padding: '0 2px' }}>‹</button>
          <span style={{ fontSize: 11, color: '#718096' }}>{(idx % visible.length) + 1}/{visible.length}</span>
          <button onClick={() => setIdx(i => (i + 1) % visible.length)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: meta.color, fontSize: 16, padding: '0 2px' }}>›</button>
        </div>
      )}

      <button onClick={() => dismiss(item.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: 16, flexShrink: 0, padding: '0 2px', lineHeight: 1 }}
        title="Dismiss">✕</button>
    </div>
  );
}
