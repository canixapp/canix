import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppointmentRow } from '@/services/appointmentsService';
import { PetRow } from '@/services/petsService';
import { ProfileRow } from '@/services/profilesService';
import { InfoTip } from './InfoTip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { Dog, MessageCircle, AlertTriangle, Clock, CalendarCheck } from 'lucide-react';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WHATSAPP_NUMBER } from '@/lib/constants';

interface PetReturnInfo {
  petId: string;
  petName: string;
  ownerName: string;
  ownerPhone: string | null;
  lastServiceDate: string;
  lastServiceName: string;
  expectedReturnDate: Date;
  daysUntilReturn: number; // negative = overdue
}

interface PetReturnCardProps {
  appointments: AppointmentRow[];
  pets: PetRow[];
  profiles: ProfileRow[];
}

const DEFAULT_RETURN_DAYS = 30;

import { sectionAnim } from '@/lib/animations';

type FilterType = 'all' | 'overdue' | 'week';

export function PetReturnCard({ appointments, pets, profiles }: PetReturnCardProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [reminderPet, setReminderPet] = useState<PetReturnInfo | null>(null);

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    profiles.forEach(p => m.set(p.user_id, p));
    return m;
  }, [profiles]);

  const returnList = useMemo(() => {
    const now = new Date();
    const completed = appointments.filter(a => a.status === 'realizado');

    // Group by pet (from appointment_pets)
    const petLastService = new Map<string, { date: string; serviceName: string; customerId: string }>();

    completed.forEach(a => {
      (a.pets || []).forEach(ap => {
        const existing = petLastService.get(ap.pet_id);
        if (!existing || a.date > existing.date) {
          petLastService.set(ap.pet_id, { date: a.date, serviceName: a.service_name, customerId: a.customer_id });
        }
      });
    });

    const results: PetReturnInfo[] = [];

    petLastService.forEach((info, petId) => {
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;
      const profile = profileMap.get(info.customerId);
      const expectedReturn = addDays(parseISO(info.date), DEFAULT_RETURN_DAYS);
      const daysUntil = differenceInDays(expectedReturn, now);

      // Only show if within 7 days or overdue
      if (daysUntil <= 7) {
        results.push({
          petId,
          petName: pet.name,
          ownerName: profile?.name || 'Tutor',
          ownerPhone: profile?.phone || null,
          lastServiceDate: info.date,
          lastServiceName: info.serviceName,
          expectedReturnDate: expectedReturn,
          daysUntilReturn: daysUntil,
        });
      }
    });

    return results.sort((a, b) => a.daysUntilReturn - b.daysUntilReturn);
  }, [appointments, pets, profileMap]);

  const filtered = useMemo(() => {
    if (filter === 'overdue') return returnList.filter(r => r.daysUntilReturn < 0);
    if (filter === 'week') return returnList.filter(r => r.daysUntilReturn >= 0 && r.daysUntilReturn <= 7);
    return returnList;
  }, [returnList, filter]);

  const overdueCount = returnList.filter(r => r.daysUntilReturn < 0).length;

  const getStatusLabel = (days: number) => {
    if (days < 0) return { text: `Atraso de ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`, cls: 'border-destructive/40 text-destructive bg-destructive/5' };
    if (days === 0) return { text: 'Volta hoje', cls: 'border-amber-400/60 text-amber-700 dark:text-amber-400 bg-amber-500/5' };
    if (days === 1) return { text: 'Volta amanhã', cls: 'border-sky-400/60 text-sky-700 dark:text-sky-400 bg-sky-500/5' };
    return { text: `Volta em ${days} dias`, cls: 'border-emerald-400/60 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5' };
  };

  const handleWhatsApp = (pet: PetReturnInfo) => {
    const msg = encodeURIComponent(
      `Olá! 🐶\nO ${pet.petName} já está na hora do próximo banho/tosa.\nÚltimo atendimento: ${format(parseISO(pet.lastServiceDate), "dd/MM/yyyy", { locale: ptBR })} (${pet.lastServiceName})\nQuer agendar para esta semana?\nAgende pelo nosso site!`
    );
    const phone = pet.ownerPhone?.replace(/\D/g, '') || WHATSAPP_NUMBER;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    setReminderPet(null);
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: `Todos (${returnList.length})` },
    { value: 'overdue', label: `Atrasados (${overdueCount})` },
    { value: 'week', label: 'Esta semana' },
  ];

  return (
    <motion.section variants={sectionAnim} initial="hidden" animate="visible" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Pets para Retorno</h2>
        <InfoTip title="Retorno de Clientes" text="Pets que devem retornar com base no último atendimento (frequência padrão: 30 dias)." />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${filter === f.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-[14px] border border-border/60 bg-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pet para retorno no momento.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.slice(0, 10).map(pet => {
              const status = getStatusLabel(pet.daysUntilReturn);
              return (
                <div key={pet.petId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 shrink-0">
                    <Dog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pet.petName}</p>
                    <p className="text-xs text-muted-foreground truncate">{pet.ownerName} • {pet.lastServiceName}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${status.cls}`}>{status.text}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setReminderPet(pet)}>
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      <ResponsiveModal open={!!reminderPet} onOpenChange={() => setReminderPet(null)} title="Enviar Lembrete" maxWidth="max-w-md">
        {reminderPet && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{reminderPet.petName}</p>
              <p className="text-xs text-muted-foreground">Tutor: {reminderPet.ownerName}</p>
              <p className="text-xs text-muted-foreground">Último atendimento: {format(parseISO(reminderPet.lastServiceDate), "dd/MM/yyyy")} — {reminderPet.lastServiceName}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs text-muted-foreground mb-1">Preview da mensagem:</p>
              <p className="text-sm text-foreground whitespace-pre-line">
                Olá! 🐶{'\n'}O {reminderPet.petName} já está na hora do próximo banho/tosa.{'\n'}Quer agendar para esta semana?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setReminderPet(null)}>Cancelar</Button>
              <Button onClick={() => handleWhatsApp(reminderPet)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <MessageCircle className="w-4 h-4 mr-1.5" /> Abrir WhatsApp
              </Button>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </motion.section>
  );
}
