import { supabase } from '@/lib/supabase';

export async function toggleLike(photoId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('gallery_likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('gallery_likes').delete().eq('id', existing.id);
  } else {
    await supabase.from('gallery_likes').insert({ photo_id: photoId, user_id: userId } as any);
  }

  const { count } = await supabase
    .from('gallery_likes')
    .select('*', { count: 'exact', head: true })
    .eq('photo_id', photoId);

  return { liked: !existing, count: count || 0 };
}

export async function getLikesForPhotos(photoIds: string[], userId?: string): Promise<Record<string, { count: number; liked: boolean }>> {
  if (photoIds.length === 0) return {};

  // Get counts
  const { data: allLikes } = await supabase
    .from('gallery_likes')
    .select('photo_id, user_id')
    .in('photo_id', photoIds);

  const result: Record<string, { count: number; liked: boolean }> = {};
  for (const id of photoIds) {
    const photoLikes = (allLikes || []).filter(l => l.photo_id === id);
    result[id] = {
      count: photoLikes.length,
      liked: userId ? photoLikes.some(l => l.user_id === userId) : false,
    };
  }
  return result;
}
