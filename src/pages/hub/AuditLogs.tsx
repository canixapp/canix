import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAuditLogsWithActors, rollbackChange, AuditLogWithActor, insertAuditLog } from '@/services/auditLogService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  History, 
  RotateCcw, 
  Search, 
  Calendar, 
  User as UserIcon, 
  MoreHorizontal,
  ArrowRight,
  Zap,
  Box,
  Key
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getAuditLogsWithActors(100);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({ title: 'Erro ao carregar auditoria', variant: 'destructive' });
    }
    setLoading(false);
  }

  const handleRollback = async (log: AuditLogWithActor) => {
    if (!confirm(`Deseja realmente reverter esta alteração? O campo "${log.field}" voltará para "${log.old_value}".`)) return;
    
    setRevertingId(log.id);
    try {
      await rollbackChange(log);
      
      // Registrar o log da própria reversão
      // Isso será feito automaticamente se as páginas estiverem integradas, 
      // mas aqui estamos fazendo direto via serviço.
      
      toast({ 
        title: 'Reversão concluída! ✅', 
        description: `O campo ${log.field} foi restaurado com sucesso.` 
      });

      // Registrar que houve uma reversão
      if (user) {
        insertAuditLog({
          actor_id: user.id,
          action: 'rollback',
          entity: log.entity || 'n/a',
          target_id: log.target_id || undefined,
          field: log.field || undefined,
          old_value: log.new_value, // O valor que estava antes da reversão
          new_value: log.old_value, // O valor restaurado
          details: { original_log_id: log.id, action: 'reverted_to_old_value' }
        });
      }

      await loadLogs();
    } catch (error: any) {
      console.error('Rollback error:', error);
      toast({ 
        title: 'Falha na reversão', 
        description: error.message,
        variant: 'destructive' 
      });
    }
    setRevertingId(null);
  };

  const getEntityIcon = (entity: string | null) => {
    switch (entity) {
      case 'plan': return <Zap className="w-4 h-4" />;
      case 'license': 
      case 'petshop': return <Box className="w-4 h-4" />;
      case 'profile': return <UserIcon className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'update': return <Badge variant="outline" className="text-blue-500 border-blue-500/20 bg-blue-500/5">UPDATE</Badge>;
      case 'insert': return <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">INSERT</Badge>;
      case 'delete': return <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">DELETE</Badge>;
      default: return <Badge variant="outline">{action.toUpperCase()}</Badge>;
    }
  };

  const formatValue = (val: string | null) => {
    if (!val) return <span className="text-muted-foreground italic">vazio</span>;
    if (val === 'null') return <span className="text-muted-foreground italic">null</span>;
    // Tenta formatar se for JSON stringificado
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'boolean') return parsed ? 'Ativo' : 'Inativo';
      if (typeof parsed === 'object') return JSON.stringify(parsed);
      return String(parsed);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          Log de Auditoria
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe todas as alterações administrativas realizadas no ecossistema Canix.
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Filtrar por usuário, entidade..." 
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
        <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4" /> Últimas 48h
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse font-medium">Sincronizando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-20 flex flex-col items-center justify-center text-center border-dashed bg-muted/20">
            <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum registro de auditoria encontrado.</p>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="p-0 overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-md bg-card">
              <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                
                {/* Time & Actor */}
                <div className="md:w-48 shrink-0 space-y-1">
                  <p className="text-xs font-black text-primary/80 flex items-center gap-1.5 uppercase tracking-wide">
                    {format(new Date(log.created_at), "HH:mm '·' dd MMM", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-bold truncate">{log.actor_name}</span>
                  </div>
                </div>

                {/* Entity & Action */}
                <div className="md:w-40 shrink-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1 px-1.5 bg-muted rounded-md group-hover:bg-primary/5 transition-colors">
                      {getEntityIcon(log.entity)}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-tight">{log.entity}</span>
                  </div>
                  <div>{getActionBadge(log.action)}</div>
                </div>

                {/* Changes */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-muted/50 text-[10px] font-black uppercase px-2 py-0">
                      Campo: {log.field || 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1 p-2 px-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs line-through text-muted-foreground/70 overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatValue(log.old_value)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    <div className="flex-1 p-2 px-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      {formatValue(log.new_value)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:w-24 shrink-0 flex justify-end">
                  {log.action === 'update' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl h-10 w-10 p-0 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                      title="Reverter alteração"
                      onClick={() => handleRollback(log)}
                      disabled={revertingId === log.id}
                    >
                      {revertingId === log.id ? (
                        <RotateCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
