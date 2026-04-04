import { supabase } from '@/lib/supabase';
import { getTenantSlug } from '@/lib/tenant';
import { PetshopSettings, DEFAULT_SETTINGS } from '@/lib/constants';
import type { Json } from '@/integrations/supabase/types';

export interface Petshop {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  cnpj_cpf: string | null;
  instagram_url: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  hours: string | null;
  theme: string | null;
  onboarding_completed: boolean;
  app_version: string;
  settings: PetshopSettings;
}

export interface PetshopUpdate {
  name?: string;
  slug?: string;
  phone?: string | null;
  address?: string | null;
  cnpj_cpf?: string | null;
  instagram_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  hours?: string | null;
  theme?: string | null;
  onboarding_completed?: boolean;
  app_version?: string;
  settings?: Json | null;
}

export async function getPetshop(): Promise<Petshop | null> {
  const slug = getTenantSlug();
  if (!slug) return null;

  const { data, error } = await supabase
    .from('petshops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
    
  if (error || !data) return null;
  
  const d = data as any;
  return {
    ...d,
    cnpj_cpf: d.cnpj_cpf || null,
    instagram_url: d.instagram_url || null,
    onboarding_completed: d.onboarding_completed || false,
    app_version: String(d.app_version || "1.0"),
    settings: { ...DEFAULT_SETTINGS, ...(d.settings as any || {}) },
  } as Petshop;
}

export async function updatePetshop(updates: Partial<Omit<PetshopUpdate, 'id' | 'settings'>>, petshopId: string): Promise<boolean> {
  const { error } = await supabase
    .from('petshops')
    .update(updates)
    .eq('id', petshopId);
  return !error;
}

export async function updatePetshopSettings(settings: Partial<PetshopSettings>, petshopId: string): Promise<boolean> {
  // 1. Buscar petshop atual para merge de settings
  const { data } = await supabase
    .from('petshops')
    .select('settings')
    .eq('id', petshopId)
    .single();
    
  const currentSettings = (data?.settings as unknown as PetshopSettings) || DEFAULT_SETTINGS;
  const merged = { ...currentSettings, ...settings };
  
  const { error } = await supabase
    .from('petshops')
    .update({ settings: merged as unknown as Json })
    .eq('id', petshopId);
  return !error;
}
