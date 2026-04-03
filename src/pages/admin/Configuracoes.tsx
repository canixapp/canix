import { useState, useEffect, useRef, useCallback } from 'react';
import { uploadImageToStorage } from '@/lib/storageUtils';
import { validateImageFile } from '@/lib/imageUtils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { logFieldChanges } from '@/services/auditLogService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs, premiumTabClass, premiumTabListClass } from '@/components/ui/scrollable-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useConfig, WeeklySchedule } from '@/hooks/useConfig';
import { useBranding } from '@/contexts/BrandingContext';
import { useHomeContent } from '@/hooks/useHomeContent';
import { usePetshop } from '@/contexts/PetshopContext';
import {
  Check, Clock, CalendarDays, Palette, Layout, Save, Upload, Share2, MapPin,
  BarChart2, FileText, Map, RotateCcw, Timer, Star, Plus, Settings, Trash2,
  ImageIcon, ChevronLeft, ChevronRight, Bell, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { SocialLink } from '@/hooks/useConfig';
import { Textarea } from '@/components/ui/textarea';
import { getGalleryCategories, createGalleryCategory, updateGalleryCategory, deleteGalleryCategory, GalleryCategoryRow } from '@/services/galleryCategoriesService';
import { getNotificationConfig, NOTIFICATION_SETTING_LABELS } from '@/lib/notificationTypes';
import { DEFAULT_NOTIFICATION_SETTINGS_CONFIG, type NotificationSettingsConfig } from '@/lib/constants';

/* ─── Constants ─── */
const DAY_LABELS: { key: keyof WeeklySchedule; label: string; short: string }[] = [
  { key: 'dom', label: 'Domingo', short: 'Dom' },
  { key: 'seg', label: 'Segunda', short: 'Seg' },
  { key: 'ter', label: 'Terça', short: 'Ter' },
  { key: 'qua', label: 'Quarta', short: 'Qua' },
  { key: 'qui', label: 'Quinta', short: 'Qui' },
  { key: 'sex', label: 'Sexta', short: 'Sex' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
];



const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

/* ─── Premium Card Wrapper ─── */
function PremiumCard({ icon: Icon, title, description, children, className = '' }: {
  icon: typeof Settings;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div {...fadeUp}>
      <Card className={`overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
            </div>
          </div>
          <div className="space-y-4">{children}</div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Favicon Uploader ─── */
function FaviconUploader() {
  const [faviconPreview, setFaviconPreview] = useState<string>(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    return link?.href || '/favicon.ico';
  });
  const [uploading, setUploading] = useState(false);

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || 'Arquivo inválido'); e.target.value = ''; return; }
    setUploading(true);
    try {
      const { url } = await uploadImageToStorage(file, 'logos', undefined, { quality: 0.9, maxWidth: 256, maxHeight: 256 });
      setFaviconPreview(url);
      // Update the actual favicon in the document
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = url;
      link.type = 'image/webp';
      // Save to localStorage for persistence
      localStorage.setItem('petcao-favicon', url);
      toast.success('Favicon atualizado!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("ERRO UPLOAD FAVICON:", err);
      toast.error('Erro ao enviar favicon: ' + msg);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl border border-border/50 overflow-hidden bg-muted/50 flex items-center justify-center shadow-sm">
        <img src={faviconPreview} alt="Favicon" className="w-8 h-8 object-contain" />
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 h-10" disabled={uploading} onClick={() => document.getElementById('favicon-upload')?.click()}>
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Alterar Favicon'}
        </Button>
        <input id="favicon-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" onChange={handleFaviconUpload} className="hidden" />
        <p className="text-[11px] text-muted-foreground mt-1.5">PNG ou ICO, 256×256px recomendado</p>
      </div>
    </div>
  );
}


function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70">{children}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

/* ─── Save Button ─── */
function SaveButton({ onClick, loading, label = 'Salvar' }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <Button onClick={onClick} disabled={loading} className="gap-2 min-h-[44px] shadow-sm">
      <Save className="w-4 h-4" /> {loading ? 'Salvando...' : label}
    </Button>
  );
}

/* ─── Scrollable Tabs ─── */
function ScrollableTabsNav() {
  const tabTriggerClass = "flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/50 text-muted-foreground hover:text-foreground hover:bg-background/50";
  return (
    <ScrollableTabs>
      <TabsList className="inline-flex w-max gap-1.5 md:gap-1 p-1 pr-4 rounded-xl bg-muted/50 border border-border/50 h-auto">
        <TabsTrigger value="geral" className={tabTriggerClass}><FileText className="w-3.5 h-3.5" /> Geral</TabsTrigger>
        <TabsTrigger value="horarios" className={tabTriggerClass}><Clock className="w-3.5 h-3.5" /> Horários</TabsTrigger>
        <TabsTrigger value="agenda" className={tabTriggerClass}><Timer className="w-3.5 h-3.5" /> Agenda</TabsTrigger>
        <TabsTrigger value="localizacao" className={tabTriggerClass}><MapPin className="w-3.5 h-3.5" /> Localização</TabsTrigger>
        <TabsTrigger value="redes" className={tabTriggerClass}><Share2 className="w-3.5 h-3.5" /> Redes Sociais</TabsTrigger>
        <TabsTrigger value="aparencia" className={tabTriggerClass}><Palette className="w-3.5 h-3.5" /> Aparência</TabsTrigger>
        <TabsTrigger value="galeria" className={tabTriggerClass}><BarChart2 className="w-3.5 h-3.5" /> Galeria</TabsTrigger>
        <TabsTrigger value="notificacoes" className={tabTriggerClass}><Bell className="w-3.5 h-3.5" /> Notificações</TabsTrigger>
      </TabsList>
    </ScrollableTabs>
  );
}

/* ─── Main Component ─── */
export default function Configuracoes() {
  const config = useConfig();
  const { branding, saveBranding } = useBranding();
  const { user } = useAuth();
  const actorId = user?.id || 'unknown';

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [overrideNote, setOverrideNote] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl);
  const [brandingForm, setBrandingForm] = useState({
    shopName: branding.shopName, primaryColor: branding.primaryColor, logoUrl: branding.logoUrl,
  });
  const [openTime, setOpenTime] = useState(config.openingHours.openTime);
  const [closeTime, setCloseTime] = useState(config.openingHours.closeTime);
  const [socialLinksForm, setSocialLinksForm] = useState<SocialLink[]>(config.socialLinks);
  const [addressForm, setAddressForm] = useState({ ...config.shopAddress });
  const [limitsForm, setLimitsForm] = useState({ ...config.displayLimits });
  const [locationForm, setLocationForm] = useState({ ...config.locationSettings });
  const [intervalMode, setIntervalMode] = useState<'30' | '60' | 'custom'>(
    config.appointmentInterval === 30 ? '30' : config.appointmentInterval === 60 ? '60' : 'custom'
  );
  const [customInterval, setCustomInterval] = useState(String(config.appointmentInterval));
  const { homeContent, setHomeContent, resetHomeContent, DEFAULT_HOME_CONTENT } = useHomeContent();
  const [cmsForm, setCmsForm] = useState({ ...homeContent });

  const handleToggleDay = (key: keyof WeeklySchedule) => {
    config.setWeeklySchedule(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Horário atualizado');
  };

  const handleSaveHours = () => {
    const oldVals = { openTime: config.openingHours.openTime, closeTime: config.openingHours.closeTime };
    config.setOpeningHours({ openTime, closeTime });
    logFieldChanges(actorId, 'horario_funcionamento', oldVals, { openTime, closeTime }).catch(() => { });
    toast.success('Horário de funcionamento salvo!');
  };

  const handleAddOverride = (isOpen: boolean) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    config.addDateOverride({ date: dateStr, isOpen, note: overrideNote || undefined });
    setOverrideNote('');
    toast.success('Exceção adicionada');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { toast.error(validation.error || 'Arquivo inválido'); e.target.value = ''; return; }
    try {
      toast.loading('Enviando logo...');
      const { url } = await uploadImageToStorage(file, 'logos', undefined, { quality: 0.9, maxWidth: 800, maxHeight: 400 });
      setLogoPreview(url);
      setBrandingForm(prev => ({ ...prev, logoUrl: url }));
      toast.dismiss();
      toast.success('Logo enviado! Clique em "Salvar" para aplicar.');
    } catch {
      toast.dismiss();
      toast.error('Erro ao enviar logo. Tente novamente.');
    }
    e.target.value = '';
  };

  const handleSaveBranding = () => {
    logFieldChanges(actorId, 'branding', { shopName: branding.shopName, primaryColor: branding.primaryColor }, { shopName: brandingForm.shopName, primaryColor: brandingForm.primaryColor }).catch(() => { });
    saveBranding(brandingForm);
    toast.success('Branding salvo com sucesso!');
  };


  const handleSaveInterval = () => {
    const val = intervalMode === 'custom' ? Number(customInterval) : Number(intervalMode);
    if (val < 10 || val > 120) { toast.error('Intervalo deve ser entre 10 e 120 minutos'); return; }
    logFieldChanges(actorId, 'agenda', { slotIntervalMinutes: config.appointmentInterval }, { slotIntervalMinutes: val }).catch(() => { });
    config.setAppointmentInterval(val);
    toast.success(`Intervalo de ${val} minutos salvo!`);
  };

  const existingOverride = selectedDate
    ? config.dateOverrides.find(o => o.date === format(selectedDate, 'yyyy-MM-dd'))
    : null;

  return (
    <div className="space-y-5 sm:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <motion.div className="flex items-center gap-3" {...fadeUp}>
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shrink-0">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Personalize seu petshop</p>
        </div>
      </motion.div>

      <Tabs defaultValue="geral" className="w-full max-w-full">
        <ScrollableTabsNav />

        {/* ===== GERAL (CMS) ===== */}
        <TabsContent value="geral" className="space-y-4 mt-5">
          <InaugurationDateCard />
          <PremiumCard icon={FileText} title="Conteúdo da Home" description="Edite os textos e imagens exibidos na página principal.">
            {/* Hero */}
            <SectionLabel>Hero Principal</SectionLabel>
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Título principal</Label>
                <Input value={cmsForm.hero.title} onChange={e => setCmsForm(p => ({ ...p, hero: { ...p.hero, title: e.target.value } }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Subtítulo</Label>
                <Textarea value={cmsForm.hero.subtitle} onChange={e => setCmsForm(p => ({ ...p, hero: { ...p.hero, subtitle: e.target.value } }))} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs font-medium">Botão principal</Label><Input value={cmsForm.hero.buttonPrimary} onChange={e => setCmsForm(p => ({ ...p, hero: { ...p.hero, buttonPrimary: e.target.value } }))} className="h-11" /></div>
                <div className="space-y-2"><Label className="text-xs font-medium">Botão secundário</Label><Input value={cmsForm.hero.buttonSecondary} onChange={e => setCmsForm(p => ({ ...p, hero: { ...p.hero, buttonSecondary: e.target.value } }))} className="h-11" /></div>
              </div>
            </div>

            <SectionLabel>Seções da Home</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-semibold text-foreground">Avaliações</span>
                </div>
                <div className="space-y-2"><Label className="text-xs font-medium">Título</Label><Input value={cmsForm.reviews.title} onChange={e => setCmsForm(p => ({ ...p, reviews: { ...p.reviews, title: e.target.value } }))} className="h-10" /></div>
                <div className="space-y-2"><Label className="text-xs font-medium">Subtítulo</Label><Input value={cmsForm.reviews.subtitle} onChange={e => setCmsForm(p => ({ ...p, reviews: { ...p.reviews, subtitle: e.target.value } }))} className="h-10" /></div>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Galeria</span>
                </div>
                <div className="space-y-2"><Label className="text-xs font-medium">Título</Label><Input value={cmsForm.gallery.title} onChange={e => setCmsForm(p => ({ ...p, gallery: { ...p.gallery, title: e.target.value } }))} className="h-10" /></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">Localização</span>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Texto descritivo</Label><Input value={cmsForm.location.description} onChange={e => setCmsForm(p => ({ ...p, location: { ...p.location, description: e.target.value } }))} className="h-10" /></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <SaveButton onClick={() => { setHomeContent(cmsForm); toast.success('Conteúdo da Home salvo!'); }} label="Salvar alterações" />
              <Button variant="outline" onClick={() => { resetHomeContent(); setCmsForm({ ...DEFAULT_HOME_CONTENT }); toast.success('Conteúdo restaurado ao padrão!'); }} className="gap-1.5 min-h-[44px]">
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrão
              </Button>
            </div>
          </PremiumCard>
        </TabsContent>

        {/* ===== HORÁRIOS ===== */}
        <TabsContent value="horarios" className="space-y-4 mt-5">
          <PremiumCard icon={Clock} title="Horário de Funcionamento" description="Defina os dias e horários de operação do petshop.">
            <SectionLabel>Dias da Semana</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAY_LABELS.map(({ key, label, short }) => {
                const active = config.weeklySchedule[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleDay(key)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${active
                        ? 'bg-primary/5 border-primary/30 shadow-sm'
                        : 'bg-muted/20 border-border/50 opacity-60 hover:opacity-80'
                      }`}
                  >
                    <span className="text-sm font-medium text-foreground hidden sm:inline">{label}</span>
                    <span className="text-sm font-medium text-foreground sm:hidden">{short}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-primary' : 'bg-muted'}`}>
                      {active && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionLabel>Horário de Abertura e Fechamento</SectionLabel>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Abertura</Label>
                <Input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="w-full sm:w-36 h-11" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Fechamento</Label>
                <Input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="w-full sm:w-36 h-11" />
              </div>
              <Button size="sm" variant="outline" onClick={handleSaveHours} className="gap-1.5 min-h-[44px] w-full sm:w-auto">
                <Save className="w-3.5 h-3.5" /> Salvar horários
              </Button>
            </div>
          </PremiumCard>

          <PremiumCard icon={CalendarDays} title="Exceções por Data" description="Marque datas específicas como abertas ou fechadas.">
            <div className="flex justify-center">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR}
                modifiers={{
                  overrideClosed: (date) => config.dateOverrides.some(o => o.date === format(date, 'yyyy-MM-dd') && !o.isOpen),
                  overrideOpen: (date) => config.dateOverrides.some(o => o.date === format(date, 'yyyy-MM-dd') && o.isOpen),
                }}
                modifiersStyles={{
                  overrideClosed: { backgroundColor: 'hsl(var(--destructive))', color: 'white', borderRadius: '50%' },
                  overrideOpen: { backgroundColor: 'hsl(142 76% 36%)', color: 'white', borderRadius: '50%' },
                }}
                className="rounded-xl border border-border/50"
              />
            </div>
            {selectedDate && (
              <motion.div {...fadeUp} className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/40">
                <p className="text-sm font-medium text-foreground">
                  {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {existingOverride && (
                    <Badge variant="outline" className="ml-2 text-[11px]">
                      {existingOverride.isOpen ? '✅ Aberto' : '❌ Fechado'}{existingOverride.note && ` — ${existingOverride.note}`}
                    </Badge>
                  )}
                </p>
                <Input placeholder="Observação (ex: Feriado, Manutenção)" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} className="h-11" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleAddOverride(false)}>Marcar Fechado</Button>
                  <Button size="sm" variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleAddOverride(true)}>Marcar Aberto</Button>
                  {existingOverride && <Button size="sm" variant="ghost" onClick={() => config.removeDateOverride(format(selectedDate, 'yyyy-MM-dd'))}>Remover</Button>}
                </div>
              </motion.div>
            )}
            {config.dateOverrides.length > 0 && (
              <div className="pt-1">
                <SectionLabel>Exceções configuradas</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.dateOverrides.map((o) => (
                    <span key={o.date} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${o.isOpen ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                      {o.date} {o.isOpen ? '(Aberto)' : '(Fechado)'} {o.note && `— ${o.note}`}
                      <button onClick={() => config.removeDateOverride(o.date)} className="hover:opacity-70 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </PremiumCard>
        </TabsContent>

        {/* ===== AGENDA ===== */}
        <TabsContent value="agenda" className="space-y-4 mt-5">
          <PremiumCard icon={Timer} title="Intervalo de Atendimento" description="Defina o intervalo entre os horários disponíveis para agendamento.">
            <div className="space-y-4">
              <Select value={intervalMode} onValueChange={(v) => { setIntervalMode(v as '30' | '60' | 'custom'); if (v !== 'custom') setCustomInterval(v); }}>
                <SelectTrigger className="w-full sm:w-64 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">A cada 30 minutos</SelectItem>
                  <SelectItem value="60">A cada 60 minutos</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {intervalMode === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input type="number" min={10} max={120} value={customInterval} onChange={e => setCustomInterval(e.target.value)} className="w-24 h-11" />
                  <span className="text-sm text-muted-foreground">minutos</span>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-foreground">
                  Atual: <span className="font-semibold">{config.appointmentInterval} min</span> — {config.openingHours.openTime} às {config.openingHours.closeTime}
                </p>
              </div>
              <SaveButton onClick={handleSaveInterval} label="Salvar intervalo" />
            </div>
          </PremiumCard>
        </TabsContent>

        {/* ===== LOCALIZAÇÃO ===== */}
        <TabsContent value="localizacao" className="space-y-4 mt-5">
          <PremiumCard icon={MapPin} title="Endereço do Petshop" description="Esses dados aparecem no rodapé e na seção de localização.">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Endereço completo</Label>
              <Input value={addressForm.address} onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))} className="h-11" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-medium">Telefone</Label><Input value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} className="h-11" /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">WhatsApp (só números)</Label><Input value={addressForm.whatsapp} onChange={e => setAddressForm(p => ({ ...p, whatsapp: e.target.value }))} className="h-11" /></div>
            </div>
            <SaveButton onClick={() => { logFieldChanges(actorId, 'endereco', config.shopAddress as unknown as Record<string, unknown>, addressForm as unknown as Record<string, unknown>).catch(() => { }); config.setShopAddress(addressForm); toast.success('Endereço salvo!'); }} label="Salvar endereço" />
          </PremiumCard>

          <PremiumCard icon={Map} title="Mapa e Coordenadas" description="Configure as coordenadas para o mapa interativo.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs font-medium">Latitude</Label><Input value={locationForm.latitude} onChange={e => setLocationForm(p => ({ ...p, latitude: e.target.value }))} className="h-11" /></div>
              <div className="space-y-2"><Label className="text-xs font-medium">Longitude</Label><Input value={locationForm.longitude} onChange={e => setLocationForm(p => ({ ...p, longitude: e.target.value }))} className="h-11" /></div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label className="text-xs font-medium">Zoom do Mapa</Label>
              <Input type="number" min={1} max={20} value={locationForm.zoom} onChange={e => setLocationForm(p => ({ ...p, zoom: Number(e.target.value) }))} className="h-11" />
            </div>
            <SaveButton onClick={() => { logFieldChanges(actorId, 'coordenadas', config.locationSettings as unknown as Record<string, unknown>, locationForm as unknown as Record<string, unknown>).catch(() => { }); config.setLocationSettings(locationForm); toast.success('Coordenadas salvas!'); }} label="Salvar coordenadas" />
          </PremiumCard>
        </TabsContent>

        {/* ===== REDES SOCIAIS ===== */}
        <TabsContent value="redes" className="space-y-4 mt-5">
          <PremiumCard icon={Share2} title="Redes Sociais" description="Configure os links exibidos no rodapé do site.">
            <div className="space-y-2">
              {socialLinksForm.map((social, idx) => (
                <div key={social.key} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all duration-200 ${social.enabled ? 'bg-card border-border/60' : 'bg-muted/20 border-border/30 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <Switch checked={social.enabled} onCheckedChange={(checked) => setSocialLinksForm(prev => prev.map((s, i) => i === idx ? { ...s, enabled: checked } : s))} />
                    <span className="text-sm font-medium text-foreground w-24 shrink-0">{social.label}</span>
                  </div>
                  <Input value={social.url} onChange={(e) => setSocialLinksForm(prev => prev.map((s, i) => i === idx ? { ...s, url: e.target.value } : s))} placeholder="https://..." disabled={!social.enabled} className="flex-1 h-10" />
                </div>
              ))}
            </div>
            <SaveButton 
              onClick={() => { 
                const oldLinks = config.socialLinks.reduce((acc, s) => ({ ...acc, [s.key + '_enabled']: s.enabled, [s.key + '_url']: s.url }), {} as Record<string, string | boolean>); 
                const newLinks = socialLinksForm.reduce((acc, s) => ({ ...acc, [s.key + '_enabled']: s.enabled, [s.key + '_url']: s.url }), {} as Record<string, string | boolean>); 
                logFieldChanges(actorId, 'redes_sociais', oldLinks, newLinks).catch(() => { }); 
                config.setSocialLinks(socialLinksForm); 
                toast.success('Redes sociais salvas!'); 
              }} 
              label="Salvar redes sociais" 
            />
          </PremiumCard>
        </TabsContent>

        {/* ===== APARÊNCIA ===== */}
        <TabsContent value="aparencia" className="space-y-4 mt-5">
          <PremiumCard icon={Palette} title="Identidade do Petshop" description="Nome, logo e cor principal do seu negócio.">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nome do Petshop</Label>
              <Input value={brandingForm.shopName} onChange={(e) => setBrandingForm(p => ({ ...p, shopName: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-16 h-16 rounded-xl border border-border/50 overflow-hidden bg-muted/50 flex items-center justify-center shadow-sm">
                    <OptimizedImage src={logoPreview} alt="Logo" className="w-full h-full object-contain" showSkeleton={false} />
                  </div>
                )}
                <div>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 h-10" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="w-3.5 h-3.5" /> Escolher imagem
                  </Button>
                  <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-[11px] text-muted-foreground mt-1.5">PNG com fundo transparente recomendado</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Cor Primária</Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm(p => ({ ...p, primaryColor: e.target.value }))} className="w-11 h-11 rounded-xl cursor-pointer border border-border/50 shadow-sm" />
                </div>
                <code className="text-sm font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">{brandingForm.primaryColor}</code>
              </div>
            </div>
            <SaveButton onClick={handleSaveBranding} label="Salvar Branding" />
          </PremiumCard>

          {/* Favicon */}
          <PremiumCard icon={Sparkles} title="Favicon" description="Ícone exibido na aba do navegador.">
            <FaviconUploader />
          </PremiumCard>

          {/* Hero Images */}
          <PremiumCard icon={ImageIcon} title="Imagens do Hero" description="Fotos circulares exibidas no collage da página inicial. O mascote central é a imagem padrão do hero.">
            <SectionLabel>Mascote / Imagem Central</SectionLabel>
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-all hover:border-primary/50 ${cmsForm.hero.imageUrl ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-muted/30'
                  }`}
                onClick={() => document.getElementById('cms-hero-mascot')?.click()}
              >
                {cmsForm.hero.imageUrl ? (
                  <OptimizedImage src={cmsForm.hero.imageUrl} alt="Mascote" className="w-full h-full object-contain" showSkeleton={false} />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => document.getElementById('cms-hero-mascot')?.click()}>
                  <Upload className="w-3.5 h-3.5" /> Escolher imagem
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">Exibida no centro do collage</p>
              </div>
              <input id="cms-hero-mascot" type="file" accept="image/*" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; const validation = validateImageFile(file); if (!validation.valid) { toast.error(validation.error || 'Arquivo inválido'); e.target.value = ''; return; } try { toast.loading('Convertendo para WebP...'); const { url } = await uploadImageToStorage(file, 'gallery', undefined, { quality: 0.9, maxWidth: 800, maxHeight: 800 }); setCmsForm(p => ({ ...p, hero: { ...p.hero, imageUrl: url } })); toast.dismiss(); toast.success('Imagem enviada! Salve para aplicar.'); } catch { toast.dismiss(); toast.error('Erro ao enviar imagem.'); } e.target.value = ''; }} />
            </div>

            <SectionLabel>Fotos Circulares do Hero</SectionLabel>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                As fotos circulares da página inicial são selecionadas automaticamente a partir das fotos aprovadas da galeria. Não é necessário configurá-las manualmente.
              </p>
            </div>

          </PremiumCard>
        </TabsContent>

        {/* ===== GALERIA ===== */}
        <TabsContent value="galeria" className="space-y-4 mt-5">
          <PremiumCard icon={BarChart2} title="Galeria e Avaliações" description="Controla limites públicos, paginação da moderação e envio de fotos.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Fotos públicas (máx.)', key: 'maxPhotos', value: limitsForm.maxPhotos, max: 50 },
                { label: 'Avaliações públicas (máx.)', key: 'maxReviews', value: limitsForm.maxReviews, max: 50 },
                { label: 'Fotos por página (moderação)', key: 'moderationPageSizePhotos', value: limitsForm.moderationPageSizePhotos || 10, max: 50 },
                { label: 'Avaliações por página (moderação)', key: 'moderationPageSizeReviews', value: limitsForm.moderationPageSizeReviews || 10, max: 50 },
                { label: 'Envio diário de foto (por usuário)', key: 'userUploadPhotoDailyLimit', value: limitsForm.userUploadPhotoDailyLimit || 1, max: 10 },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <Label className="text-xs font-medium">{item.label}</Label>
                  <Input type="number" min={1} max={item.max} value={item.value} onChange={e => setLimitsForm(p => ({ ...p, [item.key]: Number(e.target.value) }))} className="h-11" />
                </div>
              ))}
            </div>
            <SaveButton onClick={() => { logFieldChanges(actorId, 'limites_galeria', config.displayLimits as unknown as Record<string, unknown>, limitsForm as unknown as Record<string, unknown>).catch(() => { }); config.setDisplayLimits(limitsForm); toast.success('Limites salvos!'); }} label="Salvar limites" />
          </PremiumCard>

          <GalleryCategoriesCard />
        </TabsContent>

        {/* ===== NOTIFICAÇÕES ===== */}
        <TabsContent value="notificacoes" className="space-y-4 mt-5">
          <NotificationSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Gallery Categories Card ─── */
function GalleryCategoriesCard() {
  const [categories, setCategories] = useState<GalleryCategoryRow[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    const data = await getGalleryCategories();
    setCategories(data);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Nome da categoria é obrigatório'); return; }
    const slug = newName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setLoading(true);
    const created = await createGalleryCategory(newName.trim(), slug);
    if (created) {
      toast.success('Categoria adicionada!');
      setNewName('');
      await loadCategories();
    } else {
      toast.error('Erro ao criar categoria');
    }
    setLoading(false);
  };

  const handleUpdateMaxPhotos = async (id: string, maxPhotos: number) => {
    await updateGalleryCategory(id, { max_photos: Math.max(1, Math.min(50, maxPhotos)) });
    await loadCategories();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir a categoria "${name}"?`)) return;
    const ok = await deleteGalleryCategory(id);
    if (ok) {
      toast.success('Categoria excluída');
      await loadCategories();
    } else {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <PremiumCard icon={ImageIcon} title="Categorias da Galeria" description='Configure as categorias e o limite de fotos. A aba "Todos" sempre exibe 10 por página.'>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all duration-200 ${cat.is_active ? 'bg-card border-border/60' : 'bg-muted/20 border-border/30 opacity-50'}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Switch
                checked={cat.is_active}
                onCheckedChange={async (checked) => {
                  await updateGalleryCategory(cat.id, { is_active: checked } as any);
                  await loadCategories();
                  toast.success(checked ? `"${cat.name}" ativada` : `"${cat.name}" desativada`);
                }}
              />
              <span className={`text-sm font-medium truncate ${cat.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>{cat.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Máx.:</Label>
              <Input type="number" min={1} max={50} value={cat.max_photos} onChange={e => handleUpdateMaxPhotos(cat.id, Number(e.target.value))} className="w-20 h-9 text-sm" />
              <Button variant="ghost" size="sm" className="text-destructive h-9 w-9 p-0 hover:bg-destructive/10" onClick={() => handleDelete(cat.id, cat.name)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhuma categoria criada ainda.
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da nova categoria" className="flex-1 h-11" />
        <Button onClick={handleAdd} disabled={loading || !newName.trim()} className="gap-1.5 min-h-[44px]">
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </Button>
      </div>
    </PremiumCard>
  );
}

/* ─── Inauguration Date Card ─── */
function InaugurationDateCard() {
  const { settings, updateSettings } = usePetshop();
  const [date, setDate] = useState(settings.inauguratedAt || '');
  const [saving, setSaving] = useState(false);

  const yearsCalc = (() => {
    if (!date) return null;
    const start = new Date(date);
    if (isNaN(start.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) years--;
    return Math.max(0, years);
  })();

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({ inauguratedAt: date });
    toast.success('Data de inauguração salva!');
    setSaving(false);
  };

  return (
    <PremiumCard icon={CalendarDays} title="Data de Inauguração" description="Usada para calcular os anos de experiência exibidos no site.">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="space-y-2 flex-1">
          <Label className="text-xs font-medium">Data de inauguração</Label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-11 max-w-[220px]"
          />
        </div>
        {yearsCalc !== null && (
          <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
            {yearsCalc === 1 ? '1 ano' : `${yearsCalc} anos`} de experiência
          </div>
        )}
      </div>
      <SaveButton onClick={handleSave} label="Salvar" loading={saving} />
    </PremiumCard>
  );
}

/* ─── Notification Settings Card ─── */
function NotificationSettingsCard() {
  const { settings, updateSettings } = usePetshop();
  const [form, setForm] = useState<NotificationSettingsConfig>(() => ({
    ...DEFAULT_NOTIFICATION_SETTINGS_CONFIG,
    ...settings.notification_settings,
  }));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({ notification_settings: form });
    toast.success('Configurações de notificações salvas!');
    setSaving(false);
  };

  const toggleKeys = Object.keys(NOTIFICATION_SETTING_LABELS) as (keyof typeof NOTIFICATION_SETTING_LABELS)[];

  // Group toggles by category
  const groups = [
    { label: 'Agendamentos', keys: toggleKeys.filter(k => k.startsWith('agendamento')) },
    { label: 'Fotos & Avaliações', keys: toggleKeys.filter(k => k.startsWith('foto') || k.startsWith('avaliacao')) },
    { label: 'Pacotes', keys: toggleKeys.filter(k => k.startsWith('pacote')) },
    { label: 'Sistema', keys: toggleKeys.filter(k => k === 'show_login_notification') },
  ];

  return (
    <PremiumCard icon={Bell} title="Configurações de Notificações" description="Configure quais notificações são enviadas automaticamente aos clientes.">
      <div className="space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="space-y-2 mt-3">
              {group.keys.map(key => {
                const meta = NOTIFICATION_SETTING_LABELS[key];
                if (!meta) return null;
                const ntConfig = getNotificationConfig(key);
                const Icon = ntConfig.icon;
                const isOn = form[key] as boolean;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${isOn
                        ? 'bg-card border-border/60 hover:border-primary/20'
                        : 'bg-muted/15 border-border/30 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${ntConfig.bgClass} flex items-center justify-center shrink-0 transition-transform`}>
                        <Icon className={`w-4 h-4 ${ntConfig.colorClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{meta.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isOn}
                      onCheckedChange={v => setForm(prev => ({ ...prev, [key]: v }))}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Comportamento</SectionLabel>
      <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Tempo do toast no login</Label>
            <p className="text-[11px] text-muted-foreground">Duração da notificação após o login</p>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={3} max={15} value={form.login_toast_duration} onChange={e => setForm(p => ({ ...p, login_toast_duration: Number(e.target.value) }))} className="w-20 h-10 text-center" />
            <span className="text-xs text-muted-foreground">seg</span>
          </div>
        </div>
      </div>

      <SaveButton onClick={handleSave} loading={saving} label="Salvar configurações" />
    </PremiumCard>
  );
}
