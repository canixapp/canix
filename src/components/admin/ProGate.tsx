import { useState } from 'react';
import { useProAccess } from '@/hooks/useProAccess';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Crown, Lock } from 'lucide-react';

// --- PRO Button wrapper ---
interface ProButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ProButton({ children, onClick, className = '', variant = 'default', size = 'default' }: ProButtonProps) {
  const { isProActive } = useProAccess();
  const [showModal, setShowModal] = useState(false);

  if (isProActive) {
    return (
      <Button onClick={onClick} className={className} variant={variant} size={size}>
        <Crown className="w-4 h-4 mr-1.5 text-amber-400" />
        {children}
      </Button>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`opacity-60 cursor-not-allowed ${className}`}
            onClick={(e) => { e.preventDefault(); setShowModal(true); }}
          >
            <Crown className="w-4 h-4 mr-1.5 text-amber-500/70" />
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Disponível no Plano PRO</p>
        </TooltipContent>
      </Tooltip>
      <ProUpsellModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

// --- PRO Card wrapper ---
interface ProCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ProCard({ children, className = '' }: ProCardProps) {
  const { isProActive } = useProAccess();
  const [showModal, setShowModal] = useState(false);

  if (isProActive) return <div className={className}>{children}</div>;

  return (
    <>
      <div
        className={`relative overflow-hidden cursor-pointer rounded-xl ${className}`}
        onClick={() => setShowModal(true)}
      >
        <div className="blur-[1.5px] pointer-events-none select-none opacity-40 dark:opacity-30">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 dark:bg-muted/20 border border-dashed border-amber-500/30">
          <div className="p-2.5 rounded-full bg-amber-500/10">
            <Crown className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Recurso exclusivo do Plano PRO</p>
        </div>
      </div>
      <ProUpsellModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

// --- Upsell Modal ---
interface ProUpsellModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProUpsellModal({ open, onClose }: ProUpsellModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20 dark:border-primary/30">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <DialogTitle className="text-lg">Desbloqueie recursos avançados</DialogTitle>
          <DialogDescription className="text-sm">
            Este recurso está disponível apenas para usuários com Plano PRO.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-white">
            Solicitar acesso ao DEV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
