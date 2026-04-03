import { useState, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { Search, MessageCircle, Eye, Phone, PawPrint, Trash2, Users, CalendarDays, ShieldCheck, Clock, Package, ChevronRight, UserPlus, Activity, UserX, Filter, X } from 'lucide-react';
import { DeleteClientModal } from '@/components/modals/DeleteClientModal';
import { PreRegisterClientModal } from '@/components/modals/PreRegisterClientModal';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedClient {
  id: string; phone: string; name: string; email: string;
  createdAt: string | null;
  pets: { id: string; name: string; size: string; breed: string }[];
  petCount: number; activePackage: { type: string } | null;
  lastAppointmentDate: string | null;
  appointmentHistory: { date: string; time: string; service: string; petName: string; status: string }[];
  lgpdAccepted?: boolean;
  lgpdAcceptedAt?: string | null;
}

type FilterStatus = 'todos' | 'novo' | 'ativo' | 'vip' | 'inativo';
type FilterPackage = 'todos' | 'sem' | 'com';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function getClientStatus(client: UnifiedClient): 'novo' | 'ativo' | 'vip' | 'inativo' {
  const now = Date.now();
  if (client.createdAt) {
    const created = new Date(client.createdAt).getTime();
    if (now - created <= FOURTEEN_DAYS_MS) return 'novo';
  }
  // VIP: 10+ completed appointments
  const completedCount = client.appointmentHistory.filter(a => a.status === 'realizado').length;
  if (completedCount >= 10) return 'vip';

  if (client.lastAppointmentDate) {
    const last = new Date(client.lastAppointmentDate + 'T00:00:00').getTime();
    if (now - last <= SIXTY_DAYS_MS) return 'ativo';
  }
  return 'inativo';
}

const STATUS_CONFIG = {
  novo: {
    label: 'Novo',
    bg: 'bg-primary/10 dark:bg-primary/15',
    text: 'text-primary',
    border: 'border-primary/20',
    dot: 'bg-primary',
    icon: UserPlus,
    gradient: 'from-primary/20 to-primary/5',
  },
  ativo: {
    label: 'Ativo',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
    icon: Activity,
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  vip: {
    label: 'VIP',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    icon: Activity,
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  inativo: {
    label: 'Inativo',
    bg: 'bg-muted/60',
    text: 'text-muted-foreground',
    border: 'border-border',
    dot: 'bg-muted-foreground/40',
    icon: UserX,
    gradient: 'from-muted/50 to-muted/20',
  },
};

import { cardAnimProps as cardAnim } from '@/lib/animations';

export default function Clientes() {
  const { tutors, appointments, adminPackages, refreshClients } = useAdmin();
  const { isDev } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<UnifiedClient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [preRegisterOpen, setPreRegisterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterPackage, setFilterPackage] = useState<FilterPackage>('todos');

  const clients = useMemo<UnifiedClient[]>(() => {
    const clientMap = new Map<string, UnifiedClient>();
    
    tutors.forEach(t => {
      const phone = t.phone?.replace(/\D/g, '') || '';
      const id = t.user_id;
      clientMap.set(id, {
        id, phone, name: t.name, email: '',
        createdAt: t.created_at || null,
        pets: t.pets?.map(p => ({ id: p.id, name: p.name, size: p.size || '', breed: p.breed || '' })) || [],
        petCount: t.pets?.length || 0,
        activePackage: null, lastAppointmentDate: null, appointmentHistory: [],
        lgpdAccepted: t.lgpd_accepted || false,
        lgpdAcceptedAt: t.lgpd_accepted_at || null,
      });
    });

    appointments.forEach(a => {
      const clientId = a.customer_id;
      let client = clientMap.get(clientId);
      if (!client && a.customer_phone) {
        const phone = a.customer_phone.replace(/\D/g, '');
        const found = Array.from(clientMap.values()).find(c => c.phone === phone);
        if (found) client = found;
      }
      if (client) {
        client.appointmentHistory.push({
          date: a.date, time: a.time, service: a.service_name,
          petName: a.pets?.map(p => p.pet_name).join(', ') || '', status: a.status,
        });
      }
    });

    adminPackages.forEach(pkg => {
      const client = clientMap.get(pkg.customer_id);
      if (client && pkg.status === 'ATIVO') client.activePackage = { type: 'Pacote Ativo' };
    });

    clientMap.forEach(c => {
      c.appointmentHistory.sort((a, b) => b.date.localeCompare(a.date));
      c.lastAppointmentDate = c.appointmentHistory[0]?.date || null;
    });

    return Array.from(clientMap.values());
  }, [tutors, appointments, adminPackages]);

  const filtered = useMemo(() => {
    let result = clients;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '')));
    }
    if (filterStatus !== 'todos') result = result.filter(c => getClientStatus(c) === filterStatus);
    if (filterPackage !== 'todos') {
      result = result.filter(c => filterPackage === 'sem' ? !c.activePackage : !!c.activePackage);
    }
    return result;
  }, [clients, search, filterStatus, filterPackage]);

  const formatPhone = (phone: string) => {
    if (phone.length === 11) return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    return phone;
  };

  const formatDate = (d: string) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };
  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const openWhatsApp = (name: string, phone: string) => {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      // already has country code
    } else if (digits.length >= 10 && digits.length <= 11) {
      digits = `55${digits}`;
    }
    const msg = encodeURIComponent(`Olá, ${name}! Aqui é do PetCão. Como podemos ajudar?`);
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
  };

  const statusLabel: Record<string, string> = {
    pendente: 'Pendente', confirmado: 'Confirmado', realizado: 'Concluído',
    cancelado: 'Cancelado', remarcado: 'Remarcado',
  };

  const stats = useMemo(() => {
    const total = clients.length;
    const novo = clients.filter(c => getClientStatus(c) === 'novo').length;
    const ativo = clients.filter(c => getClientStatus(c) === 'ativo').length;
    const vip = clients.filter(c => getClientStatus(c) === 'vip').length;
    const inativo = clients.filter(c => getClientStatus(c) === 'inativo').length;
    return { total, novo, ativo, vip, inativo };
  }, [clients]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const hasActiveFilters = filterStatus !== 'todos' || filterPackage !== 'todos';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua base de clientes</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 rounded-xl h-10 text-sm font-semibold"
            onClick={() => setPreRegisterOpen(true)}
          >
            <UserPlus className="w-4 h-4" /> Pré-cadastrar
          </Button>
          <Badge variant="outline" className="text-xs font-bold tabular-nums border-border/60 bg-card px-3 py-1.5 rounded-xl">
            {stats.total} clientes
          </Badge>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          { key: 'novo' as const, label: 'Novos', value: stats.novo, cfg: STATUS_CONFIG.novo, desc: 'Últimos 14 dias' },
          { key: 'ativo' as const, label: 'Ativos', value: stats.ativo, cfg: STATUS_CONFIG.ativo, desc: 'Com agendamentos' },
          { key: 'vip' as const, label: 'VIP', value: stats.vip, cfg: STATUS_CONFIG.vip, desc: '10+ atendimentos' },
          { key: 'inativo' as const, label: 'Inativos', value: stats.inativo, cfg: STATUS_CONFIG.inativo, desc: 'Sem agendamentos' },
        ]).map(({ key, label, value, cfg, desc }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilterStatus(filterStatus === key ? 'todos' : key)}
            className={`relative group rounded-2xl border p-4 sm:p-5 text-left transition-all duration-300 overflow-hidden ${
              filterStatus === key
                ? `bg-gradient-to-br ${cfg.gradient} ${cfg.border} border-2 shadow-lg`
                : 'bg-card/80 backdrop-blur-sm border-border/40 hover:border-border/80 hover:shadow-md'
            }`}
          >
            {/* Glow effect */}
            {filterStatus === key && (
              <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-50 blur-xl`} />
            )}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <cfg.icon className={`w-4 h-4 ${filterStatus === key ? cfg.text : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className={`text-3xl sm:text-4xl font-bold tabular-nums ${filterStatus === key ? cfg.text : 'text-foreground'}`}>
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1 hidden sm:block">{desc}</p>
            </div>
            {filterStatus === key && (
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Premium Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-12 sm:h-14 rounded-2xl border-border/40 bg-card/80 backdrop-blur-sm text-base placeholder:text-muted-foreground/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Pacote:</span>
          </div>
          {[
            { label: 'Todos', value: 'todos' as FilterPackage },
            { label: 'Com Pacote', value: 'com' as FilterPackage, icon: Package },
            { label: 'Sem Pacote', value: 'sem' as FilterPackage },
          ].map(o => (
            <button
              key={o.value}
              onClick={() => setFilterPackage(o.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${
                filterPackage === o.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-muted/50 backdrop-blur-sm text-muted-foreground border-border/30 hover:border-primary/40 hover:text-foreground hover:shadow-sm'
              }`}
            >
              {o.icon && <o.icon className="w-3 h-3" />}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> cliente{filtered.length !== 1 ? 's' : ''}
        </p>
        {hasActiveFilters && (
          <button
            onClick={() => { setFilterStatus('todos'); setFilterPackage('todos'); }}
            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Premium Client Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((client, i) => {
            const status = getClientStatus(client);
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={client.id}
                {...cardAnim}
                transition={{ ...cardAnim.transition, delay: i * 0.02 }}
                layout
              >
                <Card className="group border-border/30 bg-card/80 backdrop-blur-sm hover:border-border/60 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Status indicator bar */}
                      <div className={`w-1.5 shrink-0 bg-gradient-to-b ${cfg.gradient}`} />

                      <div className="flex-1 p-5">
                        <div className="flex items-start gap-4">
                          {/* Premium Avatar */}
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} border ${cfg.border} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-lg`}>
                            <span className={`text-base sm:text-lg font-bold ${cfg.text}`}>
                              {getInitials(client.name)}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Name + Status Row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="font-bold text-foreground text-base leading-tight truncate max-w-[180px] sm:max-w-none">
                                {client.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border} border shadow-sm`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              {client.activePackage && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-sm">
                                  <Package className="w-3 h-3" />
                                  Pacote
                                </span>
                              )}
                            </div>

                            {/* Info Row */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {client.phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span className="tabular-nums font-medium">{formatPhone(client.phone)}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <PawPrint className="w-3.5 h-3.5" />
                                <span className="font-medium">{client.petCount} pet{client.petCount !== 1 ? 's' : ''}</span>
                              </span>
                            </div>

                            {/* Last Appointment */}
                            <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {client.lastAppointmentDate ? `Último agendamento: ${formatDate(client.lastAppointmentDate)}` : 'Nunca agendou'}
                            </p>
                          </div>

                          {/* Desktop Action */}
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-muted/30 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 shrink-0 self-center border border-transparent hover:border-primary/20"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/20">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 text-xs gap-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 font-semibold px-4"
                            onClick={() => setSelectedClient(client)}
                          >
                            <Eye className="w-4 h-4" /> Detalhes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 text-xs gap-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 font-semibold px-4"
                            onClick={() => openWhatsApp(client.name, client.phone)}
                          >
                            <MessageCircle className="w-4 h-4" /> WhatsApp
                          </Button>
                          {isDev() && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold ml-auto"
                              onClick={() => setDeleteTarget({ id: client.id, name: client.name })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <motion.div {...cardAnim} className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Users className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <p className="text-base font-semibold text-muted-foreground">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Ajuste os filtros ou a busca</p>
          </motion.div>
        )}
      </div>

      {/* Details Modal (ResponsiveModal) */}
      {selectedClient && (() => {
        const status = getClientStatus(selectedClient);
        const cfg = STATUS_CONFIG[status];
        const StatusIcon = cfg.icon;
        return (
          <ResponsiveModal
            open={!!selectedClient}
            onOpenChange={open => { if (!open) setSelectedClient(null); }}
            title={selectedClient.name}
            description={cfg.label}
            maxWidth="max-w-xl"
            icon={
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} border ${cfg.border} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${cfg.text}`}>{getInitials(selectedClient.name)}</span>
              </div>
            }
            stickyFooter={
              <Button variant="outline" onClick={() => setSelectedClient(null)} className="w-full rounded-xl h-11 font-semibold">
                Fechar
              </Button>
            }
          >
            <div className="space-y-6">
              {/* Status badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>

              {/* Tutor info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dados do Tutor</h3>
                <div className="rounded-2xl border border-border/30 bg-muted/20 divide-y divide-border/20 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <span className="text-sm font-semibold text-foreground">{selectedClient.name}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{formatPhone(selectedClient.phone)}</span>
                  </div>
                  {selectedClient.email && (
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">E-mail</span>
                      <span className="text-sm font-semibold text-foreground">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.createdAt && (
                    <div className="flex justify-between items-center px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">Cadastro</span>
                      <span className="text-sm font-semibold text-foreground">{formatDateTime(selectedClient.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${cfg.bg} ${cfg.text} ${cfg.border} border shadow-sm`}>
                    <StatusIcon className="w-4 h-4" />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {status === 'novo' && '(cadastro há menos de 14 dias)'}
                    {status === 'ativo' && '(agendamento nos últimos 60 dias)'}
                    {status === 'inativo' && '(sem agendamentos nos últimos 60 dias)'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Último agendamento: {selectedClient.lastAppointmentDate ? formatDate(selectedClient.lastAppointmentDate) : 'Nunca agendou'}
                </p>
              </div>

              {/* LGPD */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> LGPD
                </h3>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold ${
                  selectedClient.lgpdAccepted
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {selectedClient.lgpdAccepted ? (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        Aceito {selectedClient.lgpdAcceptedAt ? `em ${formatDateTime(selectedClient.lgpdAcceptedAt)}` : ''}
                      </span>
                    </>
                  ) : (
                    <span>❌ Não aceito</span>
                  )}
                </div>
              </div>

              {/* Pets */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pets ({selectedClient.pets.length})</h3>
                {selectedClient.pets.length > 0 ? (
                  <div className="grid gap-2">
                    {selectedClient.pets.map(pet => (
                      <div key={pet.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/20 bg-muted/10">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm">
                          <PawPrint className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-foreground">{pet.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {pet.size && <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold">{pet.size}</Badge>}
                            {pet.breed && <span className="text-xs text-muted-foreground">{pet.breed}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/60 py-3">Nenhum pet cadastrado.</p>
                )}
              </div>

              {selectedClient.activePackage && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pacote</h3>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-sm">
                    <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedClient.activePackage.type}
                    </span>
                  </div>
                </div>
              )}

              {/* Appointment history */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Histórico de Agendamentos</h3>
                {selectedClient.appointmentHistory.length > 0 ? (
                  <div className="rounded-2xl border border-border/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-bold">Data</TableHead>
                          <TableHead className="text-xs font-bold">Hora</TableHead>
                          <TableHead className="text-xs font-bold">Serviço</TableHead>
                          <TableHead className="text-xs font-bold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClient.appointmentHistory.slice(0, 10).map((a, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="text-sm whitespace-nowrap tabular-nums font-medium">{formatDate(a.date)}</TableCell>
                            <TableCell className="text-sm tabular-nums">{a.time}</TableCell>
                            <TableCell className="text-sm">{a.service}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-semibold">
                                {statusLabel[a.status] || a.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/60 py-3">Nenhum agendamento registrado.</p>
                )}
              </div>
            </div>
          </ResponsiveModal>
        );
      })()}

      {deleteTarget && (
        <DeleteClientModal
          open={!!deleteTarget}
          onOpenChange={open => { if (!open) setDeleteTarget(null); }}
          clientName={deleteTarget.name}
          clientId={deleteTarget.id}
          onDeleted={() => { setDeleteTarget(null); refreshClients(); }}
        />
      )}

      <PreRegisterClientModal
        open={preRegisterOpen}
        onOpenChange={setPreRegisterOpen}
        onCreated={refreshClients}
      />
    </div>
  );
}
