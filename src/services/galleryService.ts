import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface GalleryPhotoRow {
  id: string;
  petshop_id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  category: string | null;
  moderation_status: string;
  source: string | null;
  submitted_by_name: string | null;
  submitted_by_user_id: string | null;
  owner_name: string | null;
  pet_name: string | null;
  created_at: string;
}

export interface GalleryPhotoInsert {
  petshop_id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  category?: string | null;
  moderation_status?: string;
  source?: string | null;
  submitted_by_name?: string | null;
  submitted_by_user_id?: string | null;
  owner_name?: string | null;
  pet_name?: string | null;
}

export interface GalleryPhotoUpdate {
  alt?: string | null;
  caption?: string | null;
  category?: string | null;
  moderation_status?: string;
  source?: string | null;
  submitted_by_name?: string | null;
  submitted_by_user_id?: string | null;
  owner_name?: string | null;
  pet_name?: string | null;
  url?: string;
}

export async function getGalleryPhotos(status?: string): Promise<GalleryPhotoRow[]> {
  const query = supabase
    .from('gallery_photos')
    .select('*')
    .eq('petshop_id', PETSHOP_ID)
    .order('created_at', { ascending: false });
  
  if (status) {
    query.eq('moderation_status', status);
  }
  
  const { data, error } = await query;
  if (error) { console.error('getGalleryPhotos error:', error); return []; }
  return (data || []) as GalleryPhotoRow[];
}

export async function getApprovedPhotos(limit?: number): Promise<GalleryPhotoRow[]> {
  const query = supabase
    .from('gallery_photos')
    .select('*')
    .eq('petshop_id', PETSHOP_ID)
    .eq('moderation_status', 'aprovado')
    .order('created_at', { ascending: false });
  
  if (limit) query.limit(limit);
  
  const { data, error } = await query;
  if (error) return [];
  return (data || []) as GalleryPhotoRow[];
}

export async function createGalleryPhoto(data: {
  url: string;
  alt?: string;
  caption?: string;
  category?: string;
  source?: string;
  submitted_by_name?: string;
  submitted_by_user_id?: string;
  owner_name?: string;
  pet_name?: string;
  moderation_status?: string;
}): Promise<GalleryPhotoRow | null> {
  const insertData: GalleryPhotoInsert = {
    petshop_id: PETSHOP_ID,
    url: data.url,
    alt: data.alt || '',
    caption: data.caption || '',
    category: data.category || null,
    source: data.source || 'PETSHOP',
    submitted_by_name: data.submitted_by_name || null,
    submitted_by_user_id: data.submitted_by_user_id || null,
    owner_name: data.owner_name || null,
    pet_name: data.pet_name || null,
    moderation_status: data.moderation_status || 'pendente',
  };

  const { data: row, error } = await supabase
    .from('gallery_photos')
    .insert(insertData)
    .select()
    .single();
  if (error) { console.error('createGalleryPhoto error:', error); return null; }
  return row as GalleryPhotoRow;
}

export async function updateGalleryPhoto(id: string, data: GalleryPhotoUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('gallery_photos')
    .update(data)
    .eq('id', id);
  return !error;
}
