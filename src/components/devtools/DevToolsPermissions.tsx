import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, RotateCcw, Eye } from 'lucide-react';
import { usePageAccess, PAGE_LABELS, PageKey } from '@/hooks/usePageAccess';
import { useTestModes } from '@/contexts/TestModesContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const PAGES = Object.keys(PAGE_LABELS) as PageKey[];
const ROLES: ('admin' | 'midia')[] = ['admin', 'midia'];

export function DevToolsPermissions() {
  const { matrix, toggleAccess, resetToDefaults, loaded } = usePageAccess();
  const { toast } = useToast();
  const [simulateRole, setSimulateRole] = useState<string>('none');

  const handleReset = async () => {
    await resetToDefaults();
    toast({ title: 'Permissões resetadas', description: 'Valores padrão restaurados.' });
  };

  if (!loaded) {
    return <p className="text-sm text-muted-foreground text-center py-8">Carregando permissões...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Permissões</h2>
          <p className="text-xs text-muted-foreground">Controle de acesso por página e role</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Resetar
        </Button>
      </div>

      {/* Simulate role */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Simular Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-muted-foreground mb-3">
            Visualize quais páginas cada role pode acessar.
          </p>
          <Select value={simulateRole} onValueChange={setSimulateRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="dev">DEV</SelectItem>
              <SelectItem value="admin">ADMIN</SelectItem>
              <SelectItem value="midia">MÍDIA</SelectItem>
              <SelectItem value="cliente">CLIENTE</SelectItem>
            </SelectContent>
          </Select>

          {simulateRole !== 'none' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PAGES.map(page => {
                let hasAccess = false;
                if (simulateRole === 'dev') hasAccess = true;
                else if (simulateRole === 'cliente') hasAccess = false;
                else hasAccess = matrix[simulateRole]?.[page] ?? false;

                return (
                  <Badge key={page} variant="outline" className={hasAccess ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    {PAGE_LABELS[page]} {hasAccess ? '✓' : '✗'}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission matrix */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Matriz de Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-muted-foreground mb-4">
            DEV sempre tem acesso total. Configure abaixo o acesso para ADMIN e MÍDIA.
          </p>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Página</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">ADMIN</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">MÍDIA</th>
                </tr>
              </thead>
              <tbody>
                {PAGES.map((page, i) => (
                  <tr key={page} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                    <td className="px-3 py-2.5 text-foreground text-xs font-medium">{PAGE_LABELS[page]}</td>
                    {ROLES.map(role => (
                      <td key={role} className="text-center px-3 py-2.5">
                        <Switch
                          checked={matrix[role]?.[page] ?? false}
                          onCheckedChange={() => toggleAccess(role, page)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {PAGES.map(page => (
              <div key={page} className="p-3 rounded-xl bg-muted/30">
                <p className="text-sm font-medium text-foreground mb-2">{PAGE_LABELS[page]}</p>
                <div className="flex items-center justify-between gap-4">
                  {ROLES.map(role => (
                    <div key={role} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{role.toUpperCase()}</Badge>
                      <Switch
                        checked={matrix[role]?.[page] ?? false}
                        onCheckedChange={() => toggleAccess(role, page)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
