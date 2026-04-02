import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import {
  DashboardPreferences, DEFAULT_PREFERENCES, DashboardModuleConfig,
} from '@/services/dashboardPreferencesService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: DashboardPreferences;
  onSave: (prefs: DashboardPreferences) => void;
}

const MODULE_LABELS: Record<string, string> = {
  resumoFinanceiro: 'Resumo Financeiro',
  metodosPagamento: 'Métodos de Pagamento',
  cardsOperacao: 'Cards de Operação',
  graficos: 'Gráficos',
  listaServicos: 'Lista de Serviços Concluídos',
};

const CARD_LABELS: Record<string, Record<string, string>> = {
  resumoFinanceiro: {
    receita: 'Recebido',
    despesa: 'Despesas',
    lucro: 'Lucro / Saldo',
    pendente: 'Pendente a receber',
    ticketMedio: 'Ticket Médio',
    metodoPagamento: 'Método mais usado',
  },
  cardsOperacao: {
    atendimentos: 'Atendimentos',
    agendamentosPendentes: 'Agendamentos Pendentes',
    cancelamentos: 'Cancelamentos',
    taxaConfirmacao: 'Taxa de Confirmação',
    maisVendido: 'Serviço mais vendido',
    maisFrequente: 'Cliente mais frequente',
    melhorDia: 'Melhor dia',
  },
};

export default function DashboardSettings({ open, onOpenChange, preferences, onSave }: Props) {
  const [draft, setDraft] = useState<DashboardPreferences>({ ...preferences });
  const isMobile = useIsMobile();

  // Sync draft when open changes
  const handleOpenChange = (v: boolean) => {
    if (v) setDraft({ ...preferences });
    onOpenChange(v);
  };

  const sortedModules = Object.entries(draft)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);

  const toggleModule = (key: string) => {
    setDraft(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof DashboardPreferences], enabled: !prev[key as keyof DashboardPreferences].enabled },
    }));
  };

  const toggleCard = (moduleKey: string, cardKey: string) => {
    setDraft(prev => {
      const mod = prev[moduleKey as keyof DashboardPreferences];
      return {
        ...prev,
        [moduleKey]: {
          ...mod,
          cards: { ...mod.cards, [cardKey]: !(mod.cards?.[cardKey] ?? true) },
        },
      };
    });
  };

  const moveModule = (key: string, direction: -1 | 1) => {
    const currentOrder = draft[key as keyof DashboardPreferences].order;
    const targetOrder = currentOrder + direction;
    const targetKey = sortedModules[targetOrder];
    if (!targetKey) return;

    setDraft(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof DashboardPreferences], order: targetOrder },
      [targetKey]: { ...prev[targetKey as keyof DashboardPreferences], order: currentOrder },
    }));
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_PREFERENCES });
  };

  const content = (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto ios-scroll">
      {sortedModules.map((key, idx) => {
        const mod = draft[key as keyof DashboardPreferences];
        const label = MODULE_LABELS[key] || key;
        const cardOptions = CARD_LABELS[key];

        return (
          <div key={key} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveModule(key, -1)}
                    disabled={idx === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveModule(key, 1)}
                    disabled={idx === sortedModules.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <Switch checked={mod.enabled} onCheckedChange={() => toggleModule(key)} />
            </div>

            {mod.enabled && cardOptions && (
              <div className="grid grid-cols-2 gap-2 pl-8">
                {Object.entries(cardOptions).map(([cardKey, cardLabel]) => (
                  <label key={cardKey} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={mod.cards?.[cardKey] !== false}
                      onCheckedChange={() => toggleCard(key, cardKey)}
                    />
                    <span className="text-xs text-muted-foreground">{cardLabel}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const footer = (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
        <RotateCcw className="w-3.5 h-3.5" />
        Restaurar padrão
      </Button>
      <div className="flex-1" />
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
      <Button onClick={handleSave}>Salvar layout</Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Personalizar Dashboard</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter>{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
        </DialogHeader>
        {content}
        <div className="pt-2">{footer}</div>
      </DialogContent>
    </Dialog>
  );
}
