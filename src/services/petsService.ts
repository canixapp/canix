import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface PetRow {
  id: string;
  owner_id: string;
  petshop_id: string | null;
  name: string;
  size: string;
  breed: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetInsert {
  owner_id: string;
  petshop_id: string | null;
  name: string;
  size: string;
  breed?: string | null;
  photo_url?: string | null;
  age?: string | null;
  weight?: string | null;
  behavior?: string | null;
  allergies?: string | null;
  coat_type?: string | null;
  observations?: string | null;
}

export interface PetUpdate {
  name?: string;
  size?: string;
  breed?: string | null;
  photo_url?: string | null;
  age?: string | null;
  weight?: string | null;
  behavior?: string | null;
  allergies?: string | null;
  coat_type?: string | null;
  observations?: string | null;
}

export async function getPetsByOwner(ownerId: string): Promise<PetRow[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at');
  if (error) return [];
  return (data || []) as PetRow[];
}

export async function getAllPets(): Promise<PetRow[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as PetRow[];
}

export async function createPet(data: {
  owner_id: string;
  name: string;
  size: string;
  breed?: string;
  photo_url?: string;
}): Promise<PetRow | null> {
  const insertData: PetInsert = {
    owner_id: data.owner_id,
    petshop_id: PETSHOP_ID,
    name: data.name,
    size: data.size,
    breed: data.breed || '',
    photo_url: data.photo_url || null,
  };

  const { data: row, error } = await supabase
    .from('pets')
    .insert(insertData)
    .select()
    .single();
  if (error) { 
    console.error('createPet error:', error); 
    throw new Error(error.message); 
  }
  return row as PetRow;
}

export async function updatePet(id: string, data: PetUpdate): Promise<boolean> {
  const { error } = await supabase.from('pets').update(data).eq('id', id);
  return !error;
}

export async function deletePet(id: string): Promise<boolean> {
  const { error } = await supabase.from('pets').delete().eq('id', id);
  return !error;
}
