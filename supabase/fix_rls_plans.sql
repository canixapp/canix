-- Políticas de RLS para a tabela 'plans'
-- Permite que administradores gerenciem planos enquanto usuários comuns apenas leem.

-- 1. Habilitar RLS se não estiver habilitado
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura Pública (Qualquer usuário autenticado ou anônimo pode ler planos)
DROP POLICY IF EXISTS "Allow public read on plans" ON plans;
CREATE POLICY "Allow public read on plans" 
ON plans FOR SELECT 
USING (true);

-- 3. Política de Gerenciamento para Administradores
-- Presumindo que o admin é identificado por metadata no auth.users ou uma role na tabela user_roles.
-- O walkthrough anterior mencionou o email canixapp@gmail.com como administrador.

DROP POLICY IF EXISTS "Allow admin management on plans" ON plans;
CREATE POLICY "Allow admin management on plans" 
ON plans FOR ALL 
TO authenticated
USING (
  (auth.jwt() ->> 'email' = 'canixapp@gmail.com') OR 
  (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('dev', 'admin')))
);
