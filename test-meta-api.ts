import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const { data: s } = await supabase.schema('adtracker').from("settings").select("value").eq("key", "META_ACCESS_TOKEN").single()
  const token = s?.value
  if (!token) { console.log("NO TOKEN"); return }

  // 1. Debug do token - ver permissões e tipo do app
  console.log("=== DEBUG TOKEN ===")
  const debugRes = await fetch(`https://graph.facebook.com/v25.0/debug_token?input_token=${token}&access_token=${token}`)
  const debugData = await debugRes.json()
  console.log(JSON.stringify(debugData, null, 2))

  // 2. Verificar info do app
  console.log("\n=== APP INFO ===")
  const appRes = await fetch(`https://graph.facebook.com/v25.0/app?access_token=${token}`)
  const appData = await appRes.json()
  console.log(JSON.stringify(appData, null, 2))
}

main()
