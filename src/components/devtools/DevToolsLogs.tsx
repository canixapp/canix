import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Clock, Filter, AlertTriangle } from 'lucide-react';
import { getRecentAuditLogs, AuditLogRow } from '@/services/auditLogService';
import { formatDistanceToNow, format, isToday, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ENTITY_LABELS: Record<string, string> = {
  settings: 'Configurações',
  services: 'Serviços',
  packages: 'Pacotes',
  gallery: 'Galeria',
  reviews: 'Avaliações',
  appointments: 'Agendamentos',
};

const ACTION_LABELS: Record<string, string> = {
  update: 'alterou',
  create: 'criou',
  delete: 'removeu',
};

export function DevToolsLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'24h' | '48h' | '7d'>('48h');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const hoursMap = { '24h': 24, '48h': 48, '7d': 168 };
    getRecentAuditLogs(hoursMap[filter])
      .then(data => {
        let filtered = data;
        if (filter === '24h') filtered = data.filter(l => isToday(new Date(l.created_at)));
        setLogs(filtered);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const displayLogs = actionFilter === 'all'
    ? logs
    : logs.filter(l => l.action === actionFilter);

  const formatValue = (val: string | null) => {
    if (!val || val === 'null') return '—';
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
    } catch { return val; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Logs</h2>
        <p className="text-xs text-muted-foreground">Registro de alterações e atividades do sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['24h', '48h', '7d'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs gap-1.5"
          >
            <Clock className="w-3 h-3" />
            {f === '24h' ? 'Últimas 24h' : f === '48h' ? 'Últimos 2 dias' : 'Última semana'}
          </Button>
        ))}
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Filtrar ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            <SelectItem value="update">Alterações</SelectItem>
            <SelectItem value="create">Criações</SelectItem>
            <SelectItem value="delete">Remoções</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Errors card */}
      <Card className="shadow-sm border-destructive/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Erros críticos (24h)</p>
            <p className="text-xl font-bold text-foreground">0</p>
          </div>
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Timeline
            <Badge variant="outline" className="text-[10px]">{displayLogs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Carregando...</p>
          ) : displayLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Nenhum registro encontrado.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Data</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Ação</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Página</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Campo</th>
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLogs.map(log => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px]">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-foreground">
                          {log.entity ? (ENTITY_LABELS[log.entity] || log.entity) : '—'}
                        </td>
                        <td className="py-2 px-2 text-foreground font-medium">{log.field || '—'}</td>
                        <td className="py-2 px-2">
                          {(log.old_value || log.new_value) ? (
                            <span>
                              <span className="line-through text-destructive/70">{formatValue(log.old_value)}</span>
                              {' → '}
                              <span className="text-emerald-600 dark:text-emerald-400">{formatValue(log.new_value)}</span>
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-2">
                {displayLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-muted/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[log.action] || log.action}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      {log.entity && <span className="font-semibold">{ENTITY_LABELS[log.entity] || log.entity}</span>}
                      {log.field && <> · {log.field}</>}
                    </p>
                    {(log.old_value || log.new_value) && (
                      <p className="text-[10px] text-muted-foreground">
                        <span className="line-through text-destructive/70">{formatValue(log.old_value)}</span>
                        {' → '}
                        <span className="text-emerald-600 dark:text-emerald-400">{formatValue(log.new_value)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
