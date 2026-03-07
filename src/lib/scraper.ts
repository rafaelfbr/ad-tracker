import { chromium, type Browser } from 'playwright'

// Lista de User-Agents para rotação
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
]

/**
 * Retorna um User-Agent aleatório da lista
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Delay aleatório entre min e max milissegundos
 */
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Extrai a quantidade de anúncios de uma página da Biblioteca de Anúncios do Meta.
 * Busca o texto "~X resultados" ou "X resultados" no topo da página.
 *
 * @param url - URL da página na Biblioteca de Anúncios do Meta
 * @param retries - Número de tentativas (padrão: 3)
 * @returns Quantidade de anúncios encontrada
 */
export async function scrapeAdCount(url: string, retries = 3): Promise<number> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    let browser: Browser | null = null

    try {
      console.log(`[Scraper] Tentativa ${attempt}/${retries} para: ${url}`)

      // Delay aleatório antes de iniciar (evitar padrão detectável)
      if (attempt > 1) {
        const backoffMs = Math.pow(2, attempt) * 1000 // Backoff exponencial
        console.log(`[Scraper] Aguardando ${backoffMs}ms (backoff)...`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }

      // Iniciar browser headless
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })

      const context = await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
      })

      const page = await context.newPage()

      // Delay aleatório antes da navegação
      await randomDelay(500, 2000)

      // Navegar até a página
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      })

      // Aguardar a página carregar completamente
      await randomDelay(3000, 5000)

      // Tentar encontrar o elemento com a contagem de resultados
      // O texto aparece como "~230 resultados" ou "230 resultados"
      const resultText = await page.evaluate(() => {
        // Buscar por elementos que contenham "resultados" no texto
        const allElements = document.querySelectorAll('*')
        for (const el of allElements) {
          const text = el.textContent?.trim() || ''
          // Padrão: "~230 resultados" ou "230 resultados" ou "Aproximadamente 230 resultados"
          const match = text.match(/[~≈]?\s*(\d[\d.,]*)\s*resultado/i)
          if (match && el.children.length === 0) {
            return match[1]
          }
        }

        // Fallback: buscar em divs com classes específicas do Facebook
        const divs = document.querySelectorAll('div')
        for (const div of divs) {
          const text = div.textContent?.trim() || ''
          const match = text.match(/[~≈]?\s*(\d[\d.,]*)\s*resultado/i)
          if (match) {
            return match[1]
          }
        }

        return null
      })

      if (!resultText) {
        throw new Error('Não foi possível encontrar a contagem de resultados na página')
      }

      // Limpar e converter o número (remover pontos de milhar, substituir vírgula)
      const cleanNumber = resultText.replace(/\./g, '').replace(',', '.')
      const adCount = parseInt(cleanNumber, 10)

      if (isNaN(adCount)) {
        throw new Error(`Não foi possível converter "${resultText}" para número`)
      }

      console.log(`[Scraper] Sucesso! Encontrados ${adCount} anúncios`)
      return adCount
    } catch (error) {
      lastError = error as Error
      console.error(`[Scraper] Erro na tentativa ${attempt}:`, lastError.message)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  throw new Error(`[Scraper] Falha após ${retries} tentativas. Último erro: ${lastError?.message}`)
}
