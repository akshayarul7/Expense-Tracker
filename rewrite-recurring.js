const fs = require('fs');
let code = fs.readFileSync('src/app/expenses/recurring/page.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getRecurringExpenses } from '@/lib/db-helpers';");
code = code.replace("import { db } from '@/lib/db';", "");

const useLiveQueryBlock = `  const allExpenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const actualRecurring = allExpenses.filter(e => e.isRecurring);`;
  
const useEffectBlock = `  const [actualRecurring, setActualRecurring] = useState<Expense[]>([]);

  const fetchRecurring = useCallback(async () => {
    try {
      const data = await getRecurringExpenses();
      setActualRecurring(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
    const channel = supabase
      .channel('recurring-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchRecurring)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRecurring]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
code = code.replace("const handleDelete = async (id?: number) => {", "const handleDelete = async (id?: string) => {");

fs.writeFileSync('src/app/expenses/recurring/page.tsx', code);
console.log("Rewrote recurring expenses page");
