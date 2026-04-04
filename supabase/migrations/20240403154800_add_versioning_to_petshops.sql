
-- Adiciona colunas para controle de Onboarding e Versionamento Global
ALTER TABLE petshops ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE petshops ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0';

-- Comentário para documentação das novas colunas
COMMENT ON COLUMN petshops.onboarding_completed IS 'Indica se o lojista completou o wizard inicial de configuração.';
COMMENT ON COLUMN petshops.app_version IS 'Versão atual do aplicativo para esta licença (Staging/Version Control).';
