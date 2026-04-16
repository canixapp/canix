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
    .from('unidades_petshop')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
    
  if (error || !data) return null;
  
  const d = data as any;
  return {
    id: d.id,
    name: d.nome,
    slug: d.slug,
    phone: d.telefone,
    address: d.endereco,
    cnpj_cpf: d.cnpj_cpf || null,
    instagram_url: d.instagram_url || null,
    latitude: d.latitude || null,
    longitude: d.longitude || null,
    logo_url: d.logomarca_url,
    hours: d.horarios,
    theme: d.cor_primaria || null,
    onboarding_completed: d.onboarding_completo || false,
    app_version: String(d.versao_app || "1.0"),
    settings: { ...DEFAULT_SETTINGS, ...(d.settings as any || {}) },
  } as Petshop;
}

export async function updatePetshop(updates: Partial<Omit<PetshopUpdate, 'id' | 'settings'>>, petshopId: string): Promise<boolean> {
  const mappedUpdates: any = {};
  if (updates.name) mappedUpdates.nome = updates.name;
  if (updates.slug) mappedUpdates.slug = updates.slug;
  if (updates.phone) mappedUpdates.telefone = updates.phone;
  if (updates.address) mappedUpdates.endereco = updates.address;
  if (updates.logo_url) mappedUpdates.logomarca_url = updates.logo_url;
  if (updates.hours) mappedUpdates.horarios = updates.hours;
  if (updates.theme) mappedUpdates.cor_primaria = updates.theme;

  const { error } = await supabase
    .from('unidades_petshop')
    .update(mappedUpdates)
    .eq('id', petshopId);
  return !error;
}

export async function updatePetshopSettings(settings: Partial<PetshopSettings>, petshopId: string): Promise<boolean> {
  // 1. Buscar petshop atual para merge de settings
  const { data } = await supabase
    .from('unidades_petshop')
    .select('settings')
    .eq('id', petshopId)
    .single();
    
  const currentSettings = (data?.settings as unknown as PetshopSettings) || DEFAULT_SETTINGS;
  const merged = { ...currentSettings, ...settings };
  
  const { error } = await supabase
    .from('unidades_petshop')
    .update({ settings: merged as unknown as Json })
    .eq('id', petshopId);
  return !error;
}
