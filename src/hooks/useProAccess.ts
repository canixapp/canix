import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePetshop } from '@/contexts/PetshopContext';
import { useTestModes } from '@/contexts/TestModesContext';
import { supabase } from '@/lib/supabase';

export function useProAccess() {
  const { user } = useAuth();
  const { plan } = usePetshop();
  const { proModeActive, basicModeActive } = useTestModes();
  const [simulatedPlan, setSimulatedPlan] = useState<'pro' | 'basic' | null>(null);

  // Removed old user-based subscription fetch for SaaS architecture

  const isProActive = useMemo(() => {
    if (user?.role === 'dev') {
      if (basicModeActive) return false;
      if (proModeActive) return true;
      return true;
    }
    
    if (simulatedPlan === 'basic') return false;
    if (simulatedPlan === 'pro') return true;
    
    // SaaS logic: Check petshop plan features
    const premiumModules = ['financeiro', 'estoque', 'relatorios', 'lembretes', 'marketing'];
    return plan.features?.some(f => premiumModules.includes(f)) || plan.name === 'Free (Trial)';
  }, [user, plan, simulatedPlan, proModeActive, basicModeActive]);

  const simulatePlan = useCallback((plan: 'pro' | 'basic' | null) => {
    setSimulatedPlan(plan);
  }, []);

  const canExport = useMemo(() => {
    if (!user) return false;
    if (user.role === 'midia') return false;
    return isProActive;
  }, [user, isProActive]);

  const showExportButton = useMemo(() => {
    if (!user) return false;
    return user.role === 'dev' || user.role === 'admin';
  }, [user]);

  return {
    isProActive, canExport, showExportButton,
    simulatePlan, simulatedPlan,
  };
}
