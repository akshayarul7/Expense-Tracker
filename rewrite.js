const fs = require('fs');

// 1. Rewrite db.ts
let dbTs = `
import { RecurringFrequency } from './constants';

export interface Expense {
  id?: string;
  name: string;
  amount: number;
  originalAmount?: number;
  category: string;
  date: Date;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: Date;
  plaidId?: string;
}

export interface Budget {
  id?: string;
  category: string;
  monthlyLimit: number;
}

export interface IgnoredTransaction {
  plaidId: string;
  name?: string;
  amount?: number;
  date?: Date;
  deletedAt: Date;
}
`;
fs.writeFileSync('src/lib/db.ts', dbTs);

// 2. Rewrite db-helpers.ts
let dbHelpersTs = `
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
  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert([{ ...data, user_id: userId, created_at: new Date().toISOString() }])
    .select('id')
    .single();
    
  if (error) throw error;
  return inserted.id;
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('expenses')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const userId = await getUserId();
  
  // Get it first to see if it has plaidId
  const { data: expense } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();
    
  if (expense?.plaid_id) {
    await supabase.from('ignored_transactions').upsert({
      plaid_id: expense.plaid_id,
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      deleted_at: new Date().toISOString()
    });
  }
  
  await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);
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
`;
fs.writeFileSync('src/lib/db-helpers.ts', dbHelpersTs);

console.log("Rewrote db.ts and db-helpers.ts");
