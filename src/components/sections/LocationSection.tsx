import { MapPin, Navigation, Clock, Phone, Settings, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/hooks/useConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useHomeContent } from '@/hooks/useHomeContent';
import { usePetshop } from '@/contexts/PetshopContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cardVariants } from '@/lib/animations';

export function LocationSection() {
  const { shopAddress, locationSettings } = useConfig();
  const { settings } = usePetshop();
  const { isDev, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { homeContent } = useHomeContent();
  const address = shopAddress.address || '';
  const phone = shopAddress.phone || '';
  const showAdmin = isDev() || isAdmin();

  const lat = locationSettings.latitude;
  const lng = locationSettings.longitude;
  const zoom = locationSettings.zoom || 15;
  const hasCoords = lat && lng;

  const openDays = settings.openDaysDefault || [];
  const hoursLabel = openDays.length > 0
    ? `${openDays[0].charAt(0).toUpperCase() + openDays[0].slice(1)} - ${openDays[openDays.length - 1].charAt(0).toUpperCase() + openDays[openDays.length - 1].slice(1)}: ${settings.openTimeDefault.replace(':', 'h')} às ${settings.closeTimeDefault.replace(':', 'h')}`
    : 'Horário não configurado';

  const closedDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
    .filter(d => !openDays.includes(d))
    .map(d => d.charAt(0).toUpperCase() + d.slice(1));

  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '#';
  const embedUrl = hasCoords
    ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3659.8!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1spt-BR!2sbr!4v1234567890`
    : '';

  return (
    <section id="localizacao" className="py-20 md:py-28 scroll-mt-20 relative overflow-hidden">
      {/* Lightweight background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-14 relative"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">Onde estamos</span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Localização</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{homeContent.location.description}</p>
          {showAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate('/admin/configuracoes#endereco')} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted">
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Atalho para configurações (Admin)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Map */}
          <motion.div
            className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/50"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="aspect-[16/9] md:aspect-[21/9] bg-muted relative">
              {hasCoords ? (
                <iframe src={embedUrl} className="absolute inset-0 w-full h-full" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Localização não configurada.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info cards row */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: MapPin, title: 'Endereço', content: address || 'Não configurado' },
              { icon: Clock, title: 'Horário', content: hoursLabel, extra: closedDays.length > 0 ? `${closedDays.join(', ')}: Fechado` : null },
              { icon: Phone, title: 'Contato', content: phone || 'Não configurado' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="group relative rounded-2xl bg-card border border-border/60 p-5 transition-shadow duration-200 hover:shadow-md hover:border-primary/30"
                variants={cardVariants}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-0.5">{card.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.content}</p>
                    {card.extra && <p className="text-xs text-muted-foreground/70 mt-0.5">{card.extra}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.22 }}
          >
            <Button
              size="lg"
              className="rounded-xl px-8 shadow-lg shadow-primary/20 transition-shadow duration-200"
              onClick={() => hasCoords && window.open(mapsUrl, '_blank')}
              disabled={!hasCoords}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Como Chegar
              <ExternalLink className="w-4 h-4 ml-2 opacity-60" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
