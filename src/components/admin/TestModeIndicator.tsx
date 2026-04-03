import { useState, useEffect } from 'react';
import { useTestModes } from '@/contexts/TestModesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Database, Wrench, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function TestModeIndicator() {
  const { anyModeActive, activeModes, clientModeActive, toggleClientMode } = useTestModes();
  const { isDev } = useAuth();
  const navigate = useNavigate();
  const [hiddenByModal, setHiddenByModal] = useState(false);

  // Listen for pro-modal-change events to hide/show this indicator
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setHiddenByModal(!!detail);
    };
    window.addEventListener('pro-modal-change', handler);
    return () => window.removeEventListener('pro-modal-change', handler);
  }, []);

  if (!isDev() || !anyModeActive) return null;

  const normalizeModeKey = (mode: string) =>
    mode
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const modeConfig: Record<string, { icon: typeof Crown; color: string }> = {
    pro: { icon: Crown, color: 'bg-amber-500 text-white' },
    basico: { icon: User, color: 'bg-slate-500 text-white' },
    cliente: { icon: User, color: 'bg-sky-500 text-white' },
    demo: { icon: Database, color: 'bg-cyan-500 text-white' },
  };

  const handleDisableClientMode = () => {
    toggleClientMode();
    navigate('/admin/devtools');
  };

  return (
    <AnimatePresence>
      {!hiddenByModal && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-3 py-2 rounded-full bg-card/95 border border-border shadow-lg backdrop-blur-sm max-w-[calc(100vw-2rem)]"
        >
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Modo de teste</span>
          {activeModes.map(mode => {
            const cfg = modeConfig[normalizeModeKey(mode)] ?? { icon: Wrench, color: 'bg-muted text-foreground' };
            const Icon = cfg.icon;
            return (
              <Badge key={mode} className={`${cfg.color} text-[11px] gap-1 px-2 py-0.5`}>
                <Icon className="w-3 h-3" />
                {mode}
              </Badge>
            );
          })}

          {clientModeActive && (
            <button
              onClick={handleDisableClientMode}
              className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-colors"
            >
              <X className="w-3 h-3" />
              Desativar
            </button>
          )}

          {!clientModeActive && (
            <button
              onClick={() => navigate('/admin/devtools')}
              className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <Wrench className="w-3 h-3" />
              Painel Dev
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
