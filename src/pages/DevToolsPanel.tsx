import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDevMonitor, type ApiRequest, type JsError, type BackendLog, type JobItem, type WebhookStatus } from '@/hooks/useDevMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Cpu, HardDrive, Zap, Layers, Webhook, Globe, ScrollText,
  AlertTriangle, Database, Wrench, ArrowLeft, Copy, Download, Trash2,
  RefreshCw, Circle, Clock, CheckCircle2, XCircle, Loader2, LogOut,
  Monitor, BarChart3, Server, Bug, Settings
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Section = 'usage' | 'jobs' | 'webhooks' | 'api' | 'logs' | 'errors' | 'database' | 'tools';

const SECTIONS: { key: Section; label: string; icon: typeof Activity; color: string }[] = [
  { key: 'usage', label: 'Uso do Sistema', icon: BarChart3, color: 'text-sky-500' },
  { key: 'jobs', label: 'Fila de Tarefas', icon: Layers, color: 'text-cyan-500' },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook, color: 'text-emerald-500' },
  { key: 'api', label: 'Requisições API', icon: Globe, color: 'text-amber-500' },
  { key: 'logs', label: 'Logs do Backend', icon: ScrollText, color: 'text-rose-500' },
  { key: 'errors', label: 'Erros JS', icon: Bug, color: 'text-red-500' },
  { key: 'database', label: 'Banco de Dados', icon: Database, color: 'text-cyan-500' },
  { key: 'tools', label: 'Ferramentas', icon: Wrench, color: 'text-orange-500' },
];

export default function DevToolsPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('usage');
  const [collapsed, setCollapsed] = useState(false);
  const monitor = useDevMonitor();

  const jobCounts = useMemo(() => ({
    pending: monitor.jobs.filter(j => j.status === 'pending').length,
    running: monitor.jobs.filter(j => j.status === 'running').length,
    done: monitor.jobs.filter(j => j.status === 'done').length,
    failed: monitor.jobs.filter(j => j.status === 'failed').length,
  }), [monitor.jobs]);

  const copyLogs = () => {
    const text = monitor.logs.map(l => `[${l.level}] ${format(l.timestamp, 'HH:mm:ss')} ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Logs copiados!');
  };

  const exportLogs = () => {
    const text = monitor.logs.map(l => `[${l.level}] ${format(l.timestamp, 'yyyy-MM-dd HH:mm:ss')} ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `devtools-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Logs exportados!');
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn("hidden md:flex flex-col h-full border-r border-border bg-card/80 animate-fade-in",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("h-14 flex items-center border-b border-border shrink-0", collapsed ? "justify-center" : "gap-3 px-4")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20 cursor-pointer" onClick={() => setCollapsed(c => !c)}>
            <Monitor className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-foreground block">Super Dev Panel</span>
              <span className="text-[10px] text-muted-foreground/60 block">PetCão • Diagnóstico</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2.5 mb-2">Monitoramento</p>}
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.key;
            const btn = (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  'w-full flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-150',
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', isActive ? 'bg-primary/15' : 'bg-muted/50')}>
                  <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-primary' : s.color)} />
                </div>
                {!collapsed && <span className="truncate">{s.label}</span>}
                {!collapsed && s.key === 'errors' && monitor.jsErrors.length > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">{monitor.jsErrors.length}</Badge>
                )}
              </button>
            );
            if (collapsed) {
              return (
                <Tooltip key={s.key} delayDuration={0}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{s.label}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={s.key}>{btn}</div>;
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed ? (
            <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/50"><ArrowLeft className="w-3.5 h-3.5" /></div>
              <span>Voltar ao Admin</span>
            </button>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center justify-center rounded-xl py-2.5 text-muted-foreground hover:bg-muted/80"><ArrowLeft className="w-4 h-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Voltar</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-foreground">{user?.name} <span className="text-xs text-muted-foreground capitalize">({user?.role})</span></span>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 h-5 hidden sm:flex">
              <Circle className={cn('w-1.5 h-1.5', monitor.dbStatus.connected ? 'fill-emerald-500 text-emerald-500' : 'fill-destructive text-destructive')} />
              {monitor.dbStatus.connected ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono h-5 hidden sm:flex">v2.5.0</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={monitor.refreshAll}><RefreshCw className="w-3.5 h-3.5" /></Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Verificar sistema</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground h-8"><LogOut className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Sair</span></Button>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
            <div key={section} className="animate-fade-in">
              {section === 'usage' && <UsageSection metrics={monitor.metrics} loading={monitor.backendLoading} />}
              {section === 'jobs' && <JobsSection jobs={monitor.jobs} counts={jobCounts} />}
              {section === 'webhooks' && <WebhooksSection webhooks={monitor.webhooks} />}
              {section === 'api' && <ApiSection requests={monitor.apiRequests} onClear={monitor.clearRequests} />}
              {section === 'logs' && <LogsSection logs={monitor.logs} onClear={monitor.clearLogs} onCopy={copyLogs} onExport={exportLogs} />}
              {section === 'errors' && <ErrorsSection errors={monitor.jsErrors} onClear={monitor.clearErrors} />}
              {section === 'database' && <DatabaseSection db={monitor.dbStatus} onRefresh={monitor.refreshAll} loading={monitor.backendLoading} />}
              {section === 'tools' && <ToolsSection onCopyLogs={copyLogs} onExportLogs={exportLogs} onClearLogs={monitor.clearLogs} onRefresh={monitor.refreshAll} />}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SECTIONS
   ════════════════════════════════════════════════════════════ */

import { InfoButton, DEV_INFO } from '@/components/devtools/InfoButton';

function SectionHeader({ icon: Icon, title, description, color, infoKey }: { icon: typeof Activity; title: string; description: string; color: string; infoKey?: keyof typeof DEV_INFO }) {
  const info = infoKey ? DEV_INFO[infoKey] : null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {info && <InfoButton title={info.title} description={info.description} />}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 1. Usage ── */
function UsageSection({ metrics, loading }: { metrics: ReturnType<typeof useDevMonitor>['metrics']; loading: boolean }) {
  return (
    <>
      <SectionHeader icon={BarChart3} title="Uso do Sistema" description="Métricas de performance em tempo real (backend + cliente)" color="from-sky-500 to-blue-600 shadow-sky-500/20" />
      {loading && <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Atualizando métricas do backend…</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard icon={Cpu} label="Heap JS (Cliente)" value={`${metrics.memoryUsedMB}MB / ${metrics.memoryTotalMB}MB`} progress={Math.round((metrics.memoryUsedMB / metrics.memoryTotalMB) * 100)} color="success" />
        <MetricCard icon={Zap} label="Requisições/min" value={`${metrics.rpm} rpm`} progress={Math.min(metrics.rpm, 100)} color="success" />
        <MetricCard icon={Database} label="Total de Registros" value={`${metrics.totalRows.toLocaleString()}`} progress={Math.min(metrics.totalRows / 10, 100)} color="success" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Registros por Tabela</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Object.entries(metrics.tableCounts).sort((a, b) => b[1] - a[1]).map(([table, count]) => (
          <Card key={table} className="border-border/50 bg-card/60">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{table}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, progress, color }: { icon: typeof Cpu; label: string; value: string; progress: number; color: string }) {
  const barColor = color === 'destructive' ? 'bg-destructive' : color === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center"><Icon className="w-4 h-4 text-muted-foreground" /></div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
          </div>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", barColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── 2. Jobs ── */
function JobsSection({ jobs, counts }: { jobs: JobItem[]; counts: { pending: number; running: number; done: number; failed: number } }) {
  const statusIcon = (s: JobItem['status']) => {
    switch (s) {
      case 'pending': return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
      case 'running': return <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />;
      case 'done': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };
  return (
    <>
      <SectionHeader icon={Layers} title="Fila de Tarefas" description="Estado das tarefas em processamento" color="from-cyan-500 to-teal-600 shadow-cyan-500/20" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Pendentes" value={counts.pending} color="text-muted-foreground" />
        <MiniStat label="Executando" value={counts.running} color="text-amber-500" />
        <MiniStat label="Concluídos" value={counts.done} color="text-emerald-500" />
        <MiniStat label="Falhas" value={counts.failed} color="text-destructive" />
      </div>
      <Card className="border-border/50">
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y divide-border/50">
            {jobs.map(j => (
              <div key={j.id} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-muted/30 transition-colors">
                {statusIcon(j.status)}
                <span className="font-mono text-foreground w-32 truncate">{j.type}</span>
                <Badge variant="outline" className="text-[10px] h-5 capitalize">{j.status}</Badge>
                <span className="text-muted-foreground ml-auto">{j.duration != null ? `${j.duration}ms` : '—'}</span>
                <span className="text-muted-foreground/60 w-16 text-right">{format(j.timestamp, 'HH:mm:ss')}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="border-border/50 bg-card/60">
      <CardContent className="p-4 text-center">
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ── 3. Webhooks ── */
function WebhooksSection({ webhooks }: { webhooks: WebhookStatus[] }) {
  const dot = (s: WebhookStatus['status']) => s === 'online' ? 'bg-emerald-500 animate-pulse' : s === 'error' ? 'bg-destructive' : 'bg-muted-foreground';
  return (
    <>
      <SectionHeader icon={Webhook} title="Webhooks / Integrações" description="Status das integrações externas" color="from-emerald-500 to-green-600 shadow-emerald-500/20" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {webhooks.map(w => (
          <Card key={w.name} className="border-border/50 bg-card/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dot(w.status))} />
                  <span className="text-sm font-semibold text-foreground">{w.name}</span>
                </div>
                <Badge variant={w.status === 'online' ? 'default' : 'destructive'} className="text-[10px] h-5 capitalize">{w.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Última: {w.lastCall ? format(w.lastCall, 'HH:mm:ss') : '—'}</span>
                <span>Resposta: {w.responseTime ?? '—'}ms</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ── 4. API Monitor ── */
function ApiSection({ requests, onClear }: { requests: ApiRequest[]; onClear: () => void }) {
  const methodColor = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-emerald-500/15 text-emerald-600';
      case 'POST': return 'bg-sky-500/15 text-sky-600';
      case 'PUT': return 'bg-amber-500/15 text-amber-600';
      case 'DELETE': return 'bg-destructive/15 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const statusColor = (s: number) => s >= 500 ? 'text-destructive' : s >= 400 ? 'text-amber-500' : s > 0 ? 'text-emerald-500' : 'text-destructive';

  return (
    <>
      <SectionHeader icon={Globe} title="Requisições da API" description="Últimas requisições ao backend" color="from-amber-500 to-yellow-600 shadow-amber-500/20" />
      <div className="flex justify-end mb-3">
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-7"><Trash2 className="w-3 h-3 mr-1" />Limpar</Button>
      </div>
      <Card className="border-border/50">
        <ScrollArea className="max-h-[500px]">
          <div className="divide-y divide-border/50">
            {requests.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhuma requisição capturada</p>}
            {requests.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2 text-xs hover:bg-muted/30 transition-colors">
                <Badge className={cn("text-[10px] h-5 w-14 justify-center font-mono", methodColor(r.method))} variant="outline">{r.method}</Badge>
                <span className="font-mono text-foreground truncate flex-1 min-w-0">{r.url.replace(/https?:\/\/[^/]+/, '')}</span>
                <span className={cn("font-mono font-bold w-10 text-right", statusColor(r.status))}>{r.status || 'ERR'}</span>
                <span className="text-muted-foreground w-16 text-right">{r.duration}ms</span>
                <span className="text-muted-foreground/60 w-16 text-right">{format(r.timestamp, 'HH:mm:ss')}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </>
  );
}

/* ── 5. Logs ── */
function LogsSection({ logs, onClear, onCopy, onExport }: { logs: BackendLog[]; onClear: () => void; onCopy: () => void; onExport: () => void }) {
  const levelColor = (l: BackendLog['level']) => l === 'ERROR' ? 'text-destructive' : l === 'WARN' ? 'text-amber-500' : 'text-emerald-500';
  const levelBg = (l: BackendLog['level']) => l === 'ERROR' ? 'bg-destructive/10' : l === 'WARN' ? 'bg-amber-500/10' : '';
  return (
    <>
      <SectionHeader icon={ScrollText} title="Logs do Backend" description="Registros do servidor em tempo real" color="from-rose-500 to-pink-600 shadow-rose-500/20" />
      <div className="flex gap-2 mb-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onCopy} className="text-xs h-7"><Copy className="w-3 h-3 mr-1" />Copiar</Button>
        <Button variant="ghost" size="sm" onClick={onExport} className="text-xs h-7"><Download className="w-3 h-3 mr-1" />Exportar</Button>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-7"><Trash2 className="w-3 h-3 mr-1" />Limpar</Button>
      </div>
      <Card className="border-border/50 bg-zinc-950/80 dark:bg-zinc-950/60">
        <ScrollArea className="max-h-[500px]">
          <div className="p-3 font-mono text-xs space-y-0.5">
            {logs.length === 0 && <p className="text-muted-foreground text-center py-8">Sem logs</p>}
            {logs.map(l => (
              <div key={l.id} className={cn("flex gap-2 px-2 py-1 rounded", levelBg(l.level))}>
                <span className="text-muted-foreground/60 shrink-0 w-16">{format(l.timestamp, 'HH:mm:ss')}</span>
                <span className={cn("shrink-0 w-12 font-bold", levelColor(l.level))}>[{l.level}]</span>
                <span className="text-zinc-300 break-all">{l.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </>
  );
}

/* ── 6. Errors ── */
function ErrorsSection({ errors, onClear }: { errors: JsError[]; onClear: () => void }) {
  return (
    <>
      <SectionHeader icon={Bug} title="Erros do Frontend" description="Erros JavaScript capturados no navegador" color="from-red-500 to-rose-600 shadow-red-500/20" />
      <div className="flex justify-end mb-3">
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-7"><Trash2 className="w-3 h-3 mr-1" />Limpar</Button>
      </div>
      {errors.length === 0 ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum erro detectado 🎉</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {errors.map(e => (
            <Card key={e.id} className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-destructive font-medium break-all">{e.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{e.source}:{e.line}:{e.col}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{format(e.timestamp, 'HH:mm:ss')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/* ── 7. Database ── */
function DatabaseSection({ db, onRefresh, loading }: { db: ReturnType<typeof useDevMonitor>['dbStatus']; onRefresh: () => void; loading: boolean }) {
  return (
    <>
      <SectionHeader icon={Database} title="Banco de Dados" description="Status da conexão e performance (dados reais)" color="from-cyan-500 to-teal-600 shadow-cyan-500/20" />
      {loading && <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Consultando backend…</p>}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-5 text-center">
            <div className={cn("w-4 h-4 rounded-full mx-auto mb-2", db.connected ? "bg-emerald-500 animate-pulse" : "bg-destructive")} />
            <p className="text-sm font-bold text-foreground">{db.connected ? 'Online' : 'Offline'}</p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{db.responseTime ?? '—'}<span className="text-xs font-normal text-muted-foreground">ms</span></p>
            <p className="text-[10px] text-muted-foreground">Latência</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{db.totalRows.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-foreground">{db.activeConnections}</p>
            <p className="text-[10px] text-muted-foreground">Tabelas monitoradas</p>
          </CardContent>
        </Card>
      </div>
      {Object.keys(db.tableCounts).length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground mb-3">Contagem por Tabela</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(db.tableCounts).sort((a, b) => b[1] - a[1]).map(([table, count]) => (
              <Card key={table} className="border-border/50 bg-card/60">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{count}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{table}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs"><RefreshCw className="w-3 h-3 mr-1" />Verificar novamente</Button>
    </>
  );
}

/* ── 8. Tools ── */
function ToolsSection({ onCopyLogs, onExportLogs, onClearLogs, onRefresh }: { onCopyLogs: () => void; onExportLogs: () => void; onClearLogs: () => void; onRefresh: () => void }) {
  return (
    <>
      <SectionHeader icon={Wrench} title="Ferramentas" description="Ações rápidas para desenvolvimento" color="from-orange-500 to-amber-600 shadow-orange-500/20" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Copy, label: 'Copiar Logs', desc: 'Copia todos os logs para a área de transferência', action: onCopyLogs },
          { icon: Download, label: 'Exportar Logs', desc: 'Baixa os logs como arquivo .txt', action: onExportLogs },
          { icon: Trash2, label: 'Limpar Logs', desc: 'Remove todos os logs da sessão atual', action: onClearLogs },
          { icon: RefreshCw, label: 'Verificar Sistema', desc: 'Reexecuta todas as verificações de saúde', action: onRefresh },
        ].map(t => (
          <Card key={t.label} className="border-border/50 bg-card/60 hover:shadow-md transition-shadow cursor-pointer" onClick={t.action}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <t.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
