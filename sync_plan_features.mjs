import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_FEATURES = [
  'dashboard', 'agendamentos', 'pacotes', 'clientes', 'pets', 
  'servicos', 'moderacao', 'configuracoes', 'audit-log'
];

const PREMIUM_FEATURES = [
  ...BASE_FEATURES,
  'financeiro', 'estoque', 'relatorios', 'lembretes', 'marketing'
];

async function syncPlans() {
  console.log("🚀 Starting Plan Feature Sync...");

  // 1. Update Base (Essencial)
  const { error: e1 } = await supabase
    .from('plans')
    .update({ features: BASE_FEATURES })
    .ilike('name', '%Base%');
  
  if (e1) console.error("Error updating Base plan:", e1);
  else console.log("✅ Base (Essencial) updated.");

  // 2. Update Premium (Avançado)
  const { error: e2 } = await supabase
    .from('plans')
    .update({ features: PREMIUM_FEATURES })
    .ilike('name', '%Premium%');

  if (e2) console.error("Error updating Premium plan:", e2);
  else console.log("✅ Premium (Avançado) updated.");

  // 3. Update Free (Trial)
  const { error: e3 } = await supabase
    .from('plans')
    .update({ features: PREMIUM_FEATURES })
    .ilike('name', '%Free%');

  if (e3) console.error("Error updating Free plan:", e3);
  else console.log("✅ Free (Trial) updated.");

  console.log("🏁 Sync Complete!");
}

syncPlans();
