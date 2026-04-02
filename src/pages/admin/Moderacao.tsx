import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useConfig } from '@/hooks/useConfig';
import * as galleryService from '@/services/galleryService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs, premiumTabClass, premiumTabListClass } from '@/components/ui/scrollable-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GalleryUploadModal } from '@/components/gallery/GalleryUploadModal';
import { AddReviewModal } from '@/components/modals/AddReviewModal';
import {
  CheckCircle2, XCircle, Image, Star, Plus, ChevronLeft, ChevronRight,
  Shield, Clock, Camera, MessageSquare, Sparkles, ImageOff, MessageCircleOff
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ModerationStatus = 'pendente' | 'aprovado' | 'rejeitado';

const STATUS_LABELS: Record<ModerationStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const STATUS_COLORS: Record<ModerationStatus, string> = {
  pendente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  aprovado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  rejeitado: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Moderacao() {
  const { galleryImages, reviewsList, approvePhoto, rejectPhoto, approveReview, rejectReview, addPhoto, setShopResponse, refreshGallery } = useAdmin();
  const { displayLimits } = useConfig();
  const pageSize = displayLimits.moderationPageSizePhotos || 10;
  const reviewPageSize = displayLimits.moderationPageSizeReviews || 10;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [photoCategorySelections, setPhotoCategorySelections] = useState<Record<string, string>>({});

  const [photoFilter, setPhotoFilter] = useState<'todas' | ModerationStatus>('todas');
  const [photoPage, setPhotoPage] = useState(0);

  const [reviewFilter, setReviewFilter] = useState<'todas' | ModerationStatus>('todas');
  const [reviewPage, setReviewPage] = useState(0);

  const pendingPhotos = galleryImages.filter(img => img.moderation_status === 'pendente');
  const pendingReviews = reviewsList.filter(r => r.moderation_status === 'pendente');
  const approvedPhotos = galleryImages.filter(img => img.moderation_status === 'aprovado');
  const approvedReviews = reviewsList.filter(r => r.moderation_status === 'aprovado');

  const filteredPhotos = photoFilter === 'todas'
    ? galleryImages
    : galleryImages.filter(img => img.moderation_status === photoFilter);
  const totalPhotoPages = Math.ceil(filteredPhotos.length / pageSize);
  const pagedPhotos = filteredPhotos.slice(photoPage * pageSize, (photoPage + 1) * pageSize);

  const filteredReviews = reviewFilter === 'todas'
    ? reviewsList
    : reviewsList.filter(r => r.moderation_status === reviewFilter);
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewPageSize);
  const pagedReviews = filteredReviews.slice(reviewPage * reviewPageSize, (reviewPage + 1) * reviewPageSize);

  const updatePhotoCategory = async (id: string, category: string) => {
    await galleryService.updateGalleryPhoto(id, { category });
    refreshGallery();
  };

  const handleUploadSubmit = async (
    photoPreview: string,
    caption: string,
    category?: string,
    extra?: { petName?: string; ownerName?: string; submissionType?: string }
  ) => {
    try {
      const isOfficialUpload = (extra?.submissionType ?? 'oficial') === 'oficial';
      await addPhoto({
        url: photoPreview,
        alt: extra?.petName || 'Foto do petshop',
        category: category || undefined,
        moderation_status: isOfficialUpload ? 'aprovado' : 'pendente',
        submitted_by_name: extra?.ownerName || 'Admin',
        source: isOfficialUpload ? 'PETSHOP' : 'CLIENTE',
        pet_name: extra?.petName,
        owner_name: extra?.ownerName,
        caption,
      });
      setUploadOpen(false);
      toast.success(isOfficialUpload ? 'Foto publicada com sucesso.' : 'Foto enviada para moderação.');
    } catch (error) {
      console.error('handleUploadSubmit error:', error);
      toast.error('Não foi possível enviar a foto. Tente novamente.');
    }
  };

  const handleSaveResponse = (reviewId: string) => {
    const text = responseTexts[reviewId];
    if (text?.trim()) {
      setShopResponse(reviewId, text.trim());
    }
  };

  // ─── Shared Sub-Components ───

  const FilterChips = ({ value, onChange, options }: { value: string; onChange: (v: any) => void; options: { label: string; value: string }[] }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all duration-200',
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
              : 'bg-muted/50 backdrop-blur-sm text-muted-foreground border-border/30 hover:border-primary/40 hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const Pagination = ({ page, total, onPrev, onNext }: { page: number; total: number; onPrev: () => void; onNext: () => void }) => (
    total > 1 ? (
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 0} className="rounded-full w-9 h-9 p-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium tabular-nums">
          {page + 1} <span className="text-muted-foreground/50">de</span> {total}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= total - 1} className="rounded-full w-9 h-9 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    ) : null
  );

  const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) => (
    <div className="text-center py-16 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
        <Icon className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/60">{description}</p>}
    </div>
  );

  // ─── Photo Card ───
  const PhotoCard = ({ img, showActions, showCategoryEdit }: { img: typeof galleryImages[0]; showActions: boolean; showCategoryEdit?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 rounded-2xl group">
        <div className="aspect-square bg-muted overflow-hidden relative">
          <OptimizedImage src={img.url} alt={img.alt || ''} className="w-full h-full group-hover:scale-105 transition-transform duration-500" aspectRatio="square" />
          {/* Status overlay badge */}
          <div className={cn(
            'absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm',
            STATUS_COLORS[img.moderation_status as ModerationStatus] || ''
          )}>
            {STATUS_LABELS[img.moderation_status as ModerationStatus] || img.moderation_status}
          </div>
          {img.source && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-sm border border-border/30 text-foreground/80">
              {img.source === 'PETSHOP' ? '📷 Oficial' : '👤 Cliente'}
            </div>
          )}
        </div>
        <CardContent className="p-3.5 space-y-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground truncate">{img.alt || 'Sem título'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {img.pet_name && <span className="text-xs text-muted-foreground">🐾 {img.pet_name}</span>}
              {img.owner_name && <span className="text-xs text-muted-foreground">• {img.owner_name}</span>}
            </div>
            {img.created_at && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {img.created_at.split('T')[0]}
              </p>
            )}
          </div>

          {showActions && img.moderation_status === 'pendente' && (
            <div className="space-y-2 pt-1">
              <Select
                value={photoCategorySelections[img.id] || ''}
                onValueChange={(v) => setPhotoCategorySelections(prev => ({ ...prev, [img.id]: v }))}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Tipo da foto *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambiente">🏠 Ambientes</SelectItem>
                  <SelectItem value="antes-depois">✨ Antes e Depois</SelectItem>
                  <SelectItem value="pets">🐶 Pets</SelectItem>
                  <SelectItem value="outro">📌 Outro</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-9 rounded-xl gap-1.5 shadow-sm"
                  disabled={!photoCategorySelections[img.id]}
                  onClick={() => {
                    approvePhoto(img.id, photoCategorySelections[img.id]);
                    setPhotoCategorySelections(prev => { const n = { ...prev }; delete n[img.id]; return n; });
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl gap-1.5 text-destructive hover:text-destructive" onClick={() => rejectPhoto(img.id)}>
                  <XCircle className="w-3.5 h-3.5" /> Rejeitar
                </Button>
              </div>
            </div>
          )}

          {showCategoryEdit && img.moderation_status === 'aprovado' && (
            <Select value={img.category || ''} onValueChange={(v) => updatePhotoCategory(img.id, v)}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambiente">🏠 Ambientes</SelectItem>
                <SelectItem value="antes-depois">✨ Antes e Depois</SelectItem>
                <SelectItem value="pets">🐶 Pets</SelectItem>
                <SelectItem value="outro">📌 Outro</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // ─── Review Card ───
  const ReviewCard = ({ review, showActions }: { review: typeof reviewsList[0]; showActions: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{review.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{review.name}</p>
                  {review.pet_name && <p className="text-xs text-muted-foreground">🐾 {review.pet_name}</p>}
                </div>
                <Badge variant="outline" className={cn('text-[10px] font-bold', STATUS_COLORS[review.moderation_status as ModerationStatus] || '')}>
                  {STATUS_LABELS[review.moderation_status as ModerationStatus] || review.moderation_status}
                </Badge>
              </div>

              {review.title && <p className="text-sm font-medium text-foreground">{review.title}</p>}

              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')} />
                ))}
                <span className="text-xs text-muted-foreground ml-2">{review.rating}/5</span>
              </div>

              {review.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-xl p-3 border border-border/20">
                  "{review.comment}"
                </p>
              )}

              <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {review.created_at?.split('T')[0]}
              </p>

              {review.shop_response && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Resposta do PetCão
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{review.shop_response}</p>
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Button size="sm" className="rounded-xl gap-1.5 shadow-sm" onClick={() => approveReview(review.id)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive hover:text-destructive" onClick={() => rejectReview(review.id)}>
                  <XCircle className="w-3.5 h-3.5" /> Rejeitar
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border/30 pt-3">
            <Label className="text-xs font-semibold text-muted-foreground">Responder avaliação</Label>
            <Textarea
              placeholder="Escreva uma resposta para esta avaliação..."
              value={responseTexts[review.id] ?? review.shop_response ?? ''}
              onChange={(e) => setResponseTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
              className="min-h-[60px] rounded-xl text-sm resize-none"
            />
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => handleSaveResponse(review.id)}>
              <MessageSquare className="w-3.5 h-3.5" /> Salvar resposta
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ─── Stats ───
  const stats = [
    { label: 'Fotos Pend.', fullLabel: 'Fotos Pendentes', value: pendingPhotos.length, icon: Camera, color: 'text-amber-500', bg: 'bg-amber-500/10', glow: pendingPhotos.length > 0 },
    { label: 'Aval. Pend.', fullLabel: 'Avaliações Pendentes', value: pendingReviews.length, icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-500/10', glow: pendingReviews.length > 0 },
    { label: 'Fotos Aprov.', fullLabel: 'Fotos Aprovadas', value: approvedPhotos.length, icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Aval. Aprov.', fullLabel: 'Avaliações Aprovadas', value: approvedReviews.length, icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Premium Header ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Galeria e Avaliações</h1>
            <p className="text-sm text-muted-foreground">Moderação de conteúdo — apenas itens aprovados são exibidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} className="gap-2 shadow-lg shadow-primary/20 rounded-xl flex-1 sm:flex-none">
            <Camera className="w-4 h-4" /> Enviar Foto
          </Button>
          <Button variant="outline" onClick={() => setAddReviewOpen(true)} className="gap-2 rounded-xl flex-1 sm:flex-none">
            <Star className="w-4 h-4" /> Nova Avaliação
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.fullLabel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn(
              "border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl transition-all h-full",
              s.glow && "ring-1 ring-amber-500/20 border-amber-500/20"
            )}>
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-1.5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-tight">{s.fullLabel}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="fotos" className="w-full">
        <ScrollableTabs>
          <TabsList className={premiumTabListClass}>
            <TabsTrigger value="fotos" className={premiumTabClass}>
              <Camera className="w-3.5 h-3.5" /> Pendentes
              {pendingPhotos.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 inline-flex items-center justify-center">
                  {pendingPhotos.length + pendingReviews.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="todas-fotos" className={premiumTabClass}>
              <Image className="w-3.5 h-3.5" /> Fotos ({galleryImages.length})
            </TabsTrigger>
            <TabsTrigger value="todas-avaliacoes" className={premiumTabClass}>
              <Star className="w-3.5 h-3.5" /> Avaliações ({reviewsList.length})
            </TabsTrigger>
          </TabsList>
        </ScrollableTabs>

        {/* ── Pendentes (unified) ── */}
        <TabsContent value="fotos" className="space-y-6 mt-5">
          {/* Pending Photos */}
          {pendingPhotos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Fotos Pendentes</h3>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">{pendingPhotos.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pendingPhotos.map((img) => (
                  <PhotoCard key={img.id} img={img} showActions />
                ))}
              </div>
            </div>
          )}

          {/* Pending Reviews */}
          {pendingReviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Avaliações Pendentes</h3>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">{pendingReviews.length}</Badge>
              </div>
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showActions />
                ))}
              </div>
            </div>
          )}

          {pendingPhotos.length === 0 && pendingReviews.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="Tudo em dia!"
              description="Não há conteúdo pendente de moderação"
            />
          )}
        </TabsContent>

        {/* ── All Photos ── */}
        <TabsContent value="todas-fotos" className="space-y-4 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <FilterChips
              value={photoFilter}
              onChange={(v: any) => { setPhotoFilter(v); setPhotoPage(0); }}
              options={[
                { label: 'Todas', value: 'todas' },
                { label: 'Pendentes', value: 'pendente' },
                { label: 'Aprovadas', value: 'aprovado' },
                { label: 'Rejeitadas', value: 'rejeitado' },
              ]}
            />
            <span className="text-xs text-muted-foreground font-medium tabular-nums">{filteredPhotos.length} foto(s)</span>
          </div>

          {pagedPhotos.length === 0 ? (
            <EmptyState icon={ImageOff} title="Nenhuma foto encontrada" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pagedPhotos.map((img) => (
                <PhotoCard key={img.id} img={img} showActions showCategoryEdit />
              ))}
            </div>
          )}

          <Pagination
            page={photoPage}
            total={totalPhotoPages}
            onPrev={() => setPhotoPage(p => Math.max(0, p - 1))}
            onNext={() => setPhotoPage(p => Math.min(totalPhotoPages - 1, p + 1))}
          />
        </TabsContent>

        {/* ── All Reviews ── */}
        <TabsContent value="todas-avaliacoes" className="space-y-4 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <FilterChips
              value={reviewFilter}
              onChange={(v: any) => { setReviewFilter(v); setReviewPage(0); }}
              options={[
                { label: 'Todas', value: 'todas' },
                { label: 'Pendentes', value: 'pendente' },
                { label: 'Aprovadas', value: 'aprovado' },
                { label: 'Rejeitadas', value: 'rejeitado' },
              ]}
            />
            <span className="text-xs text-muted-foreground font-medium tabular-nums">{filteredReviews.length} avaliação(ões)</span>
          </div>

          {pagedReviews.length === 0 ? (
            <EmptyState icon={MessageCircleOff} title="Nenhuma avaliação encontrada" />
          ) : (
            <div className="space-y-3">
              {pagedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} showActions={review.moderation_status === 'pendente'} />
              ))}
            </div>
          )}

          <Pagination
            page={reviewPage}
            total={totalReviewPages}
            onPrev={() => setReviewPage(p => Math.max(0, p - 1))}
            onNext={() => setReviewPage(p => Math.min(totalReviewPages - 1, p + 1))}
          />
        </TabsContent>
      </Tabs>

      <GalleryUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleUploadSubmit}
        isAdmin={true}
      />

      <AddReviewModal
        open={addReviewOpen}
        onOpenChange={setAddReviewOpen}
      />
    </div>
  );
}
