import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount } from '@/services/notificationsService';
import { supabase } from '@/lib/supabase';
import { NotificationDrawer } from './NotificationDrawer';

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await getUnreadCount(user.id);
      setUnread(count);
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    fetchCount();

    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, user?.id, fetchCount]);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        aria-label="NotificaÃ§Ãµes"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-in zoom-in shadow-lg shadow-destructive/30">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <NotificationDrawer
        open={drawerOpen}
        onOpenChange={(v) => { setDrawerOpen(v); if (!v) fetchCount(); }}
      />
    </>
  );
}
