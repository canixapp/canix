import { supabase } from '@/lib/supabase';

export interface DashboardModuleConfig {
  enabled: boolean;
  order: number;
  cards?: Record<string, boolean>;
}

export interface DashboardPreferences {
  resumoFinanceiro: DashboardModuleConfig;
  metodosPagamento: DashboardModuleConfig;
  cardsOperacao: DashboardModuleConfig;
  graficos: DashboardModuleConfig;
  listaServicos: DashboardModuleConfig;
}

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  resumoFinanceiro: {
    enabled: true,
    order: 0,
    cards: {
      receita: true,
      despesa: true,
      lucro: true,
      pendente: true,
      ticketMedio: true,
      metodoPagamento: true,
    },
  },
  metodosPagamento: { enabled: true, order: 1 },
  cardsOperacao: {
    enabled: true,
    order: 2,
    cards: {
      atendimentos: true,
      agendamentosPendentes: true,
      cancelamentos: true,
      taxaConfirmacao: true,
      maisVendido: true,
      maisFrequente: true,
      melhorDia: true,
    },
  },
  graficos: { enabled: true, order: 3 },
  listaServicos: { enabled: true, order: 4 },
};

export async function getDashboardPreferences(userId: string): Promise<DashboardPreferences> {
  const { data, error } = await supabase
    .from('dashboard_preferences' as any)
    .select('modules')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_PREFERENCES };
  try {
    const modules = (data as any).modules as DashboardPreferences;
    return { ...DEFAULT_PREFERENCES, ...modules };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function saveDashboardPreferences(userId: string, prefs: DashboardPreferences): Promise<boolean> {
  const { error } = await supabase
    .from('dashboard_preferences' as any)
    .upsert({
      user_id: userId,
      modules: prefs as any,
    } as any, { onConflict: 'user_id' });
  return !error;
}
