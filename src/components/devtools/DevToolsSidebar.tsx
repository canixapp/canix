import { LayoutDashboard, FlaskConical, Shield, Database, ScrollText, Wrench, PanelLeftClose, PanelLeft, Users, ArrowLeft, Circle, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DevSection } from '@/pages/admin/DevTools';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/dashboard/InfoTip';
import { useSystemStatus, getOverallStatus, getOverallLabel } from '@/hooks/useSystemStatus';

interface Props {
  active: DevSection;
  onNavigate: (s: DevSection) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

const NAV_ITEMS: { key: DevSection; label: string; icon: typeof LayoutDashboard; color: string }[] = [
  { key: 'overview', label: 'Visão Geral', icon: LayoutDashboard, color: 'text-sky-500' },
  { key: 'environment', label: 'Ambiente', icon: FlaskConical, color: 'text-emerald-500' },
  { key: 'permissions', label: 'Permissões', icon: Shield, color: 'text-violet-500' },
  { key: 'demo', label: 'Dados Demo', icon: Database, color: 'text-amber-500' },
  { key: 'logs', label: 'Logs', icon: ScrollText, color: 'text-rose-500' },
  { key: 'tools', label: 'Ferramentas', icon: Wrench, color: 'text-orange-500' },
  { key: 'usuarios', label: 'Usuários', icon: Users, color: 'text-cyan-500' },
];

export function DevToolsSidebar({ active, onNavigate, collapsed, onToggle, mobile }: Props) {
  const navigate = useNavigate();
  const { statuses } = useSystemStatus();
  const overall = getOverallStatus(statuses);
  const overallLabel = getOverallLabel(overall);
  const overallDotColor = overall === 'online'
    ? 'bg-emerald-500'
    : overall === 'degraded'
      ? 'bg-amber-500'
      : 'bg-destructive';
  const w = mobile ? 'w-64' : collapsed ? 'w-14' : 'w-56';

  return (
    <div className={cn('h-full border-r border-border bg-card/80 backdrop-blur-sm flex flex-col transition-all duration-200', w)}>
      {/* Logo area */}
      <div className={cn("h-14 flex items-center border-b border-border shrink-0", collapsed && !mobile ? 'justify-center px-0' : 'gap-2.5 px-3')}>
        <div
          className={cn("w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20", collapsed && !mobile && 'cursor-pointer hover:scale-105 transition-transform')}
          onClick={collapsed && !mobile ? onToggle : undefined}
        >
          <Wrench className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <span className="text-sm font-bold text-foreground whitespace-nowrap block">Dev Console</span>
            <span className="text-[10px] text-muted-foreground/60 block">PetCão v2.5</span>
          </div>
        )}
        {!mobile && !collapsed && (
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 rounded-lg" onClick={onToggle}>
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {(!collapsed || mobile) && (
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2.5 mb-2">Menu</p>
        )}
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const btn = (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'w-full flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-150',
                collapsed && !mobile ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                isActive ? 'bg-primary/15' : 'bg-muted/50'
              )}>
                <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-primary' : item.color)} />
              </div>
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
            </button>
          );

          if (collapsed && !mobile) {
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return <div key={item.key}>{btn}</div>;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-2">
        {(!collapsed || mobile) ? (
          <>
            <button
              onClick={() => navigate('/dev-tools')}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 ring-1 ring-amber-500/20 transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10">
                <Monitor className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span>Super Dev Panel</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/50">
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
              <span>Voltar ao Admin</span>
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${overallDotColor} ${overall === 'online' ? 'animate-pulse' : ''}`} />
              <p className="text-[10px] text-muted-foreground/60 truncate">{overallLabel}</p>
              <InfoTip text="Indica o estado consolidado dos serviços: backend, autenticação e banco de dados. Verde = tudo operacional, amarelo = instabilidade parcial, vermelho = indisponível." />
            </div>
          </>
        ) : (
          <>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/dev-tools')}
                  className="w-full flex items-center justify-center rounded-xl py-2.5 text-amber-500 hover:bg-amber-500/10 transition-all"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">Super Dev Panel</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full flex items-center justify-center rounded-xl py-2.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">Voltar ao Admin</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
