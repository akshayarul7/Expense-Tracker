const fs = require('fs');
let code = fs.readFileSync('src/app/budgets/page.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getAllBudgets } from '@/lib/db-helpers';");
code = code.replace("import { db, Budget } from '@/lib/db';", "import { Budget } from '@/lib/db';");

const useLiveQueryBlock = `  const budgets = useLiveQuery(() => db.budgets.toArray(), []);`;
const useEffectBlock = `  const [budgets, setBudgets] = useState<Budget[]>([]);

  const fetchBudgets = useCallback(async () => {
    try {
      const data = await getAllBudgets();
      setBudgets(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    const channel = supabase
      .channel('budgets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchBudgets)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBudgets]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
fs.writeFileSync('src/app/budgets/page.tsx', code);
console.log("Rewrote budgets page");
