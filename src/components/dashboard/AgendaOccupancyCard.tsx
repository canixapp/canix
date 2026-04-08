import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppointmentRow } from '@/services/appointmentsService';
import { PetshopSettings } from '@/lib/constants';
import { InfoTip } from './InfoTip';
import { Progress } from '@/components/ui/progress';
import { PremiumCardCompact } from './PremiumCard';
import { Clock, TrendingUp, Lightbulb, CalendarDays } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaOccupancyProps {
  appointments: AppointmentRow[];
  settings: PetshopSettings;
}

import { sectionAnim } from '@/lib/animations';

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function AgendaOccupancyCard({ appointments, settings }: AgendaOccupancyProps) {
  const interval = settings.slotIntervalMinutes || 30;
  const openTime = parseTime(settings.openTimeDefault || '09:00');
  const closeTime = parseTime(settings.closeTimeDefault || '18:00');
  const totalSlotsPerDay = Math.floor((closeTime - openTime) / interval);

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayOccupancy = useMemo(() => {
    const todayApts = appointments.filter(a => a.date === today && ['pendente', 'confirmado'].includes(a.status));
    const occupied = todayApts.length;
    const pct = totalSlotsPerDay > 0 ? Math.round((occupied / totalSlotsPerDay) * 100) : 0;
    return { occupied, total: totalSlotsPerDay, pct: Math.min(pct, 100) };
  }, [appointments, today, totalSlotsPerDay]);

  const weekOccupancy = useMemo(() => {
    const openDays = settings.openDaysDefault || [];
    const dayMap: Record<string, string> = { dom: '0', seg: '1', ter: '2', qua: '3', qui: '4', sex: '5', sab: '6' };
    const openDayNumbers = new Set(openDays.map(d => dayMap[d] || ''));
    
    const activeDays = weekDays.filter(d => openDayNumbers.has(String(d.getDay())));
    const totalWeekSlots = activeDays.length * totalSlotsPerDay;
    
    const weekApts = appointments.filter(a => {
      const d = parseISO(a.date);
      return d >= weekStart && d <= weekEnd && ['pendente', 'confirmado'].includes(a.status);
    });
    
    const pct = totalWeekSlots > 0 ? Math.round((weekApts.length / totalWeekSlots) * 100) : 0;
    return { occupied: weekApts.length, total: totalWeekSlots, pct: Math.min(pct, 100) };
  }, [appointments, weekDays, weekStart, weekEnd, totalSlotsPerDay, settings.openDaysDefault]);

  // Busiest and emptiest hours today
  const hourInsights = useMemo(() => {
    const hourCount: Record<string, number> = {};
    const todayApts = appointments.filter(a => a.date === today && ['pendente', 'confirmado', 'realizado'].includes(a.status));
    todayApts.forEach(a => {
      const hour = a.time?.substring(0, 5) || '';
      hourCount[hour] = (hourCount[hour] || 0) + 1;
    });

    // Generate all slots
    const allSlots: string[] = [];
    for (let m = openTime; m < closeTime; m += interval) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }

    const sorted = allSlots.map(s => ({ slot: s, count: hourCount[s] || 0 })).sort((a, b) => b.count - a.count);
    const busiest = sorted.filter(s => s.count > 0).slice(0, 3);
    const emptiest = sorted.filter(s => s.count === 0).slice(0, 3);

    return { busiest, emptiest };
  }, [appointments, today, openTime, closeTime, interval]);

  // Smart suggestion
  const suggestion = useMemo(() => {
    if (hourInsights.emptiest.length >= 2) {
      const slots = hourInsights.emptiest.map(s => s.slot).join(', ');
      return `Horários ${slots} estão vazios hoje. Considere promoções nesses horários.`;
    }
    if (todayOccupancy.pct > 90) {
      return 'Agenda quase lotada hoje! Considere abrir horários extras ou encaixar clientes em lista de espera.';
    }
    return null;
  }, [hourInsights, todayOccupancy]);

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-sky-500';
  };

  return (
    <motion.section variants={sectionAnim} initial="hidden" animate="visible" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Ocupação da Agenda</h2>
        <InfoTip title="Ocupação" text="Percentual de slots ocupados com agendamentos pendentes ou confirmados." />
      </div>

      {/* Occupancy bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-border/60 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase">Hoje</p>
            <span className="text-2xl font-bold text-foreground">{todayOccupancy.pct}%</span>
          </div>
          <Progress value={todayOccupancy.pct} className={`h-3 [&>div]:${getProgressColor(todayOccupancy.pct)}`} />
          <p className="text-[11px] text-muted-foreground">{todayOccupancy.occupied} de {todayOccupancy.total} slots</p>
        </div>
        <div className="rounded-[14px] border border-border/60 bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase">Semana</p>
            <span className="text-2xl font-bold text-foreground">{weekOccupancy.pct}%</span>
          </div>
          <Progress value={weekOccupancy.pct} className={`h-3 [&>div]:${getProgressColor(weekOccupancy.pct)}`} />
          <p className="text-[11px] text-muted-foreground">{weekOccupancy.occupied} de {weekOccupancy.total} slots</p>
        </div>
      </div>

      {/* Hour insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hourInsights.busiest.length > 0 && (
          <div className="rounded-[14px] border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">Horários mais movimentados</p>
            <div className="space-y-1.5">
              {hourInsights.busiest.map(s => (
                <div key={s.slot} className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{s.slot}</span>
                  <span className="text-xs text-muted-foreground">({s.count} agendamento{s.count !== 1 ? 's' : ''})</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {hourInsights.emptiest.length > 0 && (
          <div className="rounded-[14px] border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">Horários mais vazios</p>
            <div className="space-y-1.5">
              {hourInsights.emptiest.map(s => (
                <div key={s.slot} className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{s.slot}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart suggestion */}
      {suggestion && (
        <div className="rounded-[14px] border border-amber-400/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-0.5">💡 Sugestão</p>
            <p className="text-xs text-muted-foreground">{suggestion}</p>
          </div>
        </div>
      )}
    </motion.section>
  );
}
