import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, RotateCcw } from 'lucide-react';
import { usePageAccess, PAGE_LABELS, PageKey } from '@/hooks/usePageAccess';
import { useToast } from '@/hooks/use-toast';

const PAGES = Object.keys(PAGE_LABELS) as PageKey[];
const ROLES: ('admin' | 'midia')[] = ['admin', 'midia'];

export function DevToolsPermissoes() {
  const { matrix, toggleAccess, resetToDefaults, loaded } = usePageAccess();
  const { toast } = useToast();

  const handleReset = async () => {
    await resetToDefaults();
    toast({ title: 'Permissões resetadas', description: 'Valores padrão foram restaurados.' });
  };

  if (!loaded) {
    return <p className="text-sm text-muted-foreground text-center py-8">Carregando permissões...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Matriz de Permissões por Página
        </h3>
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Resetar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        DEV sempre tem acesso total. Configure abaixo o acesso para ADMIN e MÍDIA.
      </p>

      {/* Desktop: Table */}
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

      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-3">
        {PAGES.map(page => (
          <Card key={page} className="shadow-sm">
            <CardContent className="p-3">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
