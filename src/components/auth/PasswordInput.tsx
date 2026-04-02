import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function PasswordInput({ value, onChange, placeholder = '••••••••', error, id, disabled, className }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "pl-11 pr-11 h-[52px] rounded-[14px] text-base border-border/60 bg-background focus-visible:ring-primary/30",
            error && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive pl-1">{error}</p>}
    </div>
  );
}
