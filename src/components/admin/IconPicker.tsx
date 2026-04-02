import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ICON_MAP, ICON_LABELS, getIconComponent } from '@/lib/serviceCategories';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
  /** Show icons in a compact grid (for inline forms) */
  compact?: boolean;
}

export function IconPicker({ value, onChange, label = 'Ícone', compact = false }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const entries = Object.entries(ICON_MAP).filter(([key]) => {
    if (!search) return true;
    const lbl = ICON_LABELS[key] || key;
    return lbl.toLowerCase().includes(search.toLowerCase()) || key.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <div>
        <TooltipProvider delayDuration={200}>
          <div className="flex flex-wrap justify-center gap-1.5">
            {entries.map(([key, IconComp]) => {
              const isSelected = value === key;
              return (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onChange(key)}
                      className={cn(
                        "w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 scale-110'
                          : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {ICON_LABELS[key] || key}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Selected preview */}
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(() => {
            const SelIcon = getIconComponent(value);
            return <SelIcon className="w-3.5 h-3.5 text-primary" />;
          })()}
          <span>Selecionado: <span className="font-medium text-foreground">{ICON_LABELS[value] || value}</span></span>
        </div>
      )}
    </div>
  );
}
