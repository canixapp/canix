import { useState, useEffect, useMemo } from 'react';
import { uploadImageToStorage } from '@/lib/storageUtils';
import { validateImageFile } from '@/lib/imageUtils';
import { useNavigate } from 'react-router-dom';
import { useAuth, Pet, Appointment } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useActiveServices } from '@/hooks/useActiveServices';
import { useBranding } from '@/contexts/BrandingContext';
import { getPetshopWhatsAppPhone, openWhatsAppConversation } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { TermsModal } from '@/components/modals/TermsModal';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import logoPetDefault from '@/assets/logopet.png';
import heroDog from '@/assets/hero-dog.png';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { toast } from 'sonner';
import { staggerContainer, staggerItem, cardHover, cardTap } from '@/lib/animations';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Edit2, Check, Plus, Dog, Package, Calendar, Clock,
  AlertCircle, CheckCircle2, XCircle, RefreshCw, X, LogOut,
  Home, Star, MessageCircle, ArrowLeft, Crown, Trash2,
  Mail, Phone, Shield, ChevronRight, Bell, CalendarDays, Camera,
  Search, Scissors, Image, ArrowRight, Menu, AlertTriangle, Droplets,
} from 'lucide-react';
import { usePetshop } from '@/contexts/PetshopContext';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { ProfilePageSkeleton } from '@/components/skeletons/ProfilePageSkeleton';
import { Header } from '@/components/layout/Header';
import { useTestModes } from '@/contexts/TestModesContext';

const CANCEL_REASONS = [
  'NÃ£o vou conseguir comparecer',
  'Pet indisposto',
  'MudanÃ§a de planos',
  'Atendimento em outro local',
];

export default function ProfilePage() {
  const { isAuthenticated, user, appointments, appointmentsLoading, loading: authLoading, logout,
    updateUser, updateUserAvatar, addPet, updatePet, removePet, cancelAppointment,
    refreshPets,
  } = useAuth();
  const { customerPackages } = useAdmin();
  const navigate = useNavigate();
  const { clientModeActive } = useTestModes();
  const { branding } = useBranding();
  const { petshop, settings } = usePetshop();
  const { services, loading: servicesLoading } = useActiveServices();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editPetModalOpen, setEditPetModalOpen] = useState(false);
  const [petForm, setPetForm] = useState<Partial<Pet>>({ name: '', size: 'medio', breed: '' });
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOther, setCancelOther] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) refreshPets();
  }, []);

  // Pet care alerts: check days since last bath/appointment per pet
  const petCareAlerts = useMemo(() => {
    if (!user?.pets) return [];
    const now = Date.now();
    return user.pets.map(pet => {
      const petAppointments = appointments
        .filter(a => a.petName === pet.name && a.status === 'realizado')
        .sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime());
      const lastDate = petAppointments[0]?.date;
      if (!lastDate) return { pet, daysSince: null, lastService: null };
      const diff = Math.floor((now - new Date(lastDate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
      return { pet, daysSince: diff, lastService: petAppointments[0]?.service };
    }).filter(a => a.daysSince === null || a.daysSince >= 21);
  }, [user?.pets, appointments]);

  const isPageLoading = authLoading || appointmentsLoading || servicesLoading;

  if (!isAuthenticated && !authLoading) {
    navigate('/auth/login', { replace: true });
    return null;
  }

  if (isPageLoading) {
    return <ProfilePageSkeleton />;
  }

  const activeCustomerPkg = customerPackages?.find(p => p.customer_id === user?.id && p.status === 'ATIVO');

  const upcomingAppointments = appointments.filter(a => a.status === 'pendente' || a.status === 'confirmado');
  const pastAppointments = appointments.filter(a => a.status === 'realizado' || a.status === 'cancelado' || a.status === 'remarcado');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendente': return { icon: AlertCircle, label: 'Pendente', emoji: 'ðŸŸ¡', className: 'bg-warning/10 text-warning border-warning/20' };
      case 'confirmado': return { icon: CheckCircle2, label: 'Confirmado', emoji: 'ðŸŸ¢', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'realizado': return { icon: CheckCircle2, label: 'ConcluÃ­do', emoji: 'âœ…', className: 'bg-primary/10 text-primary border-primary/20' };
      case 'cancelado': return { icon: XCircle, label: 'Cancelado', emoji: 'ðŸ”´', className: 'bg-destructive/10 text-destructive border-destructive/20' };
      case 'remarcado': return { icon: RefreshCw, label: 'Remarcado', emoji: 'ðŸ”µ', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      default: return { icon: AlertCircle, label: status, emoji: 'âšª', className: '' };
    }
  };

  const handleProfileSave = () => {
    updateUser({ name: profileForm.name, phone: profileForm.phone });
    setIsEditingProfile(false);
    toast.success('Perfil atualizado!');
  };

  const petshopWhatsAppPhone = getPetshopWhatsAppPhone({
    phone: petshop?.phone,
    whatsappUrl: settings?.social_links?.links?.whatsapp_url,
  });

  const openPetshopWhatsApp = (message: string) => {
    if (!openWhatsAppConversation({ phone: petshopWhatsAppPhone, message })) {
      toast.error('NÃ£o hÃ¡ WhatsApp cadastrado para o petshop.');
      return false;
    }

    return true;
  };

  const handleConfirmWA = (apt: Appointment) => {
    const msg = `OlÃ¡! Gostaria de confirmar o agendamento do pet ${apt.petName} para ${apt.date} Ã s ${apt.time}, serviÃ§o ${apt.service}.`;
    openPetshopWhatsApp(msg);
  };

  const handleAlter = (apt: Appointment) => {
    const msg = `OlÃ¡! Gostaria de remarcar o agendamento do pet ${apt.petName} que estÃ¡ para ${apt.date} Ã s ${apt.time}, serviÃ§o ${apt.service}.`;
    openPetshopWhatsApp(msg);
  };

  const handleCancelClick = (apt: Appointment) => { setCancelTarget(apt); setCancelReason(''); setCancelOther(''); setCancelModalOpen(true); };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    const finalReason = cancelReason === 'outro' ? cancelOther : cancelReason;
    if (!finalReason) { toast.error('Selecione um motivo'); return; }
    cancelAppointment(cancelTarget.id, finalReason);
    const msg = `OlÃ¡! Gostaria de cancelar o agendamento do pet ${cancelTarget.petName} marcado para ${cancelTarget.date} Ã s ${cancelTarget.time}.`;
    openPetshopWhatsApp(msg);
    setCancelModalOpen(false);
    toast.success('Cancelamento solicitado');
  };

  const handleDoubt = (apt: Appointment) => {
    const msg = `OlÃ¡! Gostaria de tirar uma dÃºvida sobre os serviÃ§os do PetCÃ£o.`;
    openPetshopWhatsApp(msg);
  };

  const handleRemovePet = (petId: string) => {
    if (user && user.pets.length <= 1) { toast.error('VocÃª precisa ter pelo menos 1 pet'); return; }
    removePet(petId);
    toast.success('Pet removido');
  };

  const handleAddPet = () => {
    if (!petForm.name || !petForm.size || !petForm.breed) return;
    addPet({ name: petForm.name, size: petForm.size as Pet['size'], breed: petForm.breed });
    setIsAddingPet(false);
    setPetForm({ name: '', size: 'medio', breed: '' });
    toast.success('Pet adicionado!');
  };

  const handleEditPetSave = (petId: string) => {
    updatePet(petId, { name: petForm.name, size: petForm.size as Pet['size'], breed: petForm.breed! });
    setEditingPetId(null);
    toast.success('Pet atualizado!');
  };

  const startEditPet = (pet: Pet) => { setEditingPetId(pet.id); setPetForm({ name: pet.name, size: pet.size, breed: pet.breed }); setEditPetModalOpen(true); };
  const getSizeLabel = (size: string) => { switch (size) { case 'pequeno': return 'Pequeno'; case 'medio': case 'MÃ©dio': return 'MÃ©dio'; case 'grande': return 'Grande'; default: return size; } };

  const quickShortcuts = [
    { label: 'Meus Pets', icon: Dog, color: 'text-secondary', bg: 'bg-secondary/10', action: () => document.getElementById('section-pets')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Agendar', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', action: () => { navigate('/'); setTimeout(() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' }), 400); } },
    { label: 'ServiÃ§os', icon: Scissors, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', action: () => { navigate('/'); setTimeout(() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' }), 400); } },
    { label: 'Galeria', icon: Image, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10', action: () => { navigate('/'); setTimeout(() => document.getElementById('fotos')?.scrollIntoView({ behavior: 'smooth' }), 400); } },
  ];

  // Recommended services (top 4)
  const recommendedServices = services.slice(0, 4);

  const q = searchQuery.toLowerCase().trim();
  const searchResults = q ? {
    pets: (user?.pets || []).filter(p =>
      p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q) || getSizeLabel(p.size).toLowerCase().includes(q)
    ),
    services: services.filter(s =>
      s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    ),
  } : null;

  const containerAnim = staggerContainer;
  const itemAnim = staggerItem;

  return (
    <div className="min-h-screen bg-background">
      {/* â•â•â• HEADER â•â•â• */}
      {clientModeActive ? (
        <Header />
      ) : (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-foreground">Ãrea do Cliente</span>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Menu className="w-5 h-5 text-muted-foreground" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1.5 w-44 z-50">
                      <button onClick={() => { setProfileForm({ name: user?.name || '', phone: user?.phone || '' }); setIsEditingProfile(true); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Editar perfil</button>
                      <button onClick={() => { setTermsOpen(true); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Termos</button>
                      <button onClick={() => { setPrivacyOpen(true); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Privacidade</button>
                      <div className="border-t border-border my-1" />
                      <button onClick={() => { logout(); navigate('/'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2 text-destructive"><LogOut className="w-3.5 h-3.5" /> Sair</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <motion.main
        className="pt-16 pb-24 lg:pb-8"
        variants={containerAnim}
        initial="hidden"
        animate="visible"
      >
        {/* â•â•â• GREETING HEADER â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => document.getElementById('profile-avatar-upload')?.click()}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-md">
                {user?.avatarUrl ? (
                  <OptimizedImage src={user.avatarUrl} alt={user.name} className="w-full h-full" showSkeleton={false} />
                ) : (
                  <User className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input
              id="profile-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const validation = validateImageFile(file);
                if (!validation.valid) { toast.error(validation.error || 'Arquivo invÃ¡lido'); e.target.value = ''; return; }
                try {
                  toast.loading('Enviando foto de perfil...');
                  const { url } = await uploadImageToStorage(file, 'avatars-users', `${user.id}/${Date.now()}`, { quality: 0.85, maxWidth: 400, maxHeight: 400 });
                  updateUserAvatar(url);
                  toast.dismiss();
                  toast.success('Foto de perfil atualizada!');
                } catch {
                  toast.dismiss();
                  toast.error('Erro ao enviar foto. Tente novamente.');
                }
                e.target.value = '';
              }}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">
                OlÃ¡, {user?.name?.split(' ')[0]}! ðŸ‘‹
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{todayLabel}</p>
            </div>
            {activeCustomerPkg && (
              <Badge className="bg-secondary/15 text-secondary border-secondary/30 text-xs shrink-0">
                <Package className="w-3 h-3 mr-1" /> Pacote Ativo
              </Badge>
            )}
          </div>
        </motion.div>

        {/* â•â•â• SEARCH BAR â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar serviÃ§os ou pets"
              className="h-12 rounded-2xl pl-4 pr-12 text-base bg-muted/40 border-border/50 focus-visible:ring-primary/30"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-2 bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
              {searchResults.pets.length === 0 && searchResults.services.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado para "{searchQuery}"</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.pets.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pets</div>
                      {searchResults.pets.map(pet => (
                        <button key={pet.id} onClick={() => { setSearchQuery(''); document.getElementById('section-pets')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            {pet.photo_url ? <OptimizedImage src={pet.photo_url} alt={pet.name} className="w-full h-full rounded-full" showSkeleton={false} /> : <Dog className="w-4 h-4 text-secondary" />}
                          </div>
                          <div className="text-left"><p className="text-sm font-medium text-foreground">{pet.name}</p><p className="text-xs text-muted-foreground">{pet.breed} â€¢ {getSizeLabel(pet.size)}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.services.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ServiÃ§os</div>
                      {searchResults.services.map(svc => (
                        <button key={svc.id} onClick={() => { setSearchQuery(''); navigate('/'); setTimeout(() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' }), 400); }} className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Scissors className="w-4 h-4 text-primary" /></div>
                          <div className="text-left"><p className="text-sm font-medium text-foreground">{svc.name}</p><p className="text-xs text-muted-foreground">{svc.category}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* â•â•â• QUICK SHORTCUTS â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 pb-2 max-w-2xl mx-auto">
          <div className="flex gap-3">
            {quickShortcuts.map((s, i) => (
              <motion.button
                key={s.label}
                onClick={s.action}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-colors group"
                whileHover={cardHover}
                whileTap={cardTap}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* â•â•â• CTA CARD â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 shadow-lg">
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-primary-foreground mb-1">
                Agende o prÃ³ximo cuidado do seu pet
              </h2>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Banho, tosa e muito carinho para seu melhor amigo.
              </p>
              <Button
                size="sm"
                className="bg-background text-foreground hover:bg-background/90 font-semibold"
                onClick={() => { navigate('/'); setTimeout(() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' }), 400); }}
              >
                Agendar agora <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
            {/* Decorative pet illustration */}
            <img
              src={heroDog}
              alt=""
              className="absolute -right-4 -bottom-4 w-32 h-32 object-contain opacity-20 pointer-events-none"
            />
          </div>
        </motion.div>

        {/* â•â•â• UPCOMING APPOINTMENTS â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> PrÃ³ximos agendamentos
            </h2>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Nenhum agendamento prÃ³ximo</p>
              <Button size="sm" variant="outline" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' }), 400); }}>
                Agendar agora
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map(apt => {
                const sc = getStatusConfig(apt.status);
                return (
                  <div key={apt.id} className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${sc.className}`}>
                          {sc.emoji} {sc.label}
                        </span>
                        <h4 className="font-semibold text-foreground text-sm">{apt.service}</h4>
                        <p className="text-xs text-muted-foreground">ðŸ¾ {apt.petName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(apt.date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time}</span>
                        </div>
                      </div>
                    </div>
                    {(apt.status === 'pendente' || apt.status === 'confirmado') && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        {apt.status === 'pendente' && (
                          <Button variant="outline" size="sm" className="flex-1 text-xs text-emerald-600 border-emerald-400" onClick={() => handleConfirmWA(apt)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleAlter(apt)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Alterar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive" onClick={() => handleCancelClick(apt)}>
                          <X className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* â•â•â• MY PETS â•â•â• */}
        <motion.div variants={itemAnim} id="section-pets" className="px-4 py-3 max-w-2xl mx-auto scroll-mt-20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Dog className="w-4 h-4 text-secondary" /> Meus Pets
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => { setPetForm({ name: '', size: 'medio', breed: '' }); setIsAddingPet(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo pet
            </Button>
          </div>
          {user?.pets && user.pets.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {user.pets.map((pet, i) => (
                <motion.div
                  key={pet.id}
                  className="flex-shrink-0 w-[140px] bg-card rounded-2xl border border-border p-4 text-center group relative"
                  whileHover={cardHover}
                  whileTap={cardTap}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                >
                  <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                    {pet.photo_url ? (
                      <OptimizedImage src={pet.photo_url} alt={pet.name} className="w-full h-full" showSkeleton={false} />
                    ) : (
                      <Dog className="w-7 h-7 text-secondary" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm truncate">{pet.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{pet.breed || getSizeLabel(pet.size)}</p>
                  {/* Edit overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => startEditPet(pet)} className="p-1 rounded-md bg-muted/80 hover:bg-muted">
                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {/* Add pet card */}
              <button
                onClick={() => { setPetForm({ name: '', size: 'medio', breed: '' }); setIsAddingPet(true); }}
                className="flex-shrink-0 w-[140px] bg-muted/30 rounded-2xl border border-dashed border-border p-4 text-center flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Adicionar</span>
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Dog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">VocÃª ainda nÃ£o cadastrou um pet</p>
              <Button size="sm" variant="outline" onClick={() => { setPetForm({ name: '', size: 'medio', breed: '' }); setIsAddingPet(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar pet
              </Button>
            </div>
          )}
        </motion.div>

        {/* â•â•â• PET CARE ALERTS â•â•â• */}
        {petCareAlerts.length > 0 && (
          <motion.div variants={itemAnim} className="px-4 py-1 max-w-2xl mx-auto">
            <div className="space-y-2">
              {petCareAlerts.map(alert => (
                <div key={alert.pet.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {alert.pet.name} {alert.daysSince !== null ? `estÃ¡ hÃ¡ ${alert.daysSince} dias sem atendimento` : 'ainda nÃ£o teve atendimento'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Que tal agendar um cuidado? ðŸ¾</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    onClick={() => { navigate('/'); setTimeout(() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' }), 400); }}
                  >
                    Agendar
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {/* â•â•â• RECOMMENDED SERVICES â•â•â• */}
        {recommendedServices.length > 0 && (
          <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Recomendado para vocÃª
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {recommendedServices.map((svc, i) => (
                <motion.button
                  key={svc.id}
                  onClick={() => { navigate('/'); setTimeout(() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' }), 400); }}
                  className="flex-shrink-0 w-[160px] bg-card rounded-2xl border border-border p-4 text-left hover:bg-muted/30 transition-colors group"
                  whileHover={cardHover}
                  whileTap={cardTap}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm truncate">{svc.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{svc.category}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-foreground">4.9</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* â•â•â• APPOINTMENT HISTORY â•â•â• */}
        {pastAppointments.length > 0 && (
          <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
            <h2 className="text-base font-semibold text-foreground mb-3">HistÃ³rico</h2>
            <div className="space-y-2">
              {pastAppointments.slice(0, 5).map(apt => {
                const sc = getStatusConfig(apt.status);
                return (
                  <div key={apt.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.className}`}>{sc.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{apt.service}</p>
                        <p className="text-xs text-muted-foreground">{apt.petName} â€¢ {formatDateShort(apt.date)}</p>
                      </div>
                    </div>
                    {apt.status === 'realizado' && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleDoubt(apt)}>
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* â•â•â• NOTIFICATIONS â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
          <NotificationPreferences userId={user?.id} />
        </motion.div>

        {/* â•â•â• WHATSAPP CONTACT â•â•â• */}
        <motion.div variants={itemAnim} className="px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => openPetshopWhatsApp('OlÃ¡! Gostaria de tirar uma dÃºvida sobre os serviÃ§os do PetCÃ£o.')}
            className="w-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Falar com o petshop</p>
              <p className="text-xs text-muted-foreground">Tire dÃºvidas pelo WhatsApp</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </motion.div>

        {/* â•â•â• EDIT PROFILE MODAL â•â•â• */}
        <ResponsiveModal open={isEditingProfile} onOpenChange={setIsEditingProfile} title="Editar Perfil" maxWidth="max-w-sm">
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="h-12 rounded-xl text-base" /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="h-12 rounded-xl text-base" /></div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleProfileSave}><Check className="w-4 h-4 mr-1" /> Salvar</Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
            </div>
          </div>
        </ResponsiveModal>
      </motion.main>

      {/* Add Pet Modal */}
      <ResponsiveModal open={isAddingPet} onOpenChange={setIsAddingPet} title="Adicionar Novo Pet" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome do Pet</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} placeholder="Ex: Rex" className="h-12 rounded-xl text-base" /></div>
          <div className="space-y-2"><Label>Porte</Label><Select value={petForm.size} onValueChange={(v) => setPetForm({ ...petForm, size: v })}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pequeno">Pequeno</SelectItem><SelectItem value="medio">MÃ©dio</SelectItem><SelectItem value="grande">Grande</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>RaÃ§a</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} placeholder="Ex: SRD, Labrador..." className="h-12 rounded-xl text-base" /></div>
          <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={handleAddPet} disabled={!petForm.name || !petForm.breed}><Plus className="w-4 h-4 mr-1" /> Adicionar Pet</Button>
        </div>
      </ResponsiveModal>

      {/* Edit Pet Modal */}
      <ResponsiveModal open={editPetModalOpen} onOpenChange={(v) => { setEditPetModalOpen(v); if (!v) setEditingPetId(null); }} title="Editar Pet" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome do Pet</Label><Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} className="h-12 rounded-xl text-base" /></div>
          <div className="space-y-2"><Label>Porte</Label><Select value={petForm.size} onValueChange={(v) => setPetForm({ ...petForm, size: v })}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pequeno">Pequeno</SelectItem><SelectItem value="medio">MÃ©dio</SelectItem><SelectItem value="grande">Grande</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>RaÃ§a</Label><Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} className="h-12 rounded-xl text-base" /></div>
          <Button className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => { if (editingPetId) { handleEditPetSave(editingPetId); setEditPetModalOpen(false); } }}><Check className="w-4 h-4 mr-1" /> Salvar</Button>
          <Button variant="outline" className="w-full h-10 rounded-xl text-sm text-destructive hover:text-destructive" onClick={() => { if (editingPetId) { handleRemovePet(editingPetId); setEditPetModalOpen(false); } }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover pet
          </Button>
        </div>
      </ResponsiveModal>

      {/* Cancel Modal */}
      <ResponsiveModal open={cancelModalOpen} onOpenChange={setCancelModalOpen} title="Cancelar Agendamento" maxWidth="max-w-sm">
        <div className="space-y-4">
          {cancelTarget && (
            <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-0.5">
              <p><span className="font-medium">ServiÃ§o:</span> {cancelTarget.service}</p>
              <p><span className="font-medium">Pet:</span> {cancelTarget.petName}</p>
              <p><span className="font-medium">Data:</span> {cancelTarget.date} Ã s {cancelTarget.time}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Qual o motivo do cancelamento?</Label>
            <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
              {CANCEL_REASONS.map(reason => (
                <div key={reason} className="flex items-center gap-2"><RadioGroupItem value={reason} id={reason} /><Label htmlFor={reason} className="text-sm cursor-pointer">{reason}</Label></div>
              ))}
              <div className="flex items-center gap-2"><RadioGroupItem value="outro" id="outro" /><Label htmlFor="outro" className="text-sm cursor-pointer">Outro</Label></div>
            </RadioGroup>
            {cancelReason === 'outro' && <Input placeholder="Descreva o motivo..." value={cancelOther} onChange={(e) => setCancelOther(e.target.value)} className="mt-2 h-12 rounded-xl text-base" />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelModalOpen(false)}>Voltar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancelConfirm} disabled={!cancelReason || (cancelReason === 'outro' && !cancelOther)}>Confirmar</Button>
          </div>
        </div>
      </ResponsiveModal>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
}

/* â”€â”€â”€ Notification Preferences Component â”€â”€â”€ */
function NotificationPreferences({ userId }: { userId?: string }) {
  const [prefs, setPrefs] = useState({
    notifications_enabled: true,
    notify_agendamentos: true,
    notify_fotos_avaliacoes: true,
    notify_pacotes: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs(p => ({ ...p, notifications_enabled: data.notifications_enabled ?? true }));
        }
        setLoaded(true);
      });
  }, [userId]);

  const updatePref = async (key: string, value: boolean) => {
    setPrefs(p => ({ ...p, [key]: value }));
    if (!userId) return;
    if (key === 'notifications_enabled') {
      await supabase.from('profiles').update({ notifications_enabled: value } as any).eq('user_id', userId);
    }
    toast.success(value ? 'PreferÃªncia ativada' : 'PreferÃªncia desativada');
  };

  const items = [
    { key: 'notifications_enabled', label: 'Receber notificaÃ§Ãµes', desc: 'Ativa ou desativa todas', icon: Bell },
    { key: 'notify_agendamentos', label: 'Agendamentos', desc: 'ConfirmaÃ§Ãµes e alteraÃ§Ãµes', icon: CalendarDays },
    { key: 'notify_fotos_avaliacoes', label: 'Fotos e avaliaÃ§Ãµes', desc: 'AprovaÃ§Ãµes de conteÃºdo', icon: Camera },
    { key: 'notify_pacotes', label: 'Pacotes', desc: 'AtivaÃ§Ã£o e vencimento', icon: Package },
  ];

  if (!loaded) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" /> NotificaÃ§Ãµes
      </h3>
      <div className="space-y-1">
        {items.map(item => {
          const Icon = item.icon;
          const isMain = item.key === 'notifications_enabled';
          const disabled = !isMain && !prefs.notifications_enabled;
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between py-3 px-1 ${!isMain ? 'border-t border-border/50' : ''} ${disabled ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch
                checked={(prefs as any)[item.key]}
                onCheckedChange={v => updatePref(item.key, v)}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
