import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthTabs } from '@/components/auth/AuthTabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'phone' | 'email'>((tabParam === 'email' ? 'email' : 'phone'));

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleTabChange = (v: 'phone' | 'email') => {
    setTab(v);
    setError('');
    setSearchParams({ tab: v }, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Digite um email vÃ¡lido.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      <AuthTabs value={tab} onValueChange={handleTabChange} />

      {tab === 'phone' ? (
        <div className="space-y-4 text-center py-6">
          <div className="text-4xl">ðŸ“±</div>
          <p className="text-sm text-muted-foreground">
            RecuperaÃ§Ã£o por telefone indisponÃ­vel no momento.
          </p>
          <Button
            variant="outline"
            className="h-[52px] rounded-[14px] text-base w-full"
            onClick={() => handleTabChange('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Recuperar por e-mail
          </Button>
          <p className="text-center text-sm text-muted-foreground pt-2">
            <Link to="/auth/login?tab=phone" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </Link>
          </p>
        </div>
      ) : sent ? (
        <div className="space-y-4 text-center py-6">
          <div className="text-4xl">âœ‰ï¸</div>
          <p className="text-sm text-foreground font-medium">Link enviado!</p>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada e spam. O link expira em 1 hora.
          </p>
          <Link to="/auth/login?tab=email">
            <Button variant="outline" className="h-[52px] rounded-[14px] text-base w-full mt-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-sm font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-[52px] rounded-[14px] text-base border-border/60"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full h-[52px] rounded-[14px] text-base font-semibold" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de recuperaÃ§Ã£o'}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            <Link to="/auth/login?tab=email" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
