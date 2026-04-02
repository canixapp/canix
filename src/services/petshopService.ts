import { supabase } from '@/lib/supabase';
import { PETSHOP_ID, PetshopSettings, DEFAULT_SETTINGS } from '@/lib/constants';

export interface Petshop {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  hours: string | null;
  theme: string | null;
  settings: PetshopSettings;
}

export async function getPetshop(): Promise<Petshop | null> {
  const { data, error } = await supabase
    .from('petshops')
    .select('*')
    .eq('id', PETSHOP_ID)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings as any || {}) },
  } as Petshop;
}

export async function updatePetshop(updates: Partial<Omit<Petshop, 'id' | 'settings'>>): Promise<boolean> {
  const { error } = await supabase
    .from('petshops')
    .update(updates as any)
    .eq('id', PETSHOP_ID);
  return !error;
}

export async function updatePetshopSettings(settings: Partial<PetshopSettings>): Promise<boolean> {
  // Merge with existing settings
  const current = await getPetshop();
  if (!current) return false;
  const merged = { ...current.settings, ...settings };
  const { error } = await supabase
    .from('petshops')
    .update({ settings: merged as any })
    .eq('id', PETSHOP_ID);
  return !error;
}
