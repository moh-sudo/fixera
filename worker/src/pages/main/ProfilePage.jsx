import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import { getReviewsForPartner } from '../../services/reviewsService';
import Avatar from '../../components/Avatar';
import {
  Wrench, ShoppingBag, Car, Package,
  Briefcase, Star, TrendingUp, CheckCircle,
  BarChart2, RefreshCw, Truck, Clock,
  Award, Pencil, LogOut, X, Save, Camera,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF',
  red: '#EF4444', redSoft: '#FEF2F2',
  amber: '#F59E0B', amberSoft: '#FFFBEB',
};

const ROLE_INFO = {
  worker:   { label: 'Service Worker', Icon: Wrench,      color: CL.gold  },
  vendor:   { label: 'Vendor',         Icon: ShoppingBag, color: CL.blue  },
  rider:    { label: 'Rider',          Icon: Car,         color: CL.green },
  supplier: { label: 'Supplier',       Icon: Package,     color: CL.amber },
};

const STATS_BY_ROLE = {
  worker: [
    { Icon: Briefcase,   label: 'Jobs Completed', val: p => p?.total_jobs || 0,                                  color: CL.gold  },
    { Icon: Star,        label: 'Rating',          val: p => `${p?.rating || 4.8}★`,                             color: CL.amber },
    { Icon: TrendingUp,  label: 'Total Earned',    val: p => `KSh ${((p?.earnings||0)*0.85).toLocaleString()}`,  color: CL.green },
    { Icon: CheckCircle, label: 'Response Rate',   val: p => `${p?.acceptance_rate || 95}%`,                     color: CL.blue  },
  ],
  vendor: [
    { Icon: BarChart2,   label: 'Orders Complete', val: p => p?.total_orders || 0,                        color: CL.blue  },
    { Icon: Star,        label: 'Seller Rating',   val: p => `${p?.rating || 4.9}★`,                      color: CL.amber },
    { Icon: TrendingUp,  label: 'Total Revenue',   val: p => `KSh ${(p?.earnings||0).toLocaleString()}`,  color: CL.green },
    { Icon: RefreshCw,   label: 'Repeat Rate',     val: p => `${p?.repeat_rate || 62}%`,                  color: CL.gold  },
  ],
  rider: [
    { Icon: Truck,       label: 'Deliveries',   val: p => p?.total_deliveries || 0,                            color: CL.green },
    { Icon: Star,        label: 'Rating',        val: p => `${p?.rating || 4.7}★`,                             color: CL.amber },
    { Icon: TrendingUp,  label: 'Earnings',      val: p => `KSh ${((p?.earnings||0)*0.90).toLocaleString()}`,  color: CL.green },
    { Icon: Clock,       label: 'On-time Rate',  val: p => `${p?.ontime_rate || 98}%`,                         color: CL.blue  },
  ],
  supplier: [
    { Icon: Package,     label: 'Products Sold',  val: p => p?.products_sold || 0,                       color: CL.amber },
    { Icon: Star,        label: 'Seller Rating',  val: p => `${p?.rating || 4.6}★`,                      color: CL.green },
    { Icon: TrendingUp,  label: 'Total Revenue',  val: p => `KSh ${(p?.earnings||0).toLocaleString()}`,  color: CL.green },
    { Icon: BarChart2,   label: 'Avg Rating',     val: p => `${p?.product_rating || 4.4}★`,              color: CL.gold  },
  ],
};

function EditModal({ profile, role, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name:     profile?.full_name     || '',
    phone:         profile?.phone         || '',
    business_name: profile?.business_name || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 540, margin: '0 auto',
        background: CL.surface, borderRadius: '24px 24px 0 0',
        padding: '28px 24px 48px', border: `1px solid ${CL.border}`,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ color: CL.text, fontSize: 20, fontWeight: 800 }}>Edit Profile</div>
            <div style={{ color: CL.muted, fontSize: 13, marginTop: 3 }}>Update your information</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: CL.bg, border: `1px solid ${CL.border}`, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        {[
          { label: 'Full Name',      key: 'full_name',     type: 'text', placeholder: 'Your name' },
          { label: 'Phone (M-Pesa)', key: 'phone',         type: 'tel',  placeholder: '+254 7XX XXX XXX' },
          ...(role !== 'worker' ? [{ label: 'Business Name', key: 'business_name', type: 'text', placeholder: 'Your business name' }] : []),
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.text, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: saving ? CL.bg : CL.text, color: saving ? CL.muted : '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
          <Save size={17} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, logout, refreshProfile } = useAuth();
  const [showEdit,        setShowEdit]        = useState(false);
  const [reviews,         setReviews]         = useState([]);
  const [revLoading,      setRevLoading]      = useState(false);
  const [avatarUrl,       setAvatarUrl]       = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setRevLoading(true);
    getReviewsForPartner(user.id)
      .then(setReviews).catch(() => {}).finally(() => setRevLoading(false));
  }, [user]);

  useEffect(() => {
    setAvatarUrl(profile?.profile_picture_url || null);
  }, [profile]);

  const role     = profile?.partner_role || 'worker';
  const roleInfo = ROLE_INFO[role] || ROLE_INFO.worker;
  const RoleIcon = roleInfo.Icon;
  const stats    = (STATS_BY_ROLE[role] || STATS_BY_ROLE.worker).map(s => ({ ...s, value: s.val(profile) }));
  const displayName = profile?.full_name || 'Professional';
  const firstName   = displayName.split(' ')[0];
  const email       = profile?.email || user?.email || '—';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    : 'recently';

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const handleSave   = async (form) => {
    await supabase.from('workers').update(form).eq('id', user.id);
    await refreshProfile();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const bust = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('workers').update({ profile_picture_url: bust }).eq('id', user.id);
      setAvatarUrl(bust);
      await refreshProfile();
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 48px', background: CL.bg, minHeight: '100%', boxSizing: 'border-box' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Greeting */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 28 }}>
        <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
          Hi {firstName}
        </div>
        <div style={{ color: CL.muted, fontSize: 13 }}>Welcome to your {roleInfo.label} profile</div>
      </motion.div>

      {/* Profile Card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 20, padding: '20px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Tappable avatar with camera badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div onClick={() => !avatarUploading && fileInputRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${roleInfo.color}40`, background: CL.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <RoleIcon size={28} color={roleInfo.color} strokeWidth={1.8} />
            )}
            {avatarUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>
          <div onClick={() => !avatarUploading && fileInputRef.current?.click()}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: CL.gold, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Camera size={12} color="#fff" strokeWidth={2.5} />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: CL.text, fontSize: 18, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ color: roleInfo.color, fontSize: 13, fontWeight: 700, marginTop: 3 }}>{roleInfo.label}</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        </div>
        <button onClick={() => setShowEdit(true)} style={{
          flexShrink: 0, padding: '10px 18px', borderRadius: 12,
          background: CL.text, border: 'none', color: '#fff',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Pencil size={14} /> Edit
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {stats.map(s => {
          const SIcon = s.Icon;
          return (
            <div key={s.label} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SIcon size={18} color={s.color} strokeWidth={2} />
                </div>
              </div>
              <div style={{ color: s.color, fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>{s.value}</div>
              <div style={{ color: CL.muted, fontSize: 12, fontWeight: 600 }}>{s.label}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Member Badge */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, borderRadius: 18, padding: '16px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${CL.green}18`, border: `1px solid ${CL.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Award size={24} color={CL.green} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 700 }}>Trusted Professional</div>
          <div style={{ color: CL.muted, fontSize: 12, marginTop: 3 }}>Member since {memberSince}</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 20, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, color: CL.green, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
          Active
        </div>
      </motion.div>

      {/* Reviews */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
        <div style={{ color: CL.muted, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
          Customer Reviews {reviews.length > 0 && `(${reviews.length})`}
        </div>
        {revLoading ? (
          <div style={{ color: CL.muted, fontSize: 13, textAlign: 'center', padding: '28px 0' }}>Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Star size={40} color={CL.border} strokeWidth={1.5} />
            </div>
            <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No reviews yet</div>
            <div style={{ color: CL.muted, fontSize: 13 }}>Complete jobs to earn your first review.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.slice(0, 5).map((r, i) => (
              <motion.div key={r.id} custom={5 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ fontSize: 15, color: s <= r.rating ? CL.gold : CL.border }}>★</span>
                    ))}
                  </div>
                  <div style={{ color: CL.muted, fontSize: 11 }}>
                    {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                    {r.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: CL.goldSoft, color: CL.gold, border: `1px solid ${CL.goldBorder}`, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}
                {r.comment && <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>"{r.comment}"</div>}
              </motion.div>
            ))}
            {reviews.length > 5 && (
              <div style={{ color: CL.muted, fontSize: 12, textAlign: 'center', padding: '6px 0' }}>
                + {reviews.length - 5} more reviews
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Legal section */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 16 }}>
        <div style={{ color: '#9BAAB8', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>Legal</div>
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {[
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Privacy Policy',   path: '/privacy' },
            { label: 'AI Policy',        path: '/ai-policy' },
          ].map((item, idx, arr) => (
            <div key={item.path}>
              <div onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}>
                <span style={{ color: CL.text, fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: '#9BAAB8', fontSize: 13 }}>›</span>
              </div>
              {idx < arr.length - 1 && <div style={{ height: 1, background: CL.border, marginLeft: 16 }} />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.button custom={7} variants={fadeUp} initial="hidden" animate="show" onClick={handleLogout} style={{
        width: '100%', padding: '15px', borderRadius: 14,
        background: CL.redSoft, border: `1px solid #FECACA`, color: CL.red,
        fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
      }}>
        <LogOut size={17} /> Log Out
      </motion.button>

      <div style={{ color: CL.muted, fontSize: 11, textAlign: 'center' }}>
        Fixera Partner v1.0.0 · Nairobi, Kenya
      </div>

      {showEdit && <EditModal profile={profile} role={role} onClose={() => setShowEdit(false)} onSave={handleSave} />}
    </div>
  );
}
