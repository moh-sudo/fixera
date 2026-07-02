import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';

// ── Edit Profile Drawer ──────────────────────────────────────────
function EditProfileDrawer({ profile, onClose, onSave }) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone,    setPhone]    = useState(profile?.phone     || '');
  const [city,     setCity]     = useState(profile?.city      || 'Nairobi, Kenya');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ full_name: fullName.trim(), phone: phone.trim(), city: city.trim() });
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:540,
        background:'var(--bg-light)', borderRadius:'24px 24px 0 0',
        padding:'28px 24px 40px', border:`1px solid ${C.navyBorder}`,
        maxHeight:'90vh', overflowY:'auto',
        animation:'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ color:C.textPrimary, fontSize:17, fontWeight:800 }}>✏️ Edit Profile</div>
            <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>Update your information</div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, background:'var(--bg-mid)', border:`1px solid ${C.navyBorder}`, color:C.textSec, fontSize:16, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background=C.navyBorder}
            onMouseLeave={e => e.currentTarget.style.background='var(--bg-mid)'}
          >✕</button>
        </div>

        {/* Avatar */}
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <div style={{ width:68, height:68, borderRadius:17, background:'linear-gradient(135deg, rgba(201,160,32,0.15), rgba(201,160,32,0.08))', border:'1.5px solid rgba(201,160,32,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 10px' }}>👤</div>
          <div style={{ color:C.textMuted, fontSize:11, fontWeight:500 }}>Avatar upload coming soon</div>
        </div>

        {[
          { label:'Full Name',    value:fullName, set:setFullName, placeholder:'Your full name',      type:'text' },
          { label:'Phone Number', value:phone,    set:setPhone,    placeholder:'+254 7XX XXX XXX',   type:'tel'  },
          { label:'City',         value:city,     set:setCity,     placeholder:'Nairobi, Kenya',     type:'text' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:14 }}>
            <div style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:7 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width:'100%', padding:'12px 14px', borderRadius:11, border:`1px solid ${C.navyBorder}`, background:'var(--bg-mid)', color:C.textPrimary, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'all 0.2s' }}
              onFocus={e => { e.target.style.borderColor='#C9A020'; e.target.style.background='var(--bg)'; }}
              onBlur={e  => { e.target.style.borderColor=C.navyBorder; e.target.style.background='var(--bg-mid)'; }}
            />
          </div>
        ))}

        <div style={{ marginBottom:22 }}>
          <div style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:7 }}>Email</div>
          <div style={{ padding:'12px 14px', borderRadius:11, border:`1px solid ${C.navyBorder}`, background:'var(--bg)', color:C.textMuted, fontSize:14 }}>
            {profile?.email || '—'} <span style={{ fontSize:10, opacity:0.7 }}>· read-only</span>
          </div>
        </div>

        {error && <div style={{ background:'rgba(252,129,129,0.1)', border:'1.5px solid rgba(252,129,129,0.25)', borderRadius:11, padding:'11px 14px', color:'#FC8181', fontSize:13, marginBottom:16, fontWeight:600 }}>⚠️ {error}</div>}

        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:'14px', borderRadius:12, border:'none',
          background: saving ? 'var(--bg-mid)' : 'linear-gradient(135deg,#C9A020,#D4B033)',
          color: saving ? C.textMuted : '#0A0E1A',
          fontSize:15, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: saving ? 0.6 : 1,
        }}
        onMouseEnter={e => !saving && (e.currentTarget.style.opacity = '0.95')}
        onMouseLeave={e => !saving && (e.currentTarget.style.opacity = '1')}
        >
          {saving ? '💾 Saving…' : '✅ Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main ProfilePage ─────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { isDay, toggle } = useTheme();
  const { profile, user, logout, updateProfile } = useAuth();

  const [showEdit,  setShowEdit]  = useState(false);
  const [stats,     setStats]     = useState({ total:0, completed:0 });
  const [statsLoad, setStatsLoad] = useState(true);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest';
  const email       = profile?.email     || user?.email || '—';
  const phone       = profile?.phone     || null;
  const city        = profile?.city      || 'Nairobi, Kenya';

  useEffect(() => {
    if (!user) { setStatsLoad(false); return; } // guests have no stats yet
    supabase.from('bookings').select('status').eq('user_id', user.id)
      .then(({ data }) => {
        const all = data || [];
        setStats({ total: all.length, completed: all.filter(b => b.status === 'completed').length });
        setStatsLoad(false);
      });
  }, [user]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const MENU_SECTIONS = [
    {
      title: 'Account',
      items: [
        { icon:'✏️', label:'Edit Profile',      onClick:() => setShowEdit(true) },
        { icon:'📋', label:'Booking History',   onClick:() => navigate('/history') },
        { icon:'📂', label:'My Documents',      onClick:() => navigate('/documents') },
        { icon:'🔍', label:'Inspections',       onClick:() => navigate('/inspections') },
      ],
    },
    {
      title: 'Help & Info',
      items: [
        { icon:'🎧', label:'Support Center',    onClick:() => navigate('/support') },
        { icon:'💡', label:'FAQ',               onClick:() => navigate('/faq') },
        { icon:'📄', label:'Terms of Service',  onClick:() => navigate('/terms') },
        { icon:'🛡️', label:'Privacy Policy',    onClick:() => navigate('/privacy') },
        { icon:'ℹ️', label:'About Fixera',      onClick:() => navigate('/about') },
      ],
    },
  ];

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px 32px' }} className="fade-in">

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color:C.textPrimary, fontSize:24, fontWeight:900, marginBottom:4 }}>
          👋 Hi {displayName.split(' ')[0]?.charAt(0).toUpperCase() + displayName.split(' ')[0]?.slice(1) || 'there'}!
        </div>
        <div style={{ color:C.textSec, fontSize:13 }}>Welcome back to Fixera</div>
      </div>

      {/* ── User Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,160,32,0.08), rgba(201,160,32,0.03))',
        border:`1.5px solid rgba(201,160,32,0.25)`,
        borderRadius:18, padding:18, marginBottom:20,
        display:'flex', alignItems:'center', gap:14,
      }}>
        {/* Avatar */}
        <div style={{
          width:64, height:64, borderRadius:16, flexShrink:0,
          background:'linear-gradient(135deg, rgba(201,160,32,0.2), rgba(201,160,32,0.08))',
          border:'1.5px solid rgba(201,160,32,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
        }}>👤</div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:C.textPrimary, fontSize:16, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{displayName}</div>
          <div style={{ color:C.textMuted, fontSize:12, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
          {phone && <div style={{ color:C.textMuted, fontSize:11, marginTop:1 }}>📞 {phone}</div>}
        </div>

        {/* Edit button */}
        <button onClick={() => setShowEdit(true)} style={{
          flexShrink:0, padding:'9px 16px', borderRadius:10,
          background: 'linear-gradient(135deg, #C9A020, #D4B033)',
          border: 'none',
          color: '#0A0E1A', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >✏️ Edit</button>
      </div>

      {/* ── Stats Cards (2x2 Grid) ── */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20,
      }}>
        {[
          { val: statsLoad ? '…' : stats.total,                                              label:'Total Bookings',  icon:'📋', color:'#C9A020' },
          { val: statsLoad ? '…' : stats.completed,                                          label:'Completed',       icon:'✅', color:'#48BB78' },
          { val: statsLoad ? '…' : Math.max(0, stats.total - stats.completed),               label:'Pending',         icon:'⏳', color:'#63B3ED' },
          { val: statsLoad ? '…' : '★4.8',                                                   label:'Your Rating',     icon:'⭐', color:'#F6AD55' },
        ].map(s => (
          <div key={s.label} style={{
            background: `linear-gradient(135deg, ${s.color}15, ${s.color}08)`,
            border: `1.5px solid ${s.color}30`,
            borderRadius: 16,
            padding: '16px 14px',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{s.val}</div>
            <div style={{ color: C.textSec, fontSize: 12, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Member Badge ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,160,32,0.12), rgba(201,160,32,0.05))',
        border:'1.5px solid rgba(201,160,32,0.25)',
        borderRadius:16, padding:'14px 16px', marginBottom:24,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, rgba(201,160,32,0.2), rgba(201,160,32,0.08))', border:'1px solid rgba(201,160,32,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏅</div>
        <div style={{ flex:1 }}>
          <div style={{ color:C.textPrimary, fontSize:14, fontWeight:700 }}>Trusted Member</div>
          <div style={{ color:C.textMuted, fontSize:11, marginTop:2 }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { month:'short', year:'numeric' }) : 'recently'}
          </div>
        </div>
        <div style={{ padding:'5px 11px', borderRadius:8, background:'rgba(72,187,120,0.12)', border:'1px solid rgba(72,187,120,0.3)', color:'#48BB78', fontSize:10, fontWeight:700, flexShrink:0 }}>✓ Active</div>
      </div>

      {/* ── Menu Sections ── */}
      {MENU_SECTIONS.map(sec => (
        <div key={sec.title} style={{ marginBottom:18 }}>
          <div style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', marginBottom:10, paddingLeft:4 }}>{sec.title}</div>
          <div style={{ background:'var(--bg-light)', border:`1px solid ${C.navyBorder}`, borderRadius:16, overflow:'hidden' }}>
            {sec.items.map((item, idx) => (
              <div key={item.label}>
                <div
                  onClick={item.onClick}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-mid)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:11, background:'rgba(201,160,32,0.08)', border:'1px solid rgba(201,160,32,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                      {item.icon}
                    </div>
                    <span style={{ color:C.textPrimary, fontSize:14, fontWeight:600 }}>{item.label}</span>
                  </div>
                  <span style={{ color:C.textMuted, fontSize:20, opacity:0.6 }}>›</span>
                </div>
                {idx < sec.items.length - 1 && <div style={{ height:1, background:C.navyBorder, marginLeft:68 }} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Appearance ── */}
      <div style={{ marginBottom:18 }}>
        <div style={{ color:C.textMuted, fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', marginBottom:10, paddingLeft:4 }}>Appearance</div>
        <div style={{ background:'var(--bg-light)', border:`1px solid ${C.navyBorder}`, borderRadius:16, overflow:'hidden' }}>
          <div onClick={toggle} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--bg-mid)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:11, background: isDay ? 'rgba(201,160,32,0.1)' : 'rgba(99,179,237,0.1)', border:`1px solid ${isDay ? 'rgba(201,160,32,0.25)' : 'rgba(99,179,237,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {isDay ? '☀️' : '🌙'}
              </div>
              <div>
                <div style={{ color:C.textPrimary, fontSize:14, fontWeight:600 }}>{isDay ? 'Light Mode' : 'Dark Mode'}</div>
                <div style={{ color:C.textMuted, fontSize:11, marginTop:1 }}>Switch appearance</div>
              </div>
            </div>
            {/* Toggle switch */}
            <div style={{ width:50, height:28, borderRadius:14, background: isDay ? 'linear-gradient(135deg,#C9A020,#D4B033)' : 'linear-gradient(135deg,#1A2A4A,#243552)', position:'relative', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left: isDay ? 23 : 3, width:22, height:22, borderRadius:'50%', background:'#fff', boxShadow:'0 2px 6px rgba(0,0,0,0.25)', transition:'left 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Logout Button ── */}
      <button
        onClick={handleLogout}
        style={{
          width:'100%', padding:'14px', borderRadius:14,
          background:'rgba(252,129,129,0.1)', border:'1.5px solid rgba(252,129,129,0.3)',
          color:'#FC8181', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
          marginBottom:20,
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(252,129,129,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(252,129,129,0.1)'}
      >🚪 Log Out</button>

      <div style={{ color:C.textMuted, fontSize:10, textAlign:'center', paddingBottom:8 }}>
        Fixera v1.0.0 · Nairobi, Kenya
      </div>

      {/* Edit drawer */}
      {showEdit && <EditProfileDrawer profile={profile} onClose={() => setShowEdit(false)} onSave={updateProfile} />}
    </div>
  );
}
