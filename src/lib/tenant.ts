const BASE_DOMAIN = 'canix.app.br';

export const getTenantSlug = () => {
  // 1. Prioridade para parâmetro de query (ideal para testes: ?tenant=petcao)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) return tenantParam;

  const hostname = window.location.hostname.toLowerCase();
  
  // 2. Para desenvolvimento local (incluindo subdomínios em localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    
    // Se for hub.localhost, trata como o Hub principal
    if (parts.length > 1 && parts[0] === 'hub') {
      return null;
    }
    
    // Se tiver subdomínio (ex: prototipo.localhost), retorna o slug
    if (parts.length > 1) {
      return parts[0];
    }
    
    return null; // Apenas localhost -> Hub
  }

  // 3. Para produção (canix.app.br e seus subdomínios)
  if (hostname === BASE_DOMAIN) {
    return null;
  }

  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const slug = hostname.split('.')[0];
    
    // Ignora 'www' e 'hub' como tenants, tratando-os como o Hub principal
    if (slug === 'www' || slug === 'hub') {
      return null;
    }
    
    return slug;
  }

  // 4. Fallback para outros domínios (ex: Vercel Preview)
  // Se não estiver no domínio principal, tentamos pegar o primeiro segmento se tiver subdomínio
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const firstPart = parts[0];
    if (firstPart !== 'www' && firstPart !== 'hub') {
      return firstPart;
    }
  }

  return null;
};
