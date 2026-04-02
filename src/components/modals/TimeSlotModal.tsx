import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';

interface TimeSlotModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selectedDate: Date | undefined;
  availableSlots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  onContinue: () => void;
  isSlotAvailable: (date: string, time: string) => boolean;
  dateStr: string;
}

export function TimeSlotModal({
  open, onOpenChange, selectedDate, availableSlots, selectedSlot,
  onSelectSlot, onContinue, isSlotAvailable, dateStr,
}: TimeSlotModalProps) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Selecione um horário"
      description={selectedDate ? formatDate(selectedDate) : undefined}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum horário disponível para este dia.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 px-1">
            {availableSlots.map(time => {
              const available = isSlotAvailable(dateStr, time);
              const isSelected = selectedSlot === time;
              return (
                <button
                  key={time}
                  onClick={() => available && onSelectSlot(time)}
                  disabled={!available}
                  className={`relative py-3.5 px-2 rounded-2xl border-2 font-semibold transition-all text-sm ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                      : !available
                        ? 'border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50'
                        : 'border-border hover:border-primary/50 text-foreground bg-background hover:bg-muted/30'
                  }`}
                >
                  {time}
                  {!available && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      Lotado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="pt-1">
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl"
            disabled={!selectedSlot}
            onClick={onContinue}
          >
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
