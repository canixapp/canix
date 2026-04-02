import { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Strips the +55 country code prefix from the input if present,
 * returning only the national part of the phone number.
 */
function extractNationalDigits(raw: string): string {
  // Remove all non-digits first
  const digits = raw.replace(/\D/g, '');
  
  // If starts with 55 and has 12-13 digits, it's likely a full BR number
  // Strip the country code
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2);
  }
  
  return digits;
}

/**
 * Formats phone digits as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 11 digits (9-digit mobile)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function PhoneInput({ id, value, onChange, placeholder }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    
    // Extract only national digits (strips +55 if pasted)
    const nationalDigits = extractNationalDigits(rawInput);
    
    // Limit to 11 digits (BR national phone with mobile 9)
    const limited = nationalDigits.slice(0, 11);
    
    // Store the raw digits
    onChange(limited);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    
    // Extract national digits from pasted content
    const nationalDigits = extractNationalDigits(pasted);
    const limited = nationalDigits.slice(0, 11);
    
    onChange(limited);
  }, [onChange]);

  // Format for display
  const displayValue = formatPhoneDisplay(value.replace(/\D/g, ''));

  return (
    <div className="relative">
      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder || "(11) 99999-9999"}
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        className="pl-11 h-[52px] rounded-[14px] text-base border-border/60"
        maxLength={16} // (XX) XXXXX-XXXX = 15 chars + buffer
      />
    </div>
  );
}