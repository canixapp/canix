import { useState, useCallback, useEffect } from 'react';
import { uploadImageToStorage } from '@/lib/storageUtils';
import { validateImageFile } from '@/lib/imageUtils';
import { Star, ChevronLeft, ChevronRight, MessageSquare, Store, Settings, Plus, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/hooks/useConfig';
import { useNavigate } from 'react-router-dom';
import { useHomeContent } from '@/hooks/useHomeContent';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';
import { getApprovedReviews, createReview, ReviewRow } from '@/services/reviewsService';
import { ModerationSuccessModal } from '@/components/modals/ModerationSuccessModal';
import { ReviewsSkeleton } from '@/components/skeletons/SectionSkeletons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export function ReviewsSection() {
  const { homeContent } = useHomeContent();
  const { isDev, isAdmin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { displayLimits } = useConfig();
  const maxReviews = displayLimits?.maxReviews || 10;
  const showAdmin = isDev() || isAdmin();

  // Fetch approved reviews directly (works for unauthenticated users too)
  const [approvedReviews, setApprovedReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    const data = await getApprovedReviews(maxReviews);
    setApprovedReviews(data);
    setReviewsLoading(false);
  }, [maxReviews]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState(''); // stores the final uploaded URL
  const [reviewPhotoFile, setReviewPhotoFile] = useState<File | null>(null);
  const [reviewPhotoUploading, setReviewPhotoUploading] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const handleSubmitReview = async () => {
    if (!comment.trim() || !user) return;
    const petName = user.pets?.[0]?.name || 'Meu pet';
    try {
      let uploadedPhotoUrl: string | undefined;
      if (reviewPhotoFile) {
        setReviewPhotoUploading(true);
        const { url } = await uploadImageToStorage(reviewPhotoFile, 'review-photos', undefined, {
          quality: 0.85,
          maxWidth: 1600,
          maxHeight: 1600,
        });
        uploadedPhotoUrl = url;
      }

      await createReview({
        name: user.name,
        pet_name: petName,
        rating,
        comment: comment.trim(),
        photos: uploadedPhotoUrl ? [uploadedPhotoUrl] : undefined,
        user_id: user.id,
      });
      setReviewOpen(false);
      setComment('');
      setRating(5);
      setReviewPhoto('');
      setReviewPhotoFile(null);
      setModerationOpen(true);
    } catch {
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setReviewPhotoUploading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || 'Arquivo inválido'); e.target.value = ''; return; }
    setReviewPhotoFile(file);
    // Show local preview immediately
    setReviewPhoto(URL.createObjectURL(file));
    e.target.value = '';
  };

  if (reviewsLoading) return <ReviewsSkeleton />;

  if (approvedReviews.length === 0) {
    return (
      <section id="avaliacoes" className="py-20 bg-muted/50 scroll-mt-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">{homeContent.reviews.title}</h2>
          <div className="max-w-md mx-auto py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">Ainda não temos avaliações.</p>
            {isAuthenticated && (
              <Button variant="outline" onClick={() => setReviewOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Seja o primeiro a avaliar
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="avaliacoes" className="py-20 bg-muted/50 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">{homeContent.reviews.title}</h2>
          <p className="text-lg text-muted-foreground">{homeContent.reviews.subtitle}</p>
          {showAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate('/admin/moderacao')}
                    className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Atalho para moderação (Admin)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {isAuthenticated && (
          <div className="flex justify-center mb-6">
            <Button variant="outline" className="gap-2" onClick={() => setReviewOpen(true)}>
              <Plus className="w-4 h-4" /> Avaliar
            </Button>
          </div>
        )}

        <div className="max-w-2xl mx-auto relative">
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-card flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 rounded-full bg-background border border-border shadow-card flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {approvedReviews.map((review) => (
                <div key={review.id} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="text-center py-8 px-6">
                    <div className="flex justify-center gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <blockquote className="text-lg md:text-xl text-foreground leading-relaxed mb-6 font-light italic">
                      "{review.comment}"
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{review.name.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-sm">{review.name}</p>
                        <p className="text-xs text-muted-foreground">Pet: {review.pet_name}</p>
                      </div>
                    </div>
                    {review.shop_response && (
                      <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-primary">Resposta do PetCão</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.shop_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {approvedReviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === selectedIndex ? 'bg-primary w-6' : 'bg-border hover:bg-muted-foreground/30'
                }`}
                aria-label={`Ir para avaliação ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar o PetCão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nota</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setRating(i + 1)} className="p-0.5">
                    <Star className={`w-7 h-7 transition-colors ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground hover:text-warning/50'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário *</Label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 250))}
                placeholder="Como foi sua experiência?"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{comment.length}/250</p>
            </div>
            <div className="space-y-2">
              <Label>Foto do pet (opcional)</Label>
              <Input type="file" accept="image/*" onChange={handlePhotoChange} className="text-base" />
              {reviewPhoto && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <OptimizedImage src={reviewPhoto} alt="Preview" className="w-full h-full" showSkeleton={false} />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Sua avaliação será enviada para moderação antes de ser publicada.</p>
            <Button className="w-full" onClick={handleSubmitReview} disabled={!comment.trim() || reviewPhotoUploading}>
              {reviewPhotoUploading ? 'Enviando foto...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ModerationSuccessModal
        open={moderationOpen}
        onClose={() => setModerationOpen(false)}
        type="avaliação"
      />
    </section>
  );
}
