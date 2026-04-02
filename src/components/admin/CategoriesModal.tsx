import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPicker } from '@/components/admin/IconPicker';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { Plus, Trash2, Edit2, Check, X, Loader2, FolderOpen, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DEFAULT_CATEGORIES, getAllCategories, getIconComponent,
  CATEGORY_COLOR_PRESETS, ServiceCategory
} from '@/lib/serviceCategories';

interface CategoriesModalProps {
  open: boolean;
  onClose: () => void;
  customCategories: ServiceCategory[];
  onSave: (categories: ServiceCategory[]) => Promise<boolean>;
  serviceCounts: Record<string, number>;
}

export function CategoriesModal({ open, onClose, customCategories, onSave, serviceCounts }: CategoriesModalProps) {
  const allCategories = getAllCategories(customCategories);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ label: string; icon: string; colorIdx: number }>({ label: '', icon: 'scissors', colorIdx: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('scissors');
  const [newColorIdx, setNewColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const findColorIdx = (cat: ServiceCategory) => {
    return CATEGORY_COLOR_PRESETS.findIndex(p => p.gradient === cat.gradient);
  };

  const startEdit = (cat: ServiceCategory) => {
    setEditingValue(cat.value);
    setEditForm({
      label: cat.label,
      icon: cat.icon,
      colorIdx: Math.max(0, findColorIdx(cat)),
    });
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingValue(null);
  };

  const saveEdit = async () => {
    if (!editingValue) return;
    const label = editForm.label.trim();
    if (!label) { toast.error('Nome obrigatório'); return; }

    setSaving(true);
    const preset = CATEGORY_COLOR_PRESETS[editForm.colorIdx];
    const updatedCat: ServiceCategory = {
      value: editingValue,
      label,
      icon: editForm.icon,
      color: preset.color,
      gradient: preset.gradient,
      glow: preset.glow,
      bgBadge: preset.bgBadge,
    };

    const isDefault = DEFAULT_CATEGORIES.some(c => c.value === editingValue);
    let updated: ServiceCategory[];

    if (isDefault) {
      const existing = customCategories.filter(c => c.value !== editingValue);
      updated = [...existing, updatedCat];
    } else {
      updated = customCategories.map(c => c.value === editingValue ? updatedCat : c);
    }

    const ok = await onSave(updated);
    if (ok) {
      toast.success(`Categoria "${label}" atualizada!`);
      setEditingValue(null);
    } else {
      toast.error('Erro ao salvar');
    }
    setSaving(false);
  };

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) { toast.error('Nome obrigatório'); return; }
    const value = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (allCategories.some(c => c.value === value)) {
      toast.error('Já existe uma categoria com esse nome');
      return;
    }
    setSaving(true);
    const preset = CATEGORY_COLOR_PRESETS[newColorIdx];
    const newCat: ServiceCategory = {
      value, label, icon: newIcon,
      color: preset.color, gradient: preset.gradient, glow: preset.glow, bgBadge: preset.bgBadge,
    };
    const ok = await onSave([...customCategories, newCat]);
    if (ok) {
      toast.success(`Categoria "${label}" criada!`);
      setNewLabel('');
      setNewIcon('scissors');
      setNewColorIdx(0);
      setShowCreate(false);
    } else {
      toast.error('Erro ao criar');
    }
    setSaving(false);
  };

  const handleDelete = async (value: string) => {
    const count = serviceCounts[value] || 0;
    if (count > 0) {
      toast.error(`Não é possível excluir: ${count} serviço(s) usam esta categoria`);
      return;
    }
    setSaving(true);
    const updated = customCategories.filter(c => c.value !== value);
    const ok = await onSave(updated);
    if (ok) toast.success('Categoria excluída');
    else toast.error('Erro ao excluir');
    setSaving(false);
  };

  const isCustomOnly = (value: string) => !DEFAULT_CATEGORIES.some(c => c.value === value);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={v => !v && onClose()}
      title="Categorias"
      description="Gerencie as categorias de serviços do petshop"
      icon={<FolderOpen className="w-5 h-5 text-primary" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-2 pb-4">
        {allCategories.map(cat => {
          const CatIcon = getIconComponent(cat.icon);
          const count = serviceCounts[cat.value] || 0;
          const isEditing = editingValue === cat.value;
          const isCustom = isCustomOnly(cat.value);

          if (isEditing) {
            return (
              <div key={cat.value} className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Editando categoria</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit} disabled={saving}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEdit} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={editForm.label}
                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cor</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setEditForm({ ...editForm, colorIdx: idx })}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          `bg-gradient-to-br ${preset.gradient}`,
                          editForm.colorIdx === idx ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'
                        )}
                      >
                        <span className="text-white text-[10px] font-bold">{preset.label.charAt(0)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <IconPicker value={editForm.icon} onChange={icon => setEditForm({ ...editForm, icon })} label="Ícone" compact />
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border/30">
                  <div className={cn("p-2 rounded-lg", `bg-gradient-to-br ${CATEGORY_COLOR_PRESETS[editForm.colorIdx].gradient}`)}>
                    {(() => { const I = getIconComponent(editForm.icon); return <I className="w-4 h-4 text-white" />; })()}
                  </div>
                  <span className="font-semibold text-sm">{editForm.label || '...'}</span>
                  <Badge variant="outline" className={cn("text-[10px]", CATEGORY_COLOR_PRESETS[editForm.colorIdx].bgBadge)}>
                    {editForm.label || '...'}
                  </Badge>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.value}
              className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-2 rounded-lg shrink-0", `bg-gradient-to-br ${cat.gradient}`)}>
                  <CatIcon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{cat.label}</span>
                    {!isCustom && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">padrão</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{count} serviço{count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)} title="Editar">
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {isCustom && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.value)}
                    title="Excluir"
                    disabled={saving}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate ? (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">Nova categoria</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Hidratação" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setNewColorIdx(idx)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    `bg-gradient-to-br ${preset.gradient}`,
                    newColorIdx === idx ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'
                  )}
                >
                  <span className="text-white text-[10px] font-bold">{preset.label.charAt(0)}</span>
                </button>
              ))}
            </div>
          </div>
          <IconPicker value={newIcon} onChange={setNewIcon} label="Ícone" compact />
          <Button className="w-full h-10" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FolderPlus className="w-4 h-4 mr-2" />}
            Criar Categoria
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2 mb-4 border-dashed"
          onClick={() => { setShowCreate(true); setEditingValue(null); }}
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </Button>
      )}
    </ResponsiveModal>
  );
}
