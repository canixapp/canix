import { supabase } from '@/lib/supabase';

export interface AuditLogRow {
  id: string;
  action: string;
  actor_id: string;
  target_id: string | null;
  details: any;
  created_at: string;
  entity: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
}

export async function getRecentAuditLogs(hoursBack = 48): Promise<AuditLogRow[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []) as unknown as AuditLogRow[];
}

export async function insertAuditLog(entry: {
  actor_id: string;
  action: string;
  entity?: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  target_id?: string;
  details?: any;
}) {
  const { error } = await supabase
    .from('audit_log')
    .insert(entry as any);
  if (error) console.error('Audit log error:', error);
}

/** Log multiple field changes at once */
export async function logFieldChanges(
  actorId: string,
  entity: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
) {
  const entries: any[] = [];
  for (const key of Object.keys(newValues)) {
    const oldVal = JSON.stringify(oldValues[key] ?? null);
    const newVal = JSON.stringify(newValues[key] ?? null);
    if (oldVal !== newVal) {
      entries.push({
        actor_id: actorId,
        action: 'update',
        entity,
        field: key,
        old_value: oldVal,
        new_value: newVal,
      });
    }
  }
  if (entries.length === 0) return;
  const { error } = await supabase.from('audit_log').insert(entries as any);
  if (error) console.error('Audit log batch error:', error);
}
