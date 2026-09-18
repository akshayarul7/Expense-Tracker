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
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const ignoredTransactions = await db.ignoredTransactions.toArray();

  const data: ExportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    expenses,
    budgets,
    ignoredTransactions,
  };

  return JSON.stringify(data);
}

export async function importData(jsonString: string): Promise<{ expenses: number; budgets: number; ignored: number }> {
  try {
    const data = JSON.parse(jsonString) as ExportData;
    
    // Basic validation
    if (!Array.isArray(data.expenses) || !Array.isArray(data.budgets)) {
      throw new Error('Invalid export file format');
    }

    const ignored = data.ignoredTransactions || [];

    await db.transaction('rw', db.expenses, db.budgets, db.ignoredTransactions, async () => {
      await db.expenses.clear();
      await db.budgets.clear();
      await db.ignoredTransactions.clear();
      
      await db.expenses.bulkAdd(data.expenses);
      await db.budgets.bulkAdd(data.budgets);
      if (ignored.length > 0) {
        await db.ignoredTransactions.bulkAdd(ignored);
      }
    });

    return {
      expenses: data.expenses.length,
      budgets: data.budgets.length,
      ignored: ignored.length,
    };
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('Failed to import data. Please check the file format.');
  }
}
