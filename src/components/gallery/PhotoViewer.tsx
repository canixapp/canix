import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Trash2, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toggleLike, getLikesForPhotos } from '@/services/galleryLikesService';
import { PhotoComments } from './PhotoComments';
import { toast } from 'sonner';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  owner_name?: string | null;
  pet_name?: string | null;
  submitted_by_name?: string | null;
  category?: string | null;
  created_at?: string;
}

interface PhotoViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  showAdminActions?: boolean;
  onDelete?: (id: string) => void;
}

export function PhotoViewer({ images, initialIndex, open, onClose, showAdminActions, onDelete }: PhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [likeAnimating, setLikeAnimating] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const doubleTapRef = useRef<number>(0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => { setIndex(initialIndex); }, [initialIndex]);
  useEffect(() => { setLoaded(false); setShowComments(false); }, [index]);

  // Load likes
  useEffect(() => {
    if (!open || images.length === 0) return;
    getLikesForPhotos(images.map(i => i.id), user?.id).then(setLikes);
  }, [open, images, user?.id]);

  // Preload next
  useEffect(() => {
    if (!open || index >= images.length - 1) return;
    const next = images[index + 1];
    if (next?.url) { const img = new Image(); img.src = next.url; }
  }, [open, index, images]);

  const goNext = useCallback(() => {
    if (index < images.length - 1) setIndex(i => i + 1);
  }, [index, images.length]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goNext, goPrev, onClose]);

  const image = images[index];
  if (!image) return null;

  const currentLike = likes[image.id] || { count: 0, liked: false };

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Faça login para curtir fotos.');
      return;
    }
    setLikes(prev => ({
      ...prev,
      [image.id]: {
        count: prev[image.id]?.liked ? (prev[image.id]?.count || 1) - 1 : (prev[image.id]?.count || 0) + 1,
        liked: !prev[image.id]?.liked,
      }
    }));
    if (!currentLike.liked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
    }
    try {
      const result = await toggleLike(image.id, user.id);
      setLikes(prev => ({ ...prev, [image.id]: result }));
    } catch {
      setLikes(prev => ({ ...prev, [image.id]: currentLike }));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - doubleTapRef.current < 300) {
      if (!currentLike.liked) handleLike();
      else { setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 600); }
    }
    doubleTapRef.current = now;
  };

  const handleShare = async () => {
    const shareData = {
      title: `PetCão 🐾 ${image.pet_name ? image.pet_name : 'Galeria'}`,
      text: 'Olha essa fofura que encontrei no PetCão 🐾',
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  const displayName = image.submitted_by_name || image.owner_name || 'PetCão';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isOfficial = displayName === 'PetCão' || !image.submitted_by_name;
  const timeAgo = image.created_at ? getTimeAgo(image.created_at) : '';

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-none w-screen h-[100dvh] p-0 border-0 rounded-none bg-background [&>button]:hidden overflow-y-auto"
      >
        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="fixed top-3 right-3 z-50 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-full backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex flex-col md:flex-row items-stretch justify-center min-h-[100dvh] md:min-h-0 md:h-[100dvh]">
          {/* ======= IMAGE AREA ======= */}
          <div
            className="relative flex-1 flex items-center justify-center bg-muted/30 min-h-[45dvh] md:min-h-0"
            onClick={handleDoubleTap}
            onPointerDown={(e) => { touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }; }}
            onPointerUp={(e) => {
              if (!touchStartRef.current) return;
              const dx = e.clientX - touchStartRef.current.x;
              const dy = e.clientY - touchStartRef.current.y;
              const dt = Date.now() - touchStartRef.current.time;
              touchStartRef.current = null;
              if (dt > 500) return;
              if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) { onClose(); return; }
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) goNext(); else goPrev();
              }
            }}
          >
            {/* Desktop arrows */}
            {index > 0 && (
              <button onClick={e => { e.stopPropagation(); goPrev(); }} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 hover:bg-card shadow-lg border border-border/30 items-center justify-center transition-all hover:scale-105">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {index < images.length - 1 && (
              <button onClick={e => { e.stopPropagation(); goNext(); }} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/90 hover:bg-card shadow-lg border border-border/30 items-center justify-center transition-all hover:scale-105">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            )}

            {/* Double-tap heart */}
            {likeAnimating && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <Heart className="w-20 h-20 text-red-500 fill-red-500 animate-[heartBounce_0.6s_ease-out_forwards] drop-shadow-lg" />
              </div>
            )}

            {!loaded && <Skeleton className="w-full max-w-lg aspect-square rounded-2xl bg-muted" />}
            <img
              src={image.url}
              alt={image.alt || ''}
              onLoad={() => setLoaded(true)}
              className={cn(
                'max-w-full max-h-[55dvh] md:max-h-[85dvh] object-contain select-none rounded-lg',
                !loaded && 'absolute opacity-0'
              )}
              draggable={false}
            />

            {/* Pagination indicator - pill style */}
            {images.length > 1 && (
              <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center gap-1 md:hidden pointer-events-none">
                {images.length <= 12 ? images.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      i === index ? 'bg-primary w-5' : 'bg-foreground/20 w-1.5'
                    )}
                  />
                )) : (
                  <div className="bg-card/80 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                    {index + 1} / {images.length}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======= DETAILS SIDEBAR ======= */}
          <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-card md:border-l border-border/30">

            {/* Profile header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/20">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-bold shrink-0 ring-2 ring-primary/10">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                  {isOfficial && (
                    <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      🐾 Oficial
                    </span>
                  )}
                </div>
                {timeAgo && <p className="text-xs text-muted-foreground">{timeAgo}</p>}
              </div>
              <div className="flex items-center gap-1">
                {showAdminActions && onDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(image.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 rounded-full">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Caption (desktop scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 hidden md:block">
              {(image.caption || image.pet_name) && (
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">{displayName}</span>{' '}
                  {image.caption || ''}
                  {image.pet_name && !image.caption && (
                    <span className="text-muted-foreground">🐾 {image.pet_name}</span>
                  )}
                </p>
              )}
              {image.pet_name && image.caption && (
                <p className="text-xs text-muted-foreground mt-1">🐾 {image.pet_name}</p>
              )}

              {/* Desktop comments inline */}
              <div className="mt-4">
                <PhotoComments photoId={image.id} isAuthenticated={isAuthenticated} />
              </div>
            </div>

            {/* ======= ACTION BAR ======= */}
            <div className="border-t border-border/20 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleLike}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95',
                      currentLike.liked
                        ? 'bg-red-50 dark:bg-red-500/10'
                        : 'hover:bg-muted/60'
                    )}
                  >
                    <Heart
                      className={cn(
                        'w-5 h-5 transition-all duration-200',
                        currentLike.liked
                          ? 'text-red-500 fill-red-500 scale-110'
                          : 'text-foreground'
                      )}
                    />
                    {currentLike.count > 0 && (
                      <span className={cn('text-xs font-semibold', currentLike.liked ? 'text-red-500' : 'text-foreground')}>
                        {currentLike.count}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all active:scale-95 md:hidden"
                  >
                    <MessageCircle className="w-5 h-5 text-foreground" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all active:scale-95"
                  >
                    <Share2 className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Counter desktop */}
                {images.length > 1 && (
                  <span className="hidden md:inline text-xs text-muted-foreground">
                    {index + 1} de {images.length}
                  </span>
                )}
              </div>

              {/* Like text */}
              <p className="text-sm font-semibold text-foreground mt-1.5">
                {currentLike.count > 0
                  ? `${currentLike.count} curtida${currentLike.count !== 1 ? 's' : ''}`
                  : (
                    <span className="font-normal text-muted-foreground text-xs">
                      Seja a primeira curtida desta foto
                    </span>
                  )}
              </p>

              {/* Mobile caption */}
              <div className="md:hidden mt-1">
                {(image.caption || image.pet_name) && (
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{displayName}</span>{' '}
                    {image.caption || ''}
                    {image.pet_name && !image.caption && (
                      <span className="text-muted-foreground">🐾 {image.pet_name}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile comments (expandable) */}
            {showComments && (
              <div className="md:hidden border-t border-border/20 animate-in slide-in-from-bottom-2 duration-200">
                <PhotoComments photoId={image.id} isAuthenticated={isAuthenticated} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}sem`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
