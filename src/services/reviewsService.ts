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

export async function getReviews(status?: string): Promise<ReviewRow[]> {
  let query = supabase
    .from('reviews')
    .select('*, review_photos(url)')
    .eq('petshop_id', PETSHOP_ID)
    .order('created_at', { ascending: false });
  
  if (status) query = query.eq('moderation_status', status);
  
  const { data, error } = await query;
  if (error) { console.error('getReviews error:', error); return []; }
  return (data || []).map(r => ({
    ...r,
    photos: (r.review_photos || []).map((p: any) => p.url),
  })) as ReviewRow[];
}

export async function getApprovedReviews(limit?: number): Promise<ReviewRow[]> {
  let query = supabase
    .from('reviews')
    .select('*, review_photos(url)')
    .eq('petshop_id', PETSHOP_ID)
    .eq('moderation_status', 'aprovado')
    .order('created_at', { ascending: false });
  
  if (limit) query = query.limit(limit);
  
  const { data, error } = await query;
  if (error) return [];
  return (data || []).map(r => ({
    ...r,
    photos: (r.review_photos || []).map((p: any) => p.url),
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
  const { data: row, error } = await supabase
    .from('reviews')
    .insert({
      petshop_id: PETSHOP_ID,
      user_id: data.user_id || null,
      name: data.name,
      pet_name: data.pet_name || '',
      rating: data.rating,
      title: data.title || '',
      comment: data.comment || '',
      moderation_status: 'pendente',
    } as any)
    .select()
    .single();
  
  if (error || !row) { 
    console.error('createReview error:', error); 
    throw new Error(error?.message || 'Failed to create review'); 
  }
  
  // Insert review photos
  if (data.photos && data.photos.length > 0) {
    const photoRows = data.photos.map(url => ({
      review_id: row.id,
      url,
    }));
    await supabase.from('review_photos').insert(photoRows as any);
  }
  
  return { ...row, photos: data.photos || [] } as ReviewRow;
}

export async function updateReview(id: string, data: Partial<ReviewRow>): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update(data as any)
    .eq('id', id);
  return !error;
}
