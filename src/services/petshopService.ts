import { supabase } from '@/lib/supabase';
import { PETSHOP_ID, PetshopSettings, DEFAULT_SETTINGS } from '@/lib/constants';
import type { Json } from '@/integrations/supabase/types';

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

export interface PetshopUpdate {
  name?: string;
  slug?: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  hours?: string | null;
  theme?: string | null;
  settings?: Json | null;
}

export async function getPetshop(): Promise<Petshop | null> {
  const { data, error } = await supabase
    .from('petshops')
    .select('*')
    .eq('id', PETSHOP_ID)
    .maybeSingle();
  if (error || !data) return null;
  
  const rawSettings = data.settings as unknown as Partial<PetshopSettings> | null;
  
  return {
    ...data,
    settings: { ...DEFAULT_SETTINGS, ...(rawSettings || {}) },
  } as Petshop;
}

export async function updatePetshop(updates: Partial<Omit<PetshopUpdate, 'id' | 'settings'>>): Promise<boolean> {
  const { error } = await supabase
    .from('petshops')
    .update(updates)
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
    .update({ settings: merged as unknown as Json })
    .eq('id', PETSHOP_ID);
  return !error;
}
