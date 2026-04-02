
-- Gallery comments table
CREATE TABLE public.gallery_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_avatar_url text,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments on approved photos
CREATE POLICY "Anyone can read comments on approved photos"
ON public.gallery_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.gallery_photos gp
  WHERE gp.id = gallery_comments.photo_id
  AND gp.moderation_status = 'aprovado'
));

-- Authenticated users can insert own comments
CREATE POLICY "Authenticated can insert own comments"
ON public.gallery_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON public.gallery_comments FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage comments"
ON public.gallery_comments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Devs can manage all comments
CREATE POLICY "Devs can manage comments"
ON public.gallery_comments FOR ALL
USING (has_role(auth.uid(), 'dev'::app_role))
WITH CHECK (has_role(auth.uid(), 'dev'::app_role));

CREATE INDEX idx_gallery_comments_photo_id ON public.gallery_comments(photo_id);
CREATE INDEX idx_gallery_comments_created_at ON public.gallery_comments(created_at DESC);
