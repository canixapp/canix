import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTestModes } from '@/contexts/TestModesContext';
import { supabase } from '@/lib/supabase';

export function useProAccess() {
  const { user } = useAuth();
  const { proModeActive, basicModeActive } = useTestModes();
  const [dbIsPro, setDbIsPro] = useState<boolean | null>(null);
  const [simulatedPlan, setSimulatedPlan] = useState<'pro' | 'basic' | null>(null);

  // Fetch real is_pro from user_subscriptions
  useEffect(() => {
    if (!user) { setDbIsPro(null); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('is_pro')
        .eq('user_id', user.id)
        .single();
      setDbIsPro(data?.is_pro ?? false);
    };
    fetch();

    // Realtime updates
    const channel = supabase
      .channel('pro-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        setDbIsPro(payload.new?.is_pro ?? false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const isProActive = useMemo(() => {
    // DEV test mode overrides
    if (basicModeActive && user?.role === 'dev') return false;
    if (proModeActive && user?.role === 'dev') return true;
    if (simulatedPlan === 'basic') return false;
    if (simulatedPlan === 'pro') return true;
    if (!user) return false;
    // DEV always has access
    if (user.role === 'dev') return true;
    // For admin/midia: use real DB value
    return dbIsPro === true;
  }, [user, dbIsPro, simulatedPlan, proModeActive, basicModeActive]);

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
    simulatePlan, simulatedPlan, dbIsPro,
  };
}
