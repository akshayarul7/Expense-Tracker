const fs = require('fs');
let code = fs.readFileSync('src/lib/plaid-sync.ts', 'utf8');

code = code.replace("import { db, Expense } from '@/lib/db';", "import { Expense } from '@/lib/db';\nimport { supabase } from '@/lib/supabase';\nimport { getExistingPlaidIds, getAllIgnoredTransactionIds, updateExpense, addExpense } from '@/lib/db-helpers';");

const processBlock = `  // Get existing plaid transactions to avoid duplicates
  const allExpenses = await db.expenses.toArray();
  const existingPlaidIds = new Set(allExpenses.filter(e => e.plaidId).map(e => e.plaidId));

  // Get ignored transactions
  const ignoredArray = await db.ignoredTransactions.toArray();
  const ignoredPlaidIds = new Set(ignoredArray.map(i => i.plaidId));`;

const newProcessBlock = `  // Get existing plaid transactions to avoid duplicates
  const existingIds = await getExistingPlaidIds();
  const existingPlaidIds = new Set(existingIds);

  // Get ignored transactions
  const ignoredIds = await getAllIgnoredTransactionIds();
  const ignoredPlaidIds = new Set(ignoredIds);

  // Get all expenses to update old ones
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;
  const { data: allExpensesData } = await supabase.from('expenses').select('*').eq('user_id', userId).not('plaid_id', 'is', null);
  const allExpenses = allExpensesData || [];`;
  
code = code.replace(processBlock, newProcessBlock);
code = code.replace("await db.expenses.update(existingExpense.id, updates);", "await updateExpense(existingExpense.id, updates);");
code = code.replace("existingExpense.date.getUTCHours()", "new Date(existingExpense.date).getUTCHours()");
code = code.replace("await db.expenses.bulkAdd(newExpenses);", "for (const exp of newExpenses) { await addExpense(exp); }");

fs.writeFileSync('src/lib/plaid-sync.ts', code);
console.log("Rewrote plaid-sync.ts");
