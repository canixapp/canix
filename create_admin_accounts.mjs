import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const usersToCreate = [
  { email: 'vitorhugo@canix.app.br', name: 'Vitor Hugo' },
  { email: 'vinicampos@canix.app.br', name: 'Vini Campos' }
];

const DEFAULT_PASSWORD = '@C4n1x2603';

async function seedAdminUsers() {
  console.log('🚀 Starting Admin User Seeding Protocol...');

  for (const user of usersToCreate) {
    console.log(`\n📦 Processing: ${user.email}...`);

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: user.name }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`⚠️ User ${user.email} already exists in Auth.`);
          // If exists, we still want to ensure roles/profile are correct
          // Need to fetch user ID
          const { data: userData } = await supabase.auth.admin.listUsers();
          const existingUser = userData.users.find(u => u.email === user.email);
          if (existingUser) {
            await applyRolesAndFlags(existingUser.id, user.name);
          }
        } else {
          console.error(`❌ Auth Error for ${user.email}:`, authError.message);
        }
        continue;
      }

      console.log(`✅ Auth account created for ${user.name}`);
      await applyRolesAndFlags(authData.user.id, user.name);

    } catch (err) {
      console.error(`💥 Unexpected error for ${user.email}:`, err);
    }
  }

  console.log('\n🏁 Seeding Protocol Completed.');
}

async function applyRolesAndFlags(userId, name) {
  // 2. Grant Roles (admin, dev)
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert([
      { user_id: userId, role: 'admin' },
      { user_id: userId, role: 'dev' }
    ], { onConflict: 'user_id,role' });

  if (roleError) console.error(`❌ Role Error for ${userId}:`, roleError.message);
  else console.log(`✅ Roles (admin, dev) granted to ${name}`);

  // 3. Update Profile with force reset flag
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      must_change_password: true,
      name: name 
    })
    .eq('user_id', userId);

  if (profileError) console.error(`❌ Profile Error for ${userId}:`, profileError.message);
  else console.log(`✅ Profile updated (must_change_password: true) for ${name}`);
}

seedAdminUsers();
