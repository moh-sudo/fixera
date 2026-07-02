import { useState } from 'react';
import { T } from '../design/tokens';

// ── Small reusable primitives (the start of the component library) ──

function Section({ title, desc, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ font: 'inherit', fontSize: T.font.h2.size, fontWeight: T.font.h2.weight, color: T.color.text, margin: '0 0 4px' }}>{title}</h2>
      {desc && <p style={{ fontSize: T.font.small.size, color: T.color.textMuted, margin: '0 0 16px' }}>{desc}</p>}
      <div style={{ background: T.color.surface, border: `1px solid ${T.color.border}`, borderRadius: T.radius.lg, padding: 24, boxShadow: T.shadow.sm }}>
        {children}
      </div>
    </section>
  );
}

function Btn({ variant = 'primary', children, disabled, small, full }) {
  // Uber / Bolt style — bold rounded rectangle, not a pill
  const base = {
    fontFamily: T.font.family, fontWeight: 700, fontSize: small ? 14 : 16, cursor: disabled ? 'not-allowed' : 'pointer',
    padding: small ? '11px 20px' : '16px 26px', borderRadius: T.radius.button, border: 'none', transition: 'all .18s',
    opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto', textAlign: 'center',
  };
  const styles = {
    primary:   { ...base, background: T.color.gold, color: '#fff' },
    secondary: { ...base, background: '#fff', color: T.color.navy, border: `1.5px solid ${T.color.navy}` },
    ghost:     { ...base, background: 'transparent', color: T.color.goldDark, fontWeight: 600 },
    danger:    { ...base, background: T.color.error, color: '#fff' },
  };
  return <button className="ds-btn" style={styles[variant]} disabled={disabled}>{children}</button>;
}

function Badge({ children, bg, color, icon }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: T.radius.sm }}>
      {icon}{children}
    </span>
  );
}

const SERVICES = [
  { name: 'Plumbing',   c: T.color.plumbing,   icon: '🔧' },
  { name: 'Electrical', c: T.color.electrical, icon: '⚡' },
  { name: 'Cleaning',   c: T.color.cleaning,   icon: '✨' },
  { name: 'Painting',   c: T.color.painting,   icon: '🎨' },
];

export default function DesignSystemPage() {
  const [tab, setTab] = useState('error');

  return (
    <div style={{ minHeight: '100vh', background: T.color.bg, fontFamily: T.font.family, color: T.color.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .ds-btn:hover:not(:disabled){ filter:brightness(0.94); transform:translateY(-1px); }
        .ds-btn:active:not(:disabled){ transform:scale(0.97); }
        .ds-card{ transition:all .25s; }
        .ds-card:hover{ transform:translateY(-4px); box-shadow:${T.shadow.lg}; }
        .ds-input{ width:100%; font-family:${T.font.family}; font-size:15px; padding:12px 14px; border-radius:${T.radius.md}; border:1px solid ${T.color.border}; outline:none; transition:all .2s; box-sizing:border-box; background:#fff; }
        .ds-input:focus{ border-color:${T.color.gold}; box-shadow:${T.shadow.focus}; }
        @keyframes ds-shimmer{ 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
        .ds-skel{ background:linear-gradient(90deg,#eceef1 25%,#f4f5f7 50%,#eceef1 75%); background-size:800px 100%; animation:ds-shimmer 1.4s infinite linear; border-radius:8px; }
      `}</style>

      {/* Header bar (navy) */}
      <div style={{ background: T.color.header, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>FIX<span style={{ color: T.color.gold }}>ERA</span> · Design System</span>
        <span style={{ color: T.color.textLight, fontSize: 13 }}>Option A · Light &amp; Clean</span>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* COLORS */}
        <Section title="Colors" desc="Brand, surfaces, service accents and semantic colors.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 12 }}>
            {[
              ['Background', T.color.bg], ['Surface', T.color.surface], ['Header', T.color.header], ['Gold', T.color.gold],
              ['Gold dark', T.color.goldDark], ['Text', T.color.text], ['Text muted', T.color.textMuted], ['Border', T.color.border],
              ['Plumbing', T.color.plumbing], ['Electrical', T.color.electrical], ['Cleaning', T.color.cleaning], ['Painting', T.color.painting],
              ['Success', T.color.success], ['Error', T.color.error], ['Warning', T.color.warning], ['Info', T.color.info],
            ].map(([name, hex]) => (
              <div key={name}>
                <div style={{ height: 56, background: hex, borderRadius: T.radius.sm, border: `1px solid ${T.color.border}` }} />
                <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600 }}>{name}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.color.textLight }}>{hex}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* TYPOGRAPHY */}
        <Section title="Typography" desc="Inter — confident headings, readable body.">
          <p style={{ margin: '0 0 10px', fontSize: T.font.display.size, fontWeight: 700, letterSpacing: '-0.02em' }}>Book a trusted pro</p>
          <p style={{ margin: '0 0 8px', fontSize: T.font.h1.size, fontWeight: 700 }}>Heading 1 · 24/700</p>
          <p style={{ margin: '0 0 8px', fontSize: T.font.h2.size, fontWeight: 600 }}>Heading 2 · 18/600</p>
          <p style={{ margin: '0 0 8px', fontSize: T.font.body.size, color: T.color.textMuted }}>Body · 15px · this is the everyday reading size used across the app for descriptions and content.</p>
          <p style={{ margin: 0, fontSize: T.font.label.size, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.color.textLight }}>Label · 12px uppercase</p>
        </Section>

        {/* BUTTONS */}
        <Section title="Buttons" desc="Uber / Bolt style — bold rounded rectangle. Gold = primary action.">
          <div style={{ maxWidth: 380, marginBottom: 18 }}>
            <Btn variant="primary" full>Book now</Btn>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Btn variant="primary">Book now</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="ghost">Ghost link</Btn>
            <Btn variant="danger">Cancel booking</Btn>
            <Btn variant="primary" disabled>Disabled</Btn>
            <Btn variant="primary" small>Small</Btn>
          </div>
        </Section>

        {/* INPUTS */}
        <Section title="Inputs" desc="Focus glows gold. Error state shown.">
          <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name</label>
              <input className="ds-input" placeholder="e.g. Mohamed Amin" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone number</label>
              <input className="ds-input" defaultValue="0712" style={{ borderColor: T.color.error }} />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: T.color.error }}>Please enter a valid phone number.</p>
            </div>
          </div>
        </Section>

        {/* SERVICE TILES */}
        <Section title="Service tiles" desc="Category recognition with accent colors.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 12 }}>
            {SERVICES.map((s) => (
              <div key={s.name} className="ds-card" style={{ background: '#fff', border: `1px solid ${T.color.border}`, borderRadius: T.radius.lg, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.c + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 22 }}>{s.icon}</div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{s.name}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* BADGES */}
        <Section title="Badges & trust signals" desc="Verification, ratings, status.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Badge bg={T.color.successBg} color={T.color.success} icon={<span>✓</span>}>Verified Pro</Badge>
            <Badge bg={T.color.goldSoft} color={T.color.goldDark} icon={<span>★</span>}>4.8 Rating</Badge>
            <Badge bg={T.color.infoBg} color={T.color.info}>In Progress</Badge>
            <Badge bg={T.color.warningBg} color={T.color.warning}>Pending</Badge>
            <Badge bg={T.color.successBg} color={T.color.success}>Completed</Badge>
            <Badge bg={T.color.errorBg} color={T.color.error}>Cancelled</Badge>
          </div>
        </Section>

        {/* BOOKING CARD */}
        <Section title="Booking card" desc="Real-world card combining the system.">
          <div className="ds-card" style={{ background: '#fff', border: `1px solid ${T.color.border}`, borderRadius: T.radius.lg, padding: 18, maxWidth: 440, boxShadow: T.shadow.md }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.color.plumbing + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔧</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Plumbing — Leak Repair</p>
                <p style={{ margin: 0, fontSize: 13, color: T.color.textMuted }}>James K. · Verified Pro</p>
              </div>
              <Badge bg={T.color.infoBg} color={T.color.info}>On the way</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.color.border}`, paddingTop: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: T.color.textLight }}>Total</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>KES 1,500</p>
              </div>
              <Btn variant="primary" small>Track order</Btn>
            </div>
          </div>
        </Section>

        {/* STATES */}
        <Section title="States" desc="Loading, empty, success, error — switch to preview each.">
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {['skeleton', 'empty', 'success', 'error'].map((s) => (
              <button key={s} onClick={() => setTab(s)} style={{
                fontFamily: T.font.family, fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: T.radius.pill, cursor: 'pointer',
                border: `1px solid ${tab === s ? T.color.gold : T.color.border}`, background: tab === s ? T.color.goldSoft : '#fff', color: tab === s ? T.color.goldDark : T.color.textMuted, textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>

          {tab === 'skeleton' && (
            <div style={{ maxWidth: 440 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: 16, border: `1px solid ${T.color.border}`, borderRadius: T.radius.lg, marginBottom: 12 }}>
                  <div className="ds-skel" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="ds-skel" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                    <div className="ds-skel" style={{ height: 12, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'empty' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>No bookings yet</p>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: T.color.textMuted }}>When you book a service, it will show up here.</p>
              <Btn variant="primary">Book your first service</Btn>
            </div>
          )}

          {tab === 'success' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.color.successBg, color: T.color.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px' }}>✓</div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>Booking confirmed!</p>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: T.color.textMuted }}>Your plumber is on the way. You will get an SMS shortly.</p>
              <Btn variant="primary">Track your pro</Btn>
            </div>
          )}

          {tab === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.color.errorBg, color: T.color.error, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px' }}>!</div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 17 }}>Something went wrong</p>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: T.color.textMuted }}>We could not load your bookings. Please try again.</p>
              <Btn variant="secondary">Retry</Btn>
            </div>
          )}
        </Section>

        <p style={{ textAlign: 'center', fontSize: 13, color: T.color.textLight, marginTop: 40 }}>
          Fixera Design System · Phase 2 · Built from your approved tokens
        </p>
      </div>
    </div>
  );
}
