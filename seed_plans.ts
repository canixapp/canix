import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const envMap: any = {}
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val) {
    envMap[key.trim()] = val.join('=').trim().replace(/['"]/g, '')
  }
})

const supabase = createClient(envMap.VITE_SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('--- Iniciando Semeio de Planos ---')
  
  const plansToSeed = [
    { id: 'b5ad9ae7-c6d2-44f9-aab1-2c60877f57eb', name: 'Free', price: 0, price_monthly: 0 },
    { id: 'c5ad9ae7-c6d2-44f9-aab1-2c60877f57ec', name: 'Premium', price: 299, price_monthly: 299 },
    { id: 'd5ad9ae7-c6d2-44f9-aab1-2c60877f57ed', name: 'Base', price: 149, price_monthly: 149 }
  ]

  console.log('Upserting plans...')
  const { data: upsertData, error: upsertError } = await supabase.from('plans').upsert(plansToSeed)
  
  if (upsertError) {
    console.error('❌ Erro no upsert:', upsertError)
    return
  }
  
  console.log('✅ Upsert concluído.')

  console.log('Verificando persistência...')
  const { data: verifyData, error: verifyError } = await supabase.from('plans').select('*')
  
  if (verifyError) {
    console.error('❌ Erro na verificação:', verifyError)
    return
  }

  console.log(`📊 Total de planos encontrados no DB (Service Role): ${verifyData.length}`)
  console.log(JSON.stringify(verifyData, null, 2))
  
  if (verifyData.length === 0) {
    console.error('⚠️ AVISO: A tabela continua vazia após o upsert!')
  } else {
    console.log('🎉 Semeio validado com sucesso!')
  }
}

seed()
