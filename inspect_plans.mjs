import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectPlansTable() {
  console.log('Inspecting plans table policies and structure...');
  
  // No Supabase-js não há comando direto para listar policies, 
  // mas podemos tentar ler e ver o que acontece, ou usar uma query SQL bruta via RPC se existir.
  // Como temos a service_role, podemos ler tudo.
  
  const { data, error } = await supabase.from('plans').select('*');
  if (error) {
    console.error('Error fetching plans:', error);
  } else {
    console.log('Current plans in DB:', data.length);
    console.table(data);
  }
}

inspectPlansTable();
