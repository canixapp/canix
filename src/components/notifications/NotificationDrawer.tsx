import { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markAsRead, markAllAsRead, NotificationRow } from '@/services/notificationsService';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getNotificationConfig } from '@/lib/notificationTypes';

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function groupNotifications(items: NotificationRow[]) {
  const groups: { label: string; items: NotificationRow[] }[] = [];
  const today: NotificationRow[] = [];
  const yesterday: NotificationRow[] = [];
  const older: NotificationRow[] = [];

  items.forEach(n => {
    const d = new Date(n.created_at);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else older.push(n);
  });

  if (today.length) groups.push({ label: 'Hoje', items: today });
  if (yesterday.length) groups.push({ label: 'Ontem', items: yesterday });
  if (older.length) groups.push({ label: 'Anteriores', items: older });
  return groups;
}

export function NotificationDrawer({ open, onOpenChange }: NotificationDrawerProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoading(true);
    getNotifications(user.id).then(setNotifications).finally(() => setLoading(false));
  }, [open, user?.id]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-border/50">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              Notificações
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[11px] rounded-full px-2 py-0.5 font-bold min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs gap-1.5 text-primary hover:text-primary">
                <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100dvh-100px)] px-4 py-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Suas atualizações aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(group => (
                <div key={group.label}>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-1">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.items.map(n => {
                      const config = getNotificationConfig(n.type);
                      const Icon = config.icon;
                      const isUnread = !n.read_at;

                      return (
                        <button
                          key={n.id}
                          onClick={() => isUnread && handleMarkRead(n.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
                            isUnread
                              ? 'bg-card border-primary/15 shadow-sm hover:shadow-md hover:border-primary/25'
                              : 'bg-background/50 border-border/50 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                              <Icon className={`w-5 h-5 ${config.colorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {n.title}
                                </p>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                                )}
                              </div>
                              {n.description && (
                                <p className={`text-[13px] mt-0.5 line-clamp-2 ${isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                  {n.description}
                                </p>
                              )}
                              <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
