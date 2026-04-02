import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, NotificationRow } from '@/services/notificationsService';
import { getNotificationConfig } from '@/lib/notificationTypes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SESSION_KEY = 'petcao_login_toast_shown';

export function LoginNotificationToast() {
  const { user, isAuthenticated } = useAuth();
  const [notification, setNotification] = useState<NotificationRow | null>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Only show once per session
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (shown) return;

    const fetchLatest = async () => {
      try {
        const all = await getNotifications(user.id);
        const unread = all.filter(n => !n.read_at);
        if (unread.length > 0) {
          setNotification(unread[0]);
          sessionStorage.setItem(SESSION_KEY, 'true');
          // Small delay for page load
          setTimeout(() => setVisible(true), 800);
        }
      } catch {}
    };

    fetchLatest();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(() => dismiss(), 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => { setVisible(false); setNotification(null); }, 300);
  };

  if (!notification || !visible) return null;

  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md pointer-events-auto">
      <div
        className={`
          bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl shadow-black/10
          p-4 flex items-start gap-3
          transition-all duration-300 ease-out
          ${exiting ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
          animate-in slide-in-from-top-4 fade-in duration-500
        `}
      >
        <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          {notification.description && (
            <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
          )}
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
