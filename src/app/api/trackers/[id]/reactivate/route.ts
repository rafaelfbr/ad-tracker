import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/trackers/[id]/reactivate
 * Reativa o tracker, reiniciando o ciclo de 7 dias.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Calcular novo prazo: agora + 7 dias
    const newDeadline = new Date()
    newDeadline.setDate(newDeadline.getDate() + 7)

    const { data, error } = await supabase
      .from('trackers')
      .update({
        status: 'active' as const,
        auto_track_until: newDeadline.toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Tracker não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Tracker reativado com sucesso',
      tracker: data,
    })
  } catch (error) {
    console.error('[API] Erro ao reativar tracker:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
