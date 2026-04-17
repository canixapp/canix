import { getTenantSlug } from './tenant';

const CONSENT_KEY = 'petcao_cookie_consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getStoredConsent(): ConsentStatus {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') return stored;
    return null;
  } catch {
    return null;
  }
}

export function setStoredConsent(status: ConsentStatus) {
  try {
    if (status) {
      localStorage.setItem(CONSENT_KEY, status);
    }
  } catch {
    // localStorage not available
  }
}

export function hasCookieConsent(): boolean {
  return getStoredConsent() === 'accepted';
}

export function shouldShowCookieBanner(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  
  // SE FOR O HUB (ORQUESTRADOR), NÃO MOSTRA NADA
  if (hostname.includes('hub')) return false;
  
  // SE FOR O LOCALHOST PURO (SEM SUBDOMÍNIO), TAMBÉM NÃO MOSTRA (é o Hub local)
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

  // CASO CONTRÁRIO (QUALQUER SUBDOMÍNIO OU LICENÇA), VERIFICA CONSENTIMENTO
  try {
    const consent = localStorage.getItem('petcao_cookie_consent');
    return !consent;
  } catch {
    return false;
  }
}
