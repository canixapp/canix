import { useState, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Package, Plus, XCircle, Search, Phone, Calendar as CalendarIcon,
  RefreshCw, Eye, CalendarPlus, CheckCircle2, Sparkles, Users, PauseCircle
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const emptyPet = { name: '', size: '', breed: '' };

export default function Pacotes() {
  const {
    adminPackages, createCustomerPackage, toggleAdminPackageStatus, updateAdminPackage,
    addPreAgendamento, clientProfiles, packageTypes
  } = useAdmin();

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneLookupDone, setPhoneLookupDone] = useState(false);
  const [foundTutor, setFoundTutor] = useState<any>(null);
  const [ownerName, setOwnerName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [isAddingNewPet, setIsAddingNewPet] = useState(false);
  const [newPets, setNewPets] = useState<{ name: string; size: string; breed: string }[]>([{ ...emptyPet }]);
  const [packageType, setPackageType] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [observation, setObservation] = useState('');

  // Detail/edit modal
  const [detailPkg, setDetailPkg] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editObs, setEditObs] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

  // Schedule next day modal
  const [schedulePackage, setSchedulePackage] = useState<any>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedService, setSchedService] = useState('Banho do Pacote');

  // Filter
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ATIVO' | 'DESATIVADO'>('todos');

  const filtered = useMemo(() => {
    if (statusFilter === 'todos') return adminPackages;
    return adminPackages.filter(p => p.status === statusFilter);
  }, [adminPackages, statusFilter]);

  const activeCount = adminPackages.filter(p => p.status === 'ATIVO').length;
  const inactiveCount = adminPackages.filter(p => p.status === 'DESATIVADO').length;

  // Phone lookup
  const handlePhoneLookup = () => {
    const tutor = clientProfiles.find(p => p.phone?.replace(/\D/g, '') === phone.replace(/\D/g, ''));
    if (tutor) {
      setFoundTutor(tutor);
      setOwnerName(tutor.name);
      setSelectedPetId((tutor as any).pets?.[0]?.id || '');
      setIsAddingNewPet(false);
      setNewPets([{ ...emptyPet }]);
    } else {
      setFoundTutor(null);
      setOwnerName('');
      setSelectedPetId('');
      setNewPets([{ ...emptyPet }]);
    }
    setPhoneLookupDone(true);
  };

  const resetModal = () => {
    setPhone('');
    setPhoneLookupDone(false);
    setFoundTutor(null);
    setOwnerName('');
    setSelectedPetId('');
    setIsAddingNewPet(false);
    setNewPets([{ ...emptyPet }]);
    setPackageType('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setObservation('');
  };

  const handleActivate = () => {
    if (!phone || !packageType) {
      toast.error('Preencha telefone e tipo de pacote');
      return;
    }
    if (!foundTutor) {
      toast.error('Por favor, cadastre o cliente antes de criar um pacote.');
      return;
    }
    createCustomerPackage({
      customer_id: foundTutor.user_id,
      package_id: packageType,
      pet_id: selectedPetId,
      start_date: startDate || new Date().toISOString().split('T')[0],
      observation,
    });
    toast.success('Pacote ativado com sucesso!');
    setAddOpen(false);
    resetModal();
  };

  const getNextDate = (pkg: any) => {
    try {
      const start = new Date(pkg.start_date);
      const days = 7;
      const today = new Date();
      let next = new Date(start);
      while (next < today) next = addDays(next, days);
      return format(next, 'dd/MM/yyyy');
    } catch { return '—'; }
  };

  const getNextDateISO = (pkg: any) => {
    try {
      const start = new Date(pkg.start_date);
      const days = 7;
      const today = new Date();
      let next = new Date(start);
      while (next < today) next = addDays(next, days);
      return next.toISOString().split('T')[0];
    } catch { return new Date().toISOString().split('T')[0]; }
  };

  const openScheduleModal = (pkg: any) => {
    setSchedulePackage(pkg);
    setSchedDate(getNextDateISO(pkg));
    setSchedTime('');
    setSchedService('Banho do Pacote');
  };

  const handleScheduleConfirm = () => {
    if (!schedulePackage || !schedDate || !schedTime) {
      toast.error('Preencha data e horário');
      return;
    }
    addPreAgendamento({
      customer_id: schedulePackage.customer_id,
      service_name: schedService || 'Banho do Pacote',
      date: schedDate,
      time: schedTime,
      price: 0,
      origin: 'pacote',
      pets: [{ pet_id: schedulePackage.pet_id, pet_name: 'Pet do Pacote' }]
    });
    toast.success('Agendamento do pacote criado!');
    setSchedulePackage(null);
  };

  const openDetail = (pkg: any) => {
    setDetailPkg(pkg);
    setEditMode(false);
    setEditObs(pkg.observation);
    setEditStartDate(pkg.start_date);
  };

  // ─── Stats ───
  const stats = [
    { label: 'Total', value: adminPackages.length, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Ativos', value: activeCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: activeCount > 0 },
    { label: 'Desativados', value: inactiveCount, icon: PauseCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Clientes', value: new Set(adminPackages.map(p => p.customer_id)).size, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  // ─── Filter Chips ───
  const filterOptions = [
    { label: 'Todos', value: 'todos' as const },
    { label: 'Ativos', value: 'ATIVO' as const },
    { label: 'Desativados', value: 'DESATIVADO' as const },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Premium Header ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Pacotes de Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie os pacotes recorrentes dos clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20 rounded-xl flex-1 sm:flex-none">
            <Plus className="w-4 h-4" /> Ativar Pacote
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn(
              "border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl transition-all h-full",
              s.glow && "ring-1 ring-emerald-500/20 border-emerald-500/20"
            )}>
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-1.5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map(o => (
          <button
            key={o.value}
            onClick={() => setStatusFilter(o.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all duration-200',
              statusFilter === o.value
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-muted/50 backdrop-blur-sm text-muted-foreground border-border/30 hover:border-primary/40 hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground font-medium tabular-nums self-center">
          {filtered.length} pacote(s)
        </span>
      </div>

      {/* ── Package Cards ── */}
      <div className="space-y-3">
        {filtered.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <Card className="border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  {/* Top row: info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            Cliente: {pkg.customer_id.substring(0, 8)}...
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold',
                            pkg.status === 'ATIVO'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border/30'
                          )}
                        >
                          {pkg.status === 'ATIVO' ? 'Ativo' : 'Desativado'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> Início: {pkg.start_date}
                        </span>
                        {pkg.status === 'ATIVO' && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <RefreshCw className="w-3 h-3" /> Próxima: {getNextDate(pkg)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap border-t border-border/20 pt-3">
                    {pkg.status === 'ATIVO' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-xs h-8"
                        onClick={() => openScheduleModal(pkg)}
                      >
                        <CalendarPlus className="w-3.5 h-3.5" /> Agendar
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={() => openDetail(pkg)}>
                      <Eye className="w-3.5 h-3.5" /> Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-xl gap-1.5 text-xs h-8 ml-auto",
                        pkg.status === 'ATIVO' ? 'text-destructive hover:text-destructive' : 'text-emerald-600 hover:text-emerald-700'
                      )}
                      onClick={() => toggleAdminPackageStatus(pkg.id)}
                    >
                      {pkg.status === 'ATIVO' ? (
                        <><XCircle className="w-3.5 h-3.5" /> Desativar</>
                      ) : (
                        <><RefreshCw className="w-3.5 h-3.5" /> Reativar</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nenhum pacote encontrado</p>
            <p className="text-xs text-muted-foreground/60">Clique em "Ativar Pacote" para começar.</p>
          </div>
        )}
      </div>

      {/* ── Add Package Dialog ── */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ativar Pacote para Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Telefone do Cliente *</Label>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setPhoneLookupDone(false); setFoundTutor(null); }}
                  placeholder="Ex: 11999998888"
                  className="h-9 text-sm flex-1"
                  onKeyDown={e => e.key === 'Enter' && handlePhoneLookup()}
                />
                <Button type="button" size="sm" className="h-9" onClick={handlePhoneLookup} disabled={!phone.replace(/\D/g, '')}>
                  <Search className="w-4 h-4 mr-1" /> Buscar
                </Button>
              </div>
            </div>

            {phoneLookupDone && foundTutor && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Cliente encontrado: {foundTutor.name}
                </div>
                <div className="space-y-2">
                  <Label>Selecione o Pacote</Label>
                  <Select value={packageType} onValueChange={setPackageType}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {packageTypes.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Selecione o Pet</Label>
                  <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {foundTutor.pets?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleActivate} className="w-full rounded-xl shadow-lg shadow-primary/20">
                  Ativar Pacote
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
