const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getExpensesByDateRange } from '@/lib/db-helpers';\nimport { Expense } from '@/lib/db';");
code = code.replace("import { db } from '@/lib/db';", "");

const useLiveQueryBlock = `  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];`;

const useEffectBlock = `  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    try {
      const start = new Date('2000-01-01');
      const end = new Date('2100-01-01');
      const data = await getExpensesByDateRange(start, end);
      setExpenses(data);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchExpenses]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
fs.writeFileSync('src/app/reports/page.tsx', code);
console.log("Rewrote reports page");
