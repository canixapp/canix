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
  const [searchTerm, setSearchTerm] = useState('');

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
    '18:00', '18:30',
  ];

  // Automated price update based on service and pet size
  useEffect(() => {
    if (!modalService || !servicesList || !newAptModal) return;

    const svc = servicesList.find(s => s.name === modalService);
    if (!svc) return;

    let petSize = '';
    if (foundTutor) {
      if (isAddingNewPet) {
        petSize = newPets[0]?.size || '';
      } else {
        const pet = foundTutor.pets.find(p => p.id === selectedPetId);
        petSize = pet?.size || '';
      }
    } else {
      petSize = newPets[0]?.size || '';
    }

    if (petSize) {
      const s = petSize.toLowerCase();
      let price = 0;
      if (s.includes('peq')) price = svc.price_pequeno || 0;
      else if (s.includes('gran')) price = svc.price_grande || 0;
      else if (s.includes('méd') || s.includes('med')) price = svc.price_medio || 0;

      if (price > 0) {
        setModalPrice(String(price));
      }
    }
  }, [modalService, selectedPetId, isAddingNewPet, newPets, servicesList, newAptModal]);

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
    .filter(a => filterByPeriod(a.date))
    .filter(a => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      const petName = getPetName(a).toLowerCase();
      const ownerName = (a.customer_name || '').toLowerCase();
      const serviceName = (a.service_name || '').toLowerCase();
      return petName.includes(s) || ownerName.includes(s) || serviceName.includes(s);
    });

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

  const statusIconMap: Record<string, string> = {
    pendente: '⏳',
    confirmado: '✅',
    realizado: '✔',
    cancelado: '✖',
    remarcado: '↻',
  };

  const dayStats = useMemo(() => {
    const today = appointments.filter(a => { try { return isToday(parseISO(a.date)); } catch { return false; } });
    const pending = today.filter(a => a.status === 'pendente').length;
    const completed = today.filter(a => a.status === 'realizado').length;
    const revenue = today.filter(a => a.status === 'realizado').reduce((acc, a) => acc + (a.price || 0), 0);
    return { total: today.length, pending, completed, revenue };
  }, [appointments]);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ─── BENTO HEADER ─── */}
      <div className="space-y-6">
        <div className="flex items-end justify-between px-1">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              {getGreeting()} <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground/80 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="capitalize">{todayFormatted}</span>
            </p>
          </div>
          <Button
            onClick={() => setNewAptModal(true)}
            className="hidden sm:flex h-12 px-6 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" /> Novo Agendamento
          </Button>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-[2rem] bg-white border border-border/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <CalendarIcon size={120} />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Total Hoje</p>
            <h3 className="text-4xl font-black text-foreground tabular-nums">{dayStats.total}</h3>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold text-primary">Agendamentos</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-[2rem] bg-amber-50/30 border border-amber-200/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute -right-2 -bottom-2 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 text-amber-500">
              <Clock size={120} />
            </div>
            <p className="text-xs font-bold text-amber-600/80 uppercase tracking-widest mb-3">Pendentes</p>
            <h3 className="text-4xl font-black text-amber-600 tabular-nums">{dayStats.pending}</h3>
            <p className="text-[10px] font-semibold text-amber-600/60 mt-2 italic">Aguardando confirmação</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-[2rem] bg-emerald-50/30 border border-emerald-200/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute -right-2 -bottom-2 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 text-emerald-500">
              <CheckCircle2 size={120} />
            </div>
            <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-widest mb-3">Concluídos</p>
            <h3 className="text-4xl font-black text-emerald-600 tabular-nums">{dayStats.completed}</h3>
            <p className="text-[10px] font-semibold text-emerald-600/60 mt-2 italic">Hoje</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-5 rounded-[2rem] bg-indigo-50/30 border border-indigo-200/40 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
             <div className="absolute -right-2 -bottom-2 opacity-[0.05] group-hover:scale-110 transition-transform duration-500 text-indigo-500">
              <DollarSign size={120} />
            </div>
            <p className="text-xs font-bold text-indigo-600/80 uppercase tracking-widest mb-3">Faturamento</p>
            <h3 className="text-3xl font-black text-indigo-600 tabular-nums">R$ {dayStats.revenue}</h3>
            <p className="text-[10px] font-semibold text-indigo-600/60 mt-3 italic">Serviços realizados hoje</p>
          </motion.div>
        </div>
      </div>

      <Button
        onClick={() => setNewAptModal(true)}
        className="sm:hidden w-full h-14 bg-primary text-white rounded-2xl shadow-lg font-bold text-base"
      >
        <Plus className="w-5 h-5 mr-2" /> Novo Agendamento
      </Button>

      {/* ─── INTEGRATED BENTO FILTER ─── */}
      <div className="p-3 md:p-6 rounded-[2.5rem] bg-white border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Pesquisar por pet, dono ou serviço..."
              className="pl-11 h-12 bg-surface-2 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
             <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl border-none bg-surface-2 font-medium">
                  <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Pagamentos</SelectItem>
                  <SelectItem value="pago">Já Pagos</SelectItem>
                  <SelectItem value="pendente">Pagamento Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl border-none bg-surface-2 font-medium">
                  <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo período</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="amanha">Amanhã</SelectItem>
                  <SelectItem value="7dias">Próximos 7 dias</SelectItem>
                  <SelectItem value="30dias">Próximos 30 dias</SelectItem>
                  <SelectItem value="personalizado">Personalizado...</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>

        {/* Status Pills with Staggered Animation */}
        <div className="flex flex-wrap gap-2">
          {['todos', 'pendente', 'confirmado', 'realizado', 'cancelado', 'remarcado'].map((key) => {
            const count = key === 'todos' ? appointments.length : appointments.filter(a => a.status === key).length;
            const label = key === 'realizado' ? 'Concluído' : key.charAt(0).toUpperCase() + key.slice(1);
            const isActive = statusFilter === key;

            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                    : 'bg-surface-2 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20' : 'bg-background/80'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {periodFilter === 'personalizado' && (
           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-4 p-4 rounded-2xl bg-surface-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Início</label>
                <Input type="date" className="bg-white border-none rounded-xl h-11" onChange={e => setCustomRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Fim</label>
                <Input type="date" className="bg-white border-none rounded-xl h-11" onChange={e => setCustomRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))} />
              </div>
           </motion.div>
        )}
      </div>

      {/* ─── PREMIUM APPOINTMENT LIST ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((apt, i) => {
            const cfg = statusConfig[apt.status] || { label: apt.status, color: '' };
            const petName = getPetName(apt);
            const petSize = getPetSize(apt);
            const petBreed = getPetBreed(apt);

            const statusTheme =
              apt.status === 'pendente' ? { bg: 'bg-amber-100/50', border: 'border-amber-200/50', text: 'text-amber-700', dot: 'bg-amber-500' } :
              apt.status === 'confirmado' ? { bg: 'bg-blue-100/50', border: 'border-blue-200/50', text: 'text-blue-700', dot: 'bg-blue-500' } :
              apt.status === 'realizado' ? { bg: 'bg-emerald-100/50', border: 'border-emerald-200/50', text: 'text-emerald-700', dot: 'bg-emerald-500' } :
              apt.status === 'cancelado' ? { bg: 'bg-red-100/50', border: 'border-red-200/50', text: 'text-red-700', dot: 'bg-red-500' } :
              { bg: 'bg-cyan-100/50', border: 'border-cyan-200/50', text: 'text-cyan-700', dot: 'bg-cyan-500' };

            const actionButtons: React.ReactNode[] = [];

            if (showWhatsApp(apt.status)) {
              actionButtons.push(
                <Button key="wa" size="sm" variant="ghost" onClick={() => openWhatsApp(apt)} className="h-10 w-10 p-0 rounded-2xl text-emerald-600 hover:bg-emerald-50">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              );
            }
            if (apt.status === 'pendente' || apt.status === 'remarcado') {
              actionButtons.push(
                <Button key="confirm" size="sm" variant="ghost" onClick={() => handleAdminConfirm(apt)} className="h-10 w-10 p-0 rounded-2xl text-blue-600 hover:bg-blue-50">
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              );
            }
            if (apt.status === 'confirmado') {
              actionButtons.push(
                 <Button key="complete" size="sm" variant="ghost" onClick={() => handleComplete(apt.id, apt.price || 0)} className="h-10 w-10 p-0 rounded-2xl text-emerald-600 hover:bg-emerald-50">
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              );
            }
            actionButtons.push(
               <Button key="reschedule" size="sm" variant="ghost" onClick={() => setRescheduleModal({ open: true, id: apt.id })} className="h-10 w-10 p-0 rounded-2xl text-muted-foreground hover:bg-surface-2">
                <RefreshCw className="w-5 h-5" />
              </Button>
            );

            return (
              <motion.div
                key={apt.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                className="group relative p-5 md:p-6 rounded-[2.5rem] bg-white border border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Status indicator pill */}
                <div className={`absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full ${statusTheme.bg} border ${statusTheme.border}`}>
                  <div className={`w-2 h-2 rounded-full ${statusTheme.dot} ${apt.status === 'pendente' ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${statusTheme.text}`}>{cfg.label}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Photo/Avatar Block */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-[2rem] bg-surface-2 flex items-center justify-center border-4 border-white shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <Dog className={`w-10 h-10 ${statusTheme.text} opacity-40`} />
                       {/* Overlay with size info */}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-black text-white uppercase">{petSize || 'Porte?'}</span>
                       </div>
                    </div>
                  </div>

                  {/* Info Content */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-foreground tracking-tight">{petName || 'Pet'}</h4>
                      <p className="font-bold text-muted-foreground flex items-center gap-1.5">
                        <User size={14} className="text-foreground/40" />
                        {apt.customer_name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center pt-2">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-0.5">Horário</span>
                          <div className="flex items-center gap-1.5 font-bold text-foreground bg-surface-2 px-3 py-1 rounded-xl">
                            <Clock size={14} className="text-primary" />
                            {apt.time}
                          </div>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-0.5">Data</span>
                          <div className="flex items-center gap-1.5 font-bold text-foreground bg-surface-2 px-3 py-1 rounded-xl">
                            <CalendarIcon size={14} className="text-primary" />
                            {apt.date}
                          </div>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-0.5">Investimento</span>
                          <div className="flex items-center gap-1.5 font-black text-primary bg-primary/10 px-3 py-1 rounded-xl">
                            R$ {apt.price || 0}
                          </div>
                       </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                       <span className="px-4 py-2 rounded-xl bg-surface-2 text-xs font-bold text-muted-foreground border border-border/20">
                          {apt.service_name}
                       </span>
                       <div className="flex items-center gap-2">
                          {actionButtons}
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* ─── BENTO EMPTY STATE ─── */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full py-20 rounded-[3rem] bg-white border border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-surface-2 flex items-center justify-center mb-6">
              <CalendarIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-sm font-medium text-muted-foreground max-w-xs mb-8">Não há agendamentos para este período ou filtro. Que tal criar um novo?</p>
            <Button onClick={() => setNewAptModal(true)} className="h-12 px-8 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-bold">
              <Plus className="w-5 h-5 mr-2" /> Adicionar Primeiro
            </Button>
          </motion.div>
        )}
      </div>

      {/* â•â•â• RESCHEDULE MODAL â•â•â• */}
      <Dialog open={rescheduleModal.open} onOpenChange={(open) => setRescheduleModal({ ...rescheduleModal, open })}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
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
        <DialogContent className="max-w-[560px] p-0 gap-0 rounded-t-[3rem] md:rounded-[3rem] max-h-[92vh] md:max-h-[85vh] flex flex-col overflow-hidden border-none shadow-2xl">
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
                <Select value={modalService} onValueChange={(v) => setModalService(v)}>
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
