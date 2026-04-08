import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { useProAccess } from '@/hooks/useProAccess';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { Badge } from '@/components/ui/badge';
import { ProCard } from '@/components/admin/ProGate';
import { InfoTip } from '@/components/dashboard/InfoTip';
import { PetReturnCard } from '@/components/dashboard/PetReturnCard';
import OnboardingWizard from '@/components/admin/OnboardingWizard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CalendarDays, Users, Clock, Dog, DollarSign, UserPlus,
  Lightbulb, CalendarCheck, TrendingUp, PieChart, Trophy, CalendarPlus,
  Sparkles, ArrowRight, Zap, PartyPopper
} from 'lucide-react';
import { format, parseISO, subDays, isAfter, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fmtCurrency, calculateMetrics } from '@/lib/dashboardCalcs';
import * as profilesService from '@/services/profilesService';
import * as petsService from '@/services/petsService';
import * as expensesService from '@/services/expensesService';
import { motion } from 'framer-motion';
import { sectionAnim, cardVariants } from '@/lib/animations';

const STATUS_BADGE: Record<string, string> = {
  pendente: 'border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-500/5',
  confirmado: 'border-primary/40 text-primary bg-primary/5',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getServiceColor(name: string): { dot: string; bg: string } {
  const lower = name.toLowerCase();
  if (lower.includes('banho') && lower.includes('tosa')) return { dot: 'bg-cyan-500', bg: 'bg-cyan-500/10' };
  if (lower.includes('banho')) return { dot: 'bg-sky-500', bg: 'bg-sky-500/10' };
  if (lower.includes('tosa')) return { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' };
  if (lower.includes('hidrata')) return { dot: 'bg-amber-500', bg: 'bg-amber-500/10' };
  return { dot: 'bg-muted-foreground', bg: 'bg-muted/30' };
}

export default function Dashboard() {
  const { appointments } = useAdmin();
  const { user } = useAuth();
  const { petshop, appVersion } = usePetshop();
  const { isProActive } = useProAccess();
  const [searchParams] = useSearchParams();
  const isV1_1 = useFeatureGate("1.1");
  const isV2 = useFeatureGate("2.0");
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [clientProfiles, setClientProfiles] = useState<profilesService.ProfileRow[]>([]);
  const [allPets, setAllPets] = useState<petsService.PetRow[]>([]);
  const [expenses, setExpenses] = useState<expensesService.ExpenseRow[]>([]);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    profilesService.getClientProfiles().then(setClientProfiles);
    petsService.getAllPets().then(setAllPets);
    expensesService.getExpenses().then(setExpenses);

    // Mágica: Abre onboarding obrigatoriamente se nunca foi concluído no banco
    if (petshop && petshop.onboarding_completed === false) {
      setShowOnboarding(true);
    }
    
    // Mostra Release Notes se houver uma versão nova não vista
    const releaseNotes = (petshop?.settings as any)?.last_release_notes;
    if (petshop?.app_version && releaseNotes && releaseNotes.trim().length > 0) {
      const seenVersion = localStorage.getItem('seen_release_version');
      if (seenVersion !== String(petshop.app_version)) {
        setShowReleaseNotes(true);
      }
    }
  }, [petshop?.onboarding_completed, petshop?.app_version, petshop?.settings, petshop]);

  const handleCloseReleaseNotes = () => {
    localStorage.setItem('seen_release_version', String(petshop?.app_version || ''));
    setShowReleaseNotes(false);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayAppointments = useMemo(() =>
    appointments
      .filter(a => a.date === todayStr && ['pendente', 'confirmado'].includes(a.status))
      .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [appointments, todayStr]
  );

  const nextAppointment = todayAppointments[0];
  const metrics = useMemo(() => calculateMetrics(appointments, 'mes', expenses), [appointments, expenses]);
  const todayMetrics = useMemo(() => calculateMetrics(appointments, 'hoje', expenses), [appointments, expenses]);

  const clientMetrics = useMemo(() => {
    const fourteenDaysAgo = subDays(new Date(), 14);
    return {
      total: clientProfiles.length,
      newMembers: clientProfiles.filter(p => isAfter(parseISO(p.created_at), fourteenDaysAgo)).length,
    };
  }, [clientProfiles]);

  // Occupancy: slots filled today vs a configurable max (default 20)
  const MAX_SLOTS = 20;
  const occupancy = useMemo(() => {
    const filled = todayAppointments.length;
    const pct = Math.min(Math.round((filled / MAX_SLOTS) * 100), 100);
    return { filled, total: MAX_SLOTS, pct };
  }, [todayAppointments]);

  // Top service last 7 days
  const topServiceWeek = useMemo(() => {
    const sevenAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const recent = appointments.filter(a => a.status === 'realizado' && a.date >= sevenAgo);
    const counts: Record<string, number> = {};
    recent.forEach(a => { counts[a.service_name] = (counts[a.service_name] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], count: top[1] } : null;
  }, [appointments]);

  // Tomorrow appointments
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const tomorrowAppointments = useMemo(() =>
    appointments
      .filter(a => a.date === tomorrowStr && ['pendente', 'confirmado'].includes(a.status))
      .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, tomorrowStr]
  );
  const tomorrowCount = tomorrowAppointments.length;

  const firstName = user?.name?.split(' ')[0] || 'Usuário';
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const todayCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const insights = useMemo(() => {
    const msgs: string[] = [];
    const pending = todayAppointments.filter(a => a.status === 'pendente').length;
    if (pending > 0) msgs.push(`Você tem ${pending} agendamento${pending > 1 ? 's' : ''} pendente${pending > 1 ? 's' : ''} de confirmação hoje.`);
    if (clientMetrics.newMembers > 0) msgs.push(`Seu petshop recebeu ${clientMetrics.newMembers} novo${clientMetrics.newMembers > 1 ? 's' : ''} cliente${clientMetrics.newMembers > 1 ? 's' : ''} recentemente.`);
    if (todayAppointments.length === 0) msgs.push('Sua agenda está livre hoje. Que tal confirmar os horários de amanhã?');
    if (todayAppointments.length >= 5) msgs.push('Dia cheio! Organize os atendimentos para manter a qualidade.');
    if (msgs.length === 0) msgs.push('Hoje é um bom dia para confirmar os horários da tarde.');
    return msgs.slice(0, 2);
  }, [todayAppointments, clientMetrics]);

  // Helper to render a standard KPI card
  const renderCard = (label: string, value: string, icon: React.ReactNode, bgClass: string, tooltip: string, idx: number, sub?: string, extra?: React.ReactNode) => (
    <motion.div
      key={label}
      custom={idx}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`p-2.5 rounded-xl ${bgClass} shrink-0`}>{icon}</div>
        <InfoTip title={label} text={tooltip} />
      </div>
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-foreground mt-0.5 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      {extra}
    </motion.div>
  );

  return (
    <div className="space-y-8 overflow-x-hidden pb-8">
      {/* ── Greeting ── */}
      <motion.div variants={sectionAnim} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
            Hoje é {todayCapitalized}
            <Badge variant="secondary" className="text-[9px] font-mono h-4 px-1.5 bg-slate-500/10 text-slate-600 border-slate-500/20">
              v{appVersion}
            </Badge>
          </p>
        </div>

        {/* Banner de Onboarding (Se incompleto e não aberto) */}
        {!petshop?.onboarding_completed && !showOnboarding && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowOnboarding(true)}
            className="group flex items-center gap-4 p-4 bg-gradient-to-br from-[#006C51] to-[#02BF93] rounded-[2rem] text-white shadow-xl shadow-[#02BF93]/20 hover:shadow-2xl hover:shadow-[#02BF93]/40 transition-all active:scale-95 text-left"
          >
            <div className="p-3 bg-white/20 rounded-2xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Configuração Incompleta</p>
              <p className="text-sm font-bold">Finalizar Onboarding <ArrowRight className="inline-block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></p>
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />

      {/* Release Notes Modal (Client Side) */}
      <Dialog open={showReleaseNotes} onOpenChange={setShowReleaseNotes}>
        <DialogContent className="rounded-[2.5rem] p-0 max-w-md border-none overflow-hidden bg-transparent shadow-none [&>button]:hidden">
           <div className="w-full p-8 rounded-[2rem] bg-gradient-to-br from-[#141B2B] to-[#1E293B] text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <Zap size={100} />
              </div>
              <Badge className="bg-[#02BF93] text-white border-none mb-4 font-bold tracking-widest text-[10px]">NOVIDADE NO CANIX • v{appVersion}</Badge>
              <h4 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-2">
                O sistema evoluiu! <PartyPopper className="text-[#02BF93]" size={24} />
              </h4>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                 {(petshop?.settings as any)?.last_release_notes}
              </p>
              <Button 
                onClick={handleCloseReleaseNotes}
                className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-gray-100 border-none transition-transform active:scale-95"
              >
                 Entendi, vamos lá!
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* ── LINHA 1 — Lembretes Inteligentes ── */}
      <motion.section variants={sectionAnim} initial="hidden" animate="visible">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Lembretes Inteligentes</h2>
        </div>
        {insights.length > 0 ? (
          <div className="flex flex-col gap-2">
            {insights.map((msg, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-muted/30 border border-border/40 px-4 py-3">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{msg}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 border border-border/40 px-4 py-3">
            <Lightbulb className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <p className="text-xs text-muted-foreground">Nenhum lembrete no momento. Tudo certo! ✅</p>
          </div>
        )}
      </motion.section>

      {/* ── LINHA 2 — Agenda de Hoje (módulo unificado) ── */}
      <motion.section variants={sectionAnim} initial="hidden" animate="visible" className="space-y-0">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {/* Resumo */}
          <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30">
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CalendarDays className="w-4 h-4 text-sky-500" />
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Atendimentos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Próximo</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {nextAppointment ? nextAppointment.time?.substring(0, 5) : '—'}
              </p>
              {nextAppointment && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {nextAppointment.pets?.map((p: any) => p.pet_name).join(', ') || ''}
                </p>
              )}
            </div>
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <PieChart className="w-4 h-4 text-sky-500" />
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Ocupação</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{occupancy.pct}%</p>
              <div className="mt-1.5 mx-auto max-w-[100px]">
                <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${occupancy.pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Lista de agendamentos */}
          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum agendamento para hoje.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Sua agenda está livre.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {todayAppointments.map((a: any) => {
                const svcColor = getServiceColor(a.service_name);
                const petNames = a.pets?.map((p: any) => p.pet_name).join(', ') || 'Pet não informado';
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${svcColor.bg} shrink-0`}>
                      <div className={`w-3 h-3 rounded-full ${svcColor.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">{a.time?.substring(0, 5)}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-sm font-semibold text-foreground">{petNames}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.service_name}
                        {a.customer_name ? ` • ${a.customer_name}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_BADGE[a.status] || ''}`}>
                      {a.status === 'pendente' ? 'Pendente' : a.status === 'confirmado' ? 'Confirmado' : a.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* ── LINHA 3 — Base de Clientes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {renderCard('Clientes', String(clientMetrics.total),
          <Users className="w-5 h-5 text-primary" />, 'bg-primary/10',
          'Total de clientes cadastrados.', 0)}

        {renderCard('Pets', String(allPets.length),
          <Dog className="w-5 h-5 text-cyan-500" />, 'bg-cyan-500/10',
          'Total de pets cadastrados.', 1)}

        {renderCard('Novos Clientes', String(clientMetrics.newMembers),
          <UserPlus className="w-5 h-5 text-pink-500" />, 'bg-pink-500/10',
          'Clientes cadastrados nos últimos 14 dias.', 2)}
      </div>

      {/* ── LINHA 4 — Desempenho Comercial ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {renderCard('Receita de Hoje', fmtCurrency(todayMetrics.totalReceived),
          <TrendingUp className="w-5 h-5 text-emerald-500" />, 'bg-emerald-500/10',
          'Valor total recebido em atendimentos concluídos hoje.', 3,
          todayMetrics.totalReceived === 0 ? 'R$ 0 hoje' : undefined)}

        {/* Serviço Mais Vendido */}
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible"
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <InfoTip title="Serviço Mais Vendido" text="Serviço mais realizado nos últimos 7 dias." />
          </div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Serviço Mais Vendido</p>
          {topServiceWeek ? (
            <>
              <p className="text-2xl md:text-3xl font-bold text-foreground mt-0.5 tracking-tight">{topServiceWeek.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{topServiceWeek.count} atendimento{topServiceWeek.count > 1 ? 's' : ''} esta semana</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Nenhum esta semana</p>
          )}
        </motion.div>

        {renderCard('Receita (mês)', fmtCurrency(metrics.totalReceived),
          <DollarSign className="w-5 h-5 text-emerald-500" />, 'bg-emerald-500/10',
          'Total recebido no mês atual.', 5)}
      </div>

      {/* ── LINHA 5 — Agenda de Amanhã ── */}
      <motion.section variants={sectionAnim} initial="hidden" animate="visible">
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
                <CalendarPlus className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Agenda de Amanhã</p>
                <p className="text-xs text-muted-foreground">
                  {tomorrowCount > 0
                    ? `${tomorrowCount} atendimento${tomorrowCount > 1 ? 's' : ''} agendado${tomorrowCount > 1 ? 's' : ''}`
                    : 'Nenhum agendamento'}
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{tomorrowCount}</p>
          </div>
          {tomorrowCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CalendarPlus className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum atendimento agendado para amanhã.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {tomorrowAppointments.slice(0, 5).map((a: any) => {
                const svcColor = getServiceColor(a.service_name);
                const petNames = a.pets?.map((p: any) => p.pet_name).join(', ') || 'Pet não informado';
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${svcColor.dot} shrink-0`} />
                    <span className="text-sm font-bold text-foreground">{a.time?.substring(0, 5)}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-sm text-foreground">{petNames}</span>
                    <span className="text-xs text-muted-foreground">• {a.service_name}</span>
                  </div>
                );
              })}
              {tomorrowCount > 5 && (
                <div className="px-5 py-2 text-center">
                  <p className="text-xs text-muted-foreground">+{tomorrowCount - 5} mais</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ── LINHA 6 — Clientes para Reativar (PRO) ── */}
      <ProCard>
        <motion.section variants={sectionAnim} initial="hidden" animate="visible" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">🐶 Clientes para Reativar</h2>
          </div>
          <PetReturnCard appointments={appointments} pets={allPets} profiles={clientProfiles} />
        </motion.section>
      </ProCard>

      {/* ── FUNCIONALIDADE V2 (EXPERIMENTAL) ── */}
      {isV2 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 text-white shadow-2xl shadow-indigo-500/20"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Zap size={20} className="text-yellow-300" />
              </div>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10 uppercase tracking-widest text-[10px]">
                Versão v2 • Beta
              </Badge>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Insights Preditivos de Receita</h2>
            <p className="text-indigo-100/80 text-sm max-w-xl mb-6">
              Detectamos uma tendência de crescimento de 15% nos serviços de Tosa Higiênica. 
              Sugerimos abrir mais 2 horários na próxima quarta-feira para maximizar sua agenda.
            </p>
            
            <div className="flex gap-4">
              <button className="px-6 py-2.5 bg-white text-indigo-600 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                Aplicar Sugestão
              </button>
              <button className="px-6 py-2.5 bg-indigo-500/30 text-white border border-white/20 rounded-full font-bold text-sm hover:bg-indigo-500/40 transition-colors">
                Ver Relatório Completo
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
