
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xqscbymvucxfawjwmzpx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxc2NieW12dWN4ZmF3andybXpweCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEzNTQ5MzM3LCJleHAiOjIwMjkxMjUzMzd9.sb_publishable_kt5SqlQTH4vjZGpn7Ak_NQ_F5xqSSY2D"; // I'll use the full key from .env if I can find it, or just the one I found.

const supabase = createClient(supabaseUrl, supabaseKey);

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
