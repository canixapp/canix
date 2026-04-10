import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DangerZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  onSuccess?: () => void;
}

export function DangerZoneModal({ open, onOpenChange, action, onSuccess }: DangerZoneModalProps) {
  const handleAction = async () => {
    // ImplementaÃ§Ã£o bÃ¡sica para nÃ£o quebrar o build e permitir testes
    console.log(`Executando aÃ§Ã£o de risco: ${action}`);
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>VocÃª tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta aÃ§Ã£o Ã© irreversÃ­vel. Ela resultarÃ¡ na exclusÃ£o permanente dos dados ({action}) do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim, excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
