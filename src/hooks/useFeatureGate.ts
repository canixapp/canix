import { usePetshop } from "@/contexts/PetshopContext";

/**
 * Hook para controle de funcionalidades baseado na versão da aplicação.
 * Permite que novas funcionalidades sejam testadas no Protótipo antes de serem liberadas globalmente.
 * 
 * @param minVersion Versão mínima necessária para habilitar a funcionalidade.
 * @returns boolean Indica se a funcionalidade deve estar ativa.
 */
export function useFeatureGate(minVersion: string): boolean {
  const { appVersion, petshop } = usePetshop();

  // O Protótipo sempre tem acesso a todas as funcionalidades (Versão Infinita)
  if (petshop?.slug === 'prototipo') {
    return true;
  }

  // Compara a versão atual da licença com a versão mínima exigida usando parseFloat
  const hasAccess = parseFloat(appVersion) >= parseFloat(minVersion);
  
  if (import.meta.env.DEV) {
    console.log(`[FeatureGate] Check: ${minVersion} | Current: ${appVersion} | Access: ${hasAccess} | Tenant: ${petshop?.slug}`);
  }

  return hasAccess;
}
