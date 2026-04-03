import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { toE164 } from '@/lib/phoneUtils';
import * as petsService from '@/services/petsService';
import { extractPhoneFromAppointmentNotes, openWhatsAppConversation } from '@/lib/whatsapp';
import { AppointmentRow } from '@/services/appointmentsService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle2, XCircle, Calendar as CalendarIcon, Clock, RefreshCw,
  MessageCircle, Dog, User, DollarSign, Plus, Search, Trash2, ChevronRight,
  Phone, Scissors, FileText,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { startOfDay, addDays, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Helpers for AppointmentRow
const getPetName = (apt: AppointmentRow) => apt.pets?.map(p => p.pet_name).join(', ') || '';
const getPetSize = (apt: AppointmentRow) => apt.pets?.[0]?.pet_size || '';
const getPetBreed = (apt: AppointmentRow) => apt.pets?.[0]?.pet_breed || '';

interface PetInfo {
  id: string;
  name: string;
  size: string;
  breed: string;
}

interface TutorInfo {
  name: string;
  phone: string;
  pets: PetInfo[];
  user_id?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' },
  confirmado: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' },
  realizado: { label: 'Concluído', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' },
  remarcado: { label: 'Remarcado', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700' },
};

type PeriodFilter = 'todos' | 'hoje' | 'amanha' | '7dias' | '30dias' | 'personalizado';
type PaymentFilter = 'todos' | 'pago' | 'pendente';

const emptyPet = { name: '', size: '', breed: '' };

export default function Agendamentos() {
  const { appointments, servicesList, confirmAppointment, rescheduleAppointment, cancelAdminAppointment, completeAppointment, setPayment, createAppointment, clientProfiles } = useAdmin();
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; id: string; amount: number }>({ open: false, id: '', amount: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('todos');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('todos');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleTime, setRescheduleTime] = useState('');

  const [cancelModal, setCancelModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [cancelReason, setCancelReason] = useState('');

  const [newAptModal, setNewAptModal] = useState(false);
  const [modalPhone, setModalPhone] = useState('');
  const [modalOwnerName, setModalOwnerName] = useState('');
  const [phoneLookupDone, setPhoneLookupDone] = useState(false);
  const [foundTutor, setFoundTutor] = useState<TutorInfo | null>(null);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [isAddingNewPet, setIsAddingNewPet] = useState(false);
  const [newPets, setNewPets] = useState<{ name: string; size: string; breed: string }[]>([{ ...emptyPet }]);
  const [modalService, setModalService] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [extraPets, setExtraPets] = useState<Record<string, PetInfo[]>>({});

  // â”€â”€ Filter bar scroll UX â”€â”€
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkFilterScroll = useCallback(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    checkFilterScroll();
    el.addEventListener('scroll', checkFilterScroll, { passive: true });
    window.addEventListener('resize', checkFilterScroll);

    // Hint animation: nudge scroll right then back (only on mobile, once)
    const isMobile = window.innerWidth < 768;
    if (isMobile && el.scrollWidth > el.clientWidth) {
      const timer = setTimeout(() => {
        el.scrollTo({ left: 60, behavior: 'smooth' });
        setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 500);
      }, 600);
      return () => { clearTimeout(timer); el.removeEventListener('scroll', checkFilterScroll); window.removeEventListener('resize', checkFilterScroll); };
    }

    return () => { el.removeEventListener('scroll', checkFilterScroll); window.removeEventListener('resize', checkFilterScroll); };
  }, [checkFilterScroll]);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  const handlePhoneLookup = async () => {
    const raw = modalPhone;
    const normalized = raw.replace(/\D/g, '');
    if (normalized.length < 10) {
      toast.error('Telefone inválido. Informe DDD + número.');
      return;
    }

    // 1) Try to find in clientProfiles (already loaded from DB)
    const e164 = toE164(raw);
    let profile = clientProfiles.find(p => {
      const pDigits = p.phone?.replace(/\D/g, '') || '';
      // Compare normalized digits
      if (pDigits === normalized) return true;
      // Compare E.164
      if (e164 && p.phone === e164) return true;
      // Compare stripping country code from both sides
      const pNational = pDigits.startsWith('55') && (pDigits.length === 12 || pDigits.length === 13) ? pDigits.slice(2) : pDigits;
      const inputNational = normalized.startsWith('55') && (normalized.length === 12 || normalized.length === 13) ? normalized.slice(2) : normalized;
      return pNational === inputNational && pNational.length >= 10;
    });

    // 2) If not found locally, try direct lookup in user_accounts (admin has RLS access)
    if (!profile && e164) {
      const { data: uaRows } = await supabase
        .from('user_accounts')
        .select('id, full_name, phone_e164')
        .eq('phone_e164', e164)
        .limit(1);
      const row = uaRows?.[0];
      if (row && row.id) {
        // Found in user_accounts, try to match profile
        profile = clientProfiles.find(p => p.user_id === row.id);
        if (!profile) {
          // Build a minimal profile from the account data
          const fakeTutor: TutorInfo = {
            name: row.full_name || '',
            phone: normalized,
            user_id: row.id,
            pets: [],
          };
          // Load pets from DB
          const dbPets = await petsService.getPetsByOwner(row.id);
          fakeTutor.pets = dbPets.map(p => ({ id: p.id, name: p.name, size: p.size, breed: p.breed || '' }));
          
          setFoundTutor(fakeTutor);
          setModalOwnerName(fakeTutor.name);
          setSelectedPetId(fakeTutor.pets[0]?.id || '');
          setIsAddingNewPet(false);
          setNewPets([{ ...emptyPet }]);
          setPhoneLookupDone(true);
          return;
        }
      }
    }

    if (profile) {
      // Load pets from DB for this profile
      const dbPets = await petsService.getPetsByOwner(profile.user_id);
      const pets: PetInfo[] = dbPets.map(p => ({ id: p.id, name: p.name, size: p.size, breed: p.breed || '' }));

      const tutor: TutorInfo = {
        name: profile.name,
        phone: normalized,
        user_id: profile.user_id,
        pets,
      };
      setFoundTutor(tutor);
      setModalOwnerName(tutor.name);
      setSelectedPetId(pets[0]?.id || '');
      setIsAddingNewPet(false);
      setNewPets([{ ...emptyPet }]);
    } else {
      // Not found anywhere â€” new client
      setFoundTutor(null);
      setModalOwnerName('');
      setSelectedPetId('');
      setNewPets([{ ...emptyPet }]);
    }
    setPhoneLookupDone(true);
  };

  const resetModal = () => {
    setModalPhone(''); setModalOwnerName(''); setPhoneLookupDone(false); setFoundTutor(null);
    setSelectedPetId(''); setIsAddingNewPet(false); setNewPets([{ ...emptyPet }]);
    setModalService(''); setModalDate(''); setModalTime(''); setModalPrice('');
  };

  const handleCreateAppointment = async () => {
    let petName = '';
    let petSize = '';
    let petBreed = '';

    if (foundTutor) {
      if (isAddingNewPet) {
        const np = newPets[0];
        if (!np?.name) { toast.error('Preencha o nome do novo pet'); return; }
        petName = np.name; petSize = np.size; petBreed = np.breed;
        const phone = modalPhone.replace(/\D/g, '');
        setExtraPets(prev => ({ ...prev, [phone]: [...(prev[phone] || []), { id: `${phone}-${np.name}`, name: np.name, size: np.size, breed: np.breed }] }));
      } else {
        const pet = foundTutor.pets.find(p => p.id === selectedPetId);
        if (!pet) { toast.error('Selecione um pet'); return; }
        petName = pet.name; petSize = pet.size; petBreed = pet.breed;
      }
    } else {
      const firstPet = newPets[0];
      if (!firstPet?.name) { toast.error('Preencha o nome do pet'); return; }
      petName = firstPet.name; petSize = firstPet.size; petBreed = firstPet.breed;
    }

    if (!modalPhone || !modalOwnerName || !petName || !modalService || !modalDate || !modalTime) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const customerId = foundTutor?.user_id || '00000000-0000-0000-0000-000000000000';
    const petId = (foundTutor && !isAddingNewPet && selectedPetId) ? selectedPetId : '00000000-0000-0000-0000-000000000000';

    await createAppointment({
      customer_id: customerId,
      service_name: modalService,
      date: modalDate,
      time: modalTime,
      price: Number(modalPrice) || 0,
      origin: 'admin',
      notes: `Tutor: ${modalOwnerName} | Tel: ${modalPhone}`,
      pets: [{ pet_id: petId, pet_name: petName, pet_size: petSize, pet_breed: petBreed }],
    });
    toast.success('Agendamento criado com sucesso!');
    setNewAptModal(false);
    resetModal();
  };

  const filterByPeriod = (dateStr: string) => {
    if (periodFilter === 'todos') return true;
    try {
      const date = startOfDay(parseISO(dateStr));
      const today = startOfDay(new Date());
      switch (periodFilter) {
        case 'hoje': return date.getTime() === today.getTime();
        case 'amanha': return date.getTime() === startOfDay(addDays(today, 1)).getTime();
        case '7dias': return date >= today && date <= startOfDay(addDays(today, 7));
        case '30dias': return date >= today && date <= startOfDay(addDays(today, 30));
        case 'personalizado':
          if (customRange.from && customRange.to) {
            return date >= startOfDay(customRange.from) && date <= startOfDay(customRange.to);
          }
          return true;
        default: return true;
      }
    } catch { return true; }
  };

  const filterByPayment = (apt: AppointmentRow) => {
    if (paymentFilter === 'todos') return true;
    if (paymentFilter === 'pago') return apt.status === 'realizado' && apt.payment_status === 'pago';
    if (paymentFilter === 'pendente') return apt.status === 'realizado' && apt.payment_status === 'pendente';
    return true;
  };

  const filtered = appointments
    .filter(a => statusFilter === 'todos' || a.status === statusFilter)
    .filter(filterByPayment)
    .filter(a => filterByPeriod(a.date));

  const handleComplete = (id: string, price: number) => {
    completeAppointment(id);
    setPaymentModal({ open: true, id, amount: price || 0 });
  };

  const openAdminWhatsApp = (apt: AppointmentRow, message: string) => {
    const clientPhone = apt.customer_phone || extractPhoneFromAppointmentNotes(apt.notes);

    if (!openWhatsAppConversation({ phone: clientPhone, message })) {
      toast.error('Não há telefone cadastrado para este cliente.');
      return false;
    }

    return true;
  };

  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) return;

    const dateStr = rescheduleDate.toISOString().split('T')[0];
    const apt = appointments.find(a => a.id === rescheduleModal.id);

    if (apt) {
      const clientName = apt.customer_name || 'cliente';
      const petName = getPetName(apt);
      const msg = `Olá, ${clientName}! Seu agendamento do pet ${petName} foi remarcado para ${dateStr} às ${rescheduleTime}, serviço ${apt.service_name}.`;
      openAdminWhatsApp(apt, msg);
    }

    void rescheduleAppointment(rescheduleModal.id, dateStr, rescheduleTime);
    setRescheduleModal({ open: false, id: '' });
    setRescheduleDate(undefined);
    setRescheduleTime('');
  };

  const handleCancel = () => {
    const apt = appointments.find(a => a.id === cancelModal.id);
    const reason = cancelReason.trim();

    if (apt) {
      const clientName = apt.customer_name || 'cliente';
      const petName = getPetName(apt);
      const msg = `Olá, ${clientName}. O agendamento do pet ${petName} marcado para ${apt.date} às ${apt.time}, serviço ${apt.service_name}, foi cancelado.${reason ? ` Motivo: ${reason}.` : ''}`;
      openAdminWhatsApp(apt, msg);
    }

    void cancelAdminAppointment(cancelModal.id, reason);
    setCancelModal({ open: false, id: '' });
    setCancelReason('');
  };

  const handleAdminConfirm = (apt: AppointmentRow) => {
    const clientName = apt.customer_name || 'cliente';
    const petName = getPetName(apt);
    const msg = `Olá, ${clientName}! Seu agendamento para o pet ${petName} foi confirmado para ${apt.date} às ${apt.time}, serviço ${apt.service_name}.`;

    openAdminWhatsApp(apt, msg);
    void confirmAppointment(apt.id);
  };

  const openWhatsApp = (apt: AppointmentRow) => {
    const clientName = apt.customer_name || 'cliente';
    const petName = getPetName(apt);
    let msg = '';

    switch (apt.status) {
      case 'pendente':
        msg = `Olá, ${clientName}! Aqui é do PetCão 😊\nRecebemos sua solicitação de agendamento para ${apt.date} às ${apt.time}, serviço ${apt.service_name}. Podemos confirmar?`;
        break;
      case 'confirmado':
        msg = `Olá, ${clientName}! Seu agendamento do pet ${petName} em ${apt.date} às ${apt.time}, serviço ${apt.service_name}, está confirmado. Ficamos à disposição!`;
        break;
      case 'realizado':
        msg = `Olá, ${clientName}! Queremos tirar uma dúvida rápida sobre o atendimento do ${petName}. Podemos conversar?`;
        break;
      default:
        msg = `Olá, ${clientName}! Aqui é do PetCão 😊`;
    }

    openAdminWhatsApp(apt, msg);
  };

  const showWhatsApp = (status: string) => status === 'pendente' || status === 'confirmado' || status === 'realizado';

  const pendingCount = appointments.filter(a => a.status === 'pendente').length;
  const todayCount = appointments.filter(a => { try { return isToday(parseISO(a.date)); } catch { return false; } }).length;

  const PetBlock = ({ index, pet, onChange, onRemove, canRemove }: {
    index: number;
    pet: { name: string; size: string; breed: string };
    onChange: (pet: { name: string; size: string; breed: string }) => void;
    onRemove: () => void;
    canRemove: boolean;
  }) => (
    <div className="border border-border rounded-xl p-3 space-y-2 relative bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Pet {index + 1}</span>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[11px]">Nome *</Label>
          <Input value={pet.name} onChange={e => onChange({ ...pet, name: e.target.value })} placeholder="Nome" className="mt-0.5 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[11px]">Porte</Label>
          <Select value={pet.size} onValueChange={v => onChange({ ...pet, size: v })}>
            <SelectTrigger className="mt-0.5 h-9 text-sm"><SelectValue placeholder="Porte" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pequeno">Pequeno</SelectItem>
              <SelectItem value="Médio">Médio</SelectItem>
              <SelectItem value="Grande">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px]">Raça</Label>
          <Input value={pet.breed} onChange={e => onChange({ ...pet, breed: e.target.value })} placeholder="Raça" className="mt-0.5 h-9 text-sm" />
        </div>
      </div>
    </div>
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const statusTabs = [
    { key: 'todos', label: 'Todos', count: appointments.length },
    { key: 'pendente', label: 'Pendente', count: appointments.filter(a => a.status === 'pendente').length },
    { key: 'confirmado', label: 'Confirmado', count: appointments.filter(a => a.status === 'confirmado').length },
    { key: 'realizado', label: 'Concluído', count: appointments.filter(a => a.status === 'realizado').length },
    { key: 'cancelado', label: 'Cancelado', count: appointments.filter(a => a.status === 'cancelado').length },
    { key: 'remarcado', label: 'Remarcado', count: appointments.filter(a => a.status === 'remarcado').length },
  ];

  const statusIconMap: Record<string, string> = {
    pendente: 'â³',
    confirmado: 'âœ“',
    realizado: 'âœ”',
    cancelado: 'âœ•',
    remarcado: 'â†»',
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4 md:space-y-6">
      {/* â•â•â• HEADER â•â•â• */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div className="space-y-0.5 md:space-y-1">
          <h1 className="text-xl md:text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{getGreeting()} 👋</h1>
          <p className="text-xs md:text-sm text-muted-foreground capitalize">{todayFormatted}</p>
        </div>

        {/* Mobile: stats inline + full-width CTA */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Hoje</span>
              <span className="ml-auto text-base font-bold text-foreground">{todayCount}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">Pendentes</span>
                <span className="ml-auto text-base font-bold text-amber-600">{pendingCount}</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => setNewAptModal(true)}
            className="w-full h-12 text-sm font-semibold rounded-xl shadow-md shadow-primary/15"
          >
            <Plus className="w-5 h-5 mr-2" /> Novo Agendamento
          </Button>
        </div>

        {/* Desktop: original layout */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <div className="text-right">
              <p className="text-[11px] font-medium text-muted-foreground leading-none">Hoje</p>
              <p className="text-lg font-bold text-foreground leading-tight">{todayCount}</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <Clock className="w-4 h-4 text-amber-600" />
              <div className="text-right">
                <p className="text-[11px] font-medium text-muted-foreground leading-none">Pendentes</p>
                <p className="text-lg font-bold text-amber-600 leading-tight">{pendingCount}</p>
              </div>
            </div>
          )}
          <Button
            onClick={() => setNewAptModal(true)}
            className="h-11 px-5 text-sm font-semibold rounded-xl shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
          >
            <Plus className="w-4.5 h-4.5 mr-2" /> Novo Agendamento
          </Button>
        </div>
      </div>

      {/* â•â•â• SEGMENTED FILTER TABS â•â•â• */}
      <div className="space-y-4 md:space-y-4">
        {/* Filter bar container â€” fixed height wrapper to prevent layout shift */}
        <div className="space-y-0">
          {/* Hint line â€” always in DOM, fixed 18px height, opacity-only animation */}
          <div
            className="h-[18px] flex items-center gap-1 pl-1 md:hidden transition-opacity duration-300 ease-out"
            style={{ opacity: showRightFade ? 0.5 : 0 }}
          >
            <span className="text-[10px] text-muted-foreground">Arraste para ver mais</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>

          {/* Scrollable filter bar with edge fades */}
          <div className="relative">
            {/* Left fade */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none rounded-l-xl md:hidden transition-opacity duration-250"
              style={{ opacity: showLeftFade ? 1 : 0 }}
            />
            {/* Right fade + arrow */}
            <div
              className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none md:hidden flex items-center justify-end pr-1 transition-opacity duration-250"
              style={{ opacity: showRightFade ? 1 : 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent rounded-r-xl" />
              <ChevronRight className="relative w-4 h-4 text-muted-foreground/40" />
            </div>

            <div
              ref={filterScrollRef}
              className="flex gap-1.5 md:gap-1 p-1 pr-4 rounded-xl bg-muted/50 border border-border/50 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' } as React.CSSProperties}
            >
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`relative flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                    statusFilter === tab.key
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] md:min-w-[20px] h-[18px] md:h-5 px-1 md:px-1.5 rounded-full text-[10px] md:text-[11px] font-semibold ${
                      statusFilter === tab.key
                        ? tab.key === 'pendente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-primary/10 text-primary'
                        : 'bg-muted-foreground/10 text-muted-foreground'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Filters â€” modern mini-card style */}
        <div className="grid grid-cols-2 gap-2.5 md:flex md:gap-3 md:flex-wrap md:items-end">
          <div className="md:w-44">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block md:hidden">Pagamento</label>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
              <SelectTrigger className="h-11 md:h-9 text-xs rounded-xl border-border/50 bg-card shadow-sm shadow-black/[0.03] hover:shadow-md hover:border-border transition-all duration-200">
                <DollarSign className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos ({appointments.length})</SelectItem>
                <SelectItem value="pago">Pagos ({appointments.filter(a => a.status === 'realizado' && a.payment_status === 'pago').length})</SelectItem>
                <SelectItem value="pendente">Pgto Pendente ({appointments.filter(a => a.status === 'realizado' && a.payment_status === 'pendente').length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:w-48">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block md:hidden">Período</label>
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="h-11 md:h-9 text-xs rounded-xl border-border/50 bg-card shadow-sm shadow-black/[0.03] hover:shadow-md hover:border-border transition-all duration-200">
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-primary/60" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="amanha">Amanhã</SelectItem>
                <SelectItem value="7dias">Próximos 7 dias</SelectItem>
                <SelectItem value="30dias">Próximos 30 dias</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodFilter === 'personalizado' && (
            <div className="col-span-2 flex gap-2 items-end md:col-span-1">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">De</label>
                <input type="date" className="block w-full border border-border/50 rounded-xl px-3 py-2 text-xs bg-card shadow-sm h-11 md:h-9" onChange={e => setCustomRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">Até</label>
                <input type="date" className="block w-full border border-border/50 rounded-xl px-3 py-2 text-xs bg-card shadow-sm h-11 md:h-9" onChange={e => setCustomRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* â•â•â• APPOINTMENTS LIST â•â•â• */}
      <div className="space-y-3 md:space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((apt, i) => {
            const cfg = statusConfig[apt.status] || { label: apt.status, color: '' };
            const petName = getPetName(apt);
            const petSize = getPetSize(apt);
            const petBreed = getPetBreed(apt);
            const icon = statusIconMap[apt.status] || '';

            const statusAccent =
              apt.status === 'pendente' ? 'bg-amber-400' :
              apt.status === 'confirmado' ? 'bg-blue-500' :
              apt.status === 'realizado' ? 'bg-emerald-500' :
              apt.status === 'cancelado' ? 'bg-red-400' :
              apt.status === 'remarcado' ? 'bg-cyan-500' : 'bg-muted';

            const avatarBg =
              apt.status === 'pendente' ? 'bg-amber-100 dark:bg-amber-900/30' :
              apt.status === 'confirmado' ? 'bg-blue-100 dark:bg-blue-900/30' :
              apt.status === 'realizado' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              apt.status === 'cancelado' ? 'bg-red-100 dark:bg-red-900/30' :
              apt.status === 'remarcado' ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-muted';

            const avatarText =
              apt.status === 'pendente' ? 'text-amber-600 dark:text-amber-400' :
              apt.status === 'confirmado' ? 'text-blue-600 dark:text-blue-400' :
              apt.status === 'realizado' ? 'text-emerald-600 dark:text-emerald-400' :
              apt.status === 'cancelado' ? 'text-red-500 dark:text-red-400' :
              apt.status === 'remarcado' ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted-foreground';

            // Build action buttons array for this appointment
            const actionButtons: React.ReactNode[] = [];

            if (showWhatsApp(apt.status)) {
              actionButtons.push(
                <Tooltip key="wa">
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => openWhatsApp(apt)} className="h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>WhatsApp</p></TooltipContent>
                </Tooltip>
              );
            }
            if (apt.status === 'pendente' || apt.status === 'remarcado') {
              actionButtons.push(
                <Tooltip key="confirm">
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => handleAdminConfirm(apt)} className="h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Confirmar</p></TooltipContent>
                </Tooltip>
              );
            }
            if (apt.status === 'pendente' || apt.status === 'confirmado') {
              actionButtons.push(
                <Tooltip key="reschedule">
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setRescheduleModal({ open: true, id: apt.id })} className="h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Remarcar</p></TooltipContent>
                </Tooltip>
              );
            }
            if (apt.status === 'pendente' || apt.status === 'confirmado' || apt.status === 'remarcado') {
              actionButtons.push(
                <Tooltip key="cancel">
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setCancelModal({ open: true, id: apt.id })} className="h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg text-destructive hover:bg-destructive/10">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Cancelar</p></TooltipContent>
                </Tooltip>
              );
            }
            if (apt.status === 'confirmado') {
              actionButtons.push(
                <Tooltip key="complete">
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => handleComplete(apt.id, apt.price || 0)} className="h-9 w-9 md:h-8 md:w-8 rounded-full md:rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Concluir</p></TooltipContent>
                </Tooltip>
              );
            }

            return (
              <motion.div
                key={apt.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <div className="group relative rounded-2xl border border-border/60 bg-card hover:bg-accent/30 hover:border-border hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Status accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccent}`} />

                  <div className="pl-5 pr-4 py-4 md:py-4">
                    {/* â”€â”€ DESKTOP layout (unchanged) â”€â”€ */}
                    <div className="hidden md:flex md:items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${avatarBg}`}>
                        <Dog className={`w-5 h-5 ${avatarText}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{petName || 'Pet'}</span>
                          <span className="text-muted-foreground text-xs">â€¢</span>
                          <span className="text-sm text-muted-foreground truncate">{apt.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{apt.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
                          <span className="font-medium text-foreground/70">{apt.service_name}</span>
                          {apt.price != null && apt.price > 0 && <span className="font-medium">R$ {apt.price}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[11px] border rounded-lg px-2.5 py-0.5 font-semibold ${cfg.color}`}>{cfg.label}</Badge>
                        {apt.origin === 'pacote' && <Badge variant="outline" className="text-[11px] bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700 rounded-lg">Pacote</Badge>}
                        {apt.status === 'realizado' && apt.payment_status === 'pago' && <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 rounded-lg">Pago</Badge>}
                        {apt.status === 'realizado' && apt.payment_status === 'pendente' && <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 rounded-lg">Pgto Pendente</Badge>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">{actionButtons}</div>
                    </div>

                    {/* â”€â”€ MOBILE layout â”€â”€ */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {/* Row 1: Avatar + Pet/Client */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${avatarBg}`}>
                          <Dog className={`w-5 h-5 ${avatarText}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{petName || 'Pet'}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <User className="w-3 h-3 shrink-0" />
                            {apt.customer_name}
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Date & Time */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pl-[52px]">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {apt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {apt.time}
                        </span>
                      </div>

                      {/* Row 3: Service */}
                      <p className="text-xs font-medium text-foreground/70 pl-[52px]">{apt.service_name}</p>

                      {/* Row 4: Status + Price + Badges */}
                      <div className="flex items-center gap-2 flex-wrap pl-[52px]">
                        <Badge variant="outline" className={`text-[11px] border rounded-lg px-2.5 py-0.5 font-semibold ${cfg.color}`}>{cfg.label}</Badge>
                        {apt.price != null && apt.price > 0 && (
                          <span className="text-xs font-semibold text-foreground">R$ {apt.price}</span>
                        )}
                        {apt.origin === 'pacote' && <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700 rounded-lg px-2 py-0.5">Pacote</Badge>}
                        {apt.status === 'realizado' && apt.payment_status === 'pago' && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-0.5">Pago</Badge>}
                        {apt.status === 'realizado' && apt.payment_status === 'pendente' && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 rounded-lg px-2 py-0.5">Pgto Pendente</Badge>}
                      </div>

                      {/* Row 5: Actions â€” centered row of circular buttons */}
                      {actionButtons.length > 0 && (
                        <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/40">
                          {actionButtons}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* â•â•â• EMPTY STATE â•â•â• */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum agendamento encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6">Não há agendamentos para este período ou filtro.</p>
            <Button onClick={() => setNewAptModal(true)} variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Adicionar primeiro agendamento
            </Button>
          </motion.div>
        )}
      </div>

      {/* â•â•â• RESCHEDULE MODAL â•â•â• */}
      <Dialog open={rescheduleModal.open} onOpenChange={(open) => setRescheduleModal({ ...rescheduleModal, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Remarcar Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar mode="single" selected={rescheduleDate} onSelect={setRescheduleDate} locale={ptBR} disabled={[{ before: new Date() }, { dayOfWeek: [0] }]} />
            </div>
            {rescheduleDate && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Horário</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(t => (
                    <button key={t} onClick={() => setRescheduleTime(t)} className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${rescheduleTime === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'}`}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModal({ open: false, id: '' })}>Cancelar</Button>
            <Button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime}>Confirmar Remarcação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â•â•â• CANCEL MODAL â•â•â• */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => setCancelModal({ ...cancelModal, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancelar Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Motivo do cancelamento (opcional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal({ open: false, id: '' })}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â•â•â• NEW APPOINTMENT MODAL â•â•â• */}
      <Dialog open={newAptModal} onOpenChange={(open) => { setNewAptModal(open); if (!open) resetModal(); }}>
        <DialogContent className="max-w-[520px] p-0 gap-0 rounded-t-[20px] md:rounded-[20px] max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden border-border/30 shadow-xl shadow-black/10">
          {/* Bottom-sheet handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-9 h-[5px] rounded-full bg-muted-foreground/20" />
          </div>

          {/* Fixed header */}
          <div className="px-6 pt-4 md:pt-6 pb-4 shrink-0">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Novo Agendamento</DialogTitle>
              <p className="text-[13px] text-muted-foreground mt-1">Preencha os dados para agendar um atendimento</p>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-7" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

            {/* â”€â”€ SECTION: Cliente â”€â”€ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[10px] bg-primary/8 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Cliente</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefone do cliente</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="(11) 98765-4321"
                      value={modalPhone}
                      onChange={e => { setModalPhone(e.target.value); setPhoneLookupDone(false); setFoundTutor(null); }}
                      className="flex-1 h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/40 transition-all"
                    />
                    <Button type="button" variant="outline" className="h-[44px] px-4 rounded-xl border-border/40 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all" onClick={handlePhoneLookup}>
                      <Search className="w-3.5 h-3.5 mr-1.5" /> Buscar
                    </Button>
                  </div>
                  {phoneLookupDone && foundTutor && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cliente encontrado
                    </motion.p>
                  )}
                  {phoneLookupDone && !foundTutor && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-muted-foreground mt-2">Novo cliente — preencha os dados abaixo.</motion.p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do tutor</Label>
                  <Input
                    value={modalOwnerName}
                    onChange={e => setModalOwnerName(e.target.value)}
                    placeholder="Nome completo"
                    className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/40 transition-all"
                    readOnly={!!foundTutor}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* â”€â”€ SECTION: Pets â”€â”€ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[10px] bg-amber-500/8 flex items-center justify-center">
                  <Dog className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Pet</span>
              </div>

              {foundTutor ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Selecionar pet</Label>
                    <Select value={selectedPetId} onValueChange={v => { setSelectedPetId(v); setIsAddingNewPet(false); }}>
                      <SelectTrigger className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20">
                        <SelectValue placeholder="Escolha um pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {foundTutor.pets.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}{p.size ? ` • ${p.size}` : ''}{p.breed ? ` • ${p.breed}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isAddingNewPet ? (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1.5 group"
                      onClick={() => { setIsAddingNewPet(true); setSelectedPetId(''); }}
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3" />
                      </div>
                      Adicionar novo pet
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-2xl border border-border/40 p-4 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Novo Pet</span>
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => { setIsAddingNewPet(false); setSelectedPetId(foundTutor.pets[0]?.id || ''); }}>
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Nome *</Label>
                          <Input value={newPets[0].name} onChange={e => setNewPets([{ ...newPets[0], name: e.target.value }])} placeholder="Nome do pet" className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Porte</Label>
                            <Select value={newPets[0].size} onValueChange={v => setNewPets([{ ...newPets[0], size: v }])}>
                              <SelectTrigger className="h-[44px] text-base md:text-sm rounded-xl border-border/40"><SelectValue placeholder="Porte" /></SelectTrigger>
                              <SelectContent><SelectItem value="Pequeno">Pequeno</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Grande">Grande</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Raça</Label>
                            <Input value={newPets[0].breed} onChange={e => setNewPets([{ ...newPets[0], breed: e.target.value }])} placeholder="Raça" className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {newPets.map((pet, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }} className="rounded-2xl border border-border/40 p-4 space-y-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Pet {i + 1}</span>
                        {i > 0 && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setNewPets(prev => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Nome *</Label>
                          <Input value={pet.name} onChange={e => setNewPets(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} placeholder="Nome do pet" className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Porte</Label>
                            <Select value={pet.size} onValueChange={v => setNewPets(prev => prev.map((p, idx) => idx === i ? { ...p, size: v } : p))}>
                              <SelectTrigger className="h-[44px] text-base md:text-sm rounded-xl border-border/40"><SelectValue placeholder="Porte" /></SelectTrigger>
                              <SelectContent><SelectItem value="Pequeno">Pequeno</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Grande">Grande</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Raça</Label>
                            <Input value={pet.breed} onChange={e => setNewPets(prev => prev.map((p, idx) => idx === i ? { ...p, breed: e.target.value } : p))} placeholder="Raça" className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1.5 group"
                    onClick={() => setNewPets(prev => [...prev, { ...emptyPet }])}
                  >
                    <div className="w-5 h-5 rounded-md bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </div>
                    Adicionar outro pet
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* â”€â”€ SECTION: ServiÃ§o â”€â”€ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[10px] bg-cyan-500/8 flex items-center justify-center">
                  <Scissors className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Serviço</span>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de serviço</Label>
                <Select value={modalService} onValueChange={v => {
                  setModalService(v);
                  const svc = servicesList.find(s => s.name === v);
                  const petSize = foundTutor
                    ? (isAddingNewPet ? newPets[0]?.size : foundTutor.pets.find(p => p.id === selectedPetId)?.size)
                    : newPets[0]?.size;
                  if (svc && petSize) {
                    const s = petSize.toLowerCase();
                    const price = s.includes('peq') ? svc.price_pequeno : s.includes('gran') ? svc.price_grande : svc.price_medio;
                    if (price) setModalPrice(String(price));
                  }
                }}>
                  <SelectTrigger className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesList.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* â”€â”€ SECTION: Agendamento â”€â”€ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[10px] bg-blue-500/8 flex items-center justify-center">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Data e Horário</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Data</Label>
                    <Input type="date" value={modalDate} onChange={e => setModalDate(e.target.value)} className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Horário</Label>
                    <Select value={modalTime} onValueChange={setModalTime}>
                      <SelectTrigger className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20"><SelectValue placeholder="Hora" /></SelectTrigger>
                      <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Valor (R$)</Label>
                  <Input type="number" min={0} value={modalPrice} onChange={e => setModalPrice(e.target.value)} className="h-[44px] text-base md:text-sm rounded-xl border-border/40 bg-card focus-visible:ring-primary/20" placeholder="0,00" />
                </div>
              </div>
            </div>

            {/* â”€â”€ SECTION: Resumo â”€â”€ */}
            {(modalOwnerName || modalService || modalDate) && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[10px] bg-emerald-500/8 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground">Resumo</span>
                  </div>
                  <div className="rounded-2xl border border-border/30 bg-muted/20 p-4 space-y-2.5">
                    {modalOwnerName && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Cliente</span>
                        <span className="text-xs font-medium text-foreground">{modalOwnerName}</span>
                      </div>
                    )}
                    {(() => {
                      const petNameSummary = foundTutor
                        ? (isAddingNewPet ? newPets[0]?.name : foundTutor.pets.find(p => p.id === selectedPetId)?.name)
                        : newPets[0]?.name;
                      return petNameSummary ? (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Pet</span>
                          <span className="text-xs font-medium text-foreground">{petNameSummary}</span>
                        </div>
                      ) : null;
                    })()}
                    {modalService && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Serviço</span>
                        <span className="text-xs font-medium text-foreground">{modalService}</span>
                      </div>
                    )}
                    {(modalDate || modalTime) && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Quando</span>
                        <span className="text-xs font-medium text-foreground">
                          {modalDate && modalDate}{modalTime && ` às ${modalTime}`}
                        </span>
                      </div>
                    )}
                    {modalPrice && Number(modalPrice) > 0 && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-border/30">
                        <span className="text-xs font-medium text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-foreground">R$ {modalPrice}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-sm px-6 py-4 flex gap-3 pb-safe">
            <Button variant="ghost" className="h-[46px] px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground" onClick={() => { setNewAptModal(false); resetModal(); }}>Cancelar</Button>
            <Button className="flex-1 h-[46px] rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.98] transition-all duration-200" onClick={handleCreateAppointment}>
              <Plus className="w-4 h-4 mr-2" /> Criar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentModal open={paymentModal.open} onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })} appointmentId={paymentModal.id} defaultAmount={paymentModal.amount} onConfirm={(paid, method, amount) => { setPayment(paymentModal.id, paid ? 'pago' : 'pendente', method, amount); }} />
    </div>
    </TooltipProvider>
  );
}
