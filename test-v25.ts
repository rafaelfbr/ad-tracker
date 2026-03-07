import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testV25() {
  const { data } = await supabase.schema('adtracker').from('settings').select('value').eq('key', 'META_ACCESS_TOKEN').single();
  const token = data?.value;
  if (!token) return console.log("No token in DB");

  const queryParams = `?access_token=${token}&search_terms=marketing&ad_reached_countries=['BR']&ad_active_status=ACTIVE&ad_type=ALL&fields=page_id,page_name,ad_delivery_start_time,ad_snapshot_url&limit=5`;

  const res25 = await fetch("https://graph.facebook.com/v25.0/ads_archive" + queryParams);
  const json = await res25.json();
  console.log(JSON.stringify(json.data, null, 2));

  // Simulating our backend filtering
  const minDays = 7;
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - minDays);

  const filtered = json.data.filter((ad: any) => {
    const adDate = new Date(ad.ad_delivery_start_time);
    return adDate <= limitDate;
  });

  console.log(`Original: ${json.data.length}, Filtered by minDays=${minDays}: ${filtered.length}`);
}

testV25()
