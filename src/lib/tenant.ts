export const getTenantSlug = () => {
  // 1. Prioridade para parâmetro de query (ideal para testes: ?tenant=petcao)
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  if (tenantParam) return tenantParam;

  const hostname = window.location.hostname;
  
  // 2. Para desenvolvimento local (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Você pode testar subdomínios via: petcao.localhost
    // Mas o navegador geralmente precisa de configuração no hosts ou usar lvh.me
    // Se houver um ponto, assumimos que a primeira parte é o tenant
    const parts = hostname.split('.');
    if (parts.length > 1) return parts[0];
    return null; // Hub
  }

  // 3. Para produção (canix.app.br)
  const parts = hostname.split('.');
  if (parts.length > 3) {
    // subdominio.canix.app.br -> ['subdominio', 'canix', 'app', 'br']
    return parts[0];
  }

  return null; // Hub (domínio principal)
};
