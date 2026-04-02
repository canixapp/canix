import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
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
  const { canAccess } = usePageAccess();
  const { toast } = useToast();
  const hasToasted = useRef(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Carregando...</p></div>;

  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

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
