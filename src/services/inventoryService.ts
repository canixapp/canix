import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface InventoryRow {
  id: string;
  petshop_id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  purchase_price: number;
  sale_price: number;
  supplier: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryInsert {
  petshop_id: string;
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  purchase_price: number;
  sale_price: number;
  supplier: string;
}

export interface PetshopRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function getInventory(petshopId?: string): Promise<InventoryRow[]> {
  const targetId = petshopId || PETSHOP_ID;
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('petshop_id', targetId)
    .order('name');
  if (error) { console.error('getInventory error:', error); return []; }
  return (data || []) as InventoryRow[];
}

export async function getPetshopBySlug(slug: string): Promise<PetshopRow | null> {
  const { data, error } = await supabase
    .from('petshops')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) { console.error('getPetshopBySlug error:', error); return null; }
  return data as PetshopRow | null;
}

export async function getPetshopById(id: string): Promise<PetshopRow | null> {
  const { data, error } = await supabase
    .from('petshops')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getPetshopById error:', error); return null; }
  return data as PetshopRow | null;
}

export async function createInventoryItem(data: {
  name: string;
  category?: string;
  quantity?: number;
  min_quantity?: number;
  purchase_price?: number;
  sale_price?: number;
  supplier?: string;
}, petshopId?: string): Promise<InventoryRow | null> {
  const targetId = petshopId || PETSHOP_ID;
  const insertData: InventoryInsert = {
    petshop_id: targetId,
    name: data.name,
    category: data.category || 'geral',
    quantity: data.quantity || 0,
    min_quantity: data.min_quantity || 0,
    purchase_price: data.purchase_price || 0,
    sale_price: data.sale_price || 0,
    supplier: data.supplier || '',
  };

  const { data: result, error } = await supabase
    .from('inventory')
    .insert(insertData)
    .select()
    .single();
  if (error) { console.error('createInventoryItem error:', error); return null; }
  return result as InventoryRow;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryInsert>): Promise<boolean> {
  const { error } = await supabase.from('inventory').update(data).eq('id', id);
  return !error;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  return !error;
}
