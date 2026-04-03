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

export async function getInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('petshop_id', PETSHOP_ID)
    .order('name');
  if (error) { console.error('getInventory error:', error); return []; }
  return (data || []) as InventoryRow[];
}

export async function createInventoryItem(data: {
  name: string;
  category?: string;
  quantity?: number;
  min_quantity?: number;
  purchase_price?: number;
  sale_price?: number;
  supplier?: string;
}): Promise<InventoryRow | null> {
  const insertData: InventoryInsert = {
    petshop_id: PETSHOP_ID,
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
