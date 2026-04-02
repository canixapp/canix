import { useState } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';

export function InfoTip({ title, text }: { title?: string; text: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -m-2"
          aria-label="Informação"
        >
          <Info className="w-4 h-4" />
        </button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title || 'Informação'}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2">
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
            <DrawerFooter>
              <Button onClick={() => setOpen(false)}>Entendi</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 relative z-10">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[240px] z-[100]" sideOffset={5}>
        {title && <p className="text-xs font-semibold mb-0.5">{title}</p>}
        <p className="text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
