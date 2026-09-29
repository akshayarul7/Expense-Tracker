// Run with: npx tsx scratch/remove-dupes.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function removeDuplicates() {
  // Fetch all expenses with plaid_ids
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, plaid_id, created_at, name, amount, date')
    .not('plaid_id', 'is', null)
    .order('created_at', { ascending: true });

  if (error) { console.error('Fetch error:', error); return; }
  if (!expenses) { console.log('No expenses found'); return; }

  // Group by plaid_id
  const groups = new Map<string, typeof expenses>();
  for (const exp of expenses) {
    const key = exp.plaid_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(exp);
  }

  // Find duplicates (groups with more than 1 entry)
  const toDelete: string[] = [];
  for (const [plaidId, group] of groups) {
    if (group.length > 1) {
      // Keep the first (oldest), delete the rest
      console.log(`Duplicate plaid_id ${plaidId}: "${group[0].name}" $${group[0].amount} on ${group[0].date} — ${group.length} copies, deleting ${group.length - 1}`);
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  console.log(`\nDeleting ${toDelete.length} duplicate expenses...`);
  
  // Delete in batches of 50
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);
    const { error: delError } = await supabase
      .from('expenses')
      .delete()
      .in('id', batch);
    if (delError) {
      console.error('Delete error:', delError);
    } else {
      console.log(`Deleted batch ${Math.floor(i/50) + 1} (${batch.length} rows)`);
    }
  }

  console.log('Done! Duplicates removed.');
}

removeDuplicates();
