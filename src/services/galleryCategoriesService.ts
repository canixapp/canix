import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface GalleryCategoryRow {
  id: string;
  petshop_id: string;
  name: string;
  slug: string;
  max_photos: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface GalleryCategoryInsert {
  petshop_id: string;
  name: string;
  slug: string;
  max_photos: number;
  sort_order: number;
  is_active?: boolean;
}

export interface GalleryCategoryUpdate {
  name?: string;
  slug?: string;
  max_photos?: number;
  sort_order?: number;
  is_active?: boolean;
}

export async function getGalleryCategories(onlyActive = false): Promise<GalleryCategoryRow[]> {
  const query = supabase
    .from('gallery_categories')
    .select('*')
    .eq('petshop_id', PETSHOP_ID);
  
  if (onlyActive) {
    query.eq('is_active', true);
  }
  
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) { console.error('getGalleryCategories error:', error); return []; }
  return (data || []) as GalleryCategoryRow[];
}

export async function createGalleryCategory(name: string, slug: string, maxPhotos = 10): Promise<GalleryCategoryRow | null> {
  // Get max sort_order
  const categories = await getGalleryCategories();
  const maxSort = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);

  const insertData: GalleryCategoryInsert = {
    petshop_id: PETSHOP_ID,
    name,
    slug,
    max_photos: maxPhotos,
    sort_order: maxSort + 1,
  };

  const { data, error } = await supabase
    .from('gallery_categories')
    .insert(insertData)
    .select()
    .single();
  if (error) { console.error('createGalleryCategory error:', error); return null; }
  return data as GalleryCategoryRow;
}

export async function updateGalleryCategory(id: string, updates: GalleryCategoryUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('gallery_categories')
    .update(updates)
    .eq('id', id);
  return !error;
}

export async function deleteGalleryCategory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('gallery_categories')
    .delete()
    .eq('id', id);
  return !error;
}
