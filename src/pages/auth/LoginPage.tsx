import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthTabs } from '@/components/auth/AuthTabs';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Pencil } from 'lucide-react';
import { isValidPhone, formatPhone } from '@/lib/phoneUtils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loginByPhone, login, loginWithGoogle } = useAuth();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'phone' | 'email'>((tabParam === 'email' ? 'email' : 'phone'));

  // Phone two-step
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  // Email
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleTabChange = (v: 'phone' | 'email') => {
    setTab(v);
    setError('');
    setSearchParams({ tab: v }, { replace: true });
  };

  // ---- PHONE FLOW ----
  const handlePhoneContinue = () => {
    setError('');
    if (!isValidPhone(phone)) {
      setError('Digite um telefone válido com DDD (10 ou 11 dígitos).');
      return;
    }
    setPhoneStep(2);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phonePassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const result = await loginByPhone(phone, phonePassword);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Erro ao entrar.');
    }
  };

  // ---- EMAIL FLOW ----
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Digite um e-mail válido.');
      return;
    }
    if (emailPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const result = await login(trimmed, emailPassword);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'E-mail ou senha inválidos.');
    }
  };

  // ---- GOOGLE ----
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result && 'error' in result && result.error) {
      setError('Erro ao entrar com Google. Tente novamente.');
    }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para agendar e acompanhar.">
      <AuthTabs value={tab} onValueChange={handleTabChange} />

      {tab === 'phone' ? (
        phoneStep === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-phone" className="text-sm font-medium">Telefone</Label>
              <PhoneInput id="login-phone" value={phone} onChange={setPhone} />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="button"
              className="w-full h-[52px] rounded-[14px] text-base font-semibold"
              onClick={handlePhoneContinue}
            >
              Continuar
            </Button>

            <AuthDivider />
            <GoogleButton onClick={handleGoogle} loading={googleLoading} />

            <p className="text-center text-sm text-muted-foreground pt-2">
              Não tem conta?{' '}
              <Link to="/auth/register?tab=phone" className="text-primary hover:underline font-medium">Criar conta</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            {/* Phone chip */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3">
              <span className="text-sm text-foreground font-medium flex-1">
                📱 {formatPhone(phone)}
              </span>
              <button
                type="button"
                onClick={() => { setPhoneStep(1); setPhonePassword(''); setError(''); }}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-phone-pw" className="text-sm font-medium">Senha</Label>
              <PasswordInput id="login-phone-pw" value={phonePassword} onChange={setPhonePassword} />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full h-[52px] rounded-[14px] text-base font-semibold" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <Link to="/auth/forgot?tab=phone" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </form>
        )
      ) : (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-sm font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="login-email"
                type="email"
                placeholder="email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-[52px] rounded-[14px] text-base border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-email-pw" className="text-sm font-medium">Senha</Label>
            <PasswordInput id="login-email-pw" value={emailPassword} onChange={setEmailPassword} />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full h-[52px] rounded-[14px] text-base font-semibold" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <Link to="/auth/forgot?tab=email" className="text-sm text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>

          <AuthDivider />
          <GoogleButton onClick={handleGoogle} loading={googleLoading} />

          <p className="text-center text-sm text-muted-foreground pt-2">
            Não tem conta?{' '}
            <Link to="/auth/register?tab=email" className="text-primary hover:underline font-medium">Criar conta</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
