import { C, PRICING_COLORS } from '../theme';

export function Btn({ children, onClick, variant = 'primary', disabled, style }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 24px', borderRadius: 12, fontWeight: 700, fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s, transform 0.1s', border: 'none', fontFamily: 'inherit',
    letterSpacing: '0.3px',
  };
  const variants = {
    primary: { background: C.gold, color: C.navy },
    outline: { background: 'transparent', color: C.gold, border: `1.5px solid ${C.gold}` },
    ghost:   { background: 'transparent', color: C.textSec, border: `1px solid ${C.navyBorder}` },
    danger:  { background: `${C.error}15`, color: C.error, border: `1px solid ${C.error}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}>
      {children}
    </button>
  );
}

export function Badge({ label, color }) {
  const col = color || PRICING_COLORS[label] || C.gold;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: col + '22', border: `1px solid ${col}55`, color: col,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.navyLight, border: `1px solid ${C.navyBorder}`,
      borderRadius: 16, padding: 20, cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
      ...style,
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = C.gold + '66'; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = C.navyBorder; }}>
      {children}
    </div>
  );
}

export function Input({ label, icon, type = 'text', placeholder, value, onChange, multiline, rows = 4 }) {
  const fieldStyle = {
    width: '100%', background: C.navyLight, border: `1px solid ${C.navyBorder}`,
    borderRadius: 12, padding: icon ? '14px 16px 14px 44px' : '14px 16px',
    color: C.textPrimary, fontSize: 15, resize: multiline ? 'vertical' : 'none',
    fontFamily: 'inherit',
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', color: C.textSec, fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>{icon}</span>}
        {multiline
          ? <textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} rows={rows} style={fieldStyle} />
          : <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={fieldStyle} />
        }
      </div>
    </div>
  );
}

export function SectionTitle({ title, subtitle, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
      <div>
        <div style={{ color: C.textPrimary, fontSize: 18, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ color: C.textSec, fontSize: 13, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action && <button onClick={onAction} style={{ color: C.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>{action}</button>}
    </div>
  );
}

export function StatusChip({ label, color }) {
  return (
    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: color + '22', color }}>{label}</span>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: C.navyBorder, margin: '12px 0' }} />;
}
