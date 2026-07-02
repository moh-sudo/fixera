const CL = { gold: '#C9A020', goldSoft: '#FDF8EC', goldBorder: '#E8D48A' };

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

export default function Avatar({ url, name, size = 44, ring = false, ringColor }) {
  const border = ring
    ? `2px solid ${ringColor || CL.goldBorder}`
    : '1.5px solid rgba(0,0,0,0.06)';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border, overflow: 'hidden', flexShrink: 0,
      background: CL.goldSoft,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url ? (
        <img
          src={url} alt={name || 'Avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <span style={{
        display: url ? 'none' : 'flex',
        alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        color: CL.gold, fontSize: size * 0.34, fontWeight: 800, letterSpacing: '-0.5px',
        userSelect: 'none',
      }}>
        {initials(name).toUpperCase()}
      </span>
    </div>
  );
}
