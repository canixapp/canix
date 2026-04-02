import { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs, premiumTabClass, premiumTabListClass } from '@/components/ui/scrollable-tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, Edit2, Scissors, GripVertical, Eye, Clock, DollarSign,
  Sparkles, Bath, Dog, Star, Copy, Save, CheckCircle2, Loader2,
  TrendingUp, Package, AlertCircle, ChevronRight, FolderOpen
} from 'lucide-react';
import { ServiceRow } from '@/services/servicesService';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getAllCategories, getCategoryByValue, getIconComponent,
  ServiceCategory
} from '@/lib/serviceCategories';
import { IconPicker } from '@/components/admin/IconPicker';
import { CategoriesModal } from '@/components/admin/CategoriesModal';

type SizeKey = 'pequeno' | 'medio' | 'grande';
const sizeLabels: { key: SizeKey; label: string; emoji: string }[] = [
  { key: 'pequeno', label: 'Pequeno', emoji: '🐕' },
  { key: 'medio', label: 'Médio', emoji: '🐕‍🦺' },
  { key: 'grande', label: 'Grande', emoji: '🦮' },
];

// ─── Sortable Service Card ───
function SortableServiceCard({ service, categories, onEdit, onDelete, onToggleActive, onPreview, onDuplicate, priceDraft, onPriceChange, isDirty }: {
  service: ServiceRow;
  categories: ServiceCategory[];
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  priceDraft: { price_pequeno: number; price_medio: number; price_grande: number };
  onPriceChange: (size: SizeKey, value: string) => void;
  isDirty: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const catInfo = getCategoryByValue(service.category, categories);
  const Icon = getIconComponent(service.icon || catInfo.icon);
  const [priceOpen, setPriceOpen] = useState(false);

  return (
    <motion.div ref={setNodeRef} style={style} layout className={cn("group", isDragging && "z-50")}>
      <Card className={cn(
        "border shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden",
        isDragging && "shadow-xl ring-2 ring-primary/20",
        !service.active && "opacity-50",
        isDirty && "ring-2 ring-amber-500/20 border-amber-500/30"
      )}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center w-8 sm:w-10 bg-muted/30 cursor-grab active:cursor-grabbing border-r hover:bg-muted/50 transition-colors shrink-0"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0 p-3 sm:p-4">
              {/* ── Top row: icon + name + toggle/edit ── */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className={cn("p-2 rounded-xl shrink-0", `bg-gradient-to-br ${catInfo.gradient}`)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate leading-tight">{service.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", catInfo.bgBadge)}>{catInfo.label}</Badge>
                      {!service.active && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inativo</Badge>}
                      {isDirty && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30 bg-amber-500/10">Alterado</Badge>}
                    </div>
                  </div>
                </div>

                {/* Desktop actions */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <Switch checked={service.active !== false} onCheckedChange={onToggleActive} className="data-[state=checked]:bg-green-500" />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview} title="Visualizar"><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} title="Duplicar"><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
                </div>
                {/* Mobile: only toggle + edit */}
                <div className="flex sm:hidden items-center gap-0.5 shrink-0">
                  <Switch checked={service.active !== false} onCheckedChange={onToggleActive} className="data-[state=checked]:bg-green-500 scale-90" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              {/* ── Description ── */}
              {service.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{service.description}</p>
              )}

              {/* ── Meta: duration + prices ── */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{service.duration_minutes || 60} min</span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 truncate">
                  <DollarSign className="w-3 h-3 shrink-0" />
                  <span className="truncate">P: R${priceDraft.price_pequeno} · M: R${priceDraft.price_medio} · G: R${priceDraft.price_grande}</span>
                </span>
              </div>

              {/* ── Inline price editor toggle ── */}
              <button
                onClick={() => setPriceOpen(!priceOpen)}
                className="flex items-center gap-1 mt-2.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Editar valores
                <motion.div animate={{ rotate: priceOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              </button>

              <AnimatePresence>
                {priceOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-border/40">
                      {sizeLabels.map(({ key, label, emoji }) => {
                        const priceKey = key === 'pequeno' ? 'price_pequeno' : key === 'medio' ? 'price_medio' : 'price_grande';
                        return (
                          <div key={key} className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground font-medium">
                              {emoji} {label}
                            </Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-semibold text-muted-foreground">R$</span>
                              <Input
                                type="number"
                                min={0}
                                step={5}
                                value={priceDraft[priceKey] ?? 0}
                                onChange={e => onPriceChange(key, e.target.value)}
                                className="pl-7 sm:pl-10 h-9 rounded-lg text-sm font-semibold tabular-nums"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Mobile bottom actions ── */}
              <div className="flex sm:hidden items-center justify-between mt-2.5 pt-2 border-t border-border/30">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-2.5" onClick={onPreview}><Eye className="w-3.5 h-3.5" />Ver</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-2.5" onClick={onDuplicate}><Copy className="w-3.5 h-3.5" />Duplicar</Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-2.5 text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" />Excluir</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Preview Card ───
function ServicePreviewCard({ service, categories }: { service: ServiceRow; categories: ServiceCategory[] }) {
  const catInfo = getCategoryByValue(service.category, categories);
  const Icon = getIconComponent(service.icon || catInfo.icon);
  return (
    <div className="border rounded-2xl p-6 bg-card shadow-lg max-w-sm w-full">
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", `bg-gradient-to-br ${catInfo.gradient}`)}>
          <Icon className={cn("w-6 h-6 text-white")} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{service.name}</h3>
          <Badge variant="outline" className="mt-1 text-xs">{catInfo.label}</Badge>
        </div>
      </div>
      {service.description && <p className="text-muted-foreground mt-4 text-sm">{service.description}</p>}
      <div className="mt-4 space-y-2">
        {sizeLabels.map(({ key, label, emoji }) => {
          const val = key === 'pequeno' ? service.price_pequeno : key === 'medio' ? service.price_medio : service.price_grande;
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{emoji} {label}</span>
              <span className="font-semibold">R$ {val || 0}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="w-4 h-4" />
        <span>Duração: ~{service.duration_minutes || 60} minutos</span>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function Servicos() {
  const { servicesList, addService, updateService, deleteService, refreshServices, servicesLoading } = useAdmin();
  const { settings, updateSettings } = usePetshop();
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewService, setPreviewService] = useState<ServiceRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Category management
  const [catDialogOpen, setCatDialogOpen] = useState(false);

  const customCategories = (settings.custom_categories || []) as ServiceCategory[];
  const allCategories = getAllCategories(customCategories);

  // Price drafts for inline editing
  const [drafts, setDrafts] = useState<Record<string, { price_pequeno: number; price_medio: number; price_grande: number }>>({});
  const [dirtyPrices, setDirtyPrices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const d: typeof drafts = {};
    servicesList.forEach(s => {
      d[s.id] = { price_pequeno: s.price_pequeno ?? 0, price_medio: s.price_medio ?? 0, price_grande: s.price_grande ?? 0 };
    });
    setDrafts(d);
    setDirtyPrices(new Set());
  }, [servicesList]);

  const handlePriceChange = (id: string, size: SizeKey, value: string) => {
    const num = value === '' ? 0 : Number(value);
    const key = size === 'pequeno' ? 'price_pequeno' : size === 'medio' ? 'price_medio' : 'price_grande';
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: num } }));
    setDirtyPrices(prev => new Set(prev).add(id));
  };

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      await Promise.all(Array.from(dirtyPrices).map(id => {
        const d = drafts[id];
        if (!d) return Promise.resolve();
        return updateService(id, d);
      }));
      setDirtyPrices(new Set());
      toast.success('Valores salvos! Já estão visíveis no site.');
    } catch {
      toast.error('Erro ao salvar valores');
    } finally {
      setSaving(false);
    }
  };

  const [form, setForm] = useState<Omit<ServiceRow, 'id' | 'petshop_id'>>({
    name: '', description: '', icon: 'scissors', category: 'banho',
    price_pequeno: 0, price_medio: 0, price_grande: 0,
    duration_minutes: 60, active: true, sort_order: 0
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return servicesList;
    if (activeCategory === '__inactive') return servicesList.filter(s => s.active === false);
    return servicesList.filter(s => s.category === activeCategory);
  }, [servicesList, activeCategory]);

  const stats = useMemo(() => {
    const active = servicesList.filter(s => s.active !== false);
    const avgPrice = active.length > 0
      ? Math.round(active.reduce((sum, s) => sum + ((s.price_pequeno || 0) + (s.price_medio || 0) + (s.price_grande || 0)) / 3, 0) / active.length)
      : 0;
    return { total: servicesList.length, active: active.length, inactive: servicesList.length - active.length, avgPrice };
  }, [servicesList]);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '', description: '', icon: 'scissors', category: 'banho',
      price_pequeno: 0, price_medio: 0, price_grande: 0,
      duration_minutes: 60, active: true, sort_order: servicesList.length
    });
    setEditOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setEditingId(s.id);
    setForm({
      name: s.name, description: s.description || '', icon: s.icon || 'scissors',
      category: s.category, price_pequeno: s.price_pequeno || 0, price_medio: s.price_medio || 0,
      price_grande: s.price_grande || 0, duration_minutes: s.duration_minutes || 60,
      active: s.active ?? true, sort_order: s.sort_order || 0
    });
    setEditOpen(true);
  };

  const handleDuplicate = async (s: ServiceRow) => {
    try {
      await addService({
        name: `${s.name} (cópia)`, description: s.description, icon: s.icon,
        category: s.category, price_pequeno: s.price_pequeno, price_medio: s.price_medio,
        price_grande: s.price_grande, duration_minutes: s.duration_minutes,
        active: false, sort_order: servicesList.length
      });
      toast.success('Serviço duplicado (inativo)');
    } catch { toast.error('Erro ao duplicar'); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          name: form.name,
          description: form.description,
          icon: form.icon,
          category: form.category,
          price_pequeno: form.price_pequeno,
          price_medio: form.price_medio,
          price_grande: form.price_grande,
          duration_minutes: form.duration_minutes,
          active: form.active,
          sort_order: form.sort_order,
        };
        await updateService(editingId, payload);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await addService(form);
        toast.success('Serviço criado! Já disponível no site.');
      }
      setEditOpen(false);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('check constraint') || msg.includes('category')) {
        toast.error('Categoria inválida. Verifique se o tipo selecionado é válido.');
      } else {
        toast.error(`Falha ao salvar: ${msg}`);
      }
      console.error('Save error:', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteService(deleteId); toast.success('Serviço excluído'); setDeleteId(null); }
    catch { toast.error('Erro ao excluir'); }
  };

  const handleToggleActive = async (service: ServiceRow) => {
    try {
      await updateService(service.id, { active: !service.active });
      toast.success(service.active ? 'Desativado — removido do site' : 'Ativado — visível no site');
    } catch { toast.error('Erro ao alterar status'); }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filteredServices.findIndex(s => s.id === active.id);
    const newIndex = filteredServices.findIndex(s => s.id === over.id);
    const reordered = arrayMove(filteredServices, oldIndex, newIndex);
    try {
      await Promise.all(reordered.map((s, idx) => updateService(s.id, { sort_order: idx })));
      await refreshServices();
      toast.success('Ordem atualizada');
    } catch { toast.error('Erro ao reordenar'); }
  };

  // ── Category save handler ──
  const handleSaveCategories = async (cats: ServiceCategory[]) => {
    return await updateSettings({ custom_categories: cats });
  };

  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    servicesList.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
  }, [servicesList]);

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
            <Scissors className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Serviços e Valores</h1>
            <p className="text-sm text-muted-foreground">Gerencie serviços, categorias e preços do petshop</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dirtyPrices.size > 0 && (
            <Button
              variant="outline"
              className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              onClick={handleSavePrices}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Valores ({dirtyPrices.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setCatDialogOpen(true)} className="gap-2">
            <FolderOpen className="w-4 h-4" /> Categorias
          </Button>
          <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Serviço</span><span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Inativos', value: stats.inactive, icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted/50' },
          { label: 'Preço Médio', value: `R$ ${stats.avgPrice}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/30 bg-card/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Sync Banner ── */}
      <Card className="border-primary/20 bg-primary/5 rounded-2xl">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary">Sincronização automática com o site</p>
            <p className="text-muted-foreground">Serviços ativos, valores e ordem de exibição são atualizados em tempo real na página pública.</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Category Tabs ── */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <ScrollableTabs>
          <TabsList className={premiumTabListClass}>
            <TabsTrigger value="all" className={premiumTabClass}>Todos ({servicesList.length})</TabsTrigger>
            {allCategories.map(cat => {
              const count = servicesList.filter(s => s.category === cat.value).length;
              if (count === 0 && !customCategories.some(c => c.value === cat.value)) return null;
              const CatIcon = getIconComponent(cat.icon);
              return (
                <TabsTrigger key={cat.value} value={cat.value} className={premiumTabClass}>
                  <CatIcon className="w-3.5 h-3.5" />
                  {cat.label} ({count})
                </TabsTrigger>
              );
            })}
            {(() => {
              const inactiveCount = servicesList.filter(s => s.active === false).length;
              return inactiveCount > 0 ? (
                <TabsTrigger value="__inactive" className={premiumTabClass}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  Inativos ({inactiveCount})
                </TabsTrigger>
              ) : null;
            })()}
          </TabsList>
        </ScrollableTabs>
      </Tabs>

      {/* ── Service List with DnD ── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredServices.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredServices.map(service => (
                <SortableServiceCard
                  key={service.id}
                  service={service}
                  categories={customCategories}
                  onEdit={() => openEdit(service)}
                  onDelete={() => setDeleteId(service.id)}
                  onToggleActive={() => handleToggleActive(service)}
                  onPreview={() => setPreviewService(service)}
                  onDuplicate={() => handleDuplicate(service)}
                  priceDraft={drafts[service.id] || { price_pequeno: 0, price_medio: 0, price_grande: 0 }}
                  onPriceChange={(size, val) => handlePriceChange(service.id, size, val)}
                  isDirty={dirtyPrices.has(service.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {filteredServices.length === 0 && (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="py-12 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum serviço encontrado</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Criar primeiro serviço
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Create/Edit Service Modal ── */}
      <ResponsiveModal
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editingId ? 'Editar Serviço' : 'Novo Serviço'}
        description={editingId ? 'Atualize as informações do serviço' : 'Preencha os dados do novo serviço'}
        icon={
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
            <Scissors className="w-4 h-4 text-white" />
          </div>
        }
        maxWidth="max-w-lg"
        stickyFooter={
          <Button
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl gap-2",
              "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground",
              "shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)]",
              "hover:shadow-[0_4px_16px_-3px_hsl(var(--primary)/0.35)] hover:brightness-110",
              "transition-all duration-200",
            )}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingId ? 'Salvar Alterações' : 'Criar Serviço'}
              </>
            )}
          </Button>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome do serviço *</Label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Banho Completo"
              className="h-11 text-base rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição breve do serviço..."
              rows={3}
              className="text-base rounded-xl resize-none"
            />
          </div>

          {/* Category + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => {
                    const CatIcon = getIconComponent(cat.icon);
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <CatIcon className="w-4 h-4" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duração (min)</Label>
              <Input
                type="number"
                value={form.duration_minutes || ''}
                onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="h-11 text-base rounded-xl"
              />
            </div>
          </div>

          {/* Icon picker */}
          <IconPicker
            value={form.icon || 'scissors'}
            onChange={icon => setForm({ ...form, icon })}
            label="Ícone do serviço"
            compact
          />

          {/* Prices */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Valores por porte (R$)</Label>
            <div className="grid grid-cols-3 gap-3">
              {sizeLabels.map(({ key, label, emoji }) => {
                const priceKey = key === 'pequeno' ? 'price_pequeno' : key === 'medio' ? 'price_medio' : 'price_grande';
                return (
                  <div key={key} className="space-y-1.5">
                    <span className="text-xs text-muted-foreground font-medium">{emoji} {label}</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        min={0}
                        step={5}
                        value={(form as any)[priceKey] || ''}
                        onChange={e => setForm({ ...form, [priceKey]: parseFloat(e.target.value) || 0 })}
                        className="pl-9 h-10 rounded-xl text-base font-semibold tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-muted/30 border border-border/30">
            <div>
              <Label className="text-sm font-medium">Serviço ativo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Visível no site público</p>
            </div>
            <Switch
              checked={form.active ?? true}
              onCheckedChange={v => setForm({ ...form, active: v })}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
      </ResponsiveModal>

      {/* ── Categories Modal ── */}
      <CategoriesModal
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        customCategories={customCategories}
        onSave={handleSaveCategories}
        serviceCounts={serviceCounts}
      />

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente. O serviço será removido do sistema e do site.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Preview ── */}
      <ResponsiveModal
        open={!!previewService}
        onOpenChange={() => setPreviewService(null)}
        title="Pré-visualização"
        description="Como o serviço aparecerá no site"
        icon={<Eye className="w-5 h-5 text-primary" />}
        maxWidth="max-w-md"
      >
        <div className="flex justify-center py-2">
          {previewService && <ServicePreviewCard service={previewService} categories={customCategories} />}
        </div>
      </ResponsiveModal>
    </div>
  );
}
