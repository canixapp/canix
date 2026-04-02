import { Heart, Instagram, Facebook, Youtube, Globe, MessageCircle, Music2, MapPin, Phone, Clock, ArrowUpRight, ChevronUp } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import logoPetDefault from '@/assets/logopet.png';
import { useBranding } from '@/contexts/BrandingContext';
import { useConfig } from '@/hooks/useConfig';
import { usePetshop } from '@/contexts/PetshopContext';
import { Skeleton } from '@/components/ui/skeleton';

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  site: Globe,
};

function ContactSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      ))}
    </div>
  );
}

function SocialSkeleton() {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="w-11 h-11 rounded-xl" />
      ))}
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { branding } = useBranding();
  const { socialLinks, shopAddress } = useConfig();
  const { settings, loading: petshopLoading } = usePetshop();
  const logoSrc = branding.logoUrl || logoPetDefault;

  const isLoading = petshopLoading;
  const address = shopAddress.address || '';
  const phone = shopAddress.phone || '';
  const enabledSocials = socialLinks.filter(s => s.enabled && s.url);
  const hasContactInfo = phone || address;

  const openDays = settings.openDaysDefault || [];
  const hoursLabel = openDays.length > 0
    ? `${openDays[0].charAt(0).toUpperCase() + openDays[0].slice(1)} - ${openDays[openDays.length - 1].charAt(0).toUpperCase() + openDays[openDays.length - 1].slice(1)}: ${settings.openTimeDefault.replace(':', 'h')} às ${settings.closeTimeDefault.replace(':', 'h')}`
    : '';

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navLinks = [
    { href: '#inicio', label: 'Início' },
    { href: '#servicos', label: 'Serviços' },
    { href: '#valores', label: 'Valores' },
    { href: '#agenda', label: 'Agenda' },
    { href: '#fotos', label: 'Galeria' },
    { href: '#avaliacoes', label: 'Avaliações' },
    { href: '#localizacao', label: 'Localização' },
  ];

  return (
    <footer className="relative overflow-hidden bg-muted/60 dark:bg-[hsl(210_50%_8%)] text-foreground dark:text-white">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Ambient light */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-primary/[0.04] dark:bg-primary/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-secondary/[0.03] dark:bg-secondary/[0.04] rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* ── Top section: Brand + Back to top ── */}
        <div className="flex items-center justify-between pt-14 pb-10 border-b border-border/50 dark:border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-background/80 dark:bg-white/[0.06] rounded-2xl backdrop-blur-sm border border-border/60 dark:border-white/[0.06]">
              <OptimizedImage src={logoSrc} alt={branding.shopName} className="h-9 w-auto max-w-[140px] max-h-9 object-contain" showSkeleton={false} />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">{branding.shopName}</h3>
              <p className="text-[13px] text-muted-foreground">Cuidado premium para seu pet</p>
            </div>
          </div>
          <button
            onClick={scrollToTop}
            className="group w-11 h-11 bg-background/60 dark:bg-white/[0.06] hover:bg-background dark:hover:bg-white/[0.12] border border-border/60 dark:border-white/[0.08] hover:border-border dark:hover:border-white/[0.15] rounded-xl flex items-center justify-center transition-all duration-300"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 py-12">
          {/* About — spans 5 cols */}
          <div className="md:col-span-5 space-y-6">
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-sm">
              Inaugurado em 13 de maio de 2023, o PetCão nasceu com o propósito de oferecer cuidado, carinho e qualidade para os pets e tranquilidade para seus tutores. Um ambiente acolhedor, com atendimento dedicado e serviços pensados para o bem-estar dos animais.
            </p>

            {isLoading ? (
              <SocialSkeleton />
            ) : enabledSocials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {enabledSocials.map(social => {
                  const Icon = SOCIAL_ICONS[social.key] || Globe;
                  return (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.label}
                      className="group w-11 h-11 bg-background/60 dark:bg-white/[0.05] hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl flex items-center justify-center transition-all duration-300 border border-border/60 dark:border-white/[0.06] hover:border-primary/30 hover:scale-105"
                    >
                      <Icon className="w-[18px] h-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50">Redes sociais indisponíveis.</p>
            )}
          </div>

          {/* Navigation — spans 3 cols */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-5">Navegação</h4>
            <nav className="space-y-2.5">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact — spans 4 cols */}
          <div className="md:col-span-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-5">Contato</h4>
            {isLoading ? (
              <ContactSkeleton />
            ) : hasContactInfo || hoursLabel ? (
              <div className="space-y-3">
                {phone && (
                  <a href={`tel:${phone.replace(/\D/g, '')}`} className="group flex items-center gap-3">
                    <div className="w-9 h-9 bg-background/60 dark:bg-white/[0.05] rounded-xl flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-primary/15 transition-all duration-300 border border-border/60 dark:border-white/[0.06] group-hover:border-primary/20">
                      <Phone className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[14px] text-muted-foreground group-hover:text-foreground transition-colors">{phone}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors ml-auto" />
                  </a>
                )}
                {address && (
                  <div className="group flex items-start gap-3">
                    <div className="w-9 h-9 bg-background/60 dark:bg-white/[0.05] rounded-xl flex items-center justify-center shrink-0 mt-0.5 border border-border/60 dark:border-white/[0.06]">
                      <MapPin className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                    <span className="text-[14px] text-muted-foreground leading-relaxed">{address}</span>
                  </div>
                )}
                {hoursLabel && (
                  <div className="group flex items-center gap-3">
                    <div className="w-9 h-9 bg-background/60 dark:bg-white/[0.05] rounded-xl flex items-center justify-center border border-border/60 dark:border-white/[0.06]">
                      <Clock className="w-4 h-4 text-muted-foreground/60" />
                    </div>
                    <span className="text-[14px] text-muted-foreground">{hoursLabel}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/40">Informações indisponíveis no momento.</p>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-border/50 dark:border-white/[0.06] py-6 pb-24 lg:pb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground/50 tracking-wide">
            © {currentYear} {branding.shopName}. Todos os direitos reservados.
          </p>
          <p className="text-[12px] text-muted-foreground/50 flex items-center gap-1.5 tracking-wide">
            Feito com <Heart className="w-3 h-3 text-secondary/70" /> em Cajamar
          </p>
        </div>
      </div>
    </footer>
  );
}
