import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { TYPE_META } from '../services/announcementsService';

export function useNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // ── Request browser notification permission ────────────────────
  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  // ── Add a notification (in-app + browser push) ─────────────────
  const addNotification = useCallback((notif) => {
    const n = {
      ...notif,
      id:   Date.now() + Math.random(),
      read: false,
      time: new Date(),
    };
    setNotifications(prev => [n, ...prev.slice(0, 29)]); // keep last 30

    // Native browser notification when tab is not focused
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      document.hidden
    ) {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/fixera-icon.png',
          badge: '/fixera-icon.png',
          tag:  notif.type,
        });
      } catch (_) {}
    }
  }, []);

  // ── Supabase Realtime subscriptions ───────────────────────────
  useEffect(() => {
    if (!user || !profile) return;
    const role = profile.partner_role || 'worker';
    const uid  = `${user.id}-${Date.now()}`;
    const channels = [];

    // ── WORKERS: new bookings matching their service ──
    if (role === 'worker') {
      const ch = supabase
        .channel(`worker-jobs-${uid}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'bookings',
        }, payload => {
          const b = payload.new;
          const workerService = (profile.service || '').toLowerCase().split(' ')[0];
          const bookingService = (b.service || '').toLowerCase();
          // Only notify if service matches or worker has no specific service yet
          if (!workerService || bookingService.includes(workerService) || workerService.includes(bookingService)) {
            addNotification({
              type:  'new_job',
              title: '🔧 New Job Available!',
              body:  `${b.sub_service || b.service || 'New booking'} · ${b.address || 'Nairobi'}`,
              link:  `/job/${b.id}`,
              data:  b,
            });
          }
        })
        .subscribe();
      channels.push(ch);

      // Also notify when an accepted job status changes
      const ch2 = supabase
        .channel(`worker-updates-${uid}`)
        .on('postgres_changes', {
          event:  'UPDATE',
          schema: 'public',
          table:  'bookings',
          filter: `worker_id=eq.${user.id}`,
        }, payload => {
          const b = payload.new;
          const msgs = {
            confirmed:   { title: '✅ Job Confirmed!',   body: `Your booking for ${b.sub_service || b.service} has been confirmed.` },
            cancelled:   { title: '❌ Job Cancelled',    body: `Booking for ${b.sub_service || b.service} was cancelled.` },
            completed:   { title: '🎉 Job Completed!',  body: `Great work! ${b.sub_service || b.service} is marked complete.` },
          };
          const msg = msgs[b.status];
          if (msg) addNotification({ type: 'job_update', ...msg, link: `/job/${b.id}`, data: b });
        })
        .subscribe();
      channels.push(ch2);
    }

    // ── RIDERS: new delivery_tracking rows ──
    if (role === 'rider') {
      const ch = supabase
        .channel(`rider-deliveries-${uid}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'delivery_tracking',
        }, payload => {
          const d = payload.new;
          if (!d.rider_id) { // only unassigned ones
            addNotification({
              type:  'new_delivery',
              title: '🚗 New Pickup Job!',
              body:  `New delivery available · Earn KSh 300`,
              link:  '/rider/dashboard',
              data:  d,
            });
          }
        })
        .subscribe();
      channels.push(ch);

      // Notify rider when their delivery status changes
      const ch2 = supabase
        .channel(`rider-my-deliveries-${uid}`)
        .on('postgres_changes', {
          event:  'UPDATE',
          schema: 'public',
          table:  'delivery_tracking',
          filter: `rider_id=eq.${user.id}`,
        }, payload => {
          const d = payload.new;
          const msgs = {
            rider_assigned:    { title: '📦 Delivery Assigned', body: 'You have a new delivery to pick up.' },
            delivered:         { title: '🎉 Delivery Complete!', body: 'Delivery marked as completed. KSh 300 earned!' },
          };
          const msg = msgs[d.status];
          if (msg) addNotification({ type: 'delivery_update', ...msg, link: '/rider/dashboard', data: d });
        })
        .subscribe();
      channels.push(ch2);
    }

    // ── VENDORS: new bookings for their service category ──
    if (role === 'vendor') {
      const ch = supabase
        .channel(`vendor-orders-${uid}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'bookings',
        }, payload => {
          const b = payload.new;
          const bizType = (profile.business_type || '').toLowerCase();
          const svc     = (b.service || '').toLowerCase();
          if (!bizType || svc.includes(bizType) || bizType.includes(svc)) {
            addNotification({
              type:  'new_order',
              title: '🏪 New Order Received!',
              body:  `${b.sub_service || b.service || 'New order'} · ${b.address || 'Customer location'}`,
              link:  '/vendor/dashboard',
              data:  b,
            });
          }
        })
        .subscribe();
      channels.push(ch);
    }

    // ── SUPPLIERS: notify when a related booking is made ──
    if (role === 'supplier') {
      const ch = supabase
        .channel(`supplier-alerts-${uid}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'bookings',
        }, payload => {
          const b = payload.new;
          const cat = (profile.product_category || '').toLowerCase();
          const svc = (b.service || '').toLowerCase();
          if (cat && svc.includes(cat)) {
            addNotification({
              type:  'product_demand',
              title: '📦 Product Demand Alert',
              body:  `A customer booked ${b.service}. Your products may be needed!`,
              link:  '/supplier/dashboard',
              data:  b,
            });
          }
        })
        .subscribe();
      channels.push(ch);
    }

    // ── WORKERS & RIDERS: wallet balance warnings ──
    if (['worker', 'rider'].includes(role)) {
      const walletCh = supabase
        .channel(`wallet-alerts-${uid}`)
        .on('postgres_changes', {
          event:  'UPDATE',
          schema: 'public',
          table:  'workers',
          filter: `id=eq.${user.id}`,
        }, payload => {
          const newBal = payload.new?.wallet_balance ?? null;
          const oldBal = payload.old?.wallet_balance ?? null;
          if (newBal === null || newBal === oldBal) return;

          if (newBal <= 500) {
            addNotification({
              type:  'wallet_blocked',
              title: '🔒 Jobs Blocked — Wallet Too Low',
              body:  `Your wallet is at KSh ${newBal.toLocaleString()}. You cannot receive jobs until you top up above KSh 500.`,
              link:  '/withdraw',
            });
          } else if (newBal <= 1000 && (oldBal === null || oldBal > 1000)) {
            addNotification({
              type:  'wallet_critical',
              title: '🚨 Wallet Critical — KSh ' + newBal.toLocaleString(),
              body:  `You are very close to the KSh 500 block limit. Top up now to keep receiving jobs.`,
              link:  '/withdraw',
            });
          } else if (newBal <= 2000 && (oldBal === null || oldBal > 2000)) {
            addNotification({
              type:  'wallet_low',
              title: '⚠️ Wallet Running Low — KSh ' + newBal.toLocaleString(),
              body:  `Your wallet balance is getting low. Top up to avoid being blocked at KSh 500.`,
              link:  '/withdraw',
            });
          }
        })
        .subscribe();
      channels.push(walletCh);
    }

    // ── ALL PARTNERS: new announcements targeted at them ──
    const annCh = supabase
      .channel(`announcements-partner-${uid}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'announcements',
      }, payload => {
        const a = payload.new;
        const now = new Date().toISOString();
        const isLive = a.publish_at <= now && (!a.expires_at || a.expires_at > now);
        const validTargets = ['all', 'partners', role];
        if (!isLive || !validTargets.includes(a.target)) return;
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
    channels.push(annCh);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user, profile, addNotification]);

  const markRead    = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()   => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const clear       = ()   => setNotifications([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, clear, requestPermission, permission };
}
