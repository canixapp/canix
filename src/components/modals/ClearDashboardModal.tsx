import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';
import { toast } from 'sonner';

interface ClearDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ClearDashboardModal({ open, onOpenChange, onSuccess }: ClearDashboardModalProps) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error('Informe um motivo com pelo menos 3 caracteres.');
      return;
    }
    if (!password) {
      toast.error('Informe sua senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.rpc('rpc_clear_dashboard' as any, {
        p_reason: reason.trim(), 
        p_dev_password: password, 
        p_petshop_id: PETSHOP_ID
      });
      const data = response.data as any;
      const error = response.error;

      if (error) {
        toast.error(error.message || 'Erro ao limpar dados.');
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Dados excluídos com sucesso! (${data?.deleted || 0} agendamentos removidos)`);
        setReason('');
        setPassword('');
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Excluir dados do Dashboard
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <strong>AtenÃ§Ã£o:</strong> Esta aÃ§Ã£o irÃ¡ excluir permanentemente todos os agendamentos e pacotes de clientes. Esta aÃ§Ã£o nÃ£o pode ser desfeita.
          </div>
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o motivo da exclusÃ£o..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Senha da conta DEV *</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={loading || !reason.trim() || !password}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Excluindo...' : 'Excluir todos os dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
