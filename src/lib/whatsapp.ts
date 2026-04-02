import { WHATSAPP_NUMBER } from '@/lib/constants';

export function normalizeWhatsAppPhone(raw?: string | null): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

export function extractPhoneFromWhatsAppUrl(url?: string | null): string | null {
  if (!url) return null;

  const directMatch = url.match(/wa\.me\/(\d{10,15})/i);
  if (directMatch?.[1]) return normalizeWhatsAppPhone(directMatch[1]);

  const phoneParamMatch = url.match(/[?&]phone=(\d{10,15})/i);
  if (phoneParamMatch?.[1]) return normalizeWhatsAppPhone(phoneParamMatch[1]);

  return normalizeWhatsAppPhone(url);
}

export function extractPhoneFromAppointmentNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Tel:\s*([^|\n]+)/i);
  return normalizeWhatsAppPhone(match?.[1] || null);
}

export function extractTutorNameFromAppointmentNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Tutor:\s*([^|\n]+)/i);
  return match?.[1]?.trim() || null;
}

export function getPetshopWhatsAppPhone(options?: {
  phone?: string | null;
  whatsappUrl?: string | null;
}): string | null {
  return (
    extractPhoneFromWhatsAppUrl(options?.whatsappUrl) ||
    normalizeWhatsAppPhone(options?.phone) ||
    normalizeWhatsAppPhone(WHATSAPP_NUMBER)
  );
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppConversation(options: {
  phone: string | null | undefined;
  message: string;
}): boolean {
  const url = buildWhatsAppUrl(options.phone, options.message);
  if (!url) return false;

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!openedWindow) {
    window.location.assign(url);
  }

  return true;
}
