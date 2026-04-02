import { useState, useEffect } from 'react';
import { Cookie, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const CONSENT_KEY = 'petcao_cookie_consent';

type ConsentStatus = 'accepted' | 'declined' | null;

function getStoredConsent(): ConsentStatus {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') return stored;
    return null;
  } catch {
    return null;
  }
}

function setStoredConsent(status: ConsentStatus) {
  try {
    if (status) {
      localStorage.setItem(CONSENT_KEY, status);
    }
  } catch {
    // localStorage not available
  }
}

export function CookieConsentModal() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Delay showing to not block initial render
    const timer = setTimeout(() => {
      const consent = getStoredConsent();
      if (!consent) {
        setShowBanner(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setStoredConsent('accepted');
    setShowBanner(false);
    // Trigger SW registration immediately
    window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_KEY, newValue: 'accepted' }));
  };

  const handleDecline = () => {
    setStoredConsent('declined');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-background border border-border rounded-2xl shadow-xl p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-primary sm:hidden" />
                      Cookies e Performance
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Usamos tecnologias de armazenamento local para melhorar a performance do site, 
                      como cache de imagens para carregamento mais rápido. Isso torna sua experiência 
                      mais fluida em visitas futuras.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Seus dados são protegidos conforme a LGPD</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      onClick={handleAccept}
                      className="flex-1 sm:flex-none"
                    >
                      Aceitar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDecline}
                      className="flex-1 sm:flex-none"
                    >
                      Recusar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Check if user has given cookie consent
 */
export function hasCookieConsent(): boolean {
  return getStoredConsent() === 'accepted';
}
