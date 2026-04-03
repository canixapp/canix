import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface ReviewRow {
  id: string;
  petshop_id: string;
  user_id: string | null;
  name: string;
  pet_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  moderation_status: string;
  shop_response: string | null;
  created_at: string;
  photos?: string[];
}

export interface ReviewInsert {
  petshop_id: string;
  user_id: string | null;
  name: string;
  pet_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  moderation_status: string;
}

export interface ReviewPhotoInsert {
  review_id: string;
  url: string;
}

export async function getReviews(status?: string): Promise<ReviewRow[]> {
  const query = supabase
    .from('reviews')
    .select('*, review_photos(url)')
    .eq('petshop_id', PETSHOP_ID)
    .order('created_at', { ascending: false });
  
  if (status) query.eq('moderation_status', status);
  
  const { data, error } = await query;
  if (error) { console.error('getReviews error:', error); return []; }
  
  return (data || []).map(r => ({
    ...r,
    photos: (r.review_photos || []).map((p: { url: string }) => p.url),
  })) as ReviewRow[];
}

export async function getApprovedReviews(limit?: number): Promise<ReviewRow[]> {
  const query = supabase
    .from('reviews')
    .select('*, review_photos(url)')
    .eq('petshop_id', PETSHOP_ID)
    .eq('moderation_status', 'aprovado')
    .order('created_at', { ascending: false });
  
  if (limit) query.limit(limit);
  
  const { data, error } = await query;
  if (error) return [];
  
  return (data || []).map(r => ({
    ...r,
    photos: (r.review_photos || []).map((p: { url: string }) => p.url),
  })) as ReviewRow[];
}

export async function createReview(data: {
  user_id?: string;
  name: string;
  pet_name?: string;
  rating: number;
  title?: string;
  comment?: string;
  photos?: string[];
}): Promise<ReviewRow | null> {
  const insertData: ReviewInsert = {
    petshop_id: PETSHOP_ID,
    user_id: data.user_id || null,
    name: data.name,
    pet_name: data.pet_name || '',
    rating: data.rating,
    title: data.title || '',
    comment: data.comment || '',
    moderation_status: 'pendente',
  };

  const { data: row, error } = await supabase
    .from('reviews')
    .insert(insertData)
    .select()
    .single();
  
  if (error || !row) { 
    console.error('createReview error:', error); 
    throw new Error(error?.message || 'Failed to create review'); 
  }
  
  // Insert review photos
  if (data.photos && data.photos.length > 0) {
    const photoRows: ReviewPhotoInsert[] = data.photos.map(url => ({
      review_id: row.id,
      url,
    }));
    await supabase.from('review_photos').insert(photoRows);
  }
  
  return { ...row, photos: data.photos || [] } as ReviewRow;
}

export interface ReviewUpdate {
  pet_name?: string | null;
  rating?: number;
  title?: string | null;
  comment?: string | null;
  moderation_status?: string;
  shop_response?: string | null;
}

export async function updateReview(id: string, data: ReviewUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update(data)
    .eq('id', id);
  return !error;
}
