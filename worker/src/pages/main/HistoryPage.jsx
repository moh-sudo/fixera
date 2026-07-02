import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import { CheckCircle, XCircle, Wrench, MapPin, FileText, Inbox } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' } }),
};

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', gold: '#C9A020',
  green: '#10B981', red: '#EF4444', blue: '#3B82F6',
};

const STATUS_COLORS = { completed: CL.green, cancelled: CL.red, in_progress: CL.blue };

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (!user) return;
    let q = supabase.from('bookings').select('*').eq('worker_id', user.id).order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    q.then(({ data }) => { setJobs(data || []); setLoading(false); });
  }, [user, filter]);

  const total     = jobs.filter(j => j.status === 'completed').length;
  const cancelled = jobs.filter(j => j.status === 'cancelled').length;

  return (
    <div style={{ padding: '24px 20px 40px', maxWidth: 680, margin: '0 auto', background: CL.bg, minHeight: '100%', boxSizing: 'border-box' }}>
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ color: CL.text, fontSize: 24, fontWeight: 900, marginBottom: 20 }}>Job History</motion.div>

      {/* Summary */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${CL.green}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color={CL.green} strokeWidth={2} />
            </div>
          </div>
          <div style={{ color: CL.green, fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{total}</div>
          <div style={{ color: CL.muted, fontSize: 12 }}>Jobs Completed</div>
        </div>
        <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${CL.red}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={16} color={CL.red} strokeWidth={2} />
            </div>
          </div>
          <div style={{ color: CL.red, fontSize: 26, fontWeight: 900, marginBottom: 4 }}>{cancelled}</div>
          <div style={{ color: CL.muted, fontSize: 12 }}>Jobs Cancelled</div>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { k: 'all',       label: 'All' },
          { k: 'completed', label: 'Completed' },
          { k: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: filter === f.k ? `${CL.gold}15` : CL.surface,
            border: `1px solid ${filter === f.k ? CL.gold : CL.border}`,
            color: filter === f.k ? CL.gold : CL.muted,
            fontFamily: 'inherit',
          }}>{f.label}</button>
        ))}
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${CL.gold}30`, borderTopColor: CL.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : jobs.length === 0 ? (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '60px 20px', background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Inbox size={48} color={CL.border} strokeWidth={1.3} />
          </div>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No job history yet</div>
          <div style={{ color: CL.muted, fontSize: 14 }}>Completed jobs will appear here.</div>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map((job, i) => {
            const statusColor = STATUS_COLORS[job.status] || CL.gold;
            const StatusIcon  = job.status === 'completed' ? CheckCircle : job.status === 'cancelled' ? XCircle : Wrench;
            return (
              <motion.div key={job.id} custom={3 + i * 0.4} variants={fadeUp} initial="hidden" animate="show" style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => navigate(`/job/${job.id}`)}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${statusColor}14`, border: `1px solid ${statusColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <StatusIcon size={20} color={statusColor} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: CL.text, fontSize: 15, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.sub_service || job.service}</div>
                    <div style={{ color: CL.muted, fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} color={CL.muted} /> {job.address || 'Nairobi'}
                    </div>
                    <div style={{ color: CL.muted, fontSize: 11, marginTop: 2 }}>{job.booking_date} · {job.booking_time}</div>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${statusColor}14`, color: statusColor, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {(job.status || '').replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {job.status === 'completed' && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${CL.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => navigate(`/receipt/${job.id}`)}
                      style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: `${CL.green}12`, border: `1px solid ${CL.green}40`, color: CL.green, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color={CL.green} /> View Job Summary
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
