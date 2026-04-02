import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Crown, EyeOff, FlaskConical, User, X } from 'lucide-react';
import { useTestModes } from '@/contexts/TestModesContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function DevToolsEnvironment() {
  const {
    proModeActive, toggleProMode,
    basicModeActive, toggleBasicMode,
    clientModeActive, toggleClientMode,
  } = useTestModes();
  const navigate = useNavigate();

  const modes = [
    {
      id: 'pro', label: 'Modo PRO', icon: Crown,
      description: 'Desbloqueia todas as funções PRO do sistema para teste.',
      iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/10',
      active: proModeActive, onToggle: toggleProMode,
      ringColor: 'ring-amber-500/20', activeBg: 'bg-amber-500/5',
    },
    {
      id: 'basico', label: 'Modo Básico', icon: EyeOff,
      description: 'Simula a experiência do plano básico. Funções PRO ficam desfocadas.',
      iconColor: 'text-muted-foreground', iconBg: 'bg-muted/80',
      active: basicModeActive, onToggle: toggleBasicMode,
      ringColor: 'ring-border', activeBg: 'bg-muted/30',
    },
    {
      id: 'cliente', label: 'Modo Cliente', icon: User,
      description: 'Simula a experiência do cliente. Redireciona para o perfil do tutor.',
      iconColor: 'text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-500/10',
      active: clientModeActive,
      onToggle: () => {
        toggleClientMode();
        if (!clientModeActive) {
          // Activating — redirect to profile page
          setTimeout(() => navigate('/perfil'), 200);
        }
      },
      ringColor: 'ring-sky-500/20', activeBg: 'bg-sky-500/5',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Ambiente</h2>
        <p className="text-xs text-muted-foreground">Controle de modos de simulação</p>
      </div>

      <Card className="shadow-sm border-border/60">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Modos de Simulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Esses modos não alteram dados reais e servem apenas para testes.
          </p>
          {modes.map((mode, i) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.22 }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl gap-3 transition-all duration-200 ${
                  mode.active ? `${mode.activeBg} ring-1 ${mode.ringColor}` : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${mode.iconBg} shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${mode.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{mode.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mode.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Badge variant={mode.active ? 'default' : 'outline'} className={mode.active ? 'bg-primary text-primary-foreground text-[10px]' : 'text-[10px]'}>
                    {mode.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Switch checked={mode.active} onCheckedChange={mode.onToggle} />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
