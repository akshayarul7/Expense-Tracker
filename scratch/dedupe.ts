import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

async function run() {
  console.log('Fetching all expenses...');
  const { data: expenses, error } = await supabase.from('expenses').select('*');
  if (error) {
    console.error('Error fetching expenses:', error);
    return;
  }

  console.log(`Found ${expenses.length} expenses.`);

  // Group by amount, date, and name prefix to find duplicates
  const groups: Record<string, any[]> = {};
  for (const e of expenses) {
    // Only dedupe Plaid imported ones
    if (!e.plaid_id) continue;
    
    // Create a signature for the expense
    const dateStr = new Date(e.date).toISOString().substring(0, 10);
    const amount = e.original_amount !== null ? e.original_amount : e.amount;
    
    const sig = `${dateStr}_${amount}`;
    if (!groups[sig]) groups[sig] = [];
    groups[sig].push(e);
  }

  let deletedCount = 0;
  for (const sig in groups) {
    const group = groups[sig];
    if (group.length > 1) {
      // Keep the one with the earliest created_at or the one that isn't pending
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      console.log(`\nFound ${group.length} duplicates for ${sig} (${group[0].name})`);
      
      // Delete all but the first one
      for (let i = 1; i < group.length; i++) {
        const toDelete = group[i];
        console.log(`  Deleting duplicate: ${toDelete.id} - ${toDelete.name} - ${toDelete.plaid_id}`);
        // We can't delete directly without RLS, wait, we don't have SERVICE_ROLE.
        // We will just generate the SQL or do it via the browser!
      }
      deletedCount += group.length - 1;
    }
  }
  console.log(`\nTotal duplicates found: ${deletedCount}`);
}
run();
