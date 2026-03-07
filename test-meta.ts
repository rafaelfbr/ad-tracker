import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMeta() {
  const { data } = await supabase.schema('adtracker').from('settings').select('value').eq('key', 'META_ACCESS_TOKEN').single();
  const token = data?.value;
  if (!token) return console.log("No token in DB");

  const baseUrl = "https://graph.facebook.com/v19.0/ads_archive?access_token=" + token + "&fields=page_id,page_name,ad_delivery_start_time&limit=2";

  // CASO 1: EU Country (Portugal) -> Allows ALL keyword search
  const u1 = baseUrl + "&search_terms=marketing&ad_reached_countries=['PT']&ad_active_status=ACTIVE&ad_type=ALL";
  const r1 = await (await fetch(u1)).json();

  // CASO 2: Political Ads in BR -> Allows keyword search
  const u2 = baseUrl + "&search_terms=marketing&ad_reached_countries=['BR']&ad_active_status=ACTIVE&ad_type=POLITICAL_AND_ISSUE_ADS";
  const r2 = await (await fetch(u2)).json();

  fs.writeFileSync('meta_test_results.json', JSON.stringify({ PT_ALL: r1, BR_POLITICAL: r2 }, null, 2));
  console.log("Saved to meta_test_results.json");
}

testMeta()
