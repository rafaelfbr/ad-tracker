import { scrapeAdCount } from './scraper'
import { supabase } from './supabase'
import type { ScrapeSource } from './database.types'

interface QueueItem {
  trackerId: string
  url: string
  source: ScrapeSource
  resolve: (value: number) => void
  reject: (error: Error) => void
}

/**
 * Fila sequencial de scraping.
 * Garante que apenas um scraping rode por vez para preservar RAM.
 */
class ScrapeQueue {
  private queue: QueueItem[] = []
  private processing = false

  /**
   * Adiciona um scraping à fila e retorna uma Promise com o resultado.
   */
  async enqueue(trackerId: string, url: string, source: ScrapeSource = 'auto'): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.queue.push({ trackerId, url, source, resolve, reject })
      console.log(`[Queue] Item adicionado. Tamanho da fila: ${this.queue.length}`)
      this.processNext()
    })
  }

  /**
   * Processa o próximo item da fila (se não estiver processando outro).
   */
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const item = this.queue.shift()!

    try {
      console.log(`[Queue] Processando tracker ${item.trackerId}...`)

      // Realizar o scraping
      const adCount = await scrapeAdCount(item.url)

      // Salvar resultado no banco
      const { error } = await supabase.from('scrape_results').insert({
        tracker_id: item.trackerId,
        ad_count: adCount,
        source: item.source,
      })

      if (error) {
        console.error(`[Queue] Erro ao salvar resultado:`, error.message)
        item.reject(new Error(`Erro ao salvar resultado: ${error.message}`))
      } else {
        console.log(`[Queue] Resultado salvo: ${adCount} anúncios para tracker ${item.trackerId}`)
        item.resolve(adCount)
      }
    } catch (error) {
      console.error(`[Queue] Erro no scraping:`, (error as Error).message)
      item.reject(error as Error)
    } finally {
      this.processing = false
      // Processar próximo item da fila
      this.processNext()
    }
  }

  /**
   * Retorna o tamanho atual da fila.
   */
  get size(): number {
    return this.queue.length
  }

  /**
   * Retorna se a fila está processando.
   */
  get isProcessing(): boolean {
    return this.processing
  }
}

// Singleton global da fila de scraping
export const scrapeQueue = new ScrapeQueue()
