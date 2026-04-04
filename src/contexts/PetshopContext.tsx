import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getPetshop, updatePetshop as updatePetshopService, updatePetshopSettings, Petshop } from '@/services/petshopService';
import { PetshopSettings, DEFAULT_SETTINGS } from '@/lib/constants';

interface PetshopContextType {
  petshop: Petshop | null;
  loading: boolean;
  settings: PetshopSettings;
  appVersion: string;
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
  const appVersion = String(petshop?.app_version || "1.0");

  const handleUpdatePetshop = useCallback(async (data: Partial<Omit<Petshop, 'id' | 'settings'>>) => {
    if (!petshop?.id) return false;
    const ok = await updatePetshopService(data, petshop.id);
    if (ok) await load();
    return ok;
  }, [load, petshop?.id]);

  const handleUpdateSettings = useCallback(async (s: Partial<PetshopSettings>) => {
    if (!petshop?.id) return false;
    const ok = await updatePetshopSettings(s, petshop.id);
    if (ok) await load();
    return ok;
  }, [load, petshop?.id]);

  return (
    <PetshopContext.Provider value={{
      petshop, loading, settings, appVersion,
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
