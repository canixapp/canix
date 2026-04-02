import { ArrowRight, Clock, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/contexts/BrandingContext';
import { useHomeContent } from '@/hooks/useHomeContent';
import { usePetshop } from '@/contexts/PetshopContext';
import { useHeroGalleryImages } from '@/hooks/useHeroGalleryImages';
import { OrbitalVisual } from '@/components/hero/OrbitalVisual';
import heroDog from '@/assets/hero-dog.png';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { heroStagger as stagger, heroFadeUp as fadeUp } from '@/lib/animations';

/* ── Inject scroll indicator animation (CSS-only) ── */
const scrollStyleId = 'hero-scroll-styles';
if (typeof document !== 'undefined' && !document.getElementById(scrollStyleId)) {
  const style = document.createElement('style');
  style.id = scrollStyleId;
  style.textContent = `
    @keyframes hero-scroll-bounce {
      0%, 100% { transform: translateY(0); opacity: 0.6 }
      50% { transform: translateY(8px); opacity: 1 }
    }
    .hero-scroll-indicator { animation: hero-scroll-bounce 1.8s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .hero-scroll-indicator { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export function HeroSection() {
  const { shopStatus } = useBranding();
  const { homeContent } = useHomeContent();
  const { settings } = usePetshop();

  const yearsOfExperience = (() => {
    const inaugurated = settings.inauguratedAt;
    if (!inaugurated) return 0;
    const start = new Date(inaugurated);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
      years--;
    }
    return Math.max(0, years);
  })();

  // Dynamic gallery images with static fallback
  const { urls: galleryUrls } = useHeroGalleryImages(3);
  const heroImages = homeContent.hero.heroImages;
  const fallback1 = heroImages?.image1 || '';
  const fallback2 = heroImages?.image2 || '';
  const fallback3 = heroImages?.image3 || '';
  const img1 = galleryUrls[0] || fallback1;
  const img2 = galleryUrls[1] || fallback2;
  const img3 = galleryUrls[2] || fallback3;
  const mascot = homeContent.hero.imageUrl || heroDog;

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNextSection = () => {
    const hero = document.getElementById('inicio');
    if (hero?.nextElementSibling) {
      hero.nextElementSibling.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrbitalClick = (index: 1 | 2 | 3) => {
    const targets: Record<number, string> = { 1: '#galeria', 2: '#servicos', 3: '#galeria' };
    scrollToSection(targets[index]);
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-16 pb-28 lg:pb-0 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* ── Left column — text content ── */}
          <motion.div
            className="text-center lg:text-left space-y-7 lg:space-y-6"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Desktop badges */}
            <motion.div variants={fadeUp} className="hidden lg:flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Agendamento Online
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-default ${
                    shopStatus.isOpen
                      ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${shopStatus.isOpen ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}`} />
                    {shopStatus.statusLabel}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{shopStatus.tooltipLabel}</p>
                </TooltipContent>
              </Tooltip>
              {shopStatus.timeLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-muted/80 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {shopStatus.timeLabel}
                </div>
              )}
            </motion.div>

            {/* Mobile badge */}
            <motion.div variants={fadeUp} className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Agendamento Online
            </motion.div>

            {/* Title — improved typography */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] lg:leading-tight max-w-[320px] sm:max-w-none mx-auto lg:mx-0"
            >
              {homeContent.hero.title.includes('carinho') ? (
                <>
                  <span className="text-foreground">Seu pet merece</span>
                  <br className="sm:hidden" />
                  {' '}<span className="text-primary">carinho</span>
                  {' '}<span className="text-foreground">e</span>
                  {' '}<span className="text-primary">cuidado</span>
                </>
              ) : (
                homeContent.hero.title
              )}
            </motion.h1>

            {/* Mobile orbital visual — more breathing room */}
            <motion.div variants={fadeUp} className="lg:hidden flex justify-center py-2">
              <OrbitalVisual
                mascot={mascot}
                img1={img1}
                img2={img2}
                img3={img3}
                onClickImage={handleOrbitalClick}
              />
            </motion.div>

            {/* Mobile status chips */}
            <motion.div variants={fadeUp} className="lg:hidden flex flex-wrap items-center gap-2 justify-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                shopStatus.isOpen
                  ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                <span className={`w-2 h-2 rounded-full ${shopStatus.isOpen ? 'bg-[hsl(var(--success))]' : 'bg-destructive'}`} />
                {shopStatus.statusLabel}
              </div>
              {shopStatus.timeLabel && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {shopStatus.timeLabel}
                </div>
              )}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {homeContent.hero.subtitle}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-1">
              <Button
                size="lg"
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-200"
                onClick={() => {
                  const calendarEl = document.getElementById('agenda-wizard') || document.getElementById('agenda');
                  if (calendarEl) calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {homeContent.hero.buttonPrimary}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 hover:bg-primary/5 transition-colors duration-200" onClick={() => scrollToSection('#servicos')}>
                {homeContent.hero.buttonSecondary}
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center lg:justify-start gap-8 pt-6 mx-[10px]"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Pets atendidos</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">4.9</p>
                <p className="text-sm text-muted-foreground">Avaliação média</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {yearsOfExperience}{yearsOfExperience === 1 ? ' ano' : ' anos'}
                </p>
                <p className="text-sm text-muted-foreground">De experiência</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right column — orbital visual (desktop) ── */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <OrbitalVisual
              mascot={mascot}
              img1={img1}
              img2={img2}
              img3={img3}
              onClickImage={handleOrbitalClick}
            />
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.button
        type="button"
        onClick={scrollToNextSection}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200 focus:outline-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        aria-label="Rolar para baixo"
      >
        <span className="text-[10px] font-medium tracking-widest uppercase">Explorar</span>
        <ChevronDown className="w-5 h-5 hero-scroll-indicator" />
      </motion.button>
    </section>
  );
}
