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
  DollarSign, ShoppingBag, BarChart3, Bell, Megaphone, Crown,
} from 'lucide-react';
import logoPetDefault from '@/assets/logopet.png';
import { useBranding } from '@/contexts/BrandingContext';
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

  const items: SidebarItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, pageKey: 'dashboard' },
    { path: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays, pageKey: 'agendamentos', badge: pendingCount },
    { path: '/admin/pacotes', label: 'Pacotes', icon: Package, pageKey: 'pacotes' },
    { path: '/admin/clientes', label: 'Clientes', icon: UserCheck, pageKey: 'clientes' },
    { path: '/admin/pets', label: 'Pets', icon: PawPrint, pageKey: 'clientes' },
    { path: '/admin/servicos', label: 'Serviços e Valores', icon: Scissors, pageKey: 'servicos' },
    { path: '/admin/moderacao', label: 'Galeria e Avaliações', icon: Shield, pageKey: 'moderacao' },
    { path: '/admin/configuracoes', label: 'Configurações', icon: Settings, pageKey: 'configuracoes' },
    { path: '/admin/audit-log', label: 'Registro de Alterações', icon: History, pageKey: 'configuracoes' },
  ];

  const proItems: SidebarItem[] = [
    { path: '/admin/financeiro', label: 'Financeiro', icon: DollarSign, isPro: true },
    { path: '/admin/estoque', label: 'Estoque', icon: ShoppingBag, isPro: true },
    { path: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, isPro: true },
    { path: '/admin/lembretes', label: 'Lembretes Inteligentes', icon: Bell, isPro: true },
    { path: '/admin/marketing', label: 'Marketing', icon: Megaphone, isPro: true },
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
    if (isProActive) {
      navigateTo(item.path);
    } else {
      window.dispatchEvent(new CustomEvent('pro-modal-change', { detail: true }));
      setProModal(true);
    }
  };

  const renderProItem = (item: SidebarItem) => {
    if (clientModeActive) return null;
    const Icon = item.icon;
    const restrictedPages = ['financeiro', 'relatorios', 'estoque', 'marketing'];
    const isRestrictedByPlan = plan.name === 'Base (Essencial)' && item.pageKey && restrictedPages.includes(item.pageKey) && user.role !== 'dev';
    const locked = !isProActive || isRestrictedByPlan;

    const content = (
      <button
        onClick={() => handleProClick(item)}
        className={cn(
          'w-full group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
          isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5',
          locked
            ? 'text-sidebar-foreground/40 hover:bg-sidebar-accent/50'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <motion.span
          className="shrink-0 flex items-center justify-center"
          animate={{ width: isCollapsed ? 20 : 16, height: isCollapsed ? 20 : 16 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Icon className="w-full h-full" />
        </motion.span>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              key="label"
              className="truncate flex-1 text-left"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {!isCollapsed && (
          <span className={cn(
            "ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter",
            locked ? "text-gray-400" : "text-amber-500"
          )}>
            {locked ? <Shield size={10} /> : <Crown size={10} />}
            {locked ? 'Upgrade' : 'PRO'}
          </span>
        )}
      </button>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-1.5">
            {item.label} <Crown className="w-3 h-3 text-amber-500" />
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

    // Group with children
    if (item.children) {
      const groupActive = isGroupActive(item);
      const expanded = expandedGroups.dev ?? false;
      const Icon = item.icon;

      if (isCollapsed && !mobile) {
        const linkContent = (
          <NavLink
            to={item.children[0].path}
            className={cn(
              'group relative flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              groupActive
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30'
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 ring-1 ring-amber-500/20'
            )}
          >
            <Icon className="w-5 h-5" />
          </NavLink>
        );

        return (
          <Tooltip key={item.path + '-group'} delayDuration={0}>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
          </Tooltip>
        );
      }

      return (
        <div key={item.path + '-group'} className="space-y-0.5">
          <button
            onClick={() => toggleGroup('dev')}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 px-4 py-2.5',
              groupActive
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30'
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 ring-1 ring-amber-500/20'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1 text-left">{item.label}</span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="py-1 space-y-0.5">
                  {item.children.map(renderChildItem)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Regular item
    const active = isActive(item.path);
    const Icon = item.icon;

    const linkContent = (
      <NavLink
        to={item.path}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
          isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-2.5',
          item.isDevTool && !active
            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 ring-1 ring-amber-500/20'
            : active
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <motion.span
          className="shrink-0 flex items-center justify-center"
          animate={{ width: isCollapsed ? 20 : 16, height: isCollapsed ? 20 : 16 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Icon className="w-full h-full" />
        </motion.span>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              key="label"
              className="truncate"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {item.badge && item.badge > 0 && (
          <AnimatePresence mode="wait">
            {isCollapsed ? (
              <motion.span
                key="badge-dot"
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {item.badge}
              </motion.span>
            ) : (
              <motion.span
                key="badge-full"
                className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 inline-flex items-center justify-center font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {item.badge}
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </NavLink>
    );

    if (isCollapsed && !mobile) {
      return (
        <Tooltip key={item.path} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
            {item.badge && item.badge > 0 ? ` (${item.badge})` : ''}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.path}>{linkContent}</div>;
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

          {/* PRO section separator */}
          {!clientModeActive && (
            <>
              <div className={cn('pt-3 pb-1', isCollapsed && !mobile ? 'px-1' : 'px-2')}>
                {!isCollapsed ? (
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-500/60" /> Módulos PRO
                  </p>
                ) : (
                  <div className="w-full h-px bg-sidebar-border" />
                )}
              </div>
              {proItems.map(renderProItem)}
            </>
          )}

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
                <h3 className="text-lg font-bold text-foreground">Desbloqueie recursos avançados</h3>
                <p className="text-sm text-muted-foreground">
                  Este módulo está disponível apenas para usuários com Plano PRO. Faça upgrade para acessar Financeiro, Estoque, Relatórios, Lembretes e Marketing.
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
