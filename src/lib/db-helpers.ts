
import { Expense, Budget, IgnoredTransaction } from './db';
import { supabase } from './supabase';
import { startOfMonth, endOfMonth } from 'date-fns';

async function getUserId() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not logged in');
  return data.session.user.id;
}

export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const userId = await getUserId();
  const payload = {
    user_id: userId,
    name: data.name,
    amount: data.amount,
    original_amount: data.originalAmount,
    category: data.category,
    date: new Date(data.date).toISOString(),
    notes: data.notes,
    is_recurring: data.isRecurring,
    recurring_frequency: data.recurringFrequency,
    plaid_id: data.plaidId,
    created_at: new Date().toISOString()
  };
  
  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select('id')
    .single();
    
  if (error) { console.error('Add Expense Error:', error); throw error; }
  return inserted.id;
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  const userId = await getUserId();
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.amount !== undefined) payload.amount = data.amount;
  if (data.originalAmount !== undefined) payload.original_amount = data.originalAmount;
  if (data.category !== undefined) payload.category = data.category;
  if (data.date !== undefined) payload.date = new Date(data.date).toISOString();
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.isRecurring !== undefined) payload.is_recurring = data.isRecurring;
  if (data.recurringFrequency !== undefined) payload.recurring_frequency = data.recurringFrequency;
  if (data.plaidId !== undefined) payload.plaid_id = data.plaidId;
  
  const { error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) { console.error('Update Expense Error:', error); throw error; }
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getUserId();
  
  // Get it first to see if it has plaidId
  const { data: expense, error: fetchErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  console.log('Delete - fetched expense:', expense, 'fetchErr:', fetchErr);
    
  if (expense?.plaid_id) {
    console.log('Inserting into ignored_transactions, plaid_id:', expense.plaid_id);
    const { error: igErr } = await supabase.from('ignored_transactions').upsert({
      plaid_id: expense.plaid_id,
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      deleted_at: new Date().toISOString()
    }, { onConflict: 'plaid_id' });
    if (igErr) console.error('Failed to add to ignored_transactions:', igErr);
  } else {
    console.log('No plaid_id found on expense, skipping ignored_transactions');
  }
  
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function restoreIgnoredTransactions(): Promise<void> {
  const userId = await getUserId();
  await supabase.from('ignored_transactions').delete().eq('user_id', userId);
}

// Convert snake_case from DB to camelCase for frontend
function mapExpense(e: any): Expense {
  return {
    id: e.id,
    name: e.name || e.category,
    amount: Number(e.amount),
    originalAmount: e.original_amount ? Number(e.original_amount) : undefined,
    category: e.category,
    date: new Date(e.date),
    notes: e.notes || '',
    isRecurring: e.is_recurring,
    recurringFrequency: e.recurring_frequency,
    createdAt: new Date(e.created_at),
    plaidId: e.plaid_id
  };
}

export async function getExpensesByDateRange(start: Date, end: Date): Promise<Expense[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .lte('date', end.toISOString())
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data.map(mapExpense);
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const date = new Date(year, month);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return getExpensesByDateRange(start, end);
}

export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data.map(mapExpense);
}

export async function setBudget(category: string, monthlyLimit: number): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('budgets')
    .upsert({ category, user_id: userId, monthly_limit: monthlyLimit }, { onConflict: 'category,user_id' });
  if (error) throw error;
}

export async function deleteBudget(category: string): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('category', category)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getAllBudgets(): Promise<Budget[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data.map(b => ({ category: b.category, monthlyLimit: Number(b.monthly_limit) }));
}

export async function getBudgetForCategory(category: string): Promise<Budget | undefined> {
  const userId = await getUserId();
  const { data } = await supabase
    .from('budgets')
    .select('*')
    .eq('category', category)
    .eq('user_id', userId)
    .single();
    
  if (!data) return undefined;
  return { category: data.category, monthlyLimit: Number(data.monthly_limit) };
}

export async function getAllIgnoredTransactionIds(): Promise<string[]> {
  const userId = await getUserId();
  const { data } = await supabase.from('ignored_transactions').select('plaid_id').eq('user_id', userId);
  return data ? data.map(d => d.plaid_id) : [];
}

export async function getExistingPlaidIds(): Promise<string[]> {
  const userId = await getUserId();
  const { data } = await supabase.from('expenses').select('plaid_id').eq('user_id', userId).not('plaid_id', 'is', null);
  return data ? data.map(d => d.plaid_id) : [];
}

export async function getRecurringExpenses(): Promise<Expense[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .order('date', { ascending: false });
    
  if (error) throw error;
  return data.map(mapExpense);
}

export async function getAllIgnoredTransactions(): Promise<IgnoredTransaction[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('ignored_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('deleted_at', { ascending: false });
    
  if (error) throw error;
  return data.map(d => ({ plaidId: d.plaid_id, name: d.name, amount: d.amount, date: new Date(d.date), deletedAt: new Date(d.deleted_at) }));
}
