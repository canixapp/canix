import { useState, useEffect } from 'react';
import { Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieConsentModal() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    console.log('Cookie Lab Debug - Hostname:', hostname);
    
    // REGRA DE OURO: Ocultar APENAS se estiver no HUB
    const isHub = hostname.includes('hub') || hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isHub) {
      console.log('Cookie Lab Debug - Is Hub, hiding.');
      return;
    }

    const timer = setTimeout(() => {
      const consent = localStorage.getItem('petcao_cookie_consent');
      console.log('Cookie Lab Debug - Consent found:', consent);
      if (!consent) {
        setShowBanner(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('petcao_cookie_consent', 'accepted');
    setShowBanner(false);
    window.dispatchEvent(new StorageEvent('storage', { key: 'petcao_cookie_consent', newValue: 'accepted' }));
  };

  const handleDecline = () => {
    localStorage.setItem('petcao_cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      id="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 z-[99999] p-4 sm:p-6"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="bg-background border-2 border-primary/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 sm:p-6 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center flex-shrink-0 animate-pulse">
              <Cookie className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-primary sm:hidden" />
                  Cookies e Performance no Lab
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Utilizamos armazenamento local para acelerar o carregamento do seu laboratório. Ao prosseguir, você concorda com o uso de cache local para uma experiência premium.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Ambiente de Testes Protegido (LGPD)</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button onClick={handleAccept} className="flex-1 sm:flex-none font-bold">Aceitar Cookies</Button>
                <Button variant="outline" onClick={handleDecline} className="flex-1 sm:flex-none opacity-70">Recusar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
