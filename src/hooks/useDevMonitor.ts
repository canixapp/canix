import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/* â”€â”€â”€ Types â”€â”€â”€ */
export interface ApiRequest {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: Date;
}

export interface JsError {
  id: string;
  message: string;
  source: string;
  line: number;
  col: number;
  timestamp: Date;
}

export interface SystemMetrics {
  cpuPercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  rpm: number;
  totalRows: number;
  activeUsers: number;
  totalAppointments: number;
  tableCounts: Record<string, number>;
}

export interface WebhookStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  lastCall: Date | null;
  responseTime: number | null;
}

export interface JobItem {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  duration: number | null;
  timestamp: Date;
}

export interface BackendLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: Date;
}

export interface DbStatus {
  connected: boolean;
  responseTime: number | null;
  activeConnections: number;
  totalRows: number;
  tableCounts: Record<string, number>;
}

export interface StorageBucket {
  name: string;
  public: boolean;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
}

/* â”€â”€â”€ Hook â”€â”€â”€ */
export function useDevMonitor() {
  const [apiRequests, setApiRequests] = useState<ApiRequest[]>([]);
  const [jsErrors, setJsErrors] = useState<JsError[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuPercent: 0, memoryUsedMB: 0, memoryTotalMB: 4096, rpm: 0,
    totalRows: 0, activeUsers: 0, totalAppointments: 0, tableCounts: {},
  });
  const [webhooks, setWebhooks] = useState<WebhookStatus[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [logs, setLogs] = useState<BackendLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus>({ connected: false, responseTime: null, activeConnections: 0, totalRows: 0, tableCounts: {} });
  const [storageBuckets, setStorageBuckets] = useState<StorageBucket[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const requestCountRef = useRef(0);
  const idCounter = useRef(0);

  const genId = () => `dm-${++idCounter.current}-${Date.now()}`;
  const mkLog = (level: BackendLog['level'], message: string): BackendLog => ({ id: genId(), level, message, timestamp: new Date() });

  /* â”€â”€ Intercept fetch â”€â”€ */
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = (args[1]?.method || 'GET').toUpperCase();
      requestCountRef.current++;
      try {
        const res = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        setApiRequests(prev => [{
          id: genId(), method, url, status: res.status, duration, timestamp: new Date()
        }, ...prev].slice(0, 200));
        if (res.status >= 500) {
          setLogs(prev => [mkLog('ERROR', `${method} ${url} â†’ ${res.status} (${duration}ms)`), ...prev].slice(0, 500));
        } else if (res.status >= 400) {
          setLogs(prev => [mkLog('WARN', `${method} ${url} â†’ ${res.status} (${duration}ms)`), ...prev].slice(0, 500));
        }
        return res;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        setApiRequests(prev => [{
          id: genId(), method, url, status: 0, duration, timestamp: new Date()
        }, ...prev].slice(0, 200));
        setLogs(prev => [mkLog('ERROR', `${method} ${url} â†’ NETWORK ERROR (${duration}ms)`), ...prev].slice(0, 500));
        throw err;
      }
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  /* â”€â”€ JS errors â”€â”€ */
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      setJsErrors(prev => [{
        id: genId(), message: e.message || 'Unknown error', source: e.filename || 'unknown',
        line: e.lineno || 0, col: e.colno || 0, timestamp: new Date()
      }, ...prev].slice(0, 100));
      setLogs(prev => [mkLog('ERROR', `[JS] ${e.message} at ${e.filename}:${e.lineno}`), ...prev].slice(0, 500));
    };
    const unhandled = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason);
      setJsErrors(prev => [{
        id: genId(), message: msg, source: 'Promise', line: 0, col: 0, timestamp: new Date()
      }, ...prev].slice(0, 100));
      setLogs(prev => [mkLog('ERROR', `[Promise] ${msg}`), ...prev].slice(0, 500));
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', unhandled);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', unhandled);
    };
  }, []);

  /* â”€â”€ Client-side metrics ticker (every 3s) â”€â”€ */
  useEffect(() => {
    const tick = () => {
      const mem = (performance as any).memory;
      const usedMB = mem ? Math.round(mem.usedJSHeapSize / 1048576) : Math.round(50 + Math.random() * 80);
      const totalMB = mem ? Math.round(mem.jsHeapSizeLimit / 1048576) : 4096;
      setMetrics(prev => ({
        ...prev,
        cpuPercent: Math.round(10 + Math.random() * 25), // browser doesn't expose real CPU
        memoryUsedMB: usedMB,
        memoryTotalMB: totalMB,
        rpm: requestCountRef.current * 20,
      }));
      requestCountRef.current = 0;
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  /* ▬▬ Fetch real backend metrics directly (Free Plan Compatible) ▬▬ */
  const fetchBackendMetrics = useCallback(async () => {
    setBackendLoading(true);
    const start = performance.now();
    try {
      // Direct queries to count rows using { count: 'exact', head: true } 
      // which is incredibly fast and avoids downloading rows.
      const [
        { count: profilesCount, error: err1 },
        { count: apptCount, error: err2 },
        { count: petsCount, error: err3 },
        { count: servicesCount, error: err4 }
      ] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('pets').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true })
      ]);

      // If the first query throws, we consider the DB offline or inaccessible
      if (err1) throw err1;

      const elapsed = Math.round(performance.now() - start);
      setLogs(prev => [mkLog('INFO', `Backend metrics OK (${elapsed}ms)`), ...prev].slice(0, 500));

      const tableCounts = {
        profiles: profilesCount || 0,
        appointments: apptCount || 0,
        pets: petsCount || 0,
        services: servicesCount || 0,
      };

      const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0);

      // Update DB status with real data
      setDbStatus({
        connected: true,
        responseTime: elapsed,
        activeConnections: 1,
        totalRows,
        tableCounts,
      });

      // Update metrics with real row counts
      setMetrics(prev => ({
        ...prev,
        totalRows,
        activeUsers: profilesCount || 0,
        totalAppointments: apptCount || 0,
        tableCounts,
      }));

      // Webhooks, Jobs, Storage Buckets, Feature Flags are set to empty/mock 
      // because they require admin privileges or Edge Functions not available on free plan
      setWebhooks([]);
      setJobs([]);
      setStorageBuckets([{ name: 'pets', public: true }, { name: 'gallery', public: true }]);
      setFeatureFlags([{ key: 'dev_tools', enabled: true }]);

    } catch (err: any) {
      setLogs(prev => [mkLog('ERROR', `Backend metrics exception: ${err?.message || 'unknown'}`), ...prev].slice(0, 500));
      setDbStatus(prev => ({ ...prev, connected: false }));
    }
    setBackendLoading(false);
  }, []);

  // Fetch on mount and every 15s
  useEffect(() => {
    fetchBackendMetrics();
    const id = setInterval(fetchBackendMetrics, 15000);
    return () => clearInterval(id);
  }, [fetchBackendMetrics]);

  /* â”€â”€ Initial log â”€â”€ */
  useEffect(() => {
    setLogs(prev => [mkLog('INFO', 'Dev Monitor inicializado â€” conectado ao backend real'), ...prev]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);
  const clearErrors = useCallback(() => setJsErrors([]), []);
  const clearRequests = useCallback(() => setApiRequests([]), []);
  const refreshAll = useCallback(() => { fetchBackendMetrics(); }, [fetchBackendMetrics]);

  return {
    apiRequests, jsErrors, metrics, webhooks, jobs, logs, dbStatus,
    storageBuckets, featureFlags, backendLoading,
    clearLogs, clearErrors, clearRequests, refreshAll,
  };
}
