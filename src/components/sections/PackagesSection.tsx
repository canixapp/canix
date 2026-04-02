import { useState, useEffect } from 'react';
import { Check, MessageCircle, Dog, ArrowRight, Repeat, Sparkles, Shield, PawPrint, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/modals/ResponsiveModal';
import { getPackages, PackageRow } from '@/services/packagesService';
import { getPetshopWhatsAppPhone, openWhatsAppConversation } from '@/lib/whatsapp';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 0.03, 0.26, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const SIZE_OPTIONS = [
  { value: 'pequeno', label: 'Pequeno', desc: 'Até 10kg', emoji: '🐕' },
  { value: 'medio', label: 'Médio', desc: '10kg – 25kg', emoji: '🐕‍🦺' },
  { value: 'grande', label: 'Grande', desc: 'Acima de 25kg', emoji: '🦮' },
] as const;

const DEFAULT_FEATURES = [
  'Banho completo',
  'Tosa higiênica',
  'Corte de unhas',
  'Limpeza de ouvidos',
  'Perfume',
];

function getIntervalLabel(days: number): string {
  if (days === 7) return 'Semanal';
  if (days === 15) return 'Quinzenal';
  if (days === 30) return 'Mensal';
  return `A cada ${days} dias`;
}

function getIntervalDesc(days: number): string {
  if (days === 7) return 'Agendamento toda semana';
  if (days === 15) return 'Agendamento a cada 15 dias';
  if (days === 30) return 'Agendamento todo mês';
  return `Agendamento a cada ${days} dias`;
}

function InterestModal({ pkg, open, onClose }: { pkg: PackageRow | null; open: boolean; onClose: () => void }) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const petshopWhatsAppPhone = getPetshopWhatsAppPhone();

  const handleWhatsApp = () => {
    if (!pkg || !selectedSize) return;
    const sizeLabel = SIZE_OPTIONS.find(s => s.value === selectedSize)?.label || selectedSize;
    const message = `Olá! Tenho interesse no pacote *${pkg.name}* (${getIntervalLabel(pkg.interval_days)}) para um cachorro de porte *${sizeLabel}*.\nGostaria de mais informações!`;
    openWhatsAppConversation({ phone: petshopWhatsAppPhone, message });
    onClose();
    setSelectedSize('');
  };

  if (!pkg) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={() => { onClose(); setSelectedSize(''); }}
      title={`Pacote ${pkg.name}`}
      description={pkg.description || `${getIntervalLabel(pkg.interval_days)} — agendamentos regulares com desconto`}
      icon={
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
          <Repeat className="w-5 h-5 text-white" />
        </div>
      }
      maxWidth="max-w-md"
      stickyFooter={
        <Button
          size="lg"
          className={cn(
            "w-full h-12 text-base font-semibold rounded-xl gap-2",
            "bg-[#25D366] hover:bg-[#25D366]/90 text-white",
            "shadow-[0_4px_16px_-3px_rgba(37,211,102,0.3)]",
            "hover:shadow-[0_6px_24px_-4px_rgba(37,211,102,0.35)]",
            "transition-all duration-200",
          )}
          disabled={!selectedSize}
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-5 h-5" />
          Falar no WhatsApp
        </Button>
      }
    >
      <div className="space-y-5">
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-[15px]">
            <Dog className="w-5 h-5 text-primary" />
            Qual o porte do seu cachorro?
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {SIZE_OPTIONS.map((opt) => {
              const isSelected = selectedSize === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSize(opt.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-center",
                    isSelected
                      ? 'border-primary bg-primary/[0.04] dark:bg-primary/[0.08] shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.15)]'
                      : 'border-border/50 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-sm'
                  )}
                >
                  <span className="text-lg mb-1 block">{opt.emoji}</span>
                  <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}

export function PackagesSection() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PackageRow | null>(null);

  useEffect(() => {
    getPackages().then((data) => {
      setPackages(data.filter(p => p.active !== false));
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (packages.length === 0) return null;

  return (
    <section id="pacotes" className="py-16 md:py-20 lg:py-24 scroll-mt-20 relative overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute top-[10%] right-[12%] w-[500px] h-[500px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.035] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[15%] left-[8%] w-[400px] h-[400px] rounded-full bg-secondary/[0.02] dark:bg-secondary/[0.03] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-14 md:mb-18"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/[0.08] dark:bg-secondary/[0.12] border border-secondary/15 rounded-full text-secondary text-[11px] font-semibold tracking-[0.15em] uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Economize com planos
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight max-w-2xl mx-auto mb-5">
            Pacotes{' '}
            <span className="bg-gradient-to-r from-secondary via-secondary/80 to-secondary/60 bg-clip-text text-transparent">
              Recorrentes
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground/70 max-w-xl mx-auto leading-relaxed">
            Cuidados contínuos para o seu pet com economia e praticidade.
          </p>
        </motion.div>

        {/* ── Cards grid ── */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {packages.map((pkg) => {
            const intervalLabel = getIntervalLabel(pkg.interval_days);
            const intervalDesc = getIntervalDesc(pkg.interval_days);
            const isPopular = pkg.interval_days <= 15;

            return (
              <motion.div
                key={pkg.id}
                className="relative group"
                variants={fadeUp}
              >
                <div className={cn(
                  "relative h-full rounded-2xl overflow-hidden transition-all duration-300 ease-out",
                  "bg-card/70 dark:bg-card/50 backdrop-blur-sm",
                  "border hover:-translate-y-1",
                  "shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]",
                  isPopular
                    ? 'border-secondary/25 dark:border-secondary/30 shadow-[0_2px_16px_-4px_hsl(var(--secondary)/0.1)] hover:shadow-[0_12px_40px_-10px_hsl(var(--secondary)/0.12)]'
                    : 'border-border/40 hover:border-primary/15 hover:shadow-[0_12px_40px_-10px_hsl(var(--primary)/0.08)]'
                )}>
                  {/* Top accent */}
                  <div className={cn(
                    'h-[2px] w-full transition-opacity duration-300',
                    isPopular
                      ? 'bg-gradient-to-r from-secondary/60 via-secondary to-secondary/60 opacity-100'
                      : 'bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 opacity-0 group-hover:opacity-100',
                  )} />

                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-secondary/10 dark:bg-secondary/15 text-secondary border border-secondary/15 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        Mais escolhido
                      </span>
                    </div>
                  )}

                  <div className="p-6 lg:p-7 space-y-5">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-shadow duration-300",
                        "bg-gradient-to-br",
                        isPopular
                          ? "from-secondary to-secondary/70 group-hover:shadow-[0_4px_20px_-4px_hsl(var(--secondary)/0.25)]"
                          : "from-primary to-primary/70 group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.25)]"
                      )}>
                        <Repeat className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight">
                          {pkg.name}
                        </h3>
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-sm font-semibold",
                            isPopular ? "text-secondary" : "text-primary"
                          )}>{intervalLabel}</span>
                          <span className="text-xs text-muted-foreground/50">{intervalDesc}</span>
                        </div>
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="text-sm text-muted-foreground/60 leading-relaxed">{pkg.description}</p>
                    )}

                    {/* Features */}
                    <ul className="space-y-2.5">
                      {DEFAULT_FEATURES.map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 text-sm text-foreground">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                            isPopular ? "bg-secondary/10" : "bg-primary/10"
                          )}>
                            <Check className={cn("w-3 h-3", isPopular ? "text-secondary" : "text-primary")} />
                          </div>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    {/* Savings highlight */}
                    <div className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border",
                      isPopular
                        ? "bg-secondary/[0.04] dark:bg-secondary/[0.08] border-secondary/10"
                        : "bg-primary/[0.03] dark:bg-primary/[0.06] border-primary/8"
                    )}>
                      <BadgePercent className={cn("w-4 h-4 shrink-0", isPopular ? "text-secondary" : "text-primary")} />
                      <span className="text-xs font-medium text-muted-foreground">
                        Economize até <span className={cn("font-bold", isPopular ? "text-secondary" : "text-primary")}>20%</span> com plano recorrente
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="space-y-2.5 pt-1">
                      <Button
                        className={cn(
                          "w-full h-11 text-sm font-semibold rounded-xl gap-2 transition-all duration-200",
                          isPopular
                            ? "bg-gradient-to-r from-secondary to-secondary/85 text-secondary-foreground shadow-[0_2px_8px_-2px_hsl(var(--secondary)/0.3)] hover:shadow-[0_4px_16px_-3px_hsl(var(--secondary)/0.35)] hover:brightness-110"
                            : "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_16px_-3px_hsl(var(--primary)/0.35)] hover:brightness-110"
                        )}
                        onClick={() => setSelectedPkg(pkg)}
                      >
                        Quero esse plano
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground/40">
                        Cancelamento fácil a qualquer momento.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <InterestModal
        pkg={selectedPkg}
        open={!!selectedPkg}
        onClose={() => setSelectedPkg(null)}
      />
    </section>
  );
}
