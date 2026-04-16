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
  const insertData = {
    servico: data.name,
    descricao: data.description,
    preco_pequeno: data.price_pequeno,
    preco_medio: data.price_medio,
    preco_grande: data.price_grande,
    unidade_id: targetId
  };

  const { data: row, error } = await supabase
    .from('servicos_precos')
    .insert(insertData)
    .select()
    .single();

  if (error) { 
    console.error('createService error:', error); 
    throw new Error(error.message); 
  }
  
  const d = row as any;
  return {
    id: d.id,
    name: d.servico,
    description: d.descricao,
    category: 'Geral',
    icon: 'Package',
    active: true,
    price_pequeno: d.preco_pequeno,
    price_medio: d.preco_medio,
    price_grande: d.preco_grande,
    duration_minutes: 60,
    sort_order: 0,
    petshop_id: d.unidade_id
  } as ServiceRow;
}

export async function updateService(id: string, data: ServiceUpdate): Promise<boolean> {
  const updateData: any = {};
  if (data.name) updateData.servico = data.name;
  if (data.description) updateData.descricao = data.description;
  if (data.price_pequeno !== undefined) updateData.preco_pequeno = data.price_pequeno;
  if (data.price_medio !== undefined) updateData.preco_medio = data.price_medio;
  if (data.price_grande !== undefined) updateData.preco_grande = data.price_grande;

  const { error } = await supabase
    .from('servicos_precos')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('updateService error:', error);
    throw new Error(error.message);
  }
  return true;
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase.from('servicos_precos').delete().eq('id', id);
  return !error;
}
