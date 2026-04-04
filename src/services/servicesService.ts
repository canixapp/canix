import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  active: boolean | null;
  price_pequeno: number | null;
  price_medio: number | null;
  price_grande: number | null;
  duration_minutes: number | null;
  sort_order: number | null;
  petshop_id: string;
}

export async function getServices(petshopId?: string): Promise<ServiceRow[]> {
  const targetId = petshopId || PETSHOP_ID;
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('petshop_id', targetId)
    .order('sort_order', { ascending: true });
  if (error) { console.error('getServices error:', error); return []; }
  return (data || []) as ServiceRow[];
}

export async function getActiveServices(petshopId?: string): Promise<ServiceRow[]> {
  const all = await getServices(petshopId);
  return all.filter(s => s.active !== false);
}

export interface ServiceInsert {
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  active?: boolean | null;
  price_pequeno?: number | null;
  price_medio?: number | null;
  price_grande?: number | null;
  duration_minutes?: number | null;
  sort_order?: number | null;
  petshop_id: string;
}

export interface ServiceUpdate {
  name?: string;
  description?: string | null;
  category?: string;
  icon?: string | null;
  active?: boolean | null;
  price_pequeno?: number | null;
  price_medio?: number | null;
  price_grande?: number | null;
  duration_minutes?: number | null;
  sort_order?: number | null;
}

export async function createService(data: Omit<ServiceInsert, 'petshop_id'>, petshopId?: string): Promise<ServiceRow> {
  const targetId = petshopId || PETSHOP_ID;
  const insertData: ServiceInsert = { ...data, petshop_id: targetId };
  const { data: row, error } = await supabase
    .from('services')
    .insert(insertData)
    .select()
    .single();
  if (error) { 
    console.error('createService error:', error); 
    throw new Error(error.message); 
  }
  return row as ServiceRow;
}

export async function updateService(id: string, data: ServiceUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('services')
    .update(data)
    .eq('id', id);
  if (error) {
    console.error('updateService error:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  return !error;
}
