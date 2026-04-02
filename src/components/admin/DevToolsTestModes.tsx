import { useTestModes } from '@/contexts/TestModesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Database, Trash2, FlaskConical } from 'lucide-react';

export function DevToolsTestModes() {
  const {
    proModeActive, toggleProMode,
    clientModeActive, toggleClientMode,
    demoModeActive, toggleDemoMode,
    demoData, clearDemoData,
  } = useTestModes();

  const modes = [
    {
      id: 'pro',
      label: 'Modo PRO',
      description: 'Desbloqueia temporariamente todas as funcionalidades do plano PRO para teste.',
      icon: Crown,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      active: proModeActive,
      onToggle: toggleProMode,
      ringColor: 'ring-amber-500/20',
      activeBg: 'bg-amber-500/5',
    },
    {
      id: 'cliente',
      label: 'Modo Cliente',
      description: 'Simula a experiência completa de um cliente. Oculta painéis administrativos.',
      icon: User,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-500/10',
      active: clientModeActive,
      onToggle: toggleClientMode,
      ringColor: 'ring-sky-500/20',
      activeBg: 'bg-sky-500/5',
    },
    {
      id: 'demo',
      label: 'Modo Demonstração',
      description: 'Cria dados fictícios automaticamente para demonstração do sistema.',
      icon: Database,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
      active: demoModeActive,
      onToggle: toggleDemoMode,
      ringColor: 'ring-violet-500/20',
      activeBg: 'bg-violet-500/5',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Modos de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Controle os modos de teste do sistema. Esses modos não alteram dados reais e servem apenas para testes e demonstrações.
          </p>

          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl gap-3 transition-colors ${
                  mode.active ? `${mode.activeBg} ring-1 ${mode.ringColor}` : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${mode.iconBg} shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${mode.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mode.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Badge variant={mode.active ? 'default' : 'outline'} className={mode.active ? 'bg-primary text-primary-foreground' : ''}>
                    {mode.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Switch checked={mode.active} onCheckedChange={mode.onToggle} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Demo data info */}
      {demoModeActive && demoData && (
        <Card className="shadow-sm border-violet-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Database className="w-5 h-5" />
              Dados de Demonstração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{demoData.clients.length}</p>
                <p className="text-[11px] text-muted-foreground">Clientes</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{demoData.pets.length}</p>
                <p className="text-[11px] text-muted-foreground">Pets</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{demoData.appointments.length}</p>
                <p className="text-[11px] text-muted-foreground">Agendamentos</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">R$ {demoData.revenue.toLocaleString('pt-BR')}</p>
                <p className="text-[11px] text-muted-foreground">Receita</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Clientes fictícios:</p>
              <div className="flex flex-wrap gap-1.5">
                {demoData.clients.map(c => (
                  <Badge key={c.name} variant="outline" className="text-xs">{c.name}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Pets fictícios:</p>
              <div className="flex flex-wrap gap-1.5">
                {demoData.pets.map(p => (
                  <Badge key={p.name} variant="outline" className="text-xs">🐾 {p.name} ({p.breed})</Badge>
                ))}
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={clearDemoData} className="gap-2 w-full sm:w-auto min-h-[40px]">
              <Trash2 className="w-4 h-4" /> Limpar dados de demonstração
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
