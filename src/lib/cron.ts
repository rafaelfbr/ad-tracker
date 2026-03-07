import cron from 'node-cron'
import { supabase } from './supabase'
import { scrapeQueue } from './scrape-queue'

let initialized = false

/**
 * Inicializa os cron jobs para scraping automático.
 * Horários: 01:00, 10:00, 21:00 (horário de Brasília / UTC-3)
 */
export function initCronJobs(): void {
  if (initialized) return
  initialized = true

  console.log('[Cron] Inicializando cron jobs...')

  // Horários: 01:00, 10:00, 21:00 (horário de Brasília)
  cron.schedule('0 1,10,21 * * *', async () => {
    console.log(`[Cron] Executando scraping automático - ${new Date().toISOString()}`)
    await runAutoScraping()
  }, {
    timezone: 'America/Sao_Paulo',
  })

  console.log('[Cron] Cron jobs configurados: 01:00, 10:00, 21:00 (BRT)')
}

/**
 * Executa scraping automático de todos os trackers ativos.
 * Também verifica e expira trackers que passaram do prazo.
 */
async function runAutoScraping(): Promise<void> {
  try {
    // 1. Expirar trackers que passaram do prazo
    const now = new Date().toISOString()
    const { error: expireError } = await supabase
      .from('trackers')
      .update({ status: 'paused' })
      .eq('status', 'active')
      .lt('auto_track_until', now)

    if (expireError) {
      console.error('[Cron] Erro ao expirar trackers:', expireError.message)
    }

    // 2. Buscar trackers ativos (que ainda não expiraram)
    const { data: trackers, error: fetchError } = await supabase
      .from('trackers')
      .select('*')
      .eq('status', 'active')
      .gt('auto_track_until', now)

    if (fetchError) {
      console.error('[Cron] Erro ao buscar trackers:', fetchError.message)
      return
    }

    if (!trackers || trackers.length === 0) {
      console.log('[Cron] Nenhum tracker ativo encontrado.')
      return
    }

    console.log(`[Cron] Encontrados ${trackers.length} tracker(s) ativo(s). Enfileirando...`)

    // 3. Enfileirar scraping para cada tracker (fila sequencial)
    for (const tracker of trackers) {
      scrapeQueue.enqueue(tracker.id, tracker.library_url, 'auto').catch((error) => {
        console.error(`[Cron] Erro no scraping do tracker ${tracker.id}:`, error.message)
      })
    }
  } catch (error) {
    console.error('[Cron] Erro geral no scraping automático:', error)
  }
}
