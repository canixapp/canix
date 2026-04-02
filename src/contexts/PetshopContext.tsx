import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getPetshop, updatePetshop as updatePetshopService, updatePetshopSettings, Petshop } from '@/services/petshopService';
import { PetshopSettings, DEFAULT_SETTINGS } from '@/lib/constants';

interface PetshopContextType {
  petshop: Petshop | null;
  loading: boolean;
  settings: PetshopSettings;
  refresh: () => Promise<void>;
  updatePetshop: (data: Partial<Omit<Petshop, 'id' | 'settings'>>) => Promise<boolean>;
  updateSettings: (s: Partial<PetshopSettings>) => Promise<boolean>;
}

const PetshopContext = createContext<PetshopContextType | undefined>(undefined);

export function PetshopProvider({ children }: { children: ReactNode }) {
  const [petshop, setPetshop] = useState<Petshop | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getPetshop();
    setPetshop(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const settings = petshop?.settings || DEFAULT_SETTINGS;

  const handleUpdatePetshop = useCallback(async (data: Partial<Omit<Petshop, 'id' | 'settings'>>) => {
    const ok = await updatePetshopService(data);
    if (ok) await load();
    return ok;
  }, [load]);

  const handleUpdateSettings = useCallback(async (s: Partial<PetshopSettings>) => {
    const ok = await updatePetshopSettings(s);
    if (ok) await load();
    return ok;
  }, [load]);

  return (
    <PetshopContext.Provider value={{
      petshop, loading, settings,
      refresh: load,
      updatePetshop: handleUpdatePetshop,
      updateSettings: handleUpdateSettings,
    }}>
      {children}
    </PetshopContext.Provider>
  );
}

export function usePetshop() {
  const ctx = useContext(PetshopContext);
  if (!ctx) throw new Error('usePetshop must be used within PetshopProvider');
  return ctx;
}
