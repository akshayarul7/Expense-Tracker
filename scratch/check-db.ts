import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('expenses')
    .select('date, amount, name')
    .order('date', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach(e => {
    const month = e.date.substring(0, 7); // YYYY-MM
    counts[month] = (counts[month] || 0) + 1;
  });

  console.log("Expense counts by month:", counts);
}
run();
