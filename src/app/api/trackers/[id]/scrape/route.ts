import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { scrapeQueue } from '@/lib/scrape-queue'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/trackers/[id]/scrape
 * Dispara scraping manual para um tracker específico.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verificar se o tracker existe
    const { data: tracker, error } = await supabase
      .from('trackers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !tracker) {
      return NextResponse.json({ error: 'Tracker não encontrado' }, { status: 404 })
    }

    // Enfileirar scraping manual
    const adCount = await scrapeQueue.enqueue(tracker.id, tracker.library_url, 'manual')

    return NextResponse.json({
      message: 'Scraping concluído',
      ad_count: adCount,
    })
  } catch (error) {
    console.error('[API] Erro no scraping manual:', error)
    return NextResponse.json(
      { error: `Erro no scraping: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
