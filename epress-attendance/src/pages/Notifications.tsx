import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-danger/10 text-danger',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.notifications.list();
        if (!cancelled) setNotifs(data);
      } catch { /* empty */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const markRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { /* empty */ }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* empty */ }
  };

  const unread = notifs.filter((n) => !n.read).length;

  if (loading) return <TableSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notifications</h1>
          <p className="text-sm text-text-secondary mt-1">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 mx-auto text-text-secondary opacity-30 mb-4" />
          <h3 className="text-lg font-semibold text-text">No notifications</h3>
          <p className="text-sm text-text-secondary mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((notif, i) => {
            const Icon = typeIcons[notif.type] || Info;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all',
                  notif.read ? 'bg-card border-border' : 'bg-card border-primary/20 shadow-sm'
                )}
              >
                <div className={cn('p-2.5 rounded-xl shrink-0', typeColors[notif.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text">{notif.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{notif.message}</p>
                    </div>
                    {!notif.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-2">
                    {new Date(notif.created_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!notif.read && (
                  <button onClick={() => markRead(notif.id)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
