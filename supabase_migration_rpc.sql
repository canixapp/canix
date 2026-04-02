-- Migration File: Reposicionando Lógica do Supabase Edge Functions para RPCs internas (Postgres Functions)
-- Isso permite rodar as mesmas funcionalidades críticas de forma 100% gratuita no plano Free do Supabase.

-- 1. EXTENSÃO NECESSÁRIA PARA HASH DE SENHA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. FUNÇÃO: Excluir Cliente
CREATE OR REPLACE FUNCTION rpc_delete_client(p_target_id uuid, p_dev_password text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_dev_user_id uuid;
BEGIN
  -- Valida a senha do desenvolvedor que chamou a função
  SELECT id INTO v_dev_user_id
  FROM auth.users
  WHERE id = auth.uid() AND encrypted_password = crypt(p_dev_password, encrypted_password);
  
  IF v_dev_user_id IS NULL THEN
    RETURN json_build_object('error', 'Senha de conta inválida ou usuário não autorizado.');
  END IF;

  -- Deleta o usuário da tabela global auth.users. 
  -- Como o banco possui ON DELETE CASCADE, isso apagará também profiles, agendamentos, pets etc.
  DELETE FROM auth.users WHERE id = p_target_id;
  
  RETURN json_build_object('success', true, 'message', 'Cliente excluído com sucesso.');
END;
$$;

-- 3. FUNÇÃO: Limpar Dashboard
CREATE OR REPLACE FUNCTION rpc_clear_dashboard(p_reason text, p_dev_password text, p_petshop_id text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_dev_user_id uuid;
  v_deleted_count int;
BEGIN
  SELECT id INTO v_dev_user_id
  FROM auth.users
  WHERE id = auth.uid() AND encrypted_password = crypt(p_dev_password, encrypted_password);
  
  IF v_dev_user_id IS NULL THEN
    RETURN json_build_object('error', 'Senha de conta inválida ou usuário não autorizado.');
  END IF;

  -- Deleta todos os agendamentos mantendo o banco operacional
  WITH deleted AS (
    DELETE FROM appointments RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;
  
  RETURN json_build_object('success', true, 'deleted', v_deleted_count);
END;
$$;

-- 4. FUNÇÃO: Danger Zone (Reset/Excluir Todos)
CREATE OR REPLACE FUNCTION rpc_danger_zone(p_action text, p_reason text, p_dev_password text, p_petshop_id text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_dev_user_id uuid;
BEGIN
  SELECT id INTO v_dev_user_id
  FROM auth.users
  WHERE id = auth.uid() AND encrypted_password = crypt(p_dev_password, encrypted_password);
  
  IF v_dev_user_id IS NULL THEN
    RETURN json_build_object('error', 'Senha de conta inválida ou usuário não autorizado.');
  END IF;

  IF p_action = 'delete_all_clients' THEN
    -- Deleta apenas usuários com a role de cliente
    DELETE FROM auth.users 
    WHERE id IN (
      SELECT user_id FROM user_roles WHERE role = 'cliente'
    );
    RETURN json_build_object('success', true, 'message', 'Todos os clientes foram excluídos.');
  
  ELSIF p_action = 'reset_all' THEN
    -- Deleta TODOS os usuários, EXCETO quem tiver role DEV
    DELETE FROM auth.users 
    WHERE id IN (
      SELECT user_id FROM user_roles WHERE role != 'dev'
    );
    -- Garante a exclusão de registros pendentes se não houver CASCADE
    DELETE FROM appointments;
    DELETE FROM pets;
    DELETE FROM user_subscriptions;
    
    RETURN json_build_object('success', true, 'message', 'Sistema resetado com sucesso.');
  END IF;
  
  RETURN json_build_object('error', 'Ação não reconhecida.');
END;
$$;

-- 5. FUNÇÃO: Resetar senha de usuário DEV/Admin
CREATE OR REPLACE FUNCTION rpc_reset_password(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_temp_password text;
BEGIN
  -- Apenas DEVs podem invocar este método para gerar senhas arbitrárias
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'dev') THEN
    RETURN json_build_object('error', 'Apenas desenvolvedores podem resetar senhas ativamente.');
  END IF;

  -- Gera uma senha randômica de 10 caracteres
  v_temp_password := substr(md5(random()::text), 1, 10);
  
  -- Atualiza diretamente o hash de senha do Supabase Auth
  UPDATE auth.users 
  SET encrypted_password = crypt(v_temp_password, gen_salt('bf'))
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'temp_password', v_temp_password);
END;
$$;

-- 6. FUNÇÃO: Criar novo usuário Admin/Dev (Seed)
CREATE OR REPLACE FUNCTION rpc_seed_user(p_email text, p_password text, p_name text, p_role text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_new_user_id uuid;
BEGIN
  -- Apenas DEV ou ADMIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('dev', 'admin')) THEN
    RETURN json_build_object('error', 'Não autorizado a criar usuários administrativos.');
  END IF;

  -- Insere diretamente na tabela global
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    p_email, 
    crypt(p_password, gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    json_build_object('name', p_name), 
    now(), 
    now()
  ) RETURNING id INTO v_new_user_id;

  -- Define o Role
  INSERT INTO user_roles (user_id, role) VALUES (v_new_user_id, p_role::app_role);
  
  -- Garante o Profile (pode falhar suavemente se houver trigger já fazendo isso)
  INSERT INTO profiles (user_id, name, active) VALUES (v_new_user_id, p_name, true) 
  ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;
  
  RETURN json_build_object('success', true, 'new_user_id', v_new_user_id);
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('error', 'Um usuário com este e-mail já existe no sistema.');
END;
$$;
