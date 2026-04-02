import { useEffect, useState } from 'react';
import { X, Home, Scissors, DollarSign, CalendarDays, PawPrint, Star, MapPin, User, Settings, ChevronRight, LogOut, Sun, Moon, Camera, Clock, Wrench } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import logoPetDefault from '@/assets/logopet.png';
import { useTestModes } from '@/contexts/TestModesContext';

interface MobileDrawerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

const exploreItems = [
  { id: 'servicos', icon: Scissors, label: 'Serviços' },
  { id: 'valores', icon: DollarSign, label: 'Valores' },
  { id: 'fotos', icon: Camera, label: 'Galeria' },
  { id: 'avaliacoes', icon: Star, label: 'Depoimentos' },
  { id: 'localizacao', icon: MapPin, label: 'Localização' },
];

const accountItems = [
  { id: 'meus-dados', icon: User, label: 'Meus Dados' },
  { id: 'meus-pets', icon: PawPrint, label: 'Meus Pets' },
  { id: 'agenda', icon: CalendarDays, label: 'Minha Agenda' },
];

export function MobileDrawerMenu({ open, onOpenChange, onOpenLogin }: MobileDrawerMenuProps) {
  const { isAuthenticated, user, logout, canAccessDashboard, canModerate, isDev, appointments } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  const logoSrc = branding.logoUrl || logoPetDefault;
  const { clientModeActive } = useTestModes();
  const showAdmin = isAuthenticated && !clientModeActive && (canAccessDashboard() || canModerate());

  // Animation control
  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  const close = () => onOpenChange(false);

  // Next appointment badge
  const nextAppointment = (() => {
    if (!isAuthenticated || !appointments?.length) return null;
    const now = new Date();
    const upcoming = appointments
      .filter(a => {
        if (a.status === 'cancelado' || a.status === 'realizado') return false;
        const d = new Date(`${a.date}T${a.time}`);
        return d >= now;
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    return upcoming[0] || null;
  })();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const scrollTo = (id: string) => {
    close();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Try navigating to home first then scrolling
        navigate('/');
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }, 320);
  };

  const handleAccountItem = (id: string) => {
    if (!isAuthenticated) {
      close();
      navigate('/auth/login');
      return;
    }
    if (id === 'meus-dados' || id === 'meus-pets') {
      close();
      navigate('/perfil');
    } else if (id === 'agenda') {
      close();
      navigate('/perfil');
    }
  };

  const handleAdmin = () => {
    close();
    if (canAccessDashboard()) navigate('/admin/dashboard');
    else if (canModerate()) navigate('/admin/moderacao');
  };

  const handleLogout = () => {
    close();
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    close();
    navigate('/perfil');
  };

  const primaryPet = (() => {
    if (!user?.pets?.length) return null;
    const pid = (user as any)?.primaryPetId;
    if (pid) return user.pets.find(p => p.id === pid) || user.pets[0];
    return user.pets[0];
  })();

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${animating ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Full-screen iOS panel */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-out ${animating ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ backgroundColor: theme === 'dark' ? 'hsl(var(--background))' : '#F2F2F7' }}
      >
        <div className="h-full overflow-y-auto overscroll-contain pb-safe">
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-4 pb-2" style={{ backgroundColor: theme === 'dark' ? 'hsl(var(--background))' : '#F2F2F7' }}>
            <span className="text-lg font-bold text-foreground">Menu</span>
            <button
              onClick={close}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Profile card — premium */}
          <div className="mx-4 mt-2 rounded-2xl bg-card border border-border overflow-hidden">
            {/* Gradient header strip */}
            <div className="h-16 bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/10 relative">
              <div className="absolute -bottom-7 left-5">
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden bg-card border-[3px] border-card shadow-lg flex items-center justify-center">
                  {isAuthenticated && user?.avatarUrl ? (
                    <OptimizedImage src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" aspectRatio="square" />
                  ) : (
                    <OptimizedImage src={logoSrc} alt="Logo" className="w-8 h-8 object-contain" showSkeleton={false} />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-10 px-5 pb-4">
              {isAuthenticated && user ? (
                <>
                  <p className="text-[15px] font-bold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.phone}</p>
                  {primaryPet && (
                    <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15">
                      <span className="text-[11px] font-medium text-primary">🐾 {primaryPet.name}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[15px] font-bold text-foreground">Olá! 👋</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    Faça login para agendar e acompanhar seus pets
                  </p>
                </>
              )}

              {/* Next appointment badge */}
              {isAuthenticated && nextAppointment && (() => {
                const statusConfig: Record<string, { label: string; className: string }> = {
                  pendente: { label: '🟡 Pendente', className: 'bg-warning/15 text-warning' },
                  confirmado: { label: '🟢 Confirmado', className: 'bg-success/15 text-[hsl(var(--success))]' },
                  remarcado: { label: '🔵 Remarcado', className: 'bg-primary/15 text-primary' },
                };
                const sc = statusConfig[nextAppointment.status] || statusConfig['pendente'];
                return (
                  <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Próximo agendamento</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.className}`}>{sc.label}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{nextAppointment.service}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(nextAppointment.date)} às {nextAppointment.time} • {nextAppointment.petName}</p>
                  </div>
                );
              })()}

              {isAuthenticated && !nextAppointment && (
                <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Sem agendamentos próximos</span>
                  </div>
                </div>
              )}

              <div className="mt-3">
                {isAuthenticated ? (
                  <button
                    onClick={handleEditProfile}
                    className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium text-foreground active:opacity-70 transition-all"
                  >
                    Área do Cliente
                  </button>
                ) : (
                  <Button
                    className="w-full rounded-xl h-11"
                    onClick={() => { close(); navigate('/auth/login'); }}
                  >
                    Entrar / Criar conta
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* CONTA section */}
          {isAuthenticated && (
            <>
              <SectionTitle>Conta</SectionTitle>
              <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden">
                {accountItems.map((item, i) => (
                  <MenuItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => handleAccountItem(item.id)}
                    showDivider={i < accountItems.length - 1}
                  />
                ))}
              </div>
            </>
          )}

          {/* EXPLORAR section */}
          <SectionTitle>Explorar</SectionTitle>
          <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden">
            <MenuItem icon={Home} label="Início" onClick={() => scrollTo('inicio')} showDivider />
            {exploreItems.map((item, i) => (
              <MenuItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                onClick={() => scrollTo(item.id)}
                showDivider={i < exploreItems.length - 1}
              />
            ))}
          </div>

          {/* SISTEMA section */}
          <SectionTitle>Sistema</SectionTitle>
          <div className="mx-4 rounded-2xl bg-card border border-border overflow-hidden">
            {/* Dark mode toggle */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm font-medium text-foreground">Modo Escuro</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              />
            </div>

            {showAdmin && (
              <>
                <div className="mx-4 h-px bg-border" />
                <MenuItem icon={Settings} label="Painel Admin" onClick={handleAdmin} showDivider={false} iconBg="bg-secondary/15" iconColor="text-secondary" />
              </>
            )}

            {isAuthenticated && !clientModeActive && isDev() && (
              <>
                <div className="mx-4 h-px bg-border" />
                <MenuItem icon={Wrench} label="Painel Dev" onClick={() => { close(); navigate('/admin/devtools'); }} showDivider={false} iconBg="bg-amber-500/15" iconColor="text-amber-600 dark:text-amber-400" />
              </>
            )}
          </div>

          {/* Logout */}
          {isAuthenticated && (
            <div className="mx-4 mt-6 mb-8">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-card border border-border text-destructive text-sm font-medium active:opacity-70 transition-opacity flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="px-8 pt-6 pb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {children}
    </p>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  showDivider,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}: {
  icon: typeof Home;
  label: string;
  onClick: () => void;
  showDivider: boolean;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[48px] active:bg-muted/60 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="flex-1 text-left text-sm font-medium text-foreground">{label}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
      </button>
      {showDivider && <div className="ml-16 mr-4 h-px bg-border" />}
    </>
  );
}
