import { useState } from 'react';
import { MessageCircle, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getPetshopWhatsAppPhone, openWhatsAppConversation } from '@/lib/whatsapp';

type DogSize = 'pequeno' | 'medio' | 'grande';

interface PricingItem {
  id: string;
  name: string;
  prices: Record<DogSize, number>;
  description?: string;
}

interface PackageInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageItem: PricingItem | null;
}

const sizeLabels: Record<DogSize, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

export function PackageInterestModal({ isOpen, onClose, packageItem }: PackageInterestModalProps) {
  const [selectedSize, setSelectedSize] = useState<DogSize | null>(null);

  const handleWhatsAppRedirect = () => {
    if (!packageItem || !selectedSize) return;

    const message = `Olá! Tenho interesse no pacote ${packageItem.name} para um cachorro de porte ${sizeLabels[selectedSize]}.\nGostaria de mais informações para fechar o pacote.`;
    openWhatsAppConversation({ phone: getPetshopWhatsAppPhone(), message });
    onClose();
    setSelectedSize(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedSize(null);
  };

  if (!packageItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Pacote {packageItem.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {packageItem.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <h4 className="text-center font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
            <Dog className="w-5 h-5 text-primary" />
            Qual o porte do seu cachorro?
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(sizeLabels) as DogSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  selectedSize === size
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-muted/30'
                }`}
              >
                <p className="font-semibold text-foreground text-sm">
                  {sizeLabels[size]}
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  R$ {packageItem.prices[size]}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          disabled={!selectedSize}
          onClick={handleWhatsAppRedirect}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Falar com o PetCão no WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
