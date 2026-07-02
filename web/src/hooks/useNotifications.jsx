import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { TYPE_META } from '../services/announcementsService';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const shownIds = useRef(new Set());

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const addNotification = useCallback((notif) => {
    const n = { ...notif, id: Date.now() + Math.random(), read: false, time: new Date() };
    setNotifications(prev => [n, ...prev.slice(0, 29)]);

    // Native browser push when tab not focused
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try { new Notification(notif.title, { body: notif.body, icon: '/favicon.ico', tag: notif.type }); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const uid = `${user.id}-${Date.now()}`;

    // ── Watch customer's OWN bookings for status changes ──
    const bookingChannel = supabase
      .channel(`customer-bookings-${uid}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'bookings',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const b   = payload.new;
        const svc = b.sub_service || b.service || 'Your service';

        const MESSAGES = {
          confirmed: {
            type:  'confirmed',
            title: '✅ Booking Confirmed!',
            body:  `${svc} has been confirmed. A worker will be assigned shortly.`,
            link:  `/history`,
            color: '#48BB78',
            icon:  '✅',
          },
          on_way: {
            type:  'on_way',
            title: '🚗 Worker On The Way!',
            body:  `${b.worker_name || 'Your worker'} is heading to your location.`,
            link:  `/history`,
            color: '#63B3ED',
            icon:  '🚗',
          },
          in_progress: {
            type:  'in_progress',
            title: '🔧 Work Has Started!',
            body:  `${b.worker_name || 'Your worker'} has started the job.`,
            link:  `/history`,
            color: '#C9A020',
            icon:  '🔧',
          },
          completed: {
            type:  'completed',
            title: '🎉 Job Completed!',
            body:  `${svc} is done. Please leave a review!`,
            link:  `/review/${b.id}`,
            color: '#48BB78',
            icon:  '🎉',
          },
          cancelled: {
            type:  'cancelled',
            title: '❌ Booking Cancelled',
            body:  `Your booking for ${svc} has been cancelled.`,
            link:  `/history`,
            color: '#FC8181',
            icon:  '❌',
          },
        };

        const msg = MESSAGES[b.status];
        if (msg && !shownIds.current.has(`${b.id}-${b.status}`)) {
          shownIds.current.add(`${b.id}-${b.status}`);
          addNotification({ ...msg, data: b });
        }
      })
      .subscribe();

    // ── Watch for new bookings (INSERT) confirming submission ──
    const newBookingChannel = supabase
      .channel(`customer-new-booking-${uid}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'bookings',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const b = payload.new;
        addNotification({
          type:  'booked',
          title: '📅 Booking Received!',
          body:  `Your ${b.sub_service || b.service || 'booking'} request has been sent. We\'ll confirm shortly.`,
          link:  '/history',
          color: '#C9A020',
          icon:  '📅',
          data:  b,
        });
      })
      .subscribe();

    // ── Watch receipts — notify when receipt is ready ──
    const receiptChannel = supabase
      .channel(`customer-receipts-${uid}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'receipts',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const r = payload.new;
        addNotification({
          type:  'receipt',
          title: '🧾 Receipt Ready!',
          body:  `Your receipt for ${r.sub_service || r.service || 'your job'} is available. Amount: KSh ${(r.amount || 0).toLocaleString()}`,
          link:  `/receipt/${r.booking_id || r.id}`,
          color: '#68D391',
          icon:  '🧾',
          data:  r,
        });
      })
      .subscribe();

    // ── Watch support tickets for admin responses ──
    const supportChannel = supabase
      .channel(`customer-support-${uid}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'support_tickets',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const t = payload.new;
        if (t.status === 'resolved' && t.admin_note) {
          addNotification({
            type:  'support',
            title: '💬 Support Ticket Resolved',
            body:  `Your ticket "${t.subject || 'Support request'}" has been resolved.`,
            link:  '/support',
            color: '#63B3ED',
            icon:  '💬',
            data:  t,
          });
        }
      })
      .subscribe();

    // ── Watch for new announcements targeted at customers ──
    const annChannel = supabase
      .channel(`announcements-customers-${uid}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'announcements',
      }, payload => {
        const a = payload.new;
        const now = new Date().toISOString();
        const isLive = a.publish_at <= now && (!a.expires_at || a.expires_at > now);
        const targets = ['all', 'customers'];
        if (!isLive || !targets.includes(a.target)) return;
        const meta = TYPE_META[a.type] || TYPE_META.info;
        addNotification({
          type:  'announcement',
          title: `${meta.icon} ${a.title}`,
          body:  a.body,
          link:  null,
          color: meta.color,
          icon:  meta.icon,
          data:  a,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(newBookingChannel);
      supabase.removeChannel(receiptChannel);
      supabase.removeChannel(supportChannel);
      supabase.removeChannel(annChannel);
    };
  }, [user, addNotification]);

  const markRead    = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()   => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const clear       = ()   => setNotifications([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clear, requestPermission, permission };
}
