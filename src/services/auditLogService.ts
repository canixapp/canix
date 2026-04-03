import { supabase } from '@/lib/supabase';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLogRow {
  id: string;
  action: string;
  actor_id: string;
  target_id: string | null;
  details: Json;
  created_at: string;
  entity: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
}

export interface AuditLogInsert {
  actor_id: string;
  action: string;
  entity?: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  target_id?: string;
  details?: Json;
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
  return (data || []) as AuditLogRow[];
}

export async function insertAuditLog(entry: AuditLogInsert) {
  const { error } = await supabase
    .from('audit_log')
    .insert(entry);
  if (error) console.error('Audit log error:', error);
}

/** Log multiple field changes at once */
export async function logFieldChanges(
  actorId: string,
  entity: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
) {
  const entries: AuditLogInsert[] = [];
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
  const { error } = await supabase.from('audit_log').insert(entries);
  if (error) console.error('Audit log batch error:', error);
}
