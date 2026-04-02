import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Clock, Filter, FileText, Settings, Package, Image, Star, Calendar, Sparkles } from 'lucide-react';
import { getRecentAuditLogs, AuditLogRow } from '@/services/auditLogService';
import { formatDistanceToNow, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const ENTITY_CONFIG: Record<string, { label: string; icon: typeof Settings; color: string; bg: string }> = {
  settings: { label: 'Configurações', icon: Settings, color: 'text-primary', bg: 'bg-primary/10' },
  services: { label: 'Serviços', icon: FileText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  packages: { label: 'Pacotes', icon: Package, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  gallery: { label: 'Galeria', icon: Image, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
  reviews: { label: 'Avaliações', icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  appointments: { label: 'Agendamentos', icon: Calendar, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
};

const ACTION_LABELS: Record<string, string> = {
  update: 'alterou',
  create: 'criou',
  delete: 'removeu',
};

import { staggerContainer as containerAnim, staggerItem as itemAnim } from '@/lib/animations';

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'48h' | 'today'>('48h');

  useEffect(() => {
    setLoading(true);
    const hours = filter === 'today' ? 24 : 48;
    getRecentAuditLogs(hours)
      .then(data => {
        const filtered = filter === 'today'
          ? data.filter(l => isToday(new Date(l.created_at)))
          : data;
        setLogs(filtered);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const formatValue = (val: string | null) => {
    if (!val || val === 'null') return '—';
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'string') return parsed;
      return JSON.stringify(parsed);
    } catch {
      return val;
    }
  };

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, AuditLogRow[]>>((acc, log) => {
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  return (
    <motion.div
      className="space-y-5 sm:space-y-6 overflow-x-hidden max-w-full"
      variants={containerAnim}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Registro de Alterações</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Timeline de mudanças no sistema</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {[
            { key: '48h' as const, label: 'Últimas 48h', icon: Clock },
            { key: 'today' as const, label: 'Hoje', icon: Filter },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/50'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemAnim} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: logs.length, icon: History, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Configurações', value: logs.filter(l => l.entity === 'settings').length, icon: Settings, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Serviços', value: logs.filter(l => l.entity === 'services').length, icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Outros', value: logs.filter(l => l.entity !== 'settings' && l.entity !== 'services').length, icon: Sparkles, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{loading ? '—' : stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Timeline */}
      <motion.div variants={itemAnim}>
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Timeline {!loading && <span className="font-normal text-muted-foreground">· {logs.length} {logs.length === 1 ? 'registro' : 'registros'}</span>}
            </h2>
          </div>

          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhuma alteração registrada</p>
                <p className="text-xs text-muted-foreground">As alterações aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([dateKey, dateLogs]) => (
                  <div key={dateKey}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70">
                        {isToday(new Date(dateKey + 'T00:00:00'))
                          ? 'Hoje'
                          : format(new Date(dateKey + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">{dateLogs.length}</Badge>
                    </div>

                    {/* Log entries */}
                    <div className="space-y-2">
                      {dateLogs.map((log, idx) => {
                        const entityCfg = ENTITY_CONFIG[log.entity || ''] || {
                          label: log.entity || 'Sistema',
                          icon: History,
                          color: 'text-muted-foreground',
                          bg: 'bg-muted/50',
                        };
                        const Icon = entityCfg.icon;

                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.3 }}
                            className="flex items-start gap-3 p-3.5 rounded-xl border border-border/40 bg-background hover:bg-muted/20 transition-colors group"
                          >
                            <div className={`w-9 h-9 rounded-xl ${entityCfg.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${entityCfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${entityCfg.color} border-current/20`}>
                                  {entityCfg.label}
                                </Badge>
                                <span className="text-sm text-foreground">
                                  {ACTION_LABELS[log.action] || log.action}
                                  {log.field && <> <span className="font-semibold">{log.field}</span></>}
                                </span>
                              </div>
                              {(log.old_value || log.new_value) && (
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1">
                                  <span className="line-through text-destructive/70 max-w-[200px] truncate">{formatValue(log.old_value)}</span>
                                  <span className="text-muted-foreground/50">→</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium max-w-[200px] truncate">{formatValue(log.new_value)}</span>
                                </div>
                              )}
                              <p className="text-[11px] text-muted-foreground/50 mt-1">
                                {format(new Date(log.created_at), 'HH:mm', { locale: ptBR })}
                                {' · '}
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
