import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePetcaoPlan() {
  console.log('Updating PetCão tenant plan...');
  
  // 1. Encontrar o ID do plano Premium
  const { data: plans, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('name', 'Premium (Avançado)')
    .single();

  if (planError) {
    console.error('Error finding Premium plan:', planError);
    return;
  }

  const premiumPlanId = plans.id;

  // 2. Atualizar a tabela tenants
  const { error: tenantError } = await supabase
    .from('tenants')
    .update({ plan_id: premiumPlanId })
    .eq('slug', 'petcao');

  if (tenantError) {
    console.error('Error updating tenant:', tenantError);
  } else {
    console.log('Tenant "petcao" updated to Premium plan.');
  }

  // 3. Atualizar a tabela petshops (settings JSONB)
  const { data: petshop, error: fetchError } = await supabase
    .from('petshops')
    .select('id, settings')
    .eq('slug', 'petcao')
    .single();

  if (fetchError) {
    console.error('Error fetching petshop:', fetchError);
  } else {
    const settings = petshop.settings || {};
    settings.plan = {
      id: premiumPlanId,
      name: 'Premium (Avançado)',
      active: true
    };

    const { error: updateError } = await supabase
      .from('petshops')
      .update({ settings })
      .eq('id', petshop.id);

    if (updateError) {
      console.error('Error updating petshop settings:', updateError);
    } else {
      console.log('Petshop "petcao" settings updated.');
    }
  }
}

updatePetcaoPlan();
