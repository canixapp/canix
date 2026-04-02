import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type ServiceStatus = 'checking' | 'online' | 'offline' | 'degraded';

export interface ServiceInfo {
  status: ServiceStatus;
  message: string;
  errorCode?: string;
  lastChecked: Date | null;
}

export interface SystemStatuses {
  backend: ServiceInfo;
  auth: ServiceInfo;
  db: ServiceInfo;
}

export type OverallStatus = 'online' | 'degraded' | 'offline';

/** A single snapshot persisted in history */
export interface StatusHistoryEntry {
  id: string;
  timestamp: string; // ISO string
  overall: OverallStatus;
  backend: { status: ServiceStatus; message: string; errorCode?: string };
  auth: { status: ServiceStatus; message: string; errorCode?: string };
  db: { status: ServiceStatus; message: string; errorCode?: string };
}

const HISTORY_KEY = 'petcao_status_history';
const MAX_HISTORY = 10;

const DEFAULT_INFO: ServiceInfo = { status: 'checking', message: 'Verificando...', lastChecked: null };

function extractError(err: unknown): string {
  if (!err) return 'Erro desconhecido';
  if (err instanceof TypeError) {
    if (err.message.includes('Load failed') || err.message.includes('Failed to fetch'))
      return 'Falha ao conectar com a API â€” servidor inacessÃ­vel ou sem rede';
    if (err.message.includes('timeout') || err.message.includes('Timeout'))
      return 'Timeout na requisiÃ§Ã£o â€” o servidor nÃ£o respondeu a tempo';
    return `TypeError: ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.message) return String(e.message);
    if (e.error_description) return String(e.error_description);
  }
  return String(err);
}

function deriveErrorCode(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.code) return String(e.code);
    if (e.status) return String(e.status);
  }
  if (err instanceof TypeError) return 'NETWORK_ERROR';
  return undefined;
}

export function getOverallStatus(statuses: SystemStatuses): OverallStatus {
  const all = [statuses.backend, statuses.auth, statuses.db];
  const offlineCount = all.filter(s => s.status === 'offline').length;
  const onlineCount = all.filter(s => s.status === 'online').length;
  if (onlineCount === 3) return 'online';
  if (offlineCount === 3) return 'offline';
  return 'degraded';
}

export function getOverallLabel(overall: OverallStatus): string {
  if (overall === 'online') return 'Sistema operacional';
  if (overall === 'degraded') return 'Sistema com instabilidade';
  return 'Sistema indisponÃ­vel';
}

export function getOverallMessage(statuses: SystemStatuses): string {
  const offline: string[] = [];
  if (statuses.backend.status === 'offline') offline.push('backend');
  if (statuses.auth.status === 'offline') offline.push('autenticaÃ§Ã£o');
  if (statuses.db.status === 'offline') offline.push('banco de dados');

  if (offline.length === 0) return 'Todos os serviÃ§os estÃ£o operando normalmente.';
  if (offline.length === 3) return 'Sistema indisponÃ­vel â€” backend, autenticaÃ§Ã£o e banco estÃ£o offline.';

  const msgs: string[] = [];
  if (statuses.backend.status === 'offline') msgs.push('Backend indisponÃ­vel â€” algumas funÃ§Ãµes nÃ£o podem ser executadas');
  if (statuses.auth.status === 'offline') msgs.push('ServiÃ§o de autenticaÃ§Ã£o indisponÃ­vel â€” login e sessÃµes afetados');
  if (statuses.db.status === 'offline') msgs.push('Banco de dados indisponÃ­vel â€” dados podem nÃ£o ser carregados');
  return msgs.join('. ') + '.';
}

function loadHistory(): StatusHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StatusHistoryEntry[];
  } catch { return []; }
}

function saveHistory(entries: StatusHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* storage full â€” silently ignore */ }
}

const AUTO_CHECK_INTERVAL = 60_000; // 60s

export function useSystemStatus() {
  const [statuses, setStatuses] = useState<SystemStatuses>({
    backend: { ...DEFAULT_INFO },
    auth: { ...DEFAULT_INFO },
    db: { ...DEFAULT_INFO },
  });
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<StatusHistoryEntry[]>(() => loadHistory());
  const prevOverallRef = useRef<OverallStatus | null>(null);
  const checkingRef = useRef(false); // guard against concurrent checks

  const pushHistory = useCallback((s: SystemStatuses) => {
    const overall = getOverallStatus(s);
    const entry: StatusHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      overall,
      backend: { status: s.backend.status, message: s.backend.message, errorCode: s.backend.errorCode },
      auth: { status: s.auth.status, message: s.auth.message, errorCode: s.auth.errorCode },
      db: { status: s.db.status, message: s.db.message, errorCode: s.db.errorCode },
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const check = useCallback(async (silent = false) => {
    // Prevent concurrent checks â€” this avoids "Lock was stolen by another request"
    if (checkingRef.current) return;
    checkingRef.current = true;

    if (!silent) setChecking(true);
    const now = new Date();
    if (!silent) {
      setStatuses({
        backend: { status: 'checking', message: 'Verificando...', lastChecked: null },
        auth: { status: 'checking', message: 'Verificando...', lastChecked: null },
        db: { status: 'checking', message: 'Verificando...', lastChecked: null },
      });
    }

    // Auth check
    let authInfo: ServiceInfo;
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        authInfo = {
          status: 'offline',
          message: error.message || 'Falha ao validar sessÃ£o de autenticaÃ§Ã£o',
          errorCode: (error as any).code || (error as any).status?.toString(),
          lastChecked: now,
        };
      } else {
        authInfo = { status: 'online', message: 'ServiÃ§o de autenticaÃ§Ã£o respondendo normalmente', lastChecked: now };
      }
    } catch (err) {
      authInfo = {
        status: 'offline',
        message: extractError(err),
        errorCode: deriveErrorCode(err),
        lastChecked: now,
      };
    }

    // DB check
    let dbInfo: ServiceInfo;
    try {
      const { error } = await supabase.from('petshops').select('id').limit(1);
      if (error) {
        dbInfo = {
          status: 'offline',
          message: error.message || 'Falha ao consultar banco de dados',
          errorCode: error.code || (error as any).hint,
          lastChecked: now,
        };
      } else {
        dbInfo = { status: 'online', message: 'Banco de dados respondendo normalmente', lastChecked: now };
      }
    } catch (err) {
      dbInfo = {
        status: 'offline',
        message: extractError(err),
        errorCode: deriveErrorCode(err),
        lastChecked: now,
      };
    }

    // Backend = overall connectivity
    const backendOk = authInfo.status === 'online' || dbInfo.status === 'online';
    let backendInfo: ServiceInfo;
    if (backendOk) {
      backendInfo = { status: 'online', message: 'API acessÃ­vel e respondendo', lastChecked: now };
    } else {
      const primaryErr = dbInfo.message.length > authInfo.message.length ? dbInfo : authInfo;
      backendInfo = {
        status: 'offline',
        message: primaryErr.message || 'Falha ao conectar com a API',
        errorCode: primaryErr.errorCode || 'UNREACHABLE',
        lastChecked: now,
      };
    }

    const result = { backend: backendInfo, auth: authInfo, db: dbInfo };
    setStatuses(result);
    pushHistory(result);
    setChecking(false);
    checkingRef.current = false;

    // Notify on state change
    const newOverall = getOverallStatus(result);
    const prev = prevOverallRef.current;
    if (prev !== null && prev !== newOverall) {
      if (newOverall === 'online') {
        toast.success('Sistema restaurado â€” todos os serviÃ§os online', { icon: 'ðŸŸ¢' });
      } else if (newOverall === 'degraded') {
        toast.warning('Instabilidade detectada â€” alguns serviÃ§os afetados', { icon: 'ðŸŸ¡' });
      } else {
        toast.error('Sistema indisponÃ­vel â€” serviÃ§os offline', { icon: 'ðŸ”´' });
      }
    }
    prevOverallRef.current = newOverall;
  }, [pushHistory]);

  // Initial check
  useEffect(() => { check(); }, [check]);

  // Auto-check every 60s (silent)
  useEffect(() => {
    const id = setInterval(() => check(true), AUTO_CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [check]);

  return { statuses, recheck: check, checking, history, clearHistory };
}
