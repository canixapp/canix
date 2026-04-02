import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarCheck, Image, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRecentAuditLogs, AuditLogRow } from '@/services/auditLogService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { PETSHOP_ID } from '@/lib/constants';
import { InfoTip } from '@/components/dashboard/InfoTip';

export function DevToolsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, appointments: 0, pendingPhotos: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const [rolesRes, aptsRes, photosRes, logs] = await Promise.all([
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).in('role', ['dev', 'admin', 'midia']),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('date', today),
        supabase.from('gallery_photos').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pendente'),
        getRecentAuditLogs(48),
      ]);

      setStats({
        users: rolesRes.count || 0,
        appointments: aptsRes.count || 0,
        pendingPhotos: photosRes.count || 0,
      });
      setRecentLogs(logs.slice(0, 50));
      setLoading(false);
    };
    load();
  }, []);

  const CARDS = [
    { label: 'Equipe ativa', value: stats.users, icon: Users, color: 'text-primary', bg: 'bg-primary/10', tip: 'Total de usuÃ¡rios admin/dev/mÃ­dia' },
    { label: 'Agendamentos hoje', value: stats.appointments, icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tip: 'Agendamentos para a data de hoje' },
    { label: 'Uploads pendentes', value: stats.pendingPhotos, icon: Image, color: 'text-amber-500', bg: 'bg-amber-500/10', tip: 'Fotos aguardando moderaÃ§Ã£o' },
    { label: 'VersÃ£o', value: 'v2.5.0', icon: Info, color: 'text-violet-500', bg: 'bg-violet-500/10', tip: 'VersÃ£o atual do sistema' },
  ];

  const ACTION_LABELS: Record<string, string> = {
    update: 'alterou',
    create: 'criou',
    delete: 'removeu',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">VisÃ£o Geral</h2>
        <p className="text-xs text-muted-foreground">Resumo do sistema em tempo real</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${c.bg}`}>
                    <Icon className={`w-4 h-4 ${c.color}`} />
                  </div>
                  <InfoTip text={c.tip} />
                </div>
                <p className="text-2xl font-bold text-foreground">{loading ? 'â€¦' : c.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logged user info */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">SessÃ£o Atual</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Nome: <span className="text-foreground font-medium">{user?.name}</span></p>
            <p>Email: <span className="text-foreground">{user?.email}</span></p>
            <p>Role: <Badge variant="outline" className="text-[10px] capitalize ml-1">{user?.role}</Badge></p>
            <p>ID: <span className="font-mono text-foreground text-[10px]">{user?.id}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Activity feed */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            Atividade recente
            <Badge variant="outline" className="text-[10px]">{recentLogs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Carregando...</p>
          ) : recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      {log.entity && <span className="font-semibold">{log.entity}</span>}
                      {' '}{ACTION_LABELS[log.action] || log.action}
                      {log.field && <> <span className="text-muted-foreground">{log.field}</span></>}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
