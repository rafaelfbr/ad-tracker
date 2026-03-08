import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MetaAd {
  page_id: string
  page_name: string
  ad_delivery_start_time: string
  ad_delivery_stop_time?: string
  ad_snapshot_url: string
}

interface MetaApiResponse {
  data: MetaAd[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
  error?: {
    message: string
    error_user_msg?: string
    code: number
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, country = "BR", minAds = 1, minDays = 0, language = "ALL" } = body

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

    // Calcula a data limite baseado no minDays
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - minDays)
    
    // Construir a primeira URL
    const firstUrl = new URL("https://graph.facebook.com/v25.0/ads_archive")
    firstUrl.searchParams.append("access_token", accessToken)
    firstUrl.searchParams.append("search_terms", keyword)
    firstUrl.searchParams.append("ad_reached_countries", JSON.stringify([country]))
    
    if (language !== "ALL") {
      firstUrl.searchParams.append("languages", JSON.stringify([language]))
    }
    // Buscar apenas anúncios ativos
    firstUrl.searchParams.append("ad_active_status", "ACTIVE")
    firstUrl.searchParams.append("ad_type", "ALL")
    firstUrl.searchParams.append("search_type", "KEYWORD_UNORDERED")
    firstUrl.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url")
    firstUrl.searchParams.append("limit", "500")

    // Paginação usando paging.next URL diretamente (método mais confiável)
    let allAds: MetaAd[] = []
    let nextUrl: string | null = firstUrl.toString()
    let pagesFetched = 0
    const maxPages = 500

    console.log(`[Mining] Iniciando busca: keyword="${keyword}", country="${country}", language="${language}"`)

    while (nextUrl && pagesFetched < maxPages) {
      const res = await fetch(nextUrl)
      const data: MetaApiResponse = await res.json()

      if (!res.ok || data.error) {
        const metaMessage = data.error?.error_user_msg || data.error?.message || "Erro desconhecido na Meta API"
        const errorCode = data.error?.code
        
        console.error(`[Mining] Erro da Meta API (code: ${errorCode}): ${metaMessage}`)
        
        // Se for rate limit, parar graciosamente com os dados coletados
        if (errorCode === 613 || errorCode === 4) {
          console.log(`[Mining] Rate limit na página ${pagesFetched + 1}. Parando com ${allAds.length} anúncios.`)
          break
        }
        
        throw new Error(`Meta API: ${metaMessage}`)
      }

      const ads = data.data || []
      allAds = [...allAds, ...ads]
      pagesFetched++

      console.log(`[Mining] Página ${pagesFetched}: ${ads.length} anúncios (total: ${allAds.length})`)

      // Usar a URL completa de paging.next (já contém o cursor correto)
      nextUrl = data.paging?.next || null
    }

    console.log(`[Mining] Coleta finalizada: ${allAds.length} anúncios em ${pagesFetched} páginas.`)

    // Agrupar por page_id
    const pagesMap = new Map<string, {
      page_id: string
      page_name: string
      count: number
      active_count: number
      oldest_ad_date: string
      library_url: string
    }>()

    const now = new Date()

    for (const ad of allAds) {
      // Verificar se o anúncio está ativo (sem data de parada ou data de parada no futuro)
      const isActive = !ad.ad_delivery_stop_time || new Date(ad.ad_delivery_stop_time) > now

      // Pular anúncios que começaram a rodar a menos tempo que o exigido
      if (minDays > 0) {
        const adDate = new Date(ad.ad_delivery_start_time)
        if (adDate > limitDate) continue
      }

      if (!pagesMap.has(ad.page_id)) {
        pagesMap.set(ad.page_id, {
          page_id: ad.page_id,
          page_name: ad.page_name,
          count: 0,
          active_count: 0,
          oldest_ad_date: ad.ad_delivery_start_time,
          library_url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${ad.page_id}&search_type=page`
        })
      }

      const page = pagesMap.get(ad.page_id)!
      page.count++
      if (isActive) page.active_count++

      if (new Date(ad.ad_delivery_start_time) < new Date(page.oldest_ad_date)) {
        page.oldest_ad_date = ad.ad_delivery_start_time
      }
    }

    // Filtrar por anúncios ativos e converter pra array final
    const finalResults = Array.from(pagesMap.values())
      .filter(p => p.active_count >= minAds)
      .map(p => ({
        page_id: p.page_id,
        page_name: p.page_name,
        count: p.active_count, // Mostrar apenas contagem de ativos
        oldest_ad_date: p.oldest_ad_date,
        library_url: p.library_url,
      }))
      .sort((a, b) => b.count - a.count)

    const totalActive = Array.from(pagesMap.values()).reduce((sum, p) => sum + p.active_count, 0)
    console.log(`[Mining] Resultado: ${finalResults.length} fan pages, ${totalActive} ads ativos de ${allAds.length} total analisados.`)

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
