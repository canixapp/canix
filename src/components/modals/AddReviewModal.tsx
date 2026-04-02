import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAdmin } from '@/contexts/AdminContext';
import { toast } from 'sonner';

interface AddReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddReviewModal({ open, onOpenChange }: AddReviewModalProps) {
  const isMobile = useIsMobile();
  const { addReview, refreshReviews } = useAdmin();
  const [name, setName] = useState('');
  const [petName, setPetName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'aprovado' | 'pendente'>('aprovado');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(''); setPetName(''); setRating(5); setTitle(''); setComment(''); setStatus('aprovado');
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome do cliente é obrigatório.'); return; }
    if (!comment.trim()) { toast.error('Comentário é obrigatório.'); return; }
    setSaving(true);
    try {
      await addReview({
        name: name.trim(),
        pet_name: petName.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        moderation_status: status,
      } as any);
      await refreshReviews();
      toast.success('Avaliação criada com sucesso!');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Erro ao criar avaliação.');
    } finally {
      setSaving(false);
    }
  };

  const formContent = (
    <div className="space-y-4 p-1">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nome do cliente *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Silva" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nome do pet</Label>
        <Input value={petName} onChange={e => setPetName(e.target.value)} placeholder="Ex: Thor" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nota *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" onClick={() => setRating(i)} className="p-0.5">
              <Star className={`w-7 h-7 transition-colors ${i <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Título</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Excelente atendimento!" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Comentário *</Label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Escreva o comentário..." className="min-h-[80px]" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Status inicial</Label>
        <Select value={status} onValueChange={v => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aprovado">Aprovada</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Salvando...' : 'Salvar avaliação'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Adicionar Avaliação</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar Avaliação</DialogTitle></DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
