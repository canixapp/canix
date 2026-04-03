import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, Users, PawPrint, CalendarCheck, DollarSign, Trash2, AlertTriangle, RefreshCw, Settings2 } from 'lucide-react';
import { useTestModes, DEFAULT_DEMO_CONFIG } from '@/contexts/TestModesContext';
import { useToast } from '@/hooks/use-toast';

export function DevToolsDemoData() {
  const {
    demoModeActive, toggleDemoMode,
    demoData, clearDemoData,
    demoConfig, setDemoConfig, regenerateDemoData,
  } = useTestModes();
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState(demoConfig);

  const handleConfigChange = (key: keyof typeof localConfig, value: string) => {
    const num = Math.max(1, Math.min(key === 'revenue' ? 99999 : 10, Number(value) || 0));
    setLocalConfig(prev => ({ ...prev, [key]: num }));
  };

  const applyConfig = () => {
    setDemoConfig(localConfig);
    if (demoModeActive) {
      // Will regenerate on next call
      toast({ title: 'Configuração salva', description: 'Clique em "Regenerar" para aplicar.' });
    } else {
      toast({ title: 'Configuração salva', description: 'Ative o modo demo para gerar os dados.' });
    }
  };

  const handleRegenerate = () => {
    setDemoConfig(localConfig);
    // Small timeout to let config propagate
    setTimeout(() => {
      regenerateDemoData();
      toast({ title: 'Dados regenerados', description: 'Dados demo atualizados com as novas configurações.' });
    }, 50);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Dados Demo</h2>
        <p className="text-xs text-muted-foreground">Gere dados fictícios para testes e demonstrações</p>
      </div>

      {/* Toggle */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
                <Database className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Modo Demonstração</p>
                <p className="text-xs text-muted-foreground">
                  {demoModeActive
                    ? 'Dados fictícios visíveis na Dashboard, Agendamentos e Clientes.'
                    : 'Ative para injetar dados fictícios em todo o painel admin.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={demoModeActive ? 'default' : 'outline'} className={demoModeActive ? 'bg-cyan-600 text-white' : ''}>
                {demoModeActive ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch checked={demoModeActive} onCheckedChange={toggleDemoMode} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Configuração dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] text-muted-foreground">
            Defina a quantidade de dados fictícios que serão gerados. Máximo de 10 para clientes, pets e agendamentos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> Clientes
              </Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localConfig.clients}
                onChange={e => handleConfigChange('clients', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5 text-amber-500" /> Pets
              </Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localConfig.pets}
                onChange={e => handleConfigChange('pets', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" /> Agendamentos
              </Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={localConfig.appointments}
                onChange={e => handleConfigChange('appointments', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-500" /> Receita (R$)
              </Label>
              <Input
                type="number"
                min={0}
                max={99999}
                value={localConfig.revenue}
                onChange={e => {
                  const num = Math.max(0, Math.min(99999, Number(e.target.value) || 0));
                  setLocalConfig(prev => ({ ...prev, revenue: num }));
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 min-h-[36px]" onClick={applyConfig}>
              Salvar config
            </Button>
            {demoModeActive && (
              <Button variant="outline" size="sm" className="gap-1.5 min-h-[36px] text-cyan-600 border-cyan-300 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-700 dark:hover:bg-cyan-950" onClick={handleRegenerate}>
                <RefreshCw className="w-3.5 h-3.5" /> Regenerar dados
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated data view */}
      {demoData && (
        <Card className="shadow-sm border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Database className="w-4 h-4" />
              Dados Gerados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Clientes', value: demoData.clients.length },
                { label: 'Pets', value: demoData.pets.length },
                { label: 'Agendamentos', value: demoData.appointments.length },
                { label: 'Receita', value: `R$ ${demoData.revenue.toLocaleString('pt-BR')}` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Clients */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Clientes fictícios</p>
              <div className="flex flex-wrap gap-1.5">
                {demoData.clients.map(c => (
                  <Badge key={c.name} variant="outline" className="text-xs">{c.name}</Badge>
                ))}
              </div>
            </div>

            {/* Pets */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Pets fictícios</p>
              <div className="flex flex-wrap gap-1.5">
                {demoData.pets.map(p => (
                  <Badge key={p.name} variant="outline" className="text-xs">🐾 {p.name} ({p.breed})</Badge>
                ))}
              </div>
            </div>

            {/* Appointments preview */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Agendamentos exemplo</p>
              <div className="space-y-1">
                {demoData.appointments.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2 rounded bg-muted/30">
                    <span className="font-mono text-foreground">{a.time}</span>
                    <span>{a.service_name}</span>
                    <span className="text-foreground font-medium">{a.petName}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">R$ {demoData.revenue.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">Receita do mês</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">R$ {demoData.pending.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="shadow-sm border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Limpar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-muted-foreground mb-3">
            Remove todos os dados fictícios e desativa o modo demonstração.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearDemoData}
            disabled={!demoData}
            className="gap-2 min-h-[40px]"
          >
            <Trash2 className="w-4 h-4" /> Limpar dados de demonstração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
