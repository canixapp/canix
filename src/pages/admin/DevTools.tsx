import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DevToolsSidebar } from '@/components/devtools/DevToolsSidebar';
import { DevToolsOverview } from '@/components/devtools/DevToolsOverview';
import { DevToolsEnvironment } from '@/components/devtools/DevToolsEnvironment';
import { DevToolsPermissions } from '@/components/devtools/DevToolsPermissions';
import { DevToolsDemoData } from '@/components/devtools/DevToolsDemoData';
import { DevToolsLogs } from '@/components/devtools/DevToolsLogs';
import { DevToolsTools } from '@/components/devtools/DevToolsTools';
import { DevToolsUsuarios } from '@/components/admin/DevToolsUsuarios';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Menu, Circle, Copy } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export type DevSection = 'overview' | 'environment' | 'permissions' | 'demo' | 'logs' | 'tools' | 'usuarios';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || '—';
const ENV_NAME = window.location.hostname.includes('preview') ? 'Preview' : window.location.hostname.includes('localhost') ? 'Dev' : 'Produção';

export default function DevTools() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<DevSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (s: DevSection) => {
    setSection(s);
    setMobileOpen(false);
  };

  const copyProjectId = () => {
    navigator.clipboard.writeText(PROJECT_ID);
    toast.success('ID do projeto copiado!');
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full animate-fade-in">
        <DevToolsSidebar
          active={section}
          onNavigate={handleNav}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Single unified top bar */}
        <header
          className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <DevToolsSidebar
                  active={section}
                  onNavigate={handleNav}
                  collapsed={false}
                  onToggle={() => {}}
                  mobile
                />
              </SheetContent>
            </Sheet>

            <span className="text-sm font-medium text-foreground truncate">
              {user?.name}
              <span className="text-xs text-muted-foreground ml-1 capitalize">({user?.role})</span>
            </span>

            

            {/* Environment badges - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <Badge variant="outline" className="text-[10px] font-mono gap-1 h-5">
                <Circle className={`w-1.5 h-1.5 fill-emerald-500 text-emerald-500`} />
                {ENV_NAME}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-5">
                Online
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono h-5"><Badge variant="outline" className="text-[10px] font-mono h-5">v2.5.0</Badge></Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={copyProjectId}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Copiar ID do projeto</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground h-8">
              <LogOut className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <div
          className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in"
        >
          <div className="max-w-4xl mx-auto w-full">
            {section === 'overview' && <DevToolsOverview />}
            {section === 'environment' && <DevToolsEnvironment />}
            {section === 'permissions' && <DevToolsPermissions />}
            {section === 'demo' && <DevToolsDemoData />}
            {section === 'logs' && <DevToolsLogs />}
            {section === 'tools' && <DevToolsTools />}
            {section === 'usuarios' && <DevToolsUsuarios />}
          </div>
        </div>
      </div>
    </div>
  );
}