import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Let's just mock the API call exactly as it would be made
  const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
  const now = new Date();
  const bounds = {
    thisMonthStart: startOfMonth(now).toISOString(),
    thisMonthEnd: endOfMonth(now).toISOString(),
    lastMonthStart: startOfMonth(subMonths(now, 1)).toISOString(),
    lastMonthEnd: endOfMonth(subMonths(now, 1)).toISOString(),
  };
  
  console.log(bounds);
}
test();
