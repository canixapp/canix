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

  // O Protótipo sempre tem acesso a todas as funcionalidades (Modo Lab)
  if (petshop?.slug === 'prototipo') {
    return true;
  }

  // Em desenvolvimento local, também liberamos tudo para agilidade
  if (import.meta.env.DEV) {
    return true;
  }

  // Compara a versão atual da licença com a versão mínima exigida
  // __APP_VERSION__ é injetado pelo Vite baseado no package.json
  const currentVersion = __APP_VERSION__;
  
  // A lógica principal é: a licença do cliente (appVersion no banco) deve ser >= minVersion
  const hasAccess = parseFloat(appVersion) >= parseFloat(minVersion);
  
  return hasAccess;
}
