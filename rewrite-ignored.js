const fs = require('fs');
let code = fs.readFileSync('src/components/expenses/restore-ignored-dialog.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getAllIgnoredTransactions } from '@/lib/db-helpers';\nimport { IgnoredTransaction } from '@/lib/db';");
code = code.replace("import { db } from '@/lib/db';", "");

const useLiveQueryBlock = `  const ignored = useLiveQuery(() => db.ignoredTransactions.orderBy('deletedAt').reverse().toArray()) || [];`;

const useEffectBlock = `  const [ignored, setIgnored] = useState<IgnoredTransaction[]>([]);

  const fetchIgnored = useCallback(async () => {
    try {
      const data = await getAllIgnoredTransactions();
      setIgnored(data);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchIgnored();
    const channel = supabase
      .channel('ignored-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ignored_transactions' }, fetchIgnored)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchIgnored]);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
code = code.replace("await db.ignoredTransactions.delete(plaidId);", "await supabase.from('ignored_transactions').delete().eq('plaid_id', plaidId);");
fs.writeFileSync('src/components/expenses/restore-ignored-dialog.tsx', code);
console.log("Rewrote ignored dialog");
