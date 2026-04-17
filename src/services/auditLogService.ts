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

export interface AuditLogWithActor extends AuditLogRow {
  actor_name?: string;
}

export async function getAuditLogsWithActors(limit = 100): Promise<AuditLogWithActor[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((log: any) => ({
    ...log,
    actor_name: 'Administrador' // Fallback seguro enquanto o relacionamento de banco é resolvido
  }));
}

export async function insertAuditLog(entry: AuditLogInsert) {
  const { error } = await supabase
    .from('audit_log')
    .insert(entry);
  if (error) console.error('Audit log error:', error);
}

/** 
 * Reverts a change recorded in an audit log entry.
 */
export async function rollbackChange(log: AuditLogRow) {
  if (!log.entity || !log.field || !log.target_id) {
    throw new Error('Dados insuficientes para reversão.');
  }

  // Parse values (all stored as JSON strings in the log for reliability)
  let valToRestore: any;
  try {
    valToRestore = JSON.parse(log.old_value || 'null');
  } catch {
    valToRestore = log.old_value;
  }

  // Mapping entities to table names
  const entityMap: Record<string, string> = {
    'plan': 'plans',
    'license': 'unidades_petshop',
    'petshop': 'unidades_petshop',
    'profile': 'profiles'
  };

  const table = entityMap[log.entity] || log.entity;

  const { error } = await supabase
    .from(table)
    .update({ [log.field]: valToRestore })
    .eq('id', log.target_id);

  if (error) throw error;
}

/** Log multiple field changes at once */
export async function logFieldChanges(
  actorId: string,
  entity: string,
  targetId: string,
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
        target_id: targetId,
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
