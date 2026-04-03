import { supabase } from '@/lib/supabase';

export interface PetNoteRow {
  id: string;
  pet_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPetNotes(petId: string): Promise<PetNoteRow[]> {
  const { data, error } = await supabase
    .from('pet_notes')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getPetNotes error:', error); return []; }
  return (data || []) as PetNoteRow[];
}

export interface PetNoteInsert {
  pet_id: string;
  note: string;
  created_by?: string | null;
}

export async function createPetNote(petId: string, note: string, createdBy?: string): Promise<PetNoteRow | null> {
  const insertData: PetNoteInsert = { pet_id: petId, note, created_by: createdBy || null };
  const { data, error } = await supabase
    .from('pet_notes')
    .insert(insertData)
    .select()
    .single();
  if (error) { console.error('createPetNote error:', error); return null; }
  return data as PetNoteRow;
}

export async function deletePetNote(id: string): Promise<boolean> {
  const { error } = await supabase.from('pet_notes').delete().eq('id', id);
  return !error;
}
