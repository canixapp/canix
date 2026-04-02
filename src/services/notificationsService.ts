import { supabase } from '@/lib/supabase';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as unknown as NotificationRow[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count || 0;
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('id', notificationId);
  if (error) throw error;
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as any)
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

export async function createNotification(data: {
  user_id: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  link?: string;
}) {
  const { error } = await supabase
    .from('notifications')
    .insert(data as any);
  if (error) throw error;
}
