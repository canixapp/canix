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
  created_at: string;
  updated_at: string;
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

export async function getClientProfiles(): Promise<ProfileRow[]> {
  // Get all profiles that have 'cliente' role
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'cliente');
  
  if (!roles || roles.length === 0) return [];
  
  const userIds = roles.map(r => r.user_id);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', userIds)
    .order('name');
  
  if (error) return [];
  return (data || []) as ProfileRow[];
}

export async function updateProfile(userId: string, data: Partial<ProfileRow>): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(data as any)
    .eq('user_id', userId);
  return !error;
}

export async function getFeatureFlag(key: string): Promise<boolean> {
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', key)
    .eq('petshop_id', PETSHOP_ID)
    .maybeSingle();
  return data?.enabled === true;
}
