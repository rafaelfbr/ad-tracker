import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  console.log("1. Testando GET settings...");
  const { data, error } = await supabase.schema('adtracker').from('settings').select('*');
  console.log("GET Result:", data, error);

  console.log("2. Testando UPSERT settings...");
  const { data: d2, error: e2 } = await supabase.schema('adtracker').from('settings').upsert({
    key: 'TEST',
    value: '123'
  }, { onConflict: 'key' });
  console.log("UPSERT Result:", d2, e2);
}

test()
