import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModerationSuccessModalProps {
  open: boolean;
  onClose: () => void;
  type?: 'foto' | 'avaliação';
}

export function ModerationSuccessModal({ open, onClose, type = 'foto' }: ModerationSuccessModalProps) {
  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DrawerContent>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center px-8 py-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                Conteúdo enviado para análise
              </h3>

              <p className="text-sm text-muted-foreground mb-1">
                Sua {type} será revisada antes de aparecer publicamente.
              </p>

              <p className="text-xs text-muted-foreground/70 mb-2">
                Assim que aprovado, você será notificado.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <DrawerFooter className="px-8 pb-8">
          <Button onClick={onClose} className="w-full rounded-xl h-12 text-base font-semibold">
            Ok, entendi
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
