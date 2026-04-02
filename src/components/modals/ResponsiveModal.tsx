import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  maxWidth?: string;
  stickyFooter?: ReactNode;
}

export function ResponsiveModal({
  open, onOpenChange, title, description, children, icon, maxWidth = 'max-w-lg', stickyFooter,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85dvh] flex flex-col">
          <DrawerHeader className="text-left px-6 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-2.5">
              {icon}
              <div>
                <DrawerTitle className="text-lg">{title}</DrawerTitle>
                {description && <DrawerDescription className="text-sm text-muted-foreground mt-0.5">{description}</DrawerDescription>}
              </div>
            </div>
          </DrawerHeader>
          <div className="px-6 py-4 overflow-y-auto flex-1 ios-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
          {stickyFooter && (
            <div className="px-6 py-4 border-t border-border shrink-0 pb-safe">
              {stickyFooter}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[80vh] flex flex-col`}>
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2.5">
            {icon}
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          {children}
        </div>
        {stickyFooter && (
          <div className="pt-4 border-t border-border shrink-0">
            {stickyFooter}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
