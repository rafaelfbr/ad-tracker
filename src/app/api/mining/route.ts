import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // Permite até 5 minutos de execução

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    
    // Paginação - buscar até esgotar os resultados ou bater maxPages
    let allAds: MetaAd[] = []
    let afterCursor = ""
    let pagesFetched = 0
    const maxPages = 500

    console.log(`[Mining] Iniciando busca: keyword="${keyword}", country="${country}", language="${language}"`)

    while (pagesFetched < maxPages) {
      const url = new URL("https://graph.facebook.com/v25.0/ads_archive")
      url.searchParams.append("access_token", accessToken)
      url.searchParams.append("search_terms", keyword)
      url.searchParams.append("ad_reached_countries", JSON.stringify([country]))
      
      if (language !== "ALL") {
        url.searchParams.append("languages", JSON.stringify([language]))
      }
      url.searchParams.append("ad_active_status", "ACTIVE")
      url.searchParams.append("ad_type", "ALL")
      url.searchParams.append("search_type", "KEYWORD_UNORDERED")
      url.searchParams.append("fields", "page_id,page_name,ad_delivery_start_time,ad_snapshot_url")
      url.searchParams.append("limit", "500")
      
      if (afterCursor) {
        url.searchParams.append("after", afterCursor)
      }

      const res = await fetch(url.toString())
      const data: MetaApiResponse = await res.json()

      if (!res.ok || data.error) {
        const metaMessage = data.error?.error_user_msg || data.error?.message || "Erro desconhecido na Meta API"
        const errorCode = data.error?.code
        
        console.error(`[Mining] Erro da Meta API (code: ${errorCode}): ${metaMessage}`)
        
        // Se for rate limit (code 613 ou 4), esperar e tentar de novo
        if (errorCode === 613 || errorCode === 4) {
          console.log(`[Mining] Rate limit atingido na página ${pagesFetched + 1}. Parando com ${allAds.length} anúncios coletados.`)
          break
        }
        
        throw new Error(`Meta API: ${metaMessage}`)
      }

      const ads = data.data || []
      allAds = [...allAds, ...ads]
      pagesFetched++

      console.log(`[Mining] Página ${pagesFetched}: ${ads.length} anúncios (total acumulado: ${allAds.length})`)

      if (data.paging?.next && data.paging.cursors?.after) {
        afterCursor = data.paging.cursors.after
      } else {
        console.log(`[Mining] Sem mais páginas. Total final: ${allAds.length} anúncios em ${pagesFetched} páginas.`)
        break
      }
    }

    if (pagesFetched >= maxPages) {
      console.log(`[Mining] Atingiu o limite de ${maxPages} páginas. Total: ${allAds.length} anúncios.`)
    }

    // Agrupar por page_id
    const pagesMap = new Map<string, {
      page_id: string
      page_name: string
      count: number
      oldest_ad_date: string
      library_url: string
    }>()

    for (const ad of allAds) {
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
          oldest_ad_date: ad.ad_delivery_start_time,
          library_url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${ad.page_id}&search_type=page`
        })
      }

      const page = pagesMap.get(ad.page_id)!
      page.count++

      if (new Date(ad.ad_delivery_start_time) < new Date(page.oldest_ad_date)) {
        page.oldest_ad_date = ad.ad_delivery_start_time
      }
    }

    // Filtrar e converter pra array final
    const finalResults = Array.from(pagesMap.values())
      .filter(p => p.count >= minAds)
      .sort((a, b) => b.count - a.count)

    console.log(`[Mining] Resultado: ${finalResults.length} fan pages de ${allAds.length} anúncios analisados.`)

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
