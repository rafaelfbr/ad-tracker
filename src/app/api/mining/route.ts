import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Lista de domínios ignorados ao rastrear (se TODOS os criativos só tiverem esses domínios, ignora a página)
const IGNORED_DOMAINS = ["api.whatsapp.com", "wa.me", "instagram.com", "facebook.com", "ig.me", "m.me"]

interface MetaAd {
  page_id: string
  page_name: string
  ad_delivery_start_time: string
  ad_snapshot_url: string
}

interface MetaApiResponse {
  data: MetaAd[]
  paging?: {
    cursors: {
      after: string
    }
    next?: string
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, country = "BR", minAds = 1, minDays = 0 } = body

    if (!keyword) {
      return NextResponse.json({ error: "Palavra-chave é obrigatória" }, { status: 400 })
    }

    // Buscar o Token nas settings
    const { data: settingData } = await supabase
      .schema('adtracker')
      .from("settings")
      .select("value")
      .eq("key", "META_ACCESS_TOKEN")
      .single()

    const accessToken = settingData?.value || process.env.META_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: "Meta Access Token não configurado. Vá em Configurações para adicionar." },
        { status: 403 }
      )
    }

    // Calcula a data limite baseado no minDays (ad_delivery_start_time deve ser <= limitDate)
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - minDays)
    
    // Processamento da paginação até juntar 1000 anúncios ou acabar a busca
    let allAds: MetaAd[] = []
    let afterCursor = ""
    let pagesFetched = 0
    const maxPages = 5 // Limite de 5 páginas para não estourar tempo de resposta (aprox ~500 anúncios dependendo do limite)

    while (pagesFetched < maxPages) {
      const url = new URL("https://graph.facebook.com/v19.0/ads_archive")
      url.searchParams.append("access_token", accessToken)
      url.searchParams.append("search_terms", keyword)
      url.searchParams.append("ad_reached_countries", `['${country}']`)
      url.searchParams.append("ad_active_status", "ACTIVE")
      url.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time,ad_snapshot_url")
      url.searchParams.append("limit", "100") // 100 por paginação pra ser mais rápido que o max 1000
      
      if (afterCursor) {
        url.searchParams.append("after", afterCursor)
      }

      const res = await fetch(url.toString())
      const data: MetaApiResponse = await res.json()

      if (!res.ok) {
        const err = data as any
        throw new Error(err.error?.message || "Erro na Meta API")
      }

      const ads = data.data || []
      allAds = [...allAds, ...ads]
      pagesFetched++

      if (data.paging && data.paging.next && data.paging.cursors?.after) {
        afterCursor = data.paging.cursors.after
      } else {
        break // acabou os resultados
      }
    }

    // Agrupar por page_id
    const pagesMap = new Map<string, {
      page_id: string
      page_name: string
      count: number
      oldest_ad_date: string
      library_url: string
      ignored_count: number // anúncios que parecem ir pro whatsapp/fb
    }>()

    for (const ad of allAds) {
      // Pular anúncios que começaram a rodar a menos tempo que o exigido
      const adDate = new Date(ad.ad_delivery_start_time)
      if (adDate > limitDate) continue

      const isIgnored = IGNORED_DOMAINS.some(domain => ad.ad_snapshot_url?.toLowerCase().includes(domain))

      if (!pagesMap.has(ad.page_id)) {
        pagesMap.set(ad.page_id, {
          page_id: ad.page_id,
          page_name: ad.page_name,
          count: 0,
          oldest_ad_date: ad.ad_delivery_start_time,
          library_url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${ad.page_id}&search_type=page`,
          ignored_count: 0
        })
      }

      const page = pagesMap.get(ad.page_id)!
      page.count++
      
      if (isIgnored) {
        page.ignored_count++
      }

      if (new Date(ad.ad_delivery_start_time) < new Date(page.oldest_ad_date)) {
        page.oldest_ad_date = ad.ad_delivery_start_time
      }
    }

    // Filtrar e converter pra array final
    const finalResults = Array.from(pagesMap.values())
      .filter(p => p.count >= minAds)
      // Se todos os anúncios ativarem a flag de ignorado, descarta a página
      // Nota: o ad_snapshot_url da api contém o link temporário do fb, 
      // mas alguns parâmetros da URL podem revelar o destino se tiver sorte.
      // Se a filtragem ficar agressiva, podemos tirar.
      .filter(p => p.count > p.ignored_count)
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      results: finalResults,
      total_analizados: allAds.length,
      pages_encontradas: finalResults.length
    })

  } catch (error) {
    console.error("Erro POST /api/mining:", error)
    return NextResponse.json({ error: (error as Error).message || "Erro na busca" }, { status: 500 })
  }
}
