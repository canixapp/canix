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

export async function getInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('inventory' as any)
    .select('*')
    .eq('petshop_id', PETSHOP_ID)
    .order('name');
  if (error) { console.error('getInventory error:', error); return []; }
  return (data || []) as unknown as InventoryRow[];
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
  const { data: result, error } = await supabase
    .from('inventory' as any)
    .insert({
      petshop_id: PETSHOP_ID,
      name: data.name,
      category: data.category || 'geral',
      quantity: data.quantity || 0,
      min_quantity: data.min_quantity || 0,
      purchase_price: data.purchase_price || 0,
      sale_price: data.sale_price || 0,
      supplier: data.supplier || '',
    } as any)
    .select()
    .single();
  if (error) { console.error('createInventoryItem error:', error); return null; }
  return result as unknown as InventoryRow;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryRow>): Promise<boolean> {
  const { error } = await supabase.from('inventory' as any).update(data as any).eq('id', id);
  return !error;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('inventory' as any).delete().eq('id', id);
  return !error;
}
