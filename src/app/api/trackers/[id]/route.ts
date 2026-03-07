import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/trackers/[id]
 * Retorna detalhes do tracker + histórico de coletas.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Buscar tracker
    const { data: tracker, error: trackerError } = await supabase
      .from('trackers')
      .select('*')
      .eq('id', id)
      .single()

    if (trackerError || !tracker) {
      return NextResponse.json({ error: 'Tracker não encontrado' }, { status: 404 })
    }

    // Buscar resultados de scraping
    const { data: results, error: resultsError } = await supabase
      .from('scrape_results')
      .select('*')
      .eq('tracker_id', id)
      .order('scraped_at', { ascending: true })

    if (resultsError) {
      return NextResponse.json({ error: resultsError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...tracker,
      results: results || [],
    })
  } catch (error) {
    console.error('[API] Erro ao buscar tracker:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/trackers/[id]
 * Exclui o tracker e todos os resultados associados (cascade).
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('trackers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tracker excluído com sucesso' })
  } catch (error) {
    console.error('[API] Erro ao excluir tracker:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
