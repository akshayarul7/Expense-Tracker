const fs = require('fs');
let code = fs.readFileSync('src/components/expenses/expense-table.tsx', 'utf8');

// Replace imports
code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getExpensesByCategory, getExpensesByDateRange } from '@/lib/db-helpers';");
code = code.replace("import { db, Expense } from '@/lib/db';", "import { Expense } from '@/lib/db';");
code = code.replace("import { deleteExpense } from '@/lib/db-helpers';", "import { deleteExpense } from '@/lib/db-helpers';\nimport { startOfYear, endOfYear } from 'date-fns';");

// Replace useLiveQuery
const useLiveQueryBlock = `  const expenses = useLiveQuery(async () => {
    let collection = db.expenses.orderBy('date').reverse();
    if (categoryFilter !== 'All Categories') {
      collection = db.expenses.where('category').equals(categoryFilter);
      return (await collection.toArray()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    return collection.toArray();
  }, [categoryFilter]) ?? [];`;

const useEffectBlock = `  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      if (categoryFilter !== 'All Categories') {
        const data = await getExpensesByCategory(categoryFilter);
        setExpenses(data);
      } else {
        // Just fetch last 10 years to avoid getting everything
        const start = new Date('2000-01-01');
        const end = new Date('2100-01-01');
        const data = await getExpensesByDateRange(start, end);
        setExpenses(data);
      }
    } catch(e) {
      console.error(e);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('table-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);

// Replace id: number to id: string
code = code.replace("const handleDelete = async (id: number) => {", "const handleDelete = async (id: string) => {");
code = code.replace("row.original.id!", "row.original.id as string");
code = code.replace("row.original.id!", "row.original.id as string");

fs.writeFileSync('src/components/expenses/expense-table.tsx', code);
console.log("Rewrote expense-table.tsx");
