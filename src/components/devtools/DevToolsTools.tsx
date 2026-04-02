import { useState, useCallback } from 'react';
import { SystemStatusCard } from './SystemStatusCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wrench, RefreshCw, LogIn, MessageCircle, Bell, Play, Send,
  Check, X, AlertTriangle, Trash2, RotateCcw, ScrollText, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { ClearDashboardModal } from '@/components/modals/ClearDashboardModal';
import { DangerZoneModal } from '@/components/modals/DangerZoneModal';
import { PETSHOP_ID } from '@/lib/constants';
import { NOTIFICATION_TYPE_MAP, getNotificationConfig } from '@/lib/notificationTypes';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckResult {
  label: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  detail?: string;
}

export function DevToolsTools() {
  const { user, refreshUser } = useAuth();
  const { refreshAppointments } = useAdmin();
  const { toast } = useToast();
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [clearDashOpen, setClearDashOpen] = useState(false);
  const [deleteClientsOpen, setDeleteClientsOpen] = useState(false);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [showNotifPreview, setShowNotifPreview] = useState(false);
  const [pushNotif, setPushNotif] = useState<{ id: number; title: string; message: string } | null>(null);
  const pushCounter = 0;
  // Filter out legacy/generic types, keep only specific ones
  const notifTypes = Object.entries(NOTIFICATION_TYPE_MAP).filter(
    ([key]) => !['foto', 'avaliacao', 'agendamento', 'pacote'].includes(key)
  );

  const quickActions = [
    {
      label: 'Limpar cache do frontend',
      icon: RefreshCw,
      action: () => {
        localStorage.clear();
        sessionStorage.clear();
        toast({ title: 'Cache limpo', description: 'localStorage e sessionStorage foram limpos.' });
      },
    },
    {
      label: 'Resetar estado do app',
      icon: RotateCcw,
      action: () => {
        window.location.reload();
      },
    },
    {
      label: 'Revalidar sessÃ£o',
      icon: LogIn,
      action: async () => {
        await refreshUser();
        toast({ title: 'SessÃ£o revalidada' });
      },
    },
    {
      label: 'Testar WhatsApp',
      icon: MessageCircle,
      action: () => {
        window.open(`https://wa.me/5511999999999?text=Teste%20PetC%C3%A3o`, '_blank');
      },
    },
    {
      label: 'Testar notificaÃ§Ãµes',
      icon: Bell,
      action: () => setShowNotifPreview(prev => !prev),
    },
    {
      label: 'Enviar push de teste',
      icon: Send,
      action: () => {
        const id = Date.now();
        setPushNotif({ id, title: 'NotificaÃ§Ã£o de teste', message: 'Esta Ã© uma notificaÃ§Ã£o de teste do sistema.' });
        setTimeout(() => setPushNotif(prev => prev?.id === id ? null : prev), 5000);
      },
    },
  ];

  const runSystemCheck = async () => {
    setChecking(true);
    const results: CheckResult[] = [];

    // 1. Auth
    try {
      const { data } = await supabase.auth.getSession();
      results.push({
        label: 'Login / AutenticaÃ§Ã£o',
        status: data.session ? 'ok' : 'warning',
        detail: data.session ? `SessÃ£o ativa: ${data.session.user.email}` : 'Sem sessÃ£o ativa',
      });
    } catch {
      results.push({ label: 'Login / AutenticaÃ§Ã£o', status: 'error', detail: 'Falha ao verificar sessÃ£o' });
    }

    // 2. Profiles
    try {
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      results.push({
        label: 'Cadastro / Perfis',
        status: error ? 'error' : 'ok',
        detail: error ? error.message : `${count} perfis encontrados`,
      });
    } catch {
      results.push({ label: 'Cadastro / Perfis', status: 'error' });
    }

    // 3. Appointments
    try {
      const { count, error } = await supabase.from('appointments').select('id', { count: 'exact', head: true });
      results.push({
        label: 'Agendamentos',
        status: error ? 'error' : 'ok',
        detail: error ? error.message : `${count} agendamentos`,
      });
    } catch {
      results.push({ label: 'Agendamentos', status: 'error' });
    }

    // 4. Gallery
    try {
      const { count, error } = await supabase.from('gallery_photos').select('id', { count: 'exact', head: true });
      results.push({
        label: 'Uploads / Galeria',
        status: error ? 'error' : 'ok',
        detail: error ? error.message : `${count} fotos`,
      });
    } catch {
      results.push({ label: 'Uploads / Galeria', status: 'error' });
    }

    // 5. Dashboard
    try {
      const { error } = await supabase.from('services').select('id', { count: 'exact', head: true });
      results.push({
        label: 'Dashboard / ServiÃ§os',
        status: error ? 'error' : 'ok',
        detail: error ? error.message : 'Tabela acessÃ­vel',
      });
    } catch {
      results.push({ label: 'Dashboard / ServiÃ§os', status: 'error' });
    }

    // 6. Permissions
    try {
      const { error } = await supabase.from('page_access_matrix').select('id', { count: 'exact', head: true });
      results.push({
        label: 'PermissÃµes',
        status: error ? 'error' : 'ok',
        detail: error ? error.message : 'Matriz acessÃ­vel',
      });
    } catch {
      results.push({ label: 'PermissÃµes', status: 'error' });
    }

    setCheckResults(results);
    setChecking(false);
  };

  const statusIcon = (s: CheckResult['status']) => {
    switch (s) {
      case 'ok': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'error': return <X className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* iPhone-style push notification */}
      <AnimatePresence>
        {pushNotif && (
          <motion.div
            key={pushNotif.id}
            initial={{ y: -80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm cursor-pointer"
            onClick={() => setPushNotif(null)}
          >
            <div className="bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/20 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{pushNotif.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pushNotif.message}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">agora</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-lg font-bold text-foreground">Ferramentas</h2>
        <p className="text-xs text-muted-foreground">AÃ§Ãµes rÃ¡pidas e diagnÃ³stico do sistema</p>
      </div>

      {/* Quick actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            AÃ§Ãµes RÃ¡pidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <Button
                key={a.label}
                variant="outline"
                className="justify-start gap-2 h-auto py-3 text-left"
                onClick={a.action}
              >
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-xs">{a.label}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Notification preview */}
      {showNotifPreview && (
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Preview de NotificaÃ§Ãµes
              <Badge variant="outline" className="text-[10px] ml-auto">{notifTypes.length} tipos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground mb-3">
              VisualizaÃ§Ã£o de todos os tipos de notificaÃ§Ã£o com o visual premium atual.
            </p>
            <div className="space-y-2">
              {notifTypes.map(([key, config]) => {
                const Icon = config.icon;
                const isUnread = ['agendamento_confirmado', 'foto_aprovada', 'pacote_ativado', 'sistema'].includes(key);
                const fakeTime = new Date(Date.now() - Math.random() * 86400000 * 3);

                return (
                  <div
                    key={key}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isUnread
                        ? 'bg-card border-primary/15 shadow-sm'
                        : 'bg-background/50 border-border/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {config.title}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                          <Badge variant="outline" className="text-[9px] ml-auto shrink-0 font-mono">
                            {key}
                          </Badge>
                        </div>
                        {config.defaultMessage && (
                          <p className={`text-[13px] mt-0.5 line-clamp-2 ${isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                            {config.defaultMessage}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                          {formatDistanceToNow(fakeTime, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System check */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            VerificaÃ§Ã£o do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Executa uma verificaÃ§Ã£o automÃ¡tica de todos os mÃ³dulos do sistema.
          </p>
          <Button onClick={runSystemCheck} disabled={checking} className="gap-2">
            <Play className="w-4 h-4" />
            {checking ? 'Verificando...' : 'Rodar verificaÃ§Ã£o'}
          </Button>

          {checkResults.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {checkResults.map(r => (
                <div key={r.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  {statusIcon(r.status)}
                  <span className="text-xs text-foreground font-medium flex-1">{r.label}</span>
                  <Badge variant="outline" className={`text-[10px] ${r.status === 'ok' ? 'text-emerald-600' : r.status === 'error' ? 'text-destructive' : 'text-amber-600'}`}>
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {checkResults.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {checkResults.filter(r => r.status === 'ok').length}/{checkResults.length} mÃ³dulos OK
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System status */}
      <SystemStatusCard />

      {/* Danger zone */}
      <Card className="shadow-sm border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            AÃ§Ãµes irreversÃ­veis. Exigem senha e confirmaÃ§Ã£o.
          </p>

          <div className="space-y-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Limpar dados do Dashboard</p>
                <p className="text-[11px] text-muted-foreground">Exclui agendamentos e pacotes permanentemente.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setClearDashOpen(true)} className="gap-2 min-h-[40px] shrink-0">
                <Trash2 className="w-4 h-4" /> Limpar dados
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Apagar todos os clientes</p>
                <p className="text-[11px] text-muted-foreground">Remove todos os usuÃ¡rios com role "cliente" e seus dados.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setDeleteClientsOpen(true)} className="gap-2 min-h-[40px] shrink-0">
                <Trash2 className="w-4 h-4" /> Apagar clientes
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Apagar logs</p>
                <p className="text-[11px] text-muted-foreground">Remove todos os registros de auditoria.</p>
              </div>
              <Button variant="destructive" size="sm" disabled className="gap-2 min-h-[40px] shrink-0">
                <ScrollText className="w-4 h-4" /> Apagar logs
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 ring-1 ring-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-destructive">ðŸ”¥ ComeÃ§ar do Zero</p>
                <p className="text-[11px] text-muted-foreground">Apaga TUDO (usuÃ¡rios, agendamentos, pets, fotos, despesas, logs). MantÃ©m apenas DEV e configuraÃ§Ãµes do petshop.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setResetAllOpen(true)} className="gap-2 min-h-[40px] shrink-0">
                <RotateCcw className="w-4 h-4" /> Resetar tudo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClearDashboardModal
        open={clearDashOpen}
        onOpenChange={setClearDashOpen}
        onSuccess={() => refreshAppointments()}
      />

      <DangerZoneModal
        open={deleteClientsOpen}
        onOpenChange={setDeleteClientsOpen}
        action="delete_all_clients"
        onSuccess={() => refreshAppointments()}
      />

      <DangerZoneModal
        open={resetAllOpen}
        onOpenChange={setResetAllOpen}
        action="reset_all"
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
