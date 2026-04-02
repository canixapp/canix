import { useCallback } from 'react';
import { usePetshop } from '@/contexts/PetshopContext';
import { HomeContent, DEFAULT_HOME_CONTENT } from '@/lib/constants';

export type { HomeContent };

export function useHomeContent() {
  const { settings, updateSettings } = usePetshop();

  const homeContent: HomeContent = settings.homeContent || DEFAULT_HOME_CONTENT;

  const setHomeContent = useCallback(async (content: HomeContent) => {
    await updateSettings({ homeContent: content });
  }, [updateSettings]);

  const resetHomeContent = useCallback(async () => {
    await updateSettings({ homeContent: DEFAULT_HOME_CONTENT });
  }, [updateSettings]);

  return { homeContent, setHomeContent, resetHomeContent, DEFAULT_HOME_CONTENT };
}
