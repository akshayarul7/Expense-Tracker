const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useState, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getExpensesByDateRange, getAllBudgets } from '@/lib/db-helpers';\nimport { Expense, Budget } from '@/lib/db';");
code = code.replace("import { db } from '@/lib/db';", "");

const useLiveQueryBlock = `  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];`;

const useEffectBlock = `  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const start = new Date('2000-01-01');
      const end = new Date('2100-01-01');
      const expData = await getExpensesByDateRange(start, end);
      setExpenses(expData);
      
      const bData = await getAllBudgets();
      setBudgets(bData);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
fs.writeFileSync('src/app/page.tsx', code);
console.log("Rewrote dashboard");
