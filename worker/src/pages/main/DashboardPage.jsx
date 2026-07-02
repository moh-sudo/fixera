import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Wallet, Star, MapPin, Calendar, Clock, RefreshCw, FileText, History, Headphones, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import VerificationBanner from '../../components/VerificationBanner';
import Avatar from '../../components/Avatar';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  goldSoft: '#FDF8EC', goldBorder: '#E8D48A',
  green: '#10B981', greenSoft: '#ECFDF5', greenBorder: '#A7F3D0',
  blue: '#3B82F6', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  red: '#EF4444', redSoft: '#FEF2F2', redBorder: '#FECACA',
};

const STATUS_COLORS  = { upcoming: CL.gold, confirmed: CL.blue, on_way: CL.blue, in_progress: CL.green, completed: CL.green, cancelled: CL.red };
const STATUS_LABELS  = { upcoming: 'Upcoming', confirmed: 'Confirmed', on_way: 'On Way', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_BG      = { upcoming: CL.goldSoft, confirmed: CL.blueSoft, on_way: CL.blueSoft, in_progress: CL.greenSoft, completed: CL.greenSoft, cancelled: CL.redSoft };

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </div>
        <span style={{ color: iconColor, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ color: CL.text, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ color: CL.muted, fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [jobs, setJobs]                   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('new');
  const [receipts, setReceipts]           = useState([]);
  const [available, setAvailable]         = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  useEffect(() => { fetchJobs(); }, [tab, profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from('workers').select('is_available').eq('id', user.id).single()
      .then(({ data }) => { if (data) setAvailable(data.is_available ?? true); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from('receipts').select('*').eq('worker_id', user.id)
      .order('generated_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { if (!error) setReceipts(data || []); });
  }, [user]);

  async function fetchJobs() {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (tab === 'new') {
      query = query.is('worker_id', null).eq('status', 'upcoming');
      if (profile?.service) query = query.ilike('service', `${profile.service.replace(/ .*/, '')}%`);
      if (profile?.service_area) query = query.ilike('address', `%${profile.service_area}%`);
    } else {
      query = query.eq('worker_id', user.id).neq('status', 'cancelled');
    }
    const { data } = await query.limit(30);
    setJobs(data || []);
    setLoading(false);
  }

  const toggleAvailability = async () => {
    if (!user || togglingAvail) return;
    setTogglingAvail(true);
    const next = !available;
    await supabase.from('workers').update({ is_available: next }).eq('id', user.id);
    setAvailable(next);
    setTogglingAvail(false);
  };

  const acceptJob = async (jobId, e) => {
    e.stopPropagation();
    if (!available) { alert('You are currently set to Unavailable. Toggle your availability to accept jobs.'); return; }
    if (!profile?.can_receive_jobs) { alert('Your wallet balance is too low to accept jobs. Please top up to continue.'); return; }
    await supabase.from('bookings').update({ worker_id: user.id, status: 'confirmed', worker_name: profile?.full_name, accepted_at: new Date().toISOString() }).eq('id', jobId);
    fetchJobs();
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const totalJobs = profile?.total_jobs || 0;
  const earnings  = profile?.earnings   || 0;
  const rating    = profile?.rating     || 5.0;

  return (
    <div style={{ padding: '20px 16px 40px', flex: 1, maxWidth: 600, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <VerificationBanner />

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer', flexShrink: 0 }}>
          <Avatar url={profile?.profile_picture_url} name={profile?.full_name} size={56} ring ringColor="#E8D48A" />
        </div>
        <div>
          <div style={{ color: CL.text, fontSize: 24, fontWeight: 900, lineHeight: 1.2 }}>
            {greeting}
          </div>
          <div style={{ color: CL.muted, fontSize: 13, marginTop: 4 }}>
            {profile?.full_name || 'Partner'} · <span style={{ color: CL.gold, fontWeight: 700 }}>{profile?.service || 'Service Pro'}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <StatCard icon={CheckCircle2} iconColor={CL.green} iconBg={CL.greenSoft} label="Jobs" value={totalJobs} sub="Total completed" />
        <StatCard icon={Wallet} iconColor={CL.gold} iconBg={CL.goldSoft}
          label="Earnings" value={<><span style={{ fontSize: 16, fontWeight: 600, color: CL.muted }}>KSh </span>{earnings.toLocaleString()}</>}
          sub="Net earnings (85%)" />
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Star size={20} color={CL.gold} fill={CL.gold} strokeWidth={0} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Your Rating</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: CL.text, fontSize: 22, fontWeight: 900 }}>{rating}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} color={CL.gold} fill={s <= Math.round(rating) ? CL.gold : 'none'} strokeWidth={s <= Math.round(rating) ? 0 : 1.5} />
              ))}
            </div>
            <span style={{ color: CL.muted, fontSize: 11 }}>/ 5.0</span>
          </div>
        </div>
        <button onClick={() => navigate('/earnings')} style={{ padding: '8px 14px', borderRadius: 10, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, color: CL.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          View →
        </button>
      </div>

      {/* Availability Toggle */}
      <div onClick={toggleAvailability} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: available ? CL.greenSoft : CL.redSoft, border: `1px solid ${available ? CL.greenBorder : CL.redBorder}`, borderRadius: 16, padding: '14px 16px', marginBottom: 20, cursor: 'pointer', opacity: togglingAvail ? 0.6 : 1, transition: 'all 0.2s' }}>
        <div>
          <div style={{ color: available ? CL.green : CL.red, fontSize: 14, fontWeight: 800 }}>
            {available ? 'Available for Jobs' : 'Unavailable'}
          </div>
          <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>
            {available ? 'Tap to go offline' : 'Tap to go online and receive jobs'}
          </div>
        </div>
        <div style={{ width: 48, height: 26, borderRadius: 13, padding: 3, background: available ? CL.green : CL.border, transition: 'background 0.2s', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: available ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { icon: History,    label: 'History',  path: '/history',  color: CL.blue,  bg: CL.blueSoft  },
          { icon: Wallet,     label: 'Payouts',  path: '/earnings', color: CL.green, bg: CL.greenSoft },
          { icon: Headphones, label: 'Support',  path: '/support',  color: '#F59E0B', bg: '#FFFBEB'   },
        ].map(a => {
          const Icon = a.icon;
          return (
            <div key={a.label} onClick={() => navigate(a.path)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 16, background: CL.surface, border: `1px solid ${CL.border}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={a.color} strokeWidth={1.8} />
              </div>
              <span style={{ color: CL.muted, fontSize: 11, fontWeight: 600 }}>{a.label}</span>
            </div>
          );
        })}
      </div>

      {/* Job Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {[
          { k: 'new',  label: 'New Jobs' },
          { k: 'mine', label: 'My Jobs'  },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === t.k ? CL.goldSoft : 'transparent', border: `1.5px solid ${tab === t.k ? CL.gold : CL.border}`, color: tab === t.k ? CL.gold : CL.muted, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {t.label}
            {!loading && tab === t.k && (
              <span style={{ background: CL.gold, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>{jobs.length}</span>
            )}
          </button>
        ))}
        <button onClick={fetchJobs} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 10, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Job List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${CL.border}`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: CL.bg, border: `1px solid ${CL.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {tab === 'new'
              ? <Clock size={28} color={CL.muted} strokeWidth={1.5} />
              : <FileText size={28} color={CL.muted} strokeWidth={1.5} />}
          </div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            {tab === 'new' ? 'No new jobs right now' : 'No accepted jobs yet'}
          </div>
          <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.6 }}>
            {tab === 'new' ? 'Stay online to receive job alerts in real-time' : 'Accept a job from the New Jobs tab to get started'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map(job => {
            const statusColor = STATUS_COLORS[job.status] || CL.gold;
            const statusBg    = STATUS_BG[job.status]     || CL.goldSoft;
            const price       = Number(job.price || 0);
            const netEarning  = price * 0.85;
            return (
              <div key={job.id} onClick={() => navigate(`/job/${job.id}`)}
                style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s', borderLeft: `4px solid ${statusColor}` }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: CL.goldSoft, border: `1px solid ${CL.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wrench size={20} color={CL.gold} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: CL.text, fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{job.sub_service || job.service || 'Service'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}>
                        <MapPin size={11} color={CL.muted} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.address || 'Nairobi'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: statusBg, color: statusColor, whiteSpace: 'nowrap', letterSpacing: '0.04em', flexShrink: 0 }}>
                    {STATUS_LABELS[job.status] || (job.status || '').toUpperCase()}
                  </div>
                </div>

                {/* Details row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: tab === 'new' ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}>
                    <Calendar size={11} color={CL.muted} />{job.booking_date || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: CL.muted, fontSize: 12 }}>
                    <Clock size={11} color={CL.muted} />{job.booking_time || '—'}
                  </div>
                  {price > 0 && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ color: CL.green, fontSize: 15, fontWeight: 800 }}>KSh {netEarning.toLocaleString('en-KE', { maximumFractionDigits: 0 })}</span>
                      <span style={{ color: CL.muted, fontSize: 10 }}>earn</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {job.notes && (
                  <div style={{ color: CL.muted, fontSize: 12, fontStyle: 'italic', marginBottom: tab === 'new' ? 12 : 0, padding: '6px 10px', background: CL.bg, borderRadius: 8, marginTop: 8 }}>
                    "{job.notes}"
                  </div>
                )}

                {/* Accept button */}
                {tab === 'new' && (
                  <button onClick={(e) => acceptJob(job.id, e)} style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 800, background: CL.text, border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,22,40,0.2)', transition: 'box-shadow 0.15s' }}>
                    <CheckCircle2 size={16} />
                    Accept Job
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Receipts */}
      {receipts.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>Recent Receipts</div>
            <button onClick={() => navigate('/history')} style={{ color: CL.gold, fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>See all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {receipts.map(r => (
              <div key={r.id} onClick={() => navigate(`/receipt/${r.booking_id}`)}
                style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: CL.greenSoft, border: `1px solid ${CL.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={CL.green} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{r.sub_service || r.service}</div>
                  <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{r.receipt_no} · {new Date(r.generated_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={{ color: CL.green, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>KSh {(r.amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
