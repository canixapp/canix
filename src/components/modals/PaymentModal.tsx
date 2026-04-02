import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentMethod } from '@/lib/constants';
import { AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  defaultAmount: number;
  onConfirm: (paid: boolean, method?: PaymentMethod, amount?: number) => void;
}

export function PaymentModal({ open, onOpenChange, appointmentId, defaultAmount, onConfirm }: PaymentModalProps) {
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [amount, setAmount] = useState(defaultAmount.toString());

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount.toString());
      setIsPaid(null);
      setMethod('pix');
    }
  }, [open, defaultAmount]);

  const handleConfirm = () => {
    if (isPaid) {
      onConfirm(true, method, parseFloat(amount) || defaultAmount);
    } else {
      onConfirm(false);
    }
    setIsPaid(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento do Serviço</DialogTitle>
        </DialogHeader>

        {isPaid === null ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground text-center">O serviço já foi pago?</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setIsPaid(true)}>Sim, já foi pago</Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsPaid(false)}>Não, ainda pendente</Button>
            </div>
          </div>
        ) : isPaid ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor pago (R$)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleConfirm}>Confirmar Pagamento</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/30">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                A confirmação pode levar até 24h para ser atualizada. O pagamento será marcado como pendente.
              </p>
            </div>
            <Button className="w-full" onClick={handleConfirm}>Marcar como Pendente</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
