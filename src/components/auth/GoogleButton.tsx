import { Button } from '@/components/ui/button';
import { GoogleIcon } from './GoogleIcon';

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleButton({ onClick, loading, disabled }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-[52px] rounded-[14px] text-base gap-3 border-border/60 hover:bg-muted/50"
      onClick={onClick}
      disabled={loading || disabled}
    >
      <GoogleIcon />
      {loading ? 'Conectando...' : 'Continuar com Google'}
    </Button>
  );
}
