import { supabase } from '@/lib/supabase';
import { PETSHOP_ID, AppointmentStatus, PaymentMethod, PaymentStatus } from '@/lib/constants';
import { extractPhoneFromAppointmentNotes, extractTutorNameFromAppointmentNotes } from '@/lib/whatsapp';

export interface AppointmentRow {
  id: string;
  petshop_id: string;
  customer_id: string;
  service_id: string | null;
  service_name: string;
  date: string;
  time: string;
  status: string;
  price: number | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_amount: number | null;
  completed_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  origin: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  pets?: AppointmentPetRow[];
  customer_name?: string;
  customer_phone?: string;
}

export interface AppointmentPetRow {
  id: string;
  appointment_id: string;
  pet_id: string;
  pet_name: string;
  pet_size: string | null;
  pet_breed: string | null;
}

export interface AppointmentInsert {
  petshop_id: string;
  customer_id: string;
  service_id: string | null;
  service_name: string;
  date: string;
  time: string;
  status: string;
  price: number;
  payment_status: string;
  payment_method?: string | null;
  payment_amount?: number | null;
  origin?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  status?: string;
  payment_status?: string;
  payment_method?: string | null;
  payment_amount?: number | null;
  date?: string;
  time?: string;
  completed_at?: string | null;
  cancel_reason?: string | null;
}

export interface AppointmentPetInsert {
  appointment_id: string;
  pet_id: string;
  pet_name: string;
  pet_size: string | null;
  pet_breed: string | null;
}

export async function getAppointments(): Promise<AppointmentRow[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, appointment_pets(*)`)
    .eq('petshop_id', PETSHOP_ID)
    .order('date', { ascending: false })
    .order('time', { ascending: false });
  if (error) { console.error('getAppointments error:', error); return []; }
  return (data || []).map(a => ({
    ...a,
    pets: a.appointment_pets || [],
  })) as AppointmentRow[];
}

export async function getAppointmentsWithProfiles(): Promise<AppointmentRow[]> {
  const appointments = await getAppointments();
  if (appointments.length === 0) return [];

  const customerIds = [...new Set(appointments.map(a => a.customer_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, phone')
    .in('user_id', customerIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  return appointments.map(a => {
    const profile = profileMap.get(a.customer_id);

    return {
      ...a,
      customer_name: profile?.name || extractTutorNameFromAppointmentNotes(a.notes) || '',
      customer_phone: profile?.phone || extractPhoneFromAppointmentNotes(a.notes) || '',
    };
  });
}

export async function createAppointment(data: {
  customer_id: string;
  service_name: string;
  service_id?: string;
  date: string;
  time: string;
  price?: number;
  origin?: string;
  notes?: string;
  pets: { pet_id: string; pet_name: string; pet_size?: string; pet_breed?: string }[];
}): Promise<AppointmentRow | null> {
  const insertData: AppointmentInsert = {
    petshop_id: PETSHOP_ID,
    customer_id: data.customer_id,
    service_name: data.service_name,
    service_id: data.service_id || null,
    date: data.date,
    time: data.time,
    price: data.price || 0,
    origin: data.origin || 'sistema',
    notes: data.notes || '',
    status: 'pendente',
    payment_status: 'nao_cobrado',
  };

  const { data: apt, error } = await supabase
    .from('appointments')
    .insert(insertData)
    .select()
    .single();
  
  if (error || !apt) { 
    console.error('createAppointment insert error:', error?.message, error?.details, error?.hint, error?.code); 
    throw new Error(error?.message || 'Failed to create appointment'); 
  }
  
  // Insert appointment pets
  if (data.pets.length > 0) {
    const petRows: AppointmentPetInsert[] = data.pets.map(p => ({
      appointment_id: apt.id,
      pet_id: p.pet_id,
      pet_name: p.pet_name,
      pet_size: p.pet_size || null,
      pet_breed: p.pet_breed || null,
    }));
     const { error: petsError } = await supabase.from('appointment_pets').insert(petRows);
     if (petsError) console.error('appointment_pets insert error:', petsError.message, petsError.details, petsError.hint);
  }
  
  return apt as AppointmentRow;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  extra?: { cancel_reason?: string; completed_at?: string }
): Promise<boolean> {
  const updates: AppointmentUpdate = { status, ...extra };
  if (status === 'realizado' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('appointments').update(updates).eq('id', id);
  return !error;
}

export async function setAppointmentPayment(
  id: string,
  payment_status: PaymentStatus,
  payment_method?: PaymentMethod,
  payment_amount?: number
): Promise<boolean> {
  const updates: AppointmentUpdate = { 
    payment_status, 
    payment_method: payment_method || null, 
    payment_amount: payment_amount || null 
  };
  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id);
  return !error;
}

export async function rescheduleAppointment(id: string, date: string, time: string): Promise<boolean> {
  const updates: AppointmentUpdate = { date, time, status: 'remarcado' };
  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id);
  return !error;
}
