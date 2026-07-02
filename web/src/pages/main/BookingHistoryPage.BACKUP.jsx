import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { StatusChip } from '../../components/UI';
import { useAuth } from '../../hooks/useAuth';
import { getUserBookings } from '../../services/bookingService';

const TABS = ['All', 'upcoming', 'completed', 'cancelled'];
const TAB_LABELS = { All:'All', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' };

const STATUS_COLORS = {
  upcoming:  '#C9A020',
  completed: '#48BB78',
  cancelled: '#FC8181',
  pending:   '#63B3ED',
};

export default function BookingHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]       = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; } // guests have no booking history yet
    getUserBookings(user.id)
      .then(data => setBookings(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const list = tab === 'All' ? bookings : bookings.filter(b => b.status === tab);

  return (
    <div style={{ padding:32 }} className="fade-in">
      <div style={{ color:C.textPrimary, fontSize:24, fontWeight:800, marginBottom:20 }}>My Bookings</div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'9px 18px', borderRadius:999,
            border:`1px solid ${tab === t ? C.gold : C.navyBorder}`,
            background: tab === t ? C.gold : C.navyLight,
            color: tab === t ? '#0A0E1A' : C.textSec,
            fontWeight: tab === t ? 700 : 500, fontSize:13, cursor:'pointer', fontFamily:'inherit',
            transition:'all 0.15s',
          }}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'60px 0', color:C.textMuted }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <div>Loading your bookings...</div>
        </div>
      )}

      {/* Empty */}
      {!loading && list.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0', color:C.textMuted }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:6, color:C.textPrimary }}>No bookings yet</div>
          <div style={{ fontSize:13 }}>
            {tab === 'All' ? "You haven't made any bookings yet." : `No ${TAB_LABELS[tab].toLowerCase()} bookings.`}
          </div>
        </div>
      )}

      {/* List */}
      {!loading && list.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {list.map(b => (
            <div key={b.id} style={{
              background:C.navyLight, border:`1px solid ${C.navyBorder}`,
              borderRadius:16, padding:20,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:24, background:'rgba(201,160,32,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                    {b.service_icon || '🔧'}
                  </div>
                  <div>
                    <div style={{ color:C.textPrimary, fontSize:15, fontWeight:700 }}>{b.service_name}</div>
                    <div style={{ color:C.textSec, fontSize:13, marginTop:2 }}>{b.category}</div>
                  </div>
                </div>
                <StatusChip
                  label={TAB_LABELS[b.status] || b.status}
                  color={STATUS_COLORS[b.status] || C.textMuted}
                />
              </div>

              <div style={{ height:1, background:C.navyBorder, marginBottom:14 }} />

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                  <span style={{ color:C.textSec, fontSize:13 }}>📅 {b.scheduled_date} · {b.scheduled_time}</span>
                  {b.worker_name && <span style={{ color:C.textSec, fontSize:13 }}>👤 {b.worker_name}</span>}
                  {b.address && <span style={{ color:C.textSec, fontSize:13 }}>📍 {b.address}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ color:C.gold, fontSize:15, fontWeight:800 }}>TBD</span>
                  <div style={{ display:'flex', gap:8 }}>
                    {b.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/receipt/${b.id}`)}
                        style={{ padding:'6px 14px', borderRadius:8, background:'rgba(72,187,120,0.1)', border:'1px solid rgba(72,187,120,0.3)', color:'#48BB78', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        📄 Receipt
                      </button>
                    )}
                    {b.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/review/${b.id}`)}
                        style={{ padding:'6px 14px', borderRadius:8, background:'rgba(201,160,32,0.1)', border:`1px solid ${C.gold}44`, color:C.gold, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        ⭐ Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
