/**
 * Normalize phone to digits only.
 * Example: "(11) 98690-7487" → "11986907487"
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Convert phone digits to E.164 BR format.
 * "11986907487" → "+5511986907487"
 * "+5511986907487" → "+5511986907487"
 */
export function toE164(raw: string): string | null {
  let digits = normalizePhone(raw);
  if (!digits) return null;

  // If starts with 55 and has 12-13 digits, strip country code
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length < 10 || digits.length > 11) return null;
  return `+55${digits}`;
}

/**
 * Convert phone to a virtual email for Supabase Auth.
 * Uses E.164 digits (without +) as local part.
 */
export function phoneToVirtualEmail(phone: string): string {
  const e164 = toE164(phone);
  if (e164) {
    // strip the + for email local part
    return `${e164.slice(1)}@phone.petcao.app`;
  }
  // fallback to raw digits
  return `${normalizePhone(phone)}@phone.petcao.app`;
}

/**
 * Format phone for display: 11986907487 → (11) 98690-7487
 */
export function formatPhone(phone: string): string {
  // Strip +55 prefix if present
  let digits = normalizePhone(phone);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

/**
 * Validate phone has 10 or 11 digits (BR with DDD).
 */
export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  // Strip country code if present
  let national = digits;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    national = digits.slice(2);
  }
  return national.length >= 10 && national.length <= 11;
}
