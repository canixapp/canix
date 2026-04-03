import { supabase } from '@/lib/supabase';

export interface GalleryComment {
  id: string;
  photo_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  comment_text: string;
  created_at: string;
}

export async function getCommentsForPhoto(photoId: string): Promise<GalleryComment[]> {
  const { data, error } = await supabase
    .from('gallery_comments')
    .select('id, photo_id, user_id, user_name, user_avatar_url, comment_text, created_at')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getCommentsForPhoto error:', error);
    return [];
  }
  return (data || []) as GalleryComment[];
}

export interface GalleryCommentInsert {
  photo_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url: string | null;
  comment_text: string;
}

export async function addComment(
  photoId: string,
  userId: string,
  userName: string,
  avatarUrl: string | null,
  text: string
): Promise<GalleryComment | null> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return null;

  const insertData: GalleryCommentInsert = {
    photo_id: photoId,
    user_id: userId,
    user_name: userName,
    user_avatar_url: avatarUrl,
    comment_text: trimmed,
  };

  const { data, error } = await supabase
    .from('gallery_comments')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('addComment error:', error);
    return null;
  }
  return data as GalleryComment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('gallery_comments')
    .delete()
    .eq('id', commentId);
  return !error;
}

export async function getCommentCountsForPhotos(photoIds: string[]): Promise<Record<string, number>> {
  if (photoIds.length === 0) return {};
  const { data } = await supabase
    .from('gallery_comments')
    .select('photo_id')
    .in('photo_id', photoIds);

  const counts: Record<string, number> = {};
  for (const id of photoIds) counts[id] = 0;
  for (const row of (data || []) as { photo_id: string }[]) {
    counts[row.photo_id] = (counts[row.photo_id] || 0) + 1;
  }
  return counts;
}
