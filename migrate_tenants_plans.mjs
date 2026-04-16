import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Starting tenant-plan migration...');

  // 1. Get all plans
  const { data: plans, error: plansError } = await supabase.from('plans').select('id, name');
  if (plansError) throw plansError;

  const planMap = {};
  plans.forEach(p => {
    planMap[p.name] = p.id;
  });

  console.log('Available plans:', planMap);

  const migrationMap = {
    'Free': 'Free (Trial)',
    'Base': 'Base (Essencial)',
    'Premium': 'Premium (Avançado)',
    'Pro App Builder': 'Base (Essencial)'
  };

  // 2. Get all tenants
  const { data: tenants, error: tenantsError } = await supabase.from('tenants').select('id, name, plan_id');
  if (tenantsError) throw tenantsError;

  console.log(`Checking ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    const currentPlan = plans.find(p => p.id === tenant.plan_id);
    if (!currentPlan) continue;

    const newTargetName = migrationMap[currentPlan.name];
    if (newTargetName) {
      const newPlanId = planMap[newTargetName];
      if (newPlanId) {
        console.log(`Migrating tenant "${tenant.name}" from "${currentPlan.name}" to "${newTargetName}"...`);
        const { error: updateError } = await supabase.from('tenants')
          .update({ plan_id: newPlanId })
          .eq('id', tenant.id);
        
        if (updateError) {
          console.error(`Error migrating tenant ${tenant.id}:`, updateError);
        }
      }
    }
  }

  console.log('Migration complete.');
}

migrate();
