import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  const { data: settingData } = await supabase
    .schema('adtracker')
    .from("settings")
    .select("value")
    .eq("key", "META_ACCESS_TOKEN")
    .single()

  const accessToken = settingData?.value
  if (!accessToken) return

  fs.writeFileSync('test-result.log', '')
  const log = (msg: string) => fs.appendFileSync('test-result.log', msg + '\n')

  // 1. Debug do token  
  log('=== TOKEN DEBUG ===')
  const debugRes = await fetch(`https://graph.facebook.com/v25.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`)
  const debugData = await debugRes.json()
  log(JSON.stringify(debugData, null, 2))

  // 2. Testar sem ad_type (possível filtro restritivo)
  log('\n=== TESTE SEM ad_type ===')
  const url1 = new URL("https://graph.facebook.com/v25.0/ads_archive")
  url1.searchParams.append("access_token", accessToken)
  url1.searchParams.append("search_terms", "gelatina")
  url1.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  url1.searchParams.append("ad_active_status", "ACTIVE")
  url1.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time")
  url1.searchParams.append("limit", "500")

  const res1 = await fetch(url1.toString())
  const data1 = await res1.json()
  if (data1.error) {
    log(`ERRO: ${data1.error.message}`)
  } else {
    log(`Sem ad_type: ${data1.data?.length} ads, paging.next: ${!!data1.paging?.next}`)
  }

  // 3. Testar com ad_type=POLITICAL_AND_ISSUE_ADS
  log('\n=== TESTE com ad_type=POLITICAL_AND_ISSUE_ADS ===')
  const url2 = new URL("https://graph.facebook.com/v25.0/ads_archive")
  url2.searchParams.append("access_token", accessToken)
  url2.searchParams.append("search_terms", "gelatina")
  url2.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  url2.searchParams.append("ad_active_status", "ACTIVE")
  url2.searchParams.append("ad_type", "POLITICAL_AND_ISSUE_ADS")
  url2.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time")
  url2.searchParams.append("limit", "500")

  const res2 = await fetch(url2.toString())
  const data2 = await res2.json()
  if (data2.error) {
    log(`ERRO: ${data2.error.message}`)
  } else {
    log(`POLITICAL: ${data2.data?.length} ads, paging.next: ${!!data2.paging?.next}`)
  }

  // 4. Testar com palavra-chave mais popular (ex: "marketing")
  log('\n=== TESTE com keyword "marketing" ===')
  const url3 = new URL("https://graph.facebook.com/v25.0/ads_archive")
  url3.searchParams.append("access_token", accessToken)
  url3.searchParams.append("search_terms", "marketing")
  url3.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  url3.searchParams.append("ad_active_status", "ACTIVE")
  url3.searchParams.append("ad_type", "ALL")
  url3.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time")
  url3.searchParams.append("limit", "500")

  const res3 = await fetch(url3.toString())
  const data3 = await res3.json()
  if (data3.error) {
    log(`ERRO: ${data3.error.message}`)
  } else {
    log(`marketing BR ad_type=ALL: ${data3.data?.length} ads, paging.next: ${!!data3.paging?.next}`)
  }

  // 5. Testar sem ad_active_status (ALL)
  log('\n=== TESTE com ad_active_status=ALL ===')
  const url4 = new URL("https://graph.facebook.com/v25.0/ads_archive")
  url4.searchParams.append("access_token", accessToken)
  url4.searchParams.append("search_terms", "gelatina")
  url4.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  url4.searchParams.append("ad_active_status", "ALL")
  url4.searchParams.append("ad_type", "ALL")
  url4.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time")
  url4.searchParams.append("limit", "500")

  const res4 = await fetch(url4.toString())
  const data4 = await res4.json()
  if (data4.error) {
    log(`ERRO: ${data4.error.message}`)
  } else {
    log(`gelatina ALL status: ${data4.data?.length} ads, paging.next: ${!!data4.paging?.next}`)
  }
}

test().then(() => {
  setTimeout(() => {
    const result = fs.readFileSync('test-result.log', 'utf-8')
    console.log(result)
  }, 500)
})
