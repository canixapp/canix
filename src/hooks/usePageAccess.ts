import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/contexts/AuthContext';

export type PageKey =
  | 'dashboard'
  | 'agendamentos'
  | 'clientes'
  | 'pacotes'
  | 'valores'
  | 'moderacao'
  | 'configuracoes'
  | 'servicos';

export interface PageAccessEntry {
  role: string;
  page_key: string;
  allowed: boolean;
}

export const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'Dashboard Admin',
  agendamentos: 'Agendamentos',
  clientes: 'Clientes',
  pacotes: 'Pacotes',
  valores: 'Valores',
  moderacao: 'Galeria e AvaliaÃ§Ãµes',
  configuracoes: 'ConfiguraÃ§Ãµes',
  servicos: 'ServiÃ§os',
};

const DEFAULT_ACCESS: Record<string, Record<string, boolean>> = {
  admin: {
    dashboard: true, agendamentos: true, clientes: true, pacotes: true,
    valores: true, moderacao: true, configuracoes: true, servicos: false,
  },
  midia: {
    dashboard: false, agendamentos: false, clientes: false, pacotes: false,
    valores: false, moderacao: true, configuracoes: false, servicos: false,
  },
};

export function usePageAccess() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(DEFAULT_ACCESS);
  const [loaded, setLoaded] = useState(false);

  // Fetch from DB
  useEffect(() => {
    const fetchMatrix = async () => {
      const { data } = await supabase
        .from('page_access_matrix')
        .select('role, page_key, allowed');
      
      if (data && data.length > 0) {
        const built: Record<string, Record<string, boolean>> = { admin: {}, midia: {} };
        data.forEach((row: any) => {
          if (row.role === 'admin' || row.role === 'midia') {
            built[row.role][row.page_key] = row.allowed;
          }
        });
        // Merge with defaults
        setMatrix({
          admin: { ...DEFAULT_ACCESS.admin, ...built.admin },
          midia: { ...DEFAULT_ACCESS.midia, ...built.midia },
        });
      }
      setLoaded(true);
    };
    fetchMatrix();
  }, []);

  const toggleAccess = useCallback(async (role: 'admin' | 'midia', page: PageKey) => {
    const newValue = !matrix[role]?.[page];
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [page]: newValue },
    }));

    // Upsert in DB
    await supabase
      .from('page_access_matrix')
      .upsert(
        { role: role as any, page_key: page, allowed: newValue },
        { onConflict: 'role,page_key' }
      );
  }, [matrix]);

  const canAccess = useCallback((role: AppRole | string, page: PageKey): boolean => {
    if (role === 'dev') return true;
    if (role === 'cliente') return false;
    if (role === 'admin' || role === 'midia') {
      return matrix[role]?.[page] ?? false;
    }
    return false;
  }, [matrix]);

  const resetToDefaults = useCallback(async () => {
    setMatrix(DEFAULT_ACCESS);
    // Update DB entry by entry
    for (const [role, pages] of Object.entries(DEFAULT_ACCESS)) {
      for (const [page, allowed] of Object.entries(pages)) {
        await supabase
          .from('page_access_matrix')
          .upsert(
            { role: role as any, page_key: page, allowed },
            { onConflict: 'role,page_key' }
          );
      }
    }
  }, []);

  return { matrix, toggleAccess, canAccess, resetToDefaults, loaded };
}
