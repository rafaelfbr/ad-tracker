import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { CreateTrackerInput } from '@/lib/database.types'

/**
 * GET /api/trackers
 * Lista todos os trackers com o último resultado de scraping.
 */
export async function GET() {
  try {
    // Buscar todos os trackers
    const { data: trackers, error } = await supabase
      .from('trackers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar o último resultado de cada tracker
    const trackersWithResults = await Promise.all(
      (trackers || []).map(async (tracker) => {
        const { data: results } = await supabase
          .from('scrape_results')
          .select('ad_count, scraped_at')
          .eq('tracker_id', tracker.id)
          .order('scraped_at', { ascending: false })
          .limit(1)

        return {
          ...tracker,
          last_ad_count: results?.[0]?.ad_count ?? null,
          last_scraped_at: results?.[0]?.scraped_at ?? null,
        }
      })
    )

    return NextResponse.json(trackersWithResults)
  } catch (error) {
    console.error('[API] Erro ao listar trackers:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * POST /api/trackers
 * Cria um novo tracker.
 */
export async function POST(request: Request) {
  try {
    const body: CreateTrackerInput = await request.json()

    // Validação
    if (!body.library_url || !body.offer_name || !body.niche || !body.offer_url) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Inserir no banco
    const { data, error } = await supabase
      .from('trackers')
      .insert({
        library_url: body.library_url,
        offer_name: body.offer_name,
        niche: body.niche,
        offer_url: body.offer_url,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[API] Erro ao criar tracker:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
