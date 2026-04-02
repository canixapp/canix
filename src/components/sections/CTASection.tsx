import { ArrowRight, Heart, Dog, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPetshopWhatsAppPhone, openWhatsAppConversation } from '@/lib/whatsapp';
import { usePetshop } from '@/contexts/PetshopContext';
import petTexture from '@/assets/pet-texture.png';

export function CTASection() {
  const { petshop, settings } = usePetshop();
  const address = petshop?.address || '';
  const petshopWhatsAppPhone = getPetshopWhatsAppPhone({
    phone: petshop?.phone,
    whatsappUrl: settings?.social_links?.links?.whatsapp_url,
  });

  const scrollToAgenda = () => {
    const element = document.querySelector('#agenda');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-primary dark:bg-[hsl(210_50%_6%)]">
      {/* Layered background — no blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80 dark:from-[hsl(210_50%_6%)] dark:via-[hsl(210_50%_8%)] dark:to-[hsl(210_50%_10%)]" />

      {/* Pet-themed texture pattern */}
      <div className="absolute inset-0 opacity-[0.22] dark:opacity-[0.14]" style={{
        backgroundImage: `url(${petTexture})`,
        backgroundSize: '300px 300px',
        backgroundRepeat: 'repeat',
      }} />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.12] dark:bg-white/[0.06] rounded-full text-primary-foreground dark:text-white/80 text-sm font-medium mb-8 border border-white/[0.1] dark:border-white/[0.06]">
            <Sparkles className="w-4 h-4 text-secondary dark:text-secondary/80" />
            Mais de 500 pets atendidos com carinho
            <Heart className="w-3.5 h-3.5 text-secondary dark:text-secondary/70" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground dark:text-white mb-6 tracking-tight leading-[1.1]">
            Seu pet merece o{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-secondary to-secondary/80 dark:from-secondary dark:to-secondary/70 bg-clip-text text-transparent">
                melhor cuidado
              </span>
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground/80 dark:text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Agende agora e deixe seu amigo nas melhores mãos de Cajamar.
            Atendimento personalizado e muito carinho!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="group relative bg-secondary hover:bg-secondary/90 text-secondary-foreground text-base md:text-lg px-8 py-6 rounded-xl shadow-lg shadow-secondary/30 dark:shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/40 transition-shadow duration-200"
              onClick={scrollToAgenda}
            >
              Agendar Agora
              <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/[0.08] dark:bg-white/[0.04] border-white/20 dark:border-white/10 text-primary-foreground dark:text-white/90 hover:bg-white/[0.15] dark:hover:bg-white/[0.08] hover:border-white/30 dark:hover:border-white/15 text-base md:text-lg px-8 py-6 rounded-xl transition-colors duration-200"
              onClick={() => openWhatsAppConversation({ phone: petshopWhatsAppPhone, message: 'Olá! Gostaria de tirar uma dúvida sobre os serviços do PetCão.' })}
            >
              Falar no WhatsApp
            </Button>
          </div>

          {/* Address */}
          {address && (
            <div className="flex items-center justify-center gap-2.5 mt-10 px-5 py-3 bg-white/[0.06] dark:bg-white/[0.03] rounded-full border border-white/[0.06] dark:border-white/[0.04] w-fit mx-auto">
              <Dog className="w-4 h-4 text-primary-foreground/60 dark:text-white/40" />
              <span className="text-sm text-primary-foreground/70 dark:text-white/50">{address}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
