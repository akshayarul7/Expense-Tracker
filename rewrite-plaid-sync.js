const fs = require('fs');
let code = fs.readFileSync('src/components/expenses/plaid-sync-button.tsx', 'utf8');

code = code.replace("import { useLiveQuery } from 'dexie-react-hooks';", "import { useEffect as useReactEffect, useState, useCallback } from 'react';\nimport { supabase } from '@/lib/supabase';\nimport { getAllIgnoredTransactions } from '@/lib/db-helpers';");
code = code.replace("import { db } from '@/lib/db';", "");

const useLiveQueryBlock = `  const ignoredCount = useLiveQuery(() => db.ignoredTransactions?.count() || Promise.resolve(0)) || 0;`;

const useEffectBlock = `  const [ignoredCount, setIgnoredCount] = useState(0);
  useReactEffect(() => {
    async function checkIgnored() {
      try {
        const data = await getAllIgnoredTransactions();
        setIgnoredCount(data.length);
      } catch (e) {}
    }
    checkIgnored();
    const channel = supabase.channel('ignored-sync-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ignored_transactions' }, checkIgnored)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);`;

code = code.replace(useLiveQueryBlock, useEffectBlock);
fs.writeFileSync('src/components/expenses/plaid-sync-button.tsx', code);
console.log("Rewrote plaid sync button");
