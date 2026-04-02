
-- Create gallery_likes table
CREATE TABLE public.gallery_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read like counts (public gallery)
CREATE POLICY "Anyone can read gallery likes"
ON public.gallery_likes FOR SELECT TO public
USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Authenticated can insert own likes"
ON public.gallery_likes FOR INSERT TO public
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can delete their own likes (unlike)
CREATE POLICY "Users can delete own likes"
ON public.gallery_likes FOR DELETE TO public
USING (auth.uid() = user_id);

-- Admins can manage all likes
CREATE POLICY "Admins can manage gallery likes"
ON public.gallery_likes FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Devs can manage all likes
CREATE POLICY "Devs can manage gallery likes"
ON public.gallery_likes FOR ALL TO public
USING (has_role(auth.uid(), 'dev'::app_role))
WITH CHECK (has_role(auth.uid(), 'dev'::app_role));

-- Add index for fast count queries
CREATE INDEX idx_gallery_likes_photo_id ON public.gallery_likes(photo_id);
CREATE INDEX idx_gallery_likes_user_id ON public.gallery_likes(user_id);
