import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { insertAuditLog } from '@/services/auditLogService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientId: string;
  onDeleted: () => void;
}

export function DeleteClientModal({ open, onOpenChange, clientName, clientId, onDeleted }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = confirmText === 'EXCLUIR' && devPassword.length >= 6 && reason.trim().length >= 3;

  const resetForm = () => {
    setConfirmText('');
    setDevPassword('');
    setReason('');
    setError('');
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    const response = await supabase.rpc('rpc_delete_client' as any, {
      p_target_id: clientId, 
      p_dev_password: devPassword
    });
    
    const data = response.data as any;
    const fnError = response.error;

    if (fnError || (data && data.error)) {
      const msg = data?.error || fnError?.message || 'Erro ao excluir cliente.';
      setError(msg);
      setLoading(false);
      return;
    }

    // Log to audit
    if (user) {
      await insertAuditLog({
        actor_id: user.id,
        action: 'delete_client',
        entity: 'client',
        target_id: clientId,
        details: {
          client_name: clientName,
          reason: reason.trim(),
          deleted_by: user.name,
          deleted_by_role: user.role,
        },
      });
    }

    setLoading(false);
    toast({ title: 'Cliente excluÃ­do com sucesso.' });
    resetForm();
    onOpenChange(false);
    onDeleted();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Excluir cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            VocÃª estÃ¡ prestes a excluir permanentemente <strong className="text-foreground">{clientName}</strong> e todos os dados associados (pets, agendamentos, avaliaÃ§Ãµes, fotos).
          </p>
          <p className="text-sm text-destructive font-medium">
            Esta aÃ§Ã£o Ã© irreversÃ­vel.
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Motivo da exclusÃ£o *</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o motivo da exclusÃ£o..."
              className="min-h-[80px] rounded-xl resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Digite <strong>EXCLUIR</strong> para confirmar</Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="font-mono rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Senha da sua conta</Label>
            <Input
              type="password"
              value={devPassword}
              onChange={e => setDevPassword(e.target.value)}
              placeholder="Sua senha"
              className="rounded-xl"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canSubmit || loading}
            className="rounded-xl gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</> : 'Excluir permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
