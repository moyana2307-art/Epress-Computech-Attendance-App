import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DeviceNotifications() {
  const { user } = useAuth();
  const lastId = useRef(0);

  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const poll = async () => {
      try {
        const res = await fetch('/api/notifications');
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          for (const n of list) {
            if (n.id > lastId.current && !n.read) {
              lastId.current = n.id;
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Epress Attendance', {
                  body: `${n.title}: ${n.message}`,
                  icon: '/pwa-icon-192.svg',
                  tag: 'epress-notification',
                });
              }
            }
          }
          if (list.length > 0) {
            lastId.current = Math.max(...list.map((n: any) => n.id));
          }
        }
      } catch {}
    };

    const interval = setInterval(poll, 15000);
    poll();
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
