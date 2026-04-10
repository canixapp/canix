import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTenants() {
  const { data, error } = await supabase.from('tenants').select('*');
  if (error) {
    console.error('Error fetching tenants:', error);
    return;
  }
  console.log('--- ALL TENANTS ---');
  console.table(data.map(t => ({ slug: t.slug, status: t.status, v: t.app_version })));
}

checkTenants();
