import { MessageCircle, Phone, ExternalLink, Clock, Sparkles } from 'lucide-react';
import petTextureGray from '@/assets/pet-texture-gray.png';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getPetshopWhatsAppPhone, openWhatsAppConversation } from '@/lib/whatsapp';
import { usePetshop } from '@/contexts/PetshopContext';
import { sectionAnim } from '@/lib/animations';

export function WhatsAppSection() {
  const { petshop, settings } = usePetshop();
  const phone = petshop?.phone || '';
  const hoursLabel = petshop?.hours || '';
  const petshopWhatsAppPhone = getPetshopWhatsAppPhone({
    phone: petshop?.phone,
    whatsappUrl: settings?.social_links?.links?.whatsapp_url,
  });

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Lightweight background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-success mb-3">Atendimento rápido</span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Agende pelo WhatsApp
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Prefere falar diretamente conosco? Mande uma mensagem e respondemos em minutos!
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            className="relative rounded-3xl bg-card border border-border/60 overflow-hidden shadow-lg ring-1 ring-border/30"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-success/40 via-success to-success/40" />

            <div className="grid md:grid-cols-5 gap-0">
              {/* Left side - CTA */}
              <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6">
                  <MessageCircle className="w-8 h-8 text-success" />
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Fale conosco agora mesmo
                </h3>
                <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Tire dúvidas, agende serviços ou peça informações sobre pacotes. Estamos prontos para atender você e seu pet!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <Button
                    size="lg"
                    className="bg-success hover:bg-success/90 text-success-foreground rounded-xl px-8 shadow-lg shadow-success/20 hover:shadow-xl hover:shadow-success/30 transition-shadow duration-200"
                    onClick={() => {
                      openWhatsAppConversation({
                        phone: petshopWhatsAppPhone,
                        message: 'Olá! Gostaria de agendar um horário para meu pet.',
                      });
                    }}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Abrir WhatsApp
                    <ExternalLink className="w-4 h-4 ml-2 opacity-60" />
                  </Button>
                </div>
              </div>

              {/* Right side - Info cards */}
              <div className="md:col-span-2 relative bg-muted/30 p-8 md:p-10 flex flex-col justify-center gap-6 border-t md:border-t-0 md:border-l border-border/60 overflow-hidden">
                {/* Pet texture overlay */}
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]" style={{
                  backgroundImage: `url(${petTextureGray})`,
                  backgroundSize: '350px 350px',
                  backgroundRepeat: 'repeat',
                }} />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Resposta rápida</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Respondemos em poucos minutos</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Atendimento humano</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sem robôs, fale com a gente</p>
                  </div>
                </div>

                {hoursLabel && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Horário</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{hoursLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
