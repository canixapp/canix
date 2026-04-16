import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  petshop_id: string | null;
  profile_completed: boolean;
  must_change_password: boolean;
  lgpd_accepted?: boolean;
  lgpd_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
  role?: string | null;
  email?: string | null;
  pets?: { id: string; name: string; size?: string; breed?: string }[];
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data as ProfileRow | null;
}

export async function getClientProfiles(petshopId?: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome');
  
  if (error) {
    console.error('getClientProfiles error:', error);
    return [];
  }

  return (data || []).map(d => ({
    id: d.id,
    user_id: d.id, // Assuming id is user_id in this context
    name: d.nome,
    phone: d.telefone,
    email: d.email,
    active: true,
    petshop_id: petshopId || PETSHOP_ID,
    profile_completed: true,
    created_at: d.data_cadastro,
    updated_at: d.data_cadastro,
  })) as ProfileRow[];
}

export interface ProfileInsert {
  user_id: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  active?: boolean;
  petshop_id?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  active?: boolean;
  petshop_id?: string | null;
  profile_completed?: boolean;
  must_change_password?: boolean;
}

export async function updateProfile(userId: string, data: ProfileUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('user_id', userId);
  return !error;
}

export async function getFeatureFlag(key: string, petshopId?: string): Promise<boolean> {
  const targetId = petshopId || PETSHOP_ID;
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .eq('petshop_id', targetId)
    .maybeSingle();
  return data?.enabled === true;
}
