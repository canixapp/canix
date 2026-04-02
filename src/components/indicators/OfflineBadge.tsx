import { WifiOff, Database, Upload, Bell, CalendarX, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const limitations = [
  { icon: Database, label: 'Leitura/escrita no banco indisponível' },
  { icon: CalendarX, label: 'Agendamentos não podem ser criados' },
  { icon: Upload, label: 'Upload de arquivos bloqueado' },
  { icon: Bell, label: 'Notificações em tempo real pausadas' },
  { icon: RefreshCw, label: 'Dados exibidos podem estar desatualizados' },
];

interface OfflineBadgeProps {
  compact?: boolean;
}

export function OfflineBadge({ compact = false }: OfflineBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive font-semibold animate-pulse cursor-pointer hover:bg-destructive/20 transition-colors ${
            compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <WifiOff className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          {compact ? 'Offline' : 'Modo Offline'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="w-72 p-0"
      >
        <div className="px-4 py-3 border-b border-border bg-destructive/5">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-foreground">Modo Offline Ativo</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sessão dev restaurada do cache. Reconexão automática em andamento.
          </p>
        </div>
        <ul className="p-3 space-y-2">
          {limitations.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-start gap-2.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2.5 border-t border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            O sistema tentará reconectar automaticamente
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
