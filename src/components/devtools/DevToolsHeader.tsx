import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || '—';
const ENV_NAME = window.location.hostname.includes('preview') ? 'Preview' : window.location.hostname.includes('localhost') ? 'Dev' : 'Produção';

export function DevToolsHeader({ children }: { children?: ReactNode }) {
  const copyProjectId = () => {
    navigator.clipboard.writeText(PROJECT_ID);
    toast.success('ID do projeto copiado!');
  };

  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0">
      {children}

      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="outline" className="text-[10px] font-mono shrink-0 gap-1">
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
          {ENV_NAME}
        </Badge>
        <Badge variant="outline" className="text-[10px] shrink-0">Online</Badge>
        <Badge variant="outline" className="text-[10px] font-mono shrink-0"><Badge variant="outline" className="text-[10px] font-mono shrink-0">v2.5.0</Badge></Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 font-mono text-muted-foreground" onClick={copyProjectId}>
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copiar ID</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Copiar ID do projeto</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
