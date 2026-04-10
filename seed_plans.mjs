import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xqscbymvucxfawjwmzpx.supabase.co',
  'sb_publishable_kt5SqlQTH4vjZGpn7Ak_NQ_F5xqSY2D'
);

const plans = [
  {
    name: 'Free (Trial)',
    price: 0,
    price_monthly: 0,
    max_pets: 10,
    max_appointments_month: 20,
    features: ['7 dias de teste', 'Acesso completo', 'Suporte básico'],
    is_active: true
  },
  {
    name: 'Base (Essencial)',
    price: 199.00,
    price_monthly: 199.00,
    max_pets: 50,
    max_appointments_month: 200,
    features: ['Clientes e Pets', 'Agendamentos', 'Serviços', 'Dashboard Básico', 'Galeria e Comentários'],
    is_active: true
  },
  {
    name: 'Premium (Avançado)',
    price: 499.00,
    price_monthly: 499.00,
    max_pets: 1000,
    max_appointments_month: 2000,
    features: ['Financeiro Completo', 'Relatórios Avançados', 'Métricas Detalhadas', 'Automações', 'Insights IA', 'Multi-usuários'],
    is_active: true
  }
];

async function seed() {
  console.log('Seeding plans with corrected schema...');
  // Limpamos o lixo se houver (opcional)
  const { data, error } = await supabase.from('plans').insert(plans).select();
  if (error) {
    console.error('Error seeding plans:', error);
  } else {
    console.log('Plans seeded successfully:', data);
  }
}

seed();
