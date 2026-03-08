import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function paginate(token: string, label: string, fields: string, maxPages = 10) {
  console.log(`\n=== ${label} ===`)
  console.log(`Fields: ${fields}`)
  
  let nextUrl: string | null = null
  let page = 0
  let totalAds = 0

  const firstUrl = new URL("https://graph.facebook.com/v25.0/ads_archive")
  firstUrl.searchParams.append("access_token", token)
  firstUrl.searchParams.append("search_terms", "gelatina")
  firstUrl.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  firstUrl.searchParams.append("ad_active_status", "ACTIVE")
  firstUrl.searchParams.append("ad_type", "ALL")
  firstUrl.searchParams.append("fields", fields)
  firstUrl.searchParams.append("limit", "25")

  nextUrl = firstUrl.toString()

  while (nextUrl && page < maxPages) {
    const res = await fetch(nextUrl)
    const data = await res.json()

    if (data.error) {
      console.log(`  P${page + 1} ERRO: ${data.error.message}`)
      break
    }

    const ads = data.data || []
    totalAds += ads.length
    page++

    const hasNext = !!data.paging?.next
    console.log(`  P${page}: ${ads.length} ads (total: ${totalAds}) | next: ${hasNext}`)

    // Na última página, mostrar raw do paging e primeiro ad
    if (!hasNext || ads.length === 0) {
      console.log(`  Paging raw: ${JSON.stringify(data.paging)}`)
      if (ads.length > 0) {
        console.log(`  Primeiro ad keys: ${Object.keys(ads[0]).join(", ")}`)
        console.log(`  Primeiro ad: ${JSON.stringify(ads[0])}`)
      }
    }

    nextUrl = data.paging?.next || null
  }

  console.log(`  TOTAL: ${totalAds} ads em ${page} páginas\n`)
  return totalAds
}

async function main() {
  const { data: s } = await supabase.schema('adtracker').from("settings").select("value").eq("key", "META_ACCESS_TOKEN").single()
  const token = s?.value
  if (!token) { console.log("NO TOKEN"); return }

  // Teste 1: Fields mínimos (só page_id, page_name)
  await paginate(token, "TESTE 1: Fields MÍNIMOS", "page_id,page_name")

  // Teste 2: Fields com ad_delivery_start_time
  await paginate(token, "TESTE 2: + ad_delivery_start_time", "page_id,page_name,ad_delivery_start_time")

  // Teste 3: Fields completos (o que usamos na rota)
  await paginate(token, "TESTE 3: Fields COMPLETOS", "page_id,page_name,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url")

  // Teste 4: Só page_id (o mínimo absoluto)
  await paginate(token, "TESTE 4: Só page_id", "page_id")

  // Teste 5: Fields mínimos SEM search_type
  console.log("\n=== TESTE 5: Sem search_type ===")
  let nextUrl5: string | null = null
  let total5 = 0
  let page5 = 0

  const url5 = new URL("https://graph.facebook.com/v25.0/ads_archive")
  url5.searchParams.append("access_token", token)
  url5.searchParams.append("search_terms", "gelatina")
  url5.searchParams.append("ad_reached_countries", JSON.stringify(["BR"]))
  url5.searchParams.append("ad_active_status", "ACTIVE")
  url5.searchParams.append("ad_type", "ALL")
  url5.searchParams.append("fields", "page_id,page_name")
  url5.searchParams.append("limit", "25")
  nextUrl5 = url5.toString()

  while (nextUrl5 && page5 < 10) {
    const res = await fetch(nextUrl5)
    const data = await res.json()
    if (data.error) { console.log(`  ERRO: ${data.error.message}`); break }
    const ads = data.data || []
    total5 += ads.length
    page5++
    console.log(`  P${page5}: ${ads.length} ads (total: ${total5}) | next: ${!!data.paging?.next}`)
    nextUrl5 = data.paging?.next || null
  }
  console.log(`  TOTAL: ${total5} ads em ${page5} páginas`)
}

main()
