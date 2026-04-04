import { supabase } from '@/lib/supabase';
import { PETSHOP_ID } from '@/lib/constants';

export interface ExpenseRow {
  id: string;
  petshop_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  petshop_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export async function getExpenses(petshopId?: string): Promise<ExpenseRow[]> {
  const targetId = petshopId || PETSHOP_ID;
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('petshop_id', targetId)
    .order('date', { ascending: false });
  if (error) { console.error('getExpenses error:', error); return []; }
  return (data || []) as ExpenseRow[];
}

export async function getExpensesByPeriod(startDate: string, endDate: string, petshopId?: string): Promise<ExpenseRow[]> {
  const targetId = petshopId || PETSHOP_ID;
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('petshop_id', targetId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  if (error) { console.error('getExpensesByPeriod error:', error); return []; }
  return (data || []) as ExpenseRow[];
}

export async function createExpense(data: {
  description: string;
  amount: number;
  category?: string;
  date?: string;
}, petshopId?: string): Promise<ExpenseRow | null> {
  const targetId = petshopId || PETSHOP_ID;
  const insertData: ExpenseInsert = {
    petshop_id: targetId,
    description: data.description,
    amount: data.amount,
    category: data.category || 'geral',
    date: data.date || new Date().toISOString().split('T')[0],
  };

  const { data: result, error } = await supabase
    .from('expenses')
    .insert(insertData)
    .select()
    .single();
  if (error) { console.error('createExpense error:', error); return null; }
  return result as ExpenseRow;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  return !error;
}
