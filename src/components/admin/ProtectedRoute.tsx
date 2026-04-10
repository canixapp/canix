import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { ShieldAlert } from 'lucide-react';
import { usePageAccess, PageKey } from '@/hooks/usePageAccess';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  pageKey?: PageKey;
}

export function ProtectedRoute({ children, allowedRoles, pageKey }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const { plan } = usePetshop();
  const { canAccess } = usePageAccess();
  const { toast } = useToast();
  const hasToasted = useRef(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Carregando...</p></div>;

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  // 1. Check for Trial Expiry (Free Plan)
  if (plan.name === 'Free (Trial)' && plan.trial_ends_at && user.role !== 'dev') {
    const expires = new Date(plan.trial_ends_at);
    if (new Date() > expires) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="max-w-md text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
               <ShieldAlert size={40} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Período de Teste Expirado</h1>
            <p className="text-muted-foreground text-sm">Sua licença de teste de 7 dias chegou ao fim. Para continuar usando o Canix, escolha um plano comercial.</p>
            <button 
              onClick={() => window.location.href = 'https://wa.me/5511986907487?text=Quero+renovar+meu+plano'}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold uppercase tracking-widest text-[10px]"
            >
              Falar com Consultor
            </button>
          </div>
        </div>
      );
    }
  }

  // 2. Check for Page Restrictions (Base Plan)
  const restrictedPages = ['financeiro', 'relatorios', 'estoque', 'marketing'];
  if (plan.name === 'Base (Essencial)' && pageKey && restrictedPages.includes(pageKey as string) && user.role !== 'dev') {
    if (!hasToasted.current) {
      hasToasted.current = true;
      setTimeout(() => {
        toast({ title: 'Upgrade Necessário', description: 'Este módulo está disponível apenas no plano Premium.', variant: 'default' });
      }, 0);
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (pageKey && user.role !== 'dev' && !canAccess(user.role, pageKey)) {
    if (!hasToasted.current) {
      hasToasted.current = true;
      setTimeout(() => {
        toast({ title: 'Acesso não permitido', description: 'Você não tem permissão para acessar esta página.', variant: 'destructive' });
      }, 0);
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
