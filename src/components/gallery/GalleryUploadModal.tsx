import { useState, useEffect } from 'react';
import { Upload, FileImage, Loader2, CheckCircle2, XCircle, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { toast } from 'sonner';
import { getGalleryCategories, GalleryCategoryRow } from '@/services/galleryCategoriesService';
import { validateImageFile, createImagePreview } from '@/lib/imageUtils';
import { uploadImageToStorage } from '@/lib/storageUtils';

interface GalleryUploadModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (photoUrl: string, caption: string, category?: string, extra?: { petName?: string; ownerName?: string; submissionType?: string }) => void | Promise<void>;
  isAdmin?: boolean;
}

const SUBMISSION_TYPES = [
  { value: 'oficial', label: 'Foto oficial do petshop' },
  { value: 'cliente', label: 'Foto de cliente (em análise)' },
  { value: 'antes-depois', label: 'Antes e depois (em análise)' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GalleryUploadModal({ open, onOpenChange, onSubmit, isAdmin }: GalleryUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState('');
  const [petName, setPetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [submissionType, setSubmissionType] = useState('oficial');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [categories, setCategories] = useState<GalleryCategoryRow[]>([]);
  const maxChars = 250;

  useEffect(() => { getGalleryCategories(true).then(setCategories); }, []);

  // iOS scroll lock bypass (safe guard to avoid mutation loop)
  useEffect(() => {
    if (!open) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isIOS) return;

    const enforceBodyScroll = () => {
      if (document.body.style.overflow !== 'auto') {
        document.body.style.overflow = 'auto';
      }
    };

    enforceBodyScroll();
    const observer = new MutationObserver(enforceBodyScroll);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Arquivo inválido');
      e.target.value = '';
      return;
    }

    try {
      // Salvar arquivo e criar preview
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(file.size);
      
      const preview = await createImagePreview(file);
      setPhotoPreview(preview);
    } catch (error) {
      console.error('handleFileChange error:', error);
      toast.error('Erro ao processar a imagem. Tente outra foto.');
      e.target.value = '';
      setSelectedFile(null);
      setPhotoPreview('');
      setFileName('');
      setFileSize(0);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !photoPreview) return;
    if (isAdmin && !photoType) return;

    setLoading(true);
    setUploadProgress('Convertendo para WebP...');
    
    try {
      // Upload para Storage com conversão automática
      setUploadProgress('Enviando imagem...');
      const { url } = await uploadImageToStorage(
        selectedFile,
        'gallery',
        undefined,
        { quality: 0.85 }
      );

      setUploadProgress('Salvando no banco...');
      await onSubmit(url, caption, photoType || undefined, {
        petName: petName || undefined,
        ownerName: ownerName || undefined,
        submissionType: isAdmin ? submissionType : undefined,
      });
      
      resetForm();
    } catch (error) {
      console.error('GalleryUploadModal submit error:', error);
      toast.error('Não foi possível enviar a foto. Tente novamente.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPhotoPreview(''); 
    setFileName(''); 
    setFileSize(0); 
    setCaption('');
    setPhotoType('');
    setPetName(''); 
    setOwnerName('');
    setSubmissionType('oficial'); 
    setLoading(false);
    setUploadProgress('');
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPhotoPreview(''); 
    setFileName(''); 
    setFileSize(0);
  };

  const canSubmit = photoPreview && (!isAdmin || photoType) && !loading;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleClose}
      title="Enviar Foto"
      description="Envie uma foto para a galeria do PetCão."
      icon={<ImagePlus className="w-5 h-5 text-primary" />}
      maxWidth="max-w-[640px]"
      stickyFooter={
        <Button className="w-full h-12 text-base font-semibold rounded-xl gap-2" onClick={handleSubmit} disabled={!canSubmit}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress || 'Enviando...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Enviar Foto
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* File upload card */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Selecionar imagem *</Label>
          {!fileName ? (
            <label className="flex flex-col items-center justify-center gap-3 w-full px-4 py-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileImage className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Toque para selecionar</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG ou WEBP</p>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
              <button onClick={removeFile} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Photo type - dynamic from gallery_categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">Tipo da foto {isAdmin && '*'}</Label>
            <Select value={photoType} onValueChange={setPhotoType}>
              <SelectTrigger className="h-12 rounded-xl text-base">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pet & Owner names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base">Nome do pet <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              value={petName}
              onChange={e => setPetName(e.target.value.slice(0, 60))}
              placeholder="Ex: Thor, Luna..."
              className="h-12 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Nome do dono <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              value={ownerName}
              onChange={e => setOwnerName(e.target.value.slice(0, 60))}
              placeholder="Nome do tutor"
              className="h-12 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label className="text-base">Observação <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value.slice(0, maxChars))}
            placeholder="Descreva a foto..."
            rows={3}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{caption.length}/{maxChars}</p>
        </div>

        {/* Submission type (admin only) */}
        {isAdmin && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">Enviar como</Label>
            <Select value={submissionType} onValueChange={setSubmissionType}>
              <SelectTrigger className="h-12 rounded-xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {submissionType === 'oficial'
                ? 'A foto será publicada diretamente na galeria.'
                : 'A foto será enviada para moderação antes de aparecer.'}
            </p>
          </div>
        )}

        {!isAdmin && (
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground text-center">📸 A foto será enviada para moderação antes de aparecer na galeria pública.</p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
