import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { KeyRound, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export function ForcePasswordChangeModal({ open, userId, onComplete }: Props) {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  // Check if temp password has expired
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('temp_password_expires_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (data?.temp_password_expires_at) {
        const expiresAt = new Date(data.temp_password_expires_at as string).getTime();
        if (Date.now() > expiresAt) {
          setExpired(true);
        }
      }
    })();
  }, [open, userId]);

  const handleSubmit = async () => {
    setError('');
    if (expired) {
      setError('A senha temporÃ¡ria expirou. Solicite uma nova ao administrador.');
      return;
    }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas nÃ£o coincidem.'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Clear must_change_password flag and expiry
    await supabase.from('profiles').update({
      must_change_password: false,
      temp_password_expires_at: null,
    } as any).eq('user_id', userId);

    toast({ title: 'Senha atualizada com sucesso âœ“' });
    setLoading(false);
    onComplete();
  };

  if (expired) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm [&>button]:hidden" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-lg">Senha temporÃ¡ria expirada</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Sua senha temporÃ¡ria expirou. Entre em contato com o administrador para gerar uma nova.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth/login';
              }}
              className="w-full h-11 rounded-xl"
            >
              Voltar ao login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm [&>button]:hidden" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">Criar nova senha</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Sua senha foi redefinida. Crie uma nova senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Nova senha</Label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="MÃ­nimo 6 caracteres"
                className="h-11 rounded-xl text-base pr-10"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Confirmar senha</Label>
            <Input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              className="h-11 rounded-xl text-base"
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter className="pt-2">
          <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 rounded-xl text-base gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar nova senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
