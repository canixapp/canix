import { Scissors, ArrowRight, Clock, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveServices } from '@/hooks/useActiveServices';
import { usePetshop } from '@/contexts/PetshopContext';
import { ServicesSkeleton } from '@/components/skeletons/SectionSkeletons';
import { cn } from '@/lib/utils';
import { getCategoryByValue, getIconComponent, ServiceCategory } from '@/lib/serviceCategories';

const EASE: [number, number, number, number] = [0.22, 0.03, 0.26, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};
const fade = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function ServicesSection() {
  const { grouped, loading } = useActiveServices();
  const { settings } = usePetshop();
  const customCategories = (settings.custom_categories || []) as ServiceCategory[];

  if (loading) return <ServicesSkeleton />;

  const allServices = grouped.flatMap((g) => {
    const config = getCategoryByValue(g.category, customCategories);
    return g.services.map((s, i) => ({ ...s, config, isFirst: i === 0 }));
  });

  return (
    <section id="servicos" className="py-16 md:py-20 lg:py-24 scroll-mt-20 relative overflow-hidden">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] rounded-full bg-primary/[0.02] dark:bg-primary/[0.035] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[8%] w-[500px] h-[500px] rounded-full bg-primary/[0.015] dark:bg-primary/[0.03] blur-[120px] pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 900" fill="none">
        <path d="M-50 300C200 220 500 380 750 280C1000 180 1200 340 1500 260" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.03" />
      </svg>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-14 md:mb-18"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/[0.06] dark:bg-primary/[0.1] border border-primary/10 rounded-full text-primary text-[11px] font-semibold tracking-[0.15em] uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Nossos serviços
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.1] tracking-tight max-w-3xl mx-auto mb-5">
            Tudo que seu pet precisa{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              em um só lugar
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground/70 max-w-xl mx-auto leading-relaxed">
            Banho, tosa e cuidados profissionais com conforto, carinho e segurança.
          </p>
        </motion.div>

        {/* ── Services grid ── */}
        {allServices.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {allServices.map((service, i) => {
              const { config } = service;
              const ServiceIcon = getIconComponent(service.icon || config.icon);
              const hasPrice = (service.price_pequeno || 0) > 0;
              const showBadge = i === 0;

              return (
                <motion.div key={service.id} variants={fade} className="group relative">
                  <div
                    className={cn(
                      'relative h-full rounded-2xl overflow-hidden transition-all duration-300 ease-out',
                      'bg-card/70 dark:bg-card/50 backdrop-blur-sm',
                      'border hover:-translate-y-1',
                      'shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]',
                      'hover:shadow-[0_12px_40px_-10px_hsl(var(--primary)/0.1)]',
                      showBadge
                        ? 'border-primary/20 dark:border-primary/25 shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.08)]'
                        : 'border-border/40 hover:border-primary/15',
                    )}
                  >
                    {/* Top accent – visible on popular or hover */}
                    <div className={cn(
                      'h-[2px] w-full transition-opacity duration-300',
                      showBadge
                        ? 'bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-100'
                        : 'bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 opacity-0 group-hover:opacity-100',
                    )} />

                    {/* Badge */}
                    {showBadge && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-primary/10 dark:bg-primary/15 text-primary border border-primary/15 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Mais pedido
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative px-5 lg:px-6 pt-6 pb-4">
                      {/* Faded bg icon */}
                      <div className="absolute top-2 right-3 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                        <ServiceIcon className="w-20 h-20" />
                      </div>

                      {/* Icon */}
                      <div className={cn(
                        'relative w-12 h-12 rounded-xl flex items-center justify-center mb-5',
                        'bg-gradient-to-br shadow-md transition-shadow duration-300',
                        'group-hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.25)]',
                        config.gradient,
                      )}>
                        <ServiceIcon className="w-6 h-6 text-white" />
                      </div>

                      {/* Category */}
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border mb-3',
                        config.bgBadge,
                      )}>
                        {config.label}
                      </span>

                      <h4 className="text-[15px] font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-200 mb-1.5">
                        {service.name}
                      </h4>

                      {service.description && (
                        <p className="text-sm text-muted-foreground/60 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 lg:px-6 pb-5 pt-1">
                      <div className="flex items-center justify-between pt-4 border-t border-border/25">
                        {/* Price & duration */}
                        <div className="flex items-baseline gap-2.5">
                          {hasPrice && (
                            <span className="text-lg font-extrabold text-foreground tracking-tight">
                              R$&thinsp;{service.price_pequeno}
                            </span>
                          )}
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground/50">
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} min
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <a
                          href="#calendario"
                          className={cn(
                            'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold',
                            'bg-gradient-to-r from-primary to-primary/85 text-primary-foreground',
                            'shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.3)]',
                            'hover:shadow-[0_4px_16px_-3px_hsl(var(--primary)/0.35)] hover:brightness-110',
                            'transition-all duration-200',
                          )}
                        >
                          <Calendar className="w-3 h-3" />
                          Agendar
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Scissors className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Nenhum serviço cadastrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Os serviços aparecerão aqui assim que forem adicionados</p>
          </div>
        )}
      </div>
    </section>
  );
}
