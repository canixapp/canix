import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/hooks/useConfig';
import { useNavigate } from 'react-router-dom';
import { useHomeContent } from '@/hooks/useHomeContent';
import { getGalleryCategories, GalleryCategoryRow } from '@/services/galleryCategoriesService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GallerySkeleton } from '@/components/skeletons/SectionSkeletons';
import { PhotoViewer } from '@/components/gallery/PhotoViewer';
import { GalleryUploadModal } from '@/components/gallery/GalleryUploadModal';
import { ModerationSuccessModal } from '@/components/modals/ModerationSuccessModal';
import React from 'react';

const ITEMS_PER_PAGE = 12;

export function GallerySection() {
  const { galleryImages, addPhoto, galleryLoading } = useAdmin();
  const { isDev, isAdmin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { homeContent } = useHomeContent();
  const { displayLimits } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [categories, setCategories] = useState<GalleryCategoryRow[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const showAdmin = isDev() || isAdmin();

  useEffect(() => { getGalleryCategories(true).then(setCategories); }, []);
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [selectedCategory]);

  const approvedImages = useMemo(
    () => galleryImages.filter(img => img.moderation_status === 'aprovado'),
    [galleryImages]
  );

  // Stable deterministic shuffle
  const shuffledImages = useMemo(() => {
    const arr = [...approvedImages];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + arr.length * 13) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [approvedImages]);

  const filteredImages = useMemo(() => {
    if (selectedCategory === 'all') return shuffledImages;
    const cat = categories.find(c => c.slug === selectedCategory);
    const maxPhotos = cat?.max_photos || 10;
    return approvedImages.filter(img => img.category === selectedCategory).slice(0, maxPhotos);
  }, [approvedImages, shuffledImages, selectedCategory, categories]);

  const displayedImages = filteredImages.slice(0, visibleCount);
  const hasMore = visibleCount < filteredImages.length;

  // Infinite scroll with IntersectionObserver
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    // Small delay to show loading indicator
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 200);
  }, [hasMore, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const categoryTabs = [
    { slug: 'all', name: 'Todos' },
    ...categories.map(c => ({ slug: c.slug, name: c.name })),
  ];

  const canUpload = (() => {
    if (!user) return false;
    const today = new Date().toISOString().split('T')[0];
    const todayUploads = galleryImages.filter(
      img => img.submitted_by_user_id === user.id && img.created_at?.split('T')[0] === today
    ).length;
    return todayUploads < (displayLimits?.userUploadPhotoDailyLimit || 1);
  })();

  const handleUploadSuccess = async (
    photoUrl: string,
    caption: string,
    category?: string,
    extra?: { petName?: string; ownerName?: string; submissionType?: string }
  ) => {
    if (!user) return;
    try {
      const isOfficialUpload = showAdmin && extra?.submissionType === 'oficial';
      await addPhoto({
        url: photoUrl,
        alt: caption || 'Foto enviada pelo cliente',
        caption,
        category: category || undefined,
        moderation_status: isOfficialUpload ? 'aprovado' : 'pendente',
        submitted_by_name: user.name,
        submitted_by_user_id: user.id,
        source: isOfficialUpload ? 'PETSHOP' : 'CLIENTE',
        owner_name: extra?.ownerName || user.name,
        pet_name: extra?.petName,
      });
      setUploadOpen(false);
      if (isOfficialUpload) {
        toast.success('Foto publicada na galeria com sucesso.');
      } else {
        setModerationOpen(true);
      }
    } catch (error) {
      console.error('handleUploadSuccess error:', error);
      toast.error('Não foi possível enviar a foto. Tente novamente.');
    }
  };

  if (galleryLoading && approvedImages.length === 0) return <GallerySkeleton />;

  return (
    <section id="fotos" className="py-20 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">{homeContent.gallery.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Conheça nosso espaço e veja alguns dos pets que já passaram por aqui</p>
          {showAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate('/admin/moderacao')} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted">
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Atalho para moderação (Admin)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {categoryTabs.map(cat => (
            <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${selectedCategory === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {isAuthenticated && (
          <div className="flex justify-center mb-6">
            <Button variant="outline" className="gap-2" onClick={() => {
              if (!canUpload) { toast.error('Você já atingiu o limite diário de envio de fotos.'); return; }
              setUploadOpen(true);
            }}>
              <Plus className="w-4 h-4" /> Enviar foto
            </Button>
          </div>
        )}

        {/* Gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {displayedImages.map((image, idx) => (
            <LazyGalleryCard key={image.id} image={image} onClick={() => setViewerIndex(idx)} />
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            {loadingMore && <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />}
          </div>
        )}

        {displayedImages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhuma foto encontrada nesta categoria.</div>
        )}

        <PhotoViewer
          images={displayedImages}
          initialIndex={viewerIndex}
          open={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
          showAdminActions={showAdmin}
        />

        <GalleryUploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSubmit={handleUploadSuccess}
          isAdmin={showAdmin}
        />

        <ModerationSuccessModal
          open={moderationOpen}
          onClose={() => setModerationOpen(false)}
          type="foto"
        />
      </div>
    </section>
  );
}

/* Memoized gallery card */
const LazyGalleryCard = React.memo(function LazyGalleryCard({ image, onClick }: { image: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="aspect-square bg-muted rounded-xl overflow-hidden group relative">
      <OptimizedImage
        src={image.url}
        alt={image.alt || ''}
        aspectRatio="square"
        className="rounded-xl"
      />
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-150" />
    </button>
  );
});
