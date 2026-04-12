import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useTestModes } from '@/contexts/TestModesContext';
import { useProAccess } from '@/hooks/useProAccess';
import {
  LayoutDashboard, CalendarDays, Package, Shield, Scissors,
  Settings, ArrowLeft, UserCheck, Wrench, PawPrint,
  ChevronsLeft, ChevronsRight, History, Monitor, ChevronDown,
  DollarSign, ShoppingBag, BarChart3, Bell, Megaphone, Crown, Lock
} from 'lucide-react';
import logoPetDefault from '@/assets/logopet.png';
import { useBranding } from '@/contexts/BrandingContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { usePageAccess } from '@/hooks/usePageAccess';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PageKey } from '@/hooks/usePageAccess';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ElementType;
  pageKey?: PageKey;
  roles?: string[];
  badge?: number;
  devOnly?: boolean;
  isDevTool?: boolean;
  isPro?: boolean;
  children?: SidebarItem[];
}

const MotionAside = motion.aside;

export function AdminSidebar({ collapsed, onToggle, mobile = false }: AdminSidebarProps) {
  const { user, isDev } = useAuth();
  const { plan } = usePetshop();
  const { appointments } = useAdmin();
  const { clientModeActive } = useTestModes();
  const { branding } = useBranding();
  const { canAccess } = usePageAccess();
  const { isProActive } = useProAccess();
  const location = useLocation();
  const navigateTo = useNavigate();
  const logoSrc = branding.logoUrl || logoPetDefault;
  const role = user?.role || 'cliente';
  const pendingCount = appointments.filter(a => a.status === 'pendente').length;

  const isCollapsed = mobile ? false : collapsed;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const isOnDevPage = location.pathname.startsWith('/admin/devtools') || location.pathname.startsWith('/dev-tools');
    return { dev: isOnDevPage };
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [proModal, setProModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const items: SidebarItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, pageKey: 'dashboard' },
    { path: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays, pageKey: 'agendamentos', badge: pendingCount },
    { path: '/admin/pacotes', label: 'Pacotes', icon: Package, pageKey: 'pacotes' },
    { path: '/admin/clientes', label: 'Clientes', icon: UserCheck, pageKey: 'clientes' },
    { path: '/admin/pets', label: 'Pets', icon: PawPrint, pageKey: 'pets' },
    { path: '/admin/servicos', label: 'Serviços e Valores', icon: Scissors, pageKey: 'servicos' },
    { path: '/admin/moderacao', label: 'Galeria e Avaliações', icon: Shield, pageKey: 'moderacao' },
    { path: '/admin/configuracoes', label: 'Configurações', icon: Settings, pageKey: 'configuracoes' },
    { path: '/admin/audit-log', label: 'Registro de Alterações', icon: History, pageKey: 'audit-log' },
  ];

  const proItems: SidebarItem[] = [
    { path: '/admin/financeiro', label: 'Financeiro', icon: DollarSign, pageKey: 'financeiro', isPro: true },
    { path: '/admin/estoque', label: 'Estoque', icon: ShoppingBag, pageKey: 'estoque', isPro: true },
    { path: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, pageKey: 'relatorios', isPro: true },
    { path: '/admin/lembretes', label: 'Lembretes Inteligentes', icon: Bell, pageKey: 'lembretes', isPro: true },
    { path: '/admin/marketing', label: 'Marketing', icon: Megaphone, pageKey: 'marketing', isPro: true },
  ];

  const devItem: SidebarItem = {
    path: '/admin/devtools',
    label: 'Painel Dev',
    icon: Wrench,
    devOnly: true,
    isDevTool: true,
    children: [
      { path: '/admin/devtools', label: 'Visão Geral', icon: Wrench, devOnly: true, isDevTool: true },
      { path: '/dev-tools', label: 'Super Dev Panel', icon: Monitor, devOnly: true, isDevTool: true },
    ],
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (item: SidebarItem) => {
    if (isActive(item.path)) return true;
    return item.children?.some(c => isActive(c.path)) ?? false;
  };

  const renderChildItem = (item: SidebarItem) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    const linkContent = (
      <NavLink
        to={item.path}
        className={cn(
          'group relative flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200',
          isCollapsed ? 'justify-center px-3 py-2.5' : 'pl-11 pr-3 py-2',
          active
            ? 'bg-sidebar-primary/80 text-sidebar-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.path}>{linkContent}</div>;
  };

  const handleProClick = (item: SidebarItem) => {
    if (isProActive && (plan.features?.includes(item.pageKey || '') || item.pageKey === 'dashboard' || item.pageKey === 'configuracoes')) {
      navigateTo(item.path);
    } else {
      setSelectedModule(item.label);
      window.dispatchEvent(new CustomEvent('pro-modal-change', { detail: true }));
      setProModal(true);
    }
  };

  const renderProItem = (item: SidebarItem) => {
    if (clientModeActive) return null;
    
    const isFixed = item.pageKey === 'dashboard' || item.pageKey === 'configuracoes';
    const hasFeature = plan.features?.includes(item.pageKey || '') || isFixed;
    const isPlanLocked = !hasFeature && user.role !== 'dev';
    
    const Icon = item.icon;
    const lockedByPro = !isProActive;

    const content = (
      <button
        onClick={() => handleProClick(item)}
        className={cn(
          'w-full group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
          isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5',
          isPlanLocked
            ? 'text-sidebar-foreground/30 hover:bg-sidebar-accent/30 opacity-60'
            : lockedByPro
              ? 'text-sidebar-foreground/40 hover:bg-sidebar-accent/50'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <motion.span
          className="shrink-0 flex items-center justify-center relative"
          animate={{ width: isCollapsed ? 20 : 16, height: isCollapsed ? 20 : 16 }}
        >
          <Icon className="w-full h-full" />
          {isPlanLocked && (
            <div className="absolute -top-1.5 -right-1.5 bg-sidebar p-0.5 rounded-full ring-2 ring-sidebar">
              <Lock className="w-2 h-2 text-muted-foreground" />
            </div>
          )}
        </motion.span>

        {!isCollapsed && (
          <motion.span className="truncate flex-1 text-left">
            {item.label}
          </motion.span>
        )}

        {!isCollapsed && (
          <span className="ml-auto shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter">
            {isPlanLocked ? (
              <span className="text-muted-foreground/40 flex items-center gap-1">
                <Lock size={10} /> Lock
              </span>
            ) : lockedByPro ? (
              <span className="text-amber-500 flex items-center gap-1">
                <Crown size={10} /> Upgrade
              </span>
            ) : (
              <Crown size={10} className="text-amber-500" />
            )}
          </span>
        )}
      </button>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-1.5">
            {item.label} {isPlanLocked ? <Lock size={10} /> : <Crown size={10} />}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.path}>{content}</div>;
  };

  const renderItem = (item: SidebarItem) => {
    if (item.devOnly && !isDev()) return null;
    if (clientModeActive && !item.devOnly) return null;
    if (item.pageKey && !canAccess(role, item.pageKey)) return null;

    const isFixed = item.pageKey === 'dashboard' || item.pageKey === 'configuracoes';
    const hasFeature = plan.features?.includes(item.pageKey || '') || isFixed;
    const isPlanLocked = !hasFeature && user.role !== 'dev';

    // Group with children
    if (item.children) {
      // ... same logic for groups if needed, but standard items are usually flat
    }

    const active = isActive(item.path);
    const Icon = item.icon;

    const content = (
      <div 
        onClick={() => isPlanLocked ? handleProClick(item) : null}
        className="w-full"
      >
        <NavLink
          to={isPlanLocked ? location.pathname : item.path}
          onClick={(e) => isPlanLocked && e.preventDefault()}
          className={cn(
            'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
            isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5',
            isPlanLocked
              ? 'text-sidebar-foreground/30 hover:bg-sidebar-accent/30 opacity-60 cursor-pointer'
              : active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <motion.span
            className="shrink-0 flex items-center justify-center relative"
            animate={{ width: isCollapsed ? 20 : 16, height: isCollapsed ? 20 : 16 }}
          >
            <Icon className="w-full h-full" />
            {isPlanLocked && (
              <div className="absolute -top-1.5 -right-1.5 bg-sidebar p-0.5 rounded-full ring-2 ring-sidebar">
                <Lock className="w-2 h-2 text-muted-foreground" />
              </div>
            )}
          </motion.span>

          {!isCollapsed && (
            <motion.span className="truncate">
              {item.label}
            </motion.span>
          )}

          {isPlanLocked && !isCollapsed && (
            <Lock size={12} className="ml-auto text-muted-foreground/40" />
          )}

          {item.badge && item.badge > 0 && !isPlanLocked && (
             <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
               {item.badge}
             </span>
          )}
        </NavLink>
      </div>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label} {isPlanLocked && <Lock size={10} className="inline ml-1" />}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.path}>{content}</div>;
  };

  const sidebarWidth = mobile ? '100%' : isCollapsed ? 72 : 256;

  return (
    <>
      <MotionAside
        className={cn(
          'flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden',
          mobile ? 'h-full' : 'h-full',
          !mobile && 'hidden lg:flex'
        )}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center border-b border-sidebar-border shrink-0',
          isCollapsed && !mobile ? 'flex-col gap-2 px-2 py-4' : 'gap-3 px-4 py-4'
        )}>
          <motion.img
            src={logoSrc}
            alt={branding.shopName}
            className="object-contain shrink-0 rounded-lg"
            animate={{ width: 40, height: 40 }}
            transition={{ duration: 0.2 }}
          />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                key="header-text"
                className="flex-1 min-w-0 overflow-hidden"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <h2 className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Painel Admin</h2>
                <p className="text-[11px] text-sidebar-foreground/50 truncate">Gestão do {branding.shopName}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!mobile && (
            <motion.button
              onClick={onToggle}
              className={cn(
                'shrink-0 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
                isCollapsed && 'mt-1'
              )}
              title={isCollapsed ? 'Expandir (Ctrl+B)' : 'Recolher (Ctrl+B)'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
              </motion.div>
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 overflow-y-auto py-3 space-y-1',
          isCollapsed && !mobile ? 'px-2' : 'px-3'
        )}>
          {items.map(renderItem)}

          {proItems.map(renderProItem)}

          {/* Dev tools */}
          {isDev() && renderItem(devItem)}
        </nav>

        {/* Footer — Back to site */}
        <div className={cn(
          'border-t border-sidebar-border shrink-0',
          isCollapsed && !mobile ? 'px-2 py-3' : 'px-3 py-3'
        )}>
          {isCollapsed && !mobile ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to="/"
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">Voltar ao site</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao site
            </NavLink>
          )}
        </div>
      </MotionAside>

      {/* PRO Upsell Modal — z-[300] to sit above Sheet (z-50) and TestModeIndicator (z-[200]) */}
      <AnimatePresence>
        {proModal && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setProModal(false); window.dispatchEvent(new CustomEvent('pro-modal-change', { detail: false })); }}
          >
            <motion.div
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {selectedModule ? `Desbloqueie o módulo: ${selectedModule}` : 'Desbloqueie recursos avançados'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedModule 
                    ? `O recurso de "${selectedModule}" está disponível apenas para parceiros com licenciamento avançado. Faça o upgrade agora para profissionalizar sua operação.`
                    : 'Este módulo está disponível apenas para parceiros com licenciamento avançado. Faça upgrade para acessar Financeiro, Estoque, Relatórios e Marketing.'
                  }
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button onClick={() => { setProModal(false); window.dispatchEvent(new CustomEvent('pro-modal-change', { detail: false })); }} className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">
                    Fechar
                  </button>
                  <button onClick={() => { setProModal(false); window.dispatchEvent(new CustomEvent('pro-modal-change', { detail: false })); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                    Solicitar acesso ao DEV
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
