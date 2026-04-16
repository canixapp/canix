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

export async function getAppointments(petshopId?: string): Promise<AppointmentRow[]> {
  const targetId = petshopId || PETSHOP_ID;
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`*`)
    .eq('unidade_id', targetId)
    .order('data', { ascending: false })
    .order('horario', { ascending: false });
  if (error) { console.error('getAppointments error:', error); return []; }
  
  return (data || []).map(a => ({
    id: a.id,
    petshop_id: a.unidade_id,
    customer_id: a.cliente_id,
    service_id: a.servico_id,
    service_name: 'Serviço', // Needs join or fetch
    date: a.data,
    time: a.horario,
    status: a.status,
    price: a.valor,
    payment_status: 'pendente', // Default
    payment_method: null,
    payment_amount: null,
    completed_at: null,
    cancel_reason: null,
    notes: a.obs,
    origin: 'sistema',
    created_at: a.criado_em,
    updated_at: a.criado_em,
    pets: []
  })) as AppointmentRow[];
}

export async function getAppointmentsWithProfiles(petshopId?: string): Promise<AppointmentRow[]> {
  const appointments = await getAppointments(petshopId);
  if (appointments.length === 0) return [];

  const customerIds = [...new Set(appointments.map(a => a.customer_id))];
  const { data: profiles } = await supabase
    .from('clientes')
    .select('id, nome, telefone')
    .in('id', customerIds);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  return appointments.map(a => {
    const profile = profileMap.get(a.customer_id);

    return {
      ...a,
      customer_name: profile?.nome || extractTutorNameFromAppointmentNotes(a.notes) || '',
      customer_phone: profile?.telefone || extractPhoneFromAppointmentNotes(a.notes) || '',
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
}, petshopId?: string): Promise<AppointmentRow | null> {
  const targetId = petshopId || PETSHOP_ID;
  const insertData = {
    unidade_id: targetId,
    cliente_id: data.customer_id,
    servico_id: data.service_id || '',
    data: data.date,
    horario: data.time,
    valor: data.price || 0,
    obs: data.notes || '',
    status: 'pendente',
  };

  const { data: apt, error } = await supabase
    .from('agendamentos')
    .insert(insertData)
    .select()
    .single();
  
  if (error || !apt) { 
    console.error('createAppointment insert error:', error?.message); 
    throw new Error(error?.message || 'Failed to create appointment'); 
  }
  
  const a = apt as any;
  return {
    id: a.id,
    petshop_id: a.unidade_id,
    customer_id: a.cliente_id,
    service_id: a.servico_id,
    service_name: data.service_name,
    date: a.data,
    time: a.horario,
    status: a.status,
    price: a.valor,
    notes: a.obs,
    created_at: a.criado_em,
  } as any;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  extra?: { cancel_reason?: string; completed_at?: string }
): Promise<boolean> {
  const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id);
  return !error;
}

export async function setAppointmentPayment(
  id: string,
  payment_status: PaymentStatus,
  payment_method?: PaymentMethod,
  payment_amount?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('agendamentos')
    .update({ valor: payment_amount })
    .eq('id', id);
  return !error;
}

export async function rescheduleAppointment(id: string, date: string, time: string): Promise<boolean> {
  const { error } = await supabase
    .from('agendamentos')
    .update({ data: date, horario: time, status: 'remarcado' })
    .eq('id', id);
  return !error;
}
