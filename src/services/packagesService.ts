import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface PackageRow {
  id: string;
  petshop_id: string;
  name: string;
  type: string;
  description: string | null;
  interval_days: number;
  active: boolean | null;
}

export interface CustomerPackageRow {
  id: string;
  petshop_id: string;
  customer_id: string;
  package_id: string | null;
  pet_id: string | null;
  start_date: string;
  status: string;
  observation: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  customer_phone?: string;
  pet_name?: string;
  pet_size?: string;
  pet_breed?: string;
  package_name?: string;
  package_type?: string;
  interval_days?: number;
}

export async function getPackages(): Promise<PackageRow[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('petshop_id', PETSHOP_ID)
    .order('name');
  if (error) return [];
  return (data || []) as PackageRow[];
}

export async function getCustomerPackages(): Promise<CustomerPackageRow[]> {
  const { data, error } = await supabase
    .from('customer_packages')
    .select('*, packages(name, type, interval_days), pets(name, size, breed)')
    .eq('petshop_id', PETSHOP_ID)
    .order('created_at', { ascending: false });
  
  if (error) { console.error('getCustomerPackages error:', error); return []; }
  
  // Fetch profiles for customer names
  const customerIds = [...new Set((data || []).map((p: any) => p.customer_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, phone')
    .in('user_id', customerIds);
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
  
  return (data || []).map((p: any) => ({
    ...p,
    customer_name: profileMap.get(p.customer_id)?.name || '',
    customer_phone: profileMap.get(p.customer_id)?.phone || '',
    pet_name: p.pets?.name || '',
    pet_size: p.pets?.size || '',
    pet_breed: p.pets?.breed || '',
    package_name: p.packages?.name || '',
    package_type: p.packages?.type || '',
    interval_days: p.packages?.interval_days || 0,
  })) as CustomerPackageRow[];
}

export async function createCustomerPackage(data: {
  customer_id: string;
  package_id: string;
  pet_id?: string;
  start_date?: string;
  observation?: string;
}): Promise<CustomerPackageRow | null> {
  const { data: row, error } = await supabase
    .from('customer_packages')
    .insert({
      petshop_id: PETSHOP_ID,
      customer_id: data.customer_id,
      package_id: data.package_id,
      pet_id: data.pet_id || null,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      observation: data.observation || '',
      status: 'ATIVO',
    } as any)
    .select()
    .single();
  if (error) { 
    console.error('createCustomerPackage error:', error); 
    throw new Error(error.message); 
  }
  return row as CustomerPackageRow;
}

export async function updateCustomerPackage(id: string, data: Partial<CustomerPackageRow>): Promise<boolean> {
  const { error } = await supabase.from('customer_packages').update(data as any).eq('id', id);
  return !error;
}

export async function toggleCustomerPackageStatus(id: string): Promise<boolean> {
  const { data: current } = await supabase
    .from('customer_packages')
    .select('status')
    .eq('id', id)
    .single();
  if (!current) return false;
  const newStatus = current.status === 'ATIVO' ? 'DESATIVADO' : 'ATIVO';
  const { error } = await supabase.from('customer_packages').update({ status: newStatus }).eq('id', id);
  return !error;
}
