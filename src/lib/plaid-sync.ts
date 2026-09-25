import { Expense } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getExistingPlaidIds, getAllIgnoredTransactionIds, updateExpense, addExpense } from '@/lib/db-helpers';
import { CATEGORIES } from '@/lib/constants';

// Helper to loosely map Plaid categories to our app categories
function mapPlaidCategory(plaidCategories?: string[]): string {
  if (!plaidCategories || plaidCategories.length === 0) return 'Other';
  
  const categoryStr = plaidCategories.join(' ').toLowerCase();
  
  if (categoryStr.includes('food') || categoryStr.includes('restaurant') || categoryStr.includes('dining') || categoryStr.includes('coffee')) return 'Food & Dining';
  if (categoryStr.includes('travel') || categoryStr.includes('transportation') || categoryStr.includes('gas') || categoryStr.includes('taxi')) return 'Transportation';
  if (categoryStr.includes('shop') || categoryStr.includes('clothing') || categoryStr.includes('grocery')) return 'Shopping';
  if (categoryStr.includes('entertainment') || categoryStr.includes('recreation') || categoryStr.includes('movie')) return 'Entertainment';
  if (categoryStr.includes('bill') || categoryStr.includes('utility') || categoryStr.includes('electric')) return 'Bills & Utilities';
  if (categoryStr.includes('health') || categoryStr.includes('medical') || categoryStr.includes('gym')) return 'Health';
  if (categoryStr.includes('education') || categoryStr.includes('school')) return 'Education';
  if (categoryStr.includes('subscription')) return 'Subscriptions';
  
  return 'Other';
}

export async function processPlaidTransactions(transactions: any[], accounts?: any[]): Promise<number> {
  let importedCount = 0;
  
  // Get existing plaid transactions to avoid duplicates
  const existingIds = await getExistingPlaidIds();
  const existingPlaidIds = new Set(existingIds);

  // Get ignored transactions
  const ignoredIds = await getAllIgnoredTransactionIds();
  const ignoredPlaidIds = new Set(ignoredIds);

  // Get all expenses to update old ones
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  const { data: allExpensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).not('plaid_id', 'is', null);
  const allExpenses = allExpensesData || [];

  const newExpenses: Omit<Expense, 'id'>[] = [];

  // Build account lookup map
  const accountMap = new Map();
  if (accounts) {
    accounts.forEach(acc => accountMap.set(acc.account_id, acc));
  }

  for (const t of transactions) {
    const acc = accountMap.get(t.account_id);
    const accountStr = acc ? `Account: ${acc.name} (...${acc.mask})` : 'Account: Unknown';
    const newNotes = accountStr;

    // If we already imported this, let's update the notes to ensure account info is present
    if (existingPlaidIds.has(t.transaction_id)) {
      const existingExpense = allExpenses.find(e => e.plaidId === t.transaction_id);
      if (existingExpense && existingExpense.id) {
        const updates: Partial<Expense> = {};
        // Overwrite notes if we have real account data but current notes say Unknown, are missing Account, or contain the old "Original Category" text
        if (
          acc && 
          (!existingExpense.notes || !existingExpense.notes.includes(acc.name) || existingExpense.notes.includes('Original Category:'))
        ) {
          updates.notes = newNotes;
        }
        // Save original amount if missing
        if (existingExpense.originalAmount === undefined) {
          updates.originalAmount = t.amount;
        }
        
        // Fix timezone date shift for previously imported transactions (Midnight UTC)
        if (new Date(existingExpense.date).getUTCHours() === 0) {
          updates.date = new Date(t.date + 'T12:00:00');
        }
        
        if (Object.keys(updates).length > 0) {
          await updateExpense(existingExpense.id, updates);
        }
      }
      continue;
    }

    // Skip if the user intentionally deleted it
    if (ignoredPlaidIds.has(t.transaction_id)) continue;
    
    // In Plaid, positive amounts are expenses (money leaving account)
    // Negative amounts are refunds or income (money entering account)
    // We only care about expenses
    if (t.amount <= 0) continue;

    // Plaid assigns completely new IDs when a pending transaction posts, or when you reconnect.
    // If the transaction has a pending_transaction_id that is already in our DB, we should just update it.
    if (t.pending_transaction_id && existingPlaidIds.has(t.pending_transaction_id)) {
      const existingExpense = allExpenses.find(e => e.plaidId === t.pending_transaction_id);
      if (existingExpense && existingExpense.id) {
        await updateExpense(existingExpense.id, { plaidId: t.transaction_id });
      }
      continue;
    }

    // Deduplicate across Plaid Items by checking date and amount
    const expenseDateStr = t.authorized_date ? t.authorized_date : t.date;
    const isDuplicate = allExpenses.some(e => {
      const existingDateStr = new Date(e.date).toISOString().substring(0, 10);
      return e.originalAmount === t.amount && existingDateStr === expenseDateStr;
    });

    if (isDuplicate) {
      continue;
    }
    
    const expense: Omit<Expense, 'id'> = {
      name: t.merchant_name || t.name || 'Unknown Transaction',
      amount: t.amount,
      originalAmount: t.amount,
      category: mapPlaidCategory(t.category),
      date: new Date(expenseDateStr + 'T12:00:00'),
      notes: newNotes,
      isRecurring: false,
      createdAt: new Date(),
      plaidId: t.transaction_id,
    };
    
    newExpenses.push(expense);
  }

  if (newExpenses.length > 0) {
    for (const exp of newExpenses) { await addExpense(exp); }
    importedCount = newExpenses.length;
  }

  return importedCount;
}
