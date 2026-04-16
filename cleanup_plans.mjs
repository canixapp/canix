import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_PLANS = [
  'Free (Trial)',
  'Base (Essencial)',
  'Premium (Avançado)'
];

async function cleanup() {
  console.log('Cleaning up plans table...');

  // 1. Get all plans to identify which ones to deactivate
  const { data: allPlans, error: fetchError } = await supabase.from('plans').select('id, name');
  if (fetchError) throw fetchError;

  const idsToDeactivate = allPlans
    .filter(p => !TARGET_PLANS.includes(p.name))
    .map(p => p.id);

  if (idsToDeactivate.length > 0) {
    const { error: deactivateError } = await supabase
      .from('plans')
      .update({ is_active: false })
      .in('id', idsToDeactivate);

    if (deactivateError) {
      console.error('Error deactivating extra plans:', deactivateError);
    } else {
      console.log(`${idsToDeactivate.length} extra plans deactivated.`);
    }
  }

  // 2. Ensuring target plans are active and have correct data
  const plansData = [
    {
      name: 'Free (Trial)',
      price: 0,
      price_monthly: 0,
      max_pets: 50,
      max_appointments_month: 100,
      features: ['7 dias de teste', 'Acesso completo', 'Suporte'],
      is_active: true
    },
    {
      name: 'Base (Essencial)',
      price: 199,
      price_monthly: 199,
      max_pets: 200,
      max_appointments_month: 500,
      features: ['Clientes', 'Pets', 'Agenda', 'Dashboard Base'],
      is_active: true
    },
    {
      name: 'Premium (Avançado)',
      price: 399,
      price_monthly: 399,
      max_pets: 1000,
      max_appointments_month: 5000,
      features: ['Financeiro Completo', 'Relatórios', 'Marketing', 'Estoque'],
      is_active: true
    }
  ];

  for (const plan of plansData) {
    const { error: upsertError } = await supabase
      .from('plans')
      .upsert(plan, { onConflict: 'name' });
    
    if (upsertError) {
      console.error(`Error upserting plan ${plan.name}:`, upsertError);
    } else {
      console.log(`Plan ${plan.name} updated successfully.`);
    }
  }

  console.log('Cleanup complete.');
}

cleanup();
