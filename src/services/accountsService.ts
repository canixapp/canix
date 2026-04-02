import { supabase } from '@/lib/supabase';

export interface AccountLookup {
  auth_provider: string;
  has_password: boolean;
}

export async function lookupByPhone(phone: string): Promise<AccountLookup | null> {
  const { data, error } = await supabase.rpc('lookup_account_by_phone', {
    phone_input: phone,
  });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as AccountLookup;
}

export async function lookupByEmail(email: string): Promise<AccountLookup | null> {
  const { data, error } = await supabase.rpc('lookup_account_by_email', {
    email_input: email,
  });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as AccountLookup;
}
