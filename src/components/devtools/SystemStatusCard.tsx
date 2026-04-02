import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Shield, HardDrive, Circle, RefreshCw, Copy, ChevronDown, ChevronUp, AlertTriangle, History, Trash2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSystemStatus,
  getOverallStatus,
  getOverallLabel,
  getOverallMessage,
  type ServiceInfo,
  type ServiceStatus,
  type OverallStatus,
  type StatusHistoryEntry,
} from '@/hooks/useSystemStatus';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColor = (s: ServiceStatus) => {
  if (s === 'online') return { dot: 'fill-emerald-500 text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  if (s === 'degraded') return { dot: 'fill-amber-500 text-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
  if (s === 'offline') return { dot: 'fill-destructive text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20' };
  return { dot: 'fill-amber-500 text-amber-500 animate-pulse', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
};

const statusLabel = (s: ServiceStatus) => {
  if (s === 'checking') return 'Verificando...';
  if (s === 'online') return 'Online';
  if (s === 'degraded') return 'Degradado';
  return 'Offline';
};

const overallDot = (o: OverallStatus) => {
  if (o === 'online') return 'fill-emerald-500 text-emerald-500';
  if (o === 'degraded') return 'fill-amber-500 text-amber-500';
  return 'fill-destructive text-destructive';
};

const formatTime = (d: Date | null) => {
  if (!d) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

function ServiceBlock({ label, icon: Icon, info }: { label: string; icon: typeof Server; info: ServiceInfo }) {
  const [expanded, setExpanded] = useState(false);
  const colors = statusColor(info.status);
  const isOffline = info.status === 'offline' || info.status === 'degraded';
  const errorText = info.errorCode ? `[${info.errorCode}] ${info.message}` : info.message;
  const isTruncated = errorText.length > 80;

  const copyError = () => {
    const full = `${label}\nStatus: ${info.status}\nÚltima verificação: ${formatTime(info.lastChecked)}\nErro: ${errorText}`;
    navigator.clipboard.writeText(full);
    toast.success('Erro copiado para a área de transferência');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">
              Última verificação: {formatTime(info.lastChecked)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] font-semibold gap-1 ${colors.badge}`}>
          <Circle className={`w-1.5 h-1.5 ${colors.dot}`} />
          {statusLabel(info.status)}
        </Badge>
      </div>

      {info.status !== 'checking' && (
        <div className={`rounded-lg px-3 py-2 text-xs ${isOffline ? 'bg-destructive/5 border border-destructive/10' : 'bg-emerald-500/5 border border-emerald-500/10'}`}>
          <div className="flex items-start gap-2">
            {isOffline && <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />}
            <p className={`flex-1 ${isOffline ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isTruncated && !expanded ? errorText.slice(0, 80) + '…' : errorText}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {isTruncated && (
              <button onClick={() => setExpanded(p => !p)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Menos' : 'Ver detalhes'}
              </button>
            )}
            {isOffline && (
              <button onClick={copyError} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 ml-auto">
                <Copy className="w-3 h-3" /> Copiar erro
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry }: { entry: StatusHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const dotClass = overallDot(entry.overall);
  const label = getOverallLabel(entry.overall);
  const ts = new Date(entry.timestamp);

  const services = [
    { key: 'backend', label: 'Backend', ...entry.backend },
    { key: 'auth', label: 'Auth', ...entry.auth },
    { key: 'db', label: 'DB', ...entry.db },
  ];

  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
      >
        <Circle className={`w-2 h-2 shrink-0 ${dotClass}`} />
        <span className="text-xs font-medium text-foreground flex-1 text-left">{label}</span>
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(ts, { addSuffix: true, locale: ptBR })}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-1.5 border-t border-border pt-2">
          <p className="text-[10px] text-muted-foreground font-mono">
            {ts.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          {services.map(s => {
            const colors = statusColor(s.status);
            return (
              <div key={s.key} className="flex items-start gap-2">
                <Badge variant="outline" className={`text-[9px] shrink-0 gap-1 ${colors.badge}`}>
                  <Circle className={`w-1 h-1 ${colors.dot}`} />
                  {s.label}
                </Badge>
                <p className="text-[10px] text-muted-foreground leading-relaxed truncate flex-1">
                  {s.errorCode ? `[${s.errorCode}] ` : ''}{s.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SystemStatusCard() {
  const { statuses, recheck, checking, history, clearHistory } = useSystemStatus();
  const [showHistory, setShowHistory] = useState(false);
  const overall = getOverallStatus(statuses);
  const overallLabel = getOverallLabel(overall);
  const overallMessage = getOverallMessage(statuses);

  const overallColors = overall === 'online'
    ? 'fill-emerald-500 text-emerald-500'
    : overall === 'degraded'
      ? 'fill-amber-500 text-amber-500'
      : 'fill-destructive text-destructive';

  const items = [
    { key: 'backend', label: 'Backend (API)', icon: Server, info: statuses.backend },
    { key: 'auth', label: 'Autenticação', icon: Shield, info: statuses.auth },
    { key: 'db', label: 'Banco de Dados', icon: HardDrive, info: statuses.db },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            Status do Sistema
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => setShowHistory(p => !p)}
            >
              <History className="w-3 h-3" />
              <span className="hidden sm:inline">Histórico</span>
              {history.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-0.5">{history.length}</Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => recheck()}
              disabled={checking}
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall status banner */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${
          overall === 'online' ? 'bg-emerald-500/5 border-emerald-500/15' :
          overall === 'degraded' ? 'bg-amber-500/5 border-amber-500/15' :
          'bg-destructive/5 border-destructive/15'
        }`}>
          <Circle className={`w-2.5 h-2.5 ${overallColors}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${
              overall === 'online' ? 'text-emerald-600 dark:text-emerald-400' :
              overall === 'degraded' ? 'text-amber-600 dark:text-amber-400' :
              'text-destructive'
            }`}>
              {overallLabel}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{overallMessage}</p>
          </div>
        </div>

        {/* Service blocks */}
        {items.map(s => (
          <ServiceBlock key={s.key} label={s.label} icon={s.icon} info={s.info} />
        ))}

        {/* History section */}
        {showHistory && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <History className="w-3 h-3" />
                Histórico de verificações
              </p>
              {history.length > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `status-history-${new Date().toISOString().slice(0,10)}.json`; a.click();
                      URL.revokeObjectURL(url);
                      toast.success('JSON exportado');
                    }}
                  >
                    <FileJson className="w-3 h-3" /> JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground"
                    onClick={() => {
                      const headers = ['Timestamp','Status Geral','Backend','Backend Erro','Auth','Auth Erro','DB','DB Erro'];
                      const rows = history.map(e => [
                        new Date(e.timestamp).toLocaleString('pt-BR'),
                        e.overall, e.backend.status, e.backend.message,
                        e.auth.status, e.auth.message, e.db.status, e.db.message,
                      ]);
                      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `status-history-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                      URL.revokeObjectURL(url);
                      toast.success('CSV exportado');
                    }}
                  >
                    <FileSpreadsheet className="w-3 h-3" /> CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                    onClick={() => { clearHistory(); toast.success('Histórico limpo'); }}
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </Button>
                </div>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum registro ainda.</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {history.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
