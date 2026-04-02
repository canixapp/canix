import { useState } from 'react';

import { Package, Clock, ChevronRight, Settings, Sparkles, ArrowRight, PawPrint, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useActiveServices } from '@/hooks/useActiveServices';
import { ServiceRow } from '@/services/servicesService';
import { PricingSkeleton } from '@/components/skeletons/SectionSkeletons';
import { useAuth } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getCategoryByValue, getIconComponent, ServiceCategory } from '@/lib/serviceCategories';
import { cardVariants } from '@/lib/animations';

function getPriceRange(service: ServiceRow): { min: number; max: number } | null {
  const prices = [service.price_pequeno, service.price_medio, service.price_grande]
    .filter((p): p is number => p != null && p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function fmtPrice(val: number) {
  return `R$ ${val.toFixed(0)}`;
}

interface PricingCardProps {
  service: ServiceRow;
  onSelect: (service: ServiceRow) => void;
  customCategories: ServiceCategory[];
  index: number;
}

function PricingCard({ service, onSelect, customCategories, index }: PricingCardProps) {
  const range = getPriceRange(service);
  const catInfo = getCategoryByValue(service.category, customCategories);
  const Icon = getIconComponent(service.icon || catInfo.icon);

  return (
    <motion.button
      onClick={() => onSelect(service)}
      className={cn(
        "w-full text-left rounded-2xl border border-border/60 overflow-hidden",
        "bg-card",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-200 group active:scale-[0.99]"
      )}
      variants={cardVariants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Top gradient accent on hover */}
      <div className={cn(
        "h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        catInfo.gradient
      )} />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br", catInfo.gradient,
            "shadow-md"
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-xl font-extrabold text-primary leading-tight">
              {range ? fmtPrice(range.min) : 'Consulte'}
            </span>
            {service.duration_minutes && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {service.duration_minutes} min
              </span>
            )}
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {range && range.min !== range.max && (
              <span className="text-[11px] text-muted-foreground">
                {fmtPrice(range.min)} – {fmtPrice(range.max)}
              </span>
            )}
          </div>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary group-hover:text-primary-foreground",
            "transition-all duration-200"
          )}>
            Ver portes
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

interface SizeModalProps {
  service: ServiceRow | null;
  open: boolean;
  onClose: () => void;
  customCategories: ServiceCategory[];
}

const SIZE_OPTIONS = [
  { value: 'pequeno', label: 'Pequeno', desc: 'Até 10kg', emoji: '🐕' },
  { value: 'medio', label: 'Médio', desc: '10kg – 25kg', emoji: '🐕‍🦺' },
  { value: 'grande', label: 'Grande', desc: 'Acima de 25kg', emoji: '🦮' },
] as const;

function SizeModal({ service, open, onClose, customCategories }: SizeModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');

  const getPrice = (size: string): number | null => {
    if (!service) return null;
    if (size === 'pequeno') return service.price_pequeno;
    if (size === 'medio') return service.price_medio;
    if (size === 'grande') return service.price_grande;
    return null;
  };

  const currentPrice = getPrice(selectedSize);
  const catInfo = service ? getCategoryByValue(service.category, customCategories) : null;
  const ServiceIcon = service ? getIconComponent(service.icon || (catInfo ? catInfo.icon : 'scissors')) : Package;

  const scrollToAgenda = () => {
    onClose();
    setTimeout(() => {
      const el = document.querySelector('#agenda');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
      setSelectedSize('');
    }
  };

  if (!service) return null;

  const TRUST_ITEMS = [
    { icon: PawPrint, text: 'Atendimento especializado' },
    { icon: Sparkles, text: 'Produtos pet premium' },
    { icon: Shield, text: 'Ambiente seguro e higienizado' },
  ];

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title={service.name}
      description={service.description || 'Selecione o porte do seu pet para ver o valor'}
      icon={
        catInfo ? (
          <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-md", catInfo.gradient)}>
            <ServiceIcon className="w-5 h-5 text-white" />
          </div>
        ) : undefined
      }
      maxWidth="max-w-md"
      stickyFooter={
        currentPrice != null && currentPrice > 0 ? (
          <Button
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl gap-2",
              "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground",
              "shadow-[0_4px_16px_-3px_hsl(var(--primary)/0.3)]",
              "hover:shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.35)] hover:brightness-110",
              "transition-all duration-200",
            )}
            onClick={scrollToAgenda}
          >
            Continuar agendamento
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* Duration */}
        {service.duration_minutes && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground/60 font-medium">Duração estimada</span>
              <span className="block text-sm font-semibold text-foreground">{service.duration_minutes} minutos</span>
            </div>
          </div>
        )}

        {/* Size selection */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground/60 tracking-wide uppercase mb-3 block">
            Selecione o porte
          </span>
          <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="grid gap-3">
            {SIZE_OPTIONS.map(opt => {
              const price = getPrice(opt.value);
              if (price == null || price <= 0) return null;
              const isSelected = selectedSize === opt.value;
              return (
                <Label
                  key={opt.value}
                  htmlFor={`size-${opt.value}`}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                    isSelected
                      ? 'border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.15)]'
                      : 'border-border/50 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={opt.value} id={`size-${opt.value}`} className="shrink-0" />
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{opt.emoji}</span>
                      <div>
                        <span className="font-semibold text-foreground text-[15px]">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground/60">{opt.desc}</span>
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "text-lg font-extrabold tracking-tight transition-colors",
                    isSelected ? "text-primary" : "text-foreground/80"
                  )}>{fmtPrice(price)}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground/50">
                <Icon className="w-3.5 h-3.5 text-primary/40 shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ResponsiveModal>
  );
}

export function PricingSection() {
  const { grouped, loading } = useActiveServices();
  const { isDev, isAdmin } = useAuth();
  const { settings } = usePetshop();
  const navigate = useNavigate();
  const showAdmin = isDev() || isAdmin();
  const customCategories = (settings.custom_categories || []) as ServiceCategory[];

  const [activeTab, setActiveTab] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);

  const effectiveTab = activeTab || (grouped.length > 0 ? grouped[0].category : '');

  if (loading) return <PricingSkeleton />;

  if (grouped.length === 0) {
    return (
      <section id="valores" className="py-20 scroll-mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="container mx-auto px-4 text-center text-muted-foreground relative z-10">Nenhum serviço cadastrado.</div>
      </section>
    );
  }

  return (
    <section id="valores" className="py-24 md:py-32 scroll-mt-20 relative overflow-hidden">
      {/* Lightweight background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16 relative"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">Tabela de preços</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground tracking-tight">
            Nossos{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Valores
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Preços justos e transparentes para todos os portes
          </p>

          {showAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate('/admin/servicos')} className="absolute top-0 right-0 p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-primary/10">
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Editar serviços (Admin)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </motion.div>

        {/* Tabs + content */}
        <Tabs value={effectiveTab} onValueChange={setActiveTab} className="max-w-2xl mx-auto">
          <TabsList className="w-full mb-10 h-auto p-1.5 bg-muted/60 rounded-2xl border border-border/30" style={{ display: 'grid', gridTemplateColumns: `repeat(${grouped.length}, 1fr)` }}>
            {grouped.map(group => {
              const catInfo = getCategoryByValue(group.category, customCategories);
              const CatIcon = getIconComponent(catInfo.icon);
              return (
                <TabsTrigger
                  key={group.category}
                  value={group.category}
                  className={cn(
                    "flex items-center gap-2 py-3 px-3 text-sm font-medium rounded-xl transition-all",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20"
                  )}
                >
                  <CatIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{catInfo.label}</span>
                  <span className="sm:hidden text-[11px]">{catInfo.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {grouped.map(group => (
            <TabsContent key={group.category} value={group.category}>
              <div className="flex flex-col gap-4">
                {group.services.map((service, i) => (
                  <PricingCard key={service.id} service={service} onSelect={setSelectedService} customCategories={customCategories} index={i} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <SizeModal
        service={selectedService}
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        customCategories={customCategories}
      />
    </section>
  );
}
