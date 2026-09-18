import { Expense, Budget, IgnoredTransaction } from './db';
import { supabase } from './supabase';

interface ExportData {
  version: number;
  exportDate: string;
  expenses: Expense[];
  budgets: Budget[];
  ignoredTransactions: IgnoredTransaction[];
}

export async function exportData(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) throw new Error("Not logged in");

  const [eRes, bRes, iRes] = await Promise.all([
    supabase.from('expenses').select('*').eq('user_id', userId),
    supabase.from('budgets').select('*').eq('user_id', userId),
    supabase.from('ignored_transactions').select('*').eq('user_id', userId)
  ]);

  const data = {
    version: 3,
    exportDate: new Date().toISOString(),
    expenses: eRes.data || [],
    budgets: bRes.data || [],
    ignoredTransactions: iRes.data || []
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<{ expenses: number; budgets: number; ignored: number }> {
  throw new Error("Importing backup data directly to Supabase via JSON upload is disabled. Please use the settings page migration tool.");
}
