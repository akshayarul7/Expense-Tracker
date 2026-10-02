import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Try to get a profile or settings table
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  const { data: s } = await supabase.from('settings').select('*').limit(1);
  const { data: us } = await supabase.from('user_settings').select('*').limit(1);
  console.log('profiles:', !!p, 'settings:', !!s, 'user_settings:', !!us);
}
check();
