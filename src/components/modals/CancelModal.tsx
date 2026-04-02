import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getWhatsAppUrl, generateWhatsAppMessage } from '@/lib/constants';
import type { Appointment } from '@/contexts/AuthContext';

interface CancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: () => void;
}

export function CancelModal({ open, onOpenChange, appointment, onConfirm }: CancelModalProps) {
  const [reason, setReason] = useState('');

  const handleCancel = () => {
    if (!appointment) return;

    onConfirm();

    const message = generateWhatsAppMessage({
      petName: appointment.petName,
      date: appointment.date,
      time: appointment.time,
      action: 'cancelar',
      cancelReason: reason || 'Não especificado',
    });

    window.open(getWhatsAppUrl(message), '_blank');
    onOpenChange(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar Agendamento</DialogTitle>
          <DialogDescription>
            Por favor, nos informe o motivo do cancelamento para podermos melhorar nossos serviços.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {appointment && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Pet:</span> {appointment.petName}
              </p>
              <p className="text-sm">
                <span className="font-medium">Serviço:</span> {appointment.service}
              </p>
              <p className="text-sm">
                <span className="font-medium">Data:</span> {appointment.date} às {appointment.time}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Conte-nos o motivo (opcional, mas ajuda muito!)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
