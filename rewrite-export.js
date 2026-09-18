const fs = require('fs');
let code = fs.readFileSync('src/lib/export.ts', 'utf8');

code = code.replace("import { db, Expense, Budget, IgnoredTransaction } from './db';", "import { Expense, Budget, IgnoredTransaction } from './db';\nimport { supabase } from './supabase';");

// Replace exportData
const exportDataBlock = `export async function exportData(): Promise<string> {
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const ignoredTransactions = await db.ignoredTransactions.toArray();

  const data: ExportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    expenses,
    budgets,
    ignoredTransactions
  };

  return JSON.stringify(data, null, 2);
}`;

const newExportDataBlock = `export async function exportData(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  
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
}`;

code = code.replace(exportDataBlock, newExportDataBlock);

// Disable import data for now (or make it inert) since they are on Supabase
const importDataBlock = `export async function importData(jsonString: string): Promise<{ expenses: number, budgets: number, ignored: number }> {`;

code = code.replace(importDataBlock, `export async function importData(jsonString: string): Promise<{ expenses: number, budgets: number, ignored: number }> {\n  throw new Error("Importing backup data directly to Supabase is disabled in this version.");`);

fs.writeFileSync('src/lib/export.ts', code);
console.log("Rewrote export.ts");
