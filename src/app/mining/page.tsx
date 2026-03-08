"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Search,
  Loader2,
  Calendar,
  Globe,
  BarChart3,
  MonitorPlay,
  ExternalLink,
  Plus
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface MiningResult {
  page_id: string
  page_name: string
  count: number
  oldest_ad_date: string
  library_url: string
  ignored_count: number
}

export default function MiningPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<MiningResult[]>([])
  const [searched, setSearched] = useState(false)
  const [metrics, setMetrics] = useState({ total_analizados: 0, pages_encontradas: 0 })

  // form state
  const [keyword, setKeyword] = useState("")
  const [country, setCountry] = useState("BR")
  const [minAds, setMinAds] = useState(1)
  const [minDays, setMinDays] = useState(0)
  const [language, setLanguage] = useState("ALL")

  // Tracking Modal State
  const [selectedPage, setSelectedPage] = useState<MiningResult | null>(null)
  const [trackForm, setTrackForm] = useState({
    offer_name: "",
    niche: "",
    offer_url: "",
  })
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set())

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!keyword) {
      toast.error("Preencha a palavra-chave")
      return
    }

    setLoading(true)
    setSearched(true)
    setResults([])
    setMetrics({ total_analizados: 0, pages_encontradas: 0 })
    
    try {
      const res = await fetch("/api/mining", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, country, minAds, minDays, language }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResults(data.results || [])
      setMetrics({
        total_analizados: data.total_analizados || 0,
        pages_encontradas: data.pages_encontradas || 0
      })
      toast.success(`Busca concluída: ${data.pages_encontradas} páginas encontradas em ${(data.total_analizados).toLocaleString()} anúncios.`)
    } catch (error) {
      console.error(error)
      toast.error(`Erro: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  function openTrackModal(page: MiningResult) {
    setSelectedPage(page)
    setTrackForm({
      offer_name: page.page_name,
      niche: "",
      offer_url: "",
    })
  }

  async function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPage) return
    if (!trackForm.offer_name || !trackForm.niche || !trackForm.offer_url) {
      toast.error("Preencha todos os campos")
      return
    }

    setTrackingLoading(true)
    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          library_url: selectedPage.library_url,
          offer_name: trackForm.offer_name,
          niche: trackForm.niche,
          offer_url: trackForm.offer_url
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Adicionado à lista de Ofertas Marcadas!")
      
      // Marcar na UI que essa page info foi rastreada
      setTrackedIds(prev => new Set(prev).add(selectedPage.page_id))
      setSelectedPage(null)
    } catch (error) {
      toast.error(`Erro ao criar: ${(error as Error).message}`)
    } finally {
      setTrackingLoading(false)
    }
  }

  function formatDaysAgo(dateStr: string) {
    const start = new Date(dateStr)
    const diff = new Date().getTime() - start.getTime()
    const days = Math.floor(diff / (1000 * 3600 * 24))
    if (days === 0) return "Hoje"
    if (days === 1) return "Há 1 dia"
    return `Há ${days} dias`
  }

  return (
    <div className="min-h-screen bg-subtle">
      {/* Page header */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Mineração de Ofertas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Encontre criativos e ofertas em escala na Meta Ad Library.</p>
      </div>

      <main className="px-6 lg:px-8 py-6 space-y-6">
        {/* Filtros em Formulario */}
        <div className="card-premium rounded-2xl p-6 animate-fade-in">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keyword" className="flex items-center gap-1.5 text-sm font-medium">
                <Search className="w-3.5 h-3.5" />
                Palavra-chave
              </Label>
              <Input
                id="keyword"
                placeholder="Ex: Emagrecimento, Curso, Renda..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="w-3.5 h-3.5" />
                País
              </Label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL">Mundo Todo (Tudo)</option>
                <option value="BR">Brasil (BR)</option>
                <option value="US">Estados Unidos (US)</option>
                <option value="PT">Portugal (PT)</option>
                <option value="GB">Reino Unido (GB)</option>
                <option value="DE">Alemanha (DE)</option>
                <option value="ES">Espanha (ES)</option>
                <option value="MX">México (MX)</option>
                <option value="AR">Argentina (AR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="w-3.5 h-3.5" />
                Idioma
              </Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">Todos Idiomas</option>
                <option value="pt">Português (PT)</option>
                <option value="en">Inglês (EN)</option>
                <option value="es">Espanhol (ES)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAds" className="flex items-center gap-1.5 text-sm font-medium">
                <BarChart3 className="w-3.5 h-3.5" />
                Mínimo de Ads Ativos
              </Label>
              <Input
                id="minAds"
                type="number"
                min="1"
                value={minAds}
                onChange={(e) => setMinAds(Number(e.target.value))}
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minDays" className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Mínimo de dias ativo
              </Label>
              <Input
                id="minDays"
                type="number"
                min="0"
                value={minDays}
                onChange={(e) => setMinDays(Number(e.target.value))}
                className="rounded-xl h-11"
              />
            </div>

            <div className="md:col-span-5 md:flex md:justify-end mt-2">
              <Button type="submit" disabled={loading} className="w-full md:w-auto cursor-pointer btn-glow rounded-xl px-8 h-11">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando (pode demorar)...
                  </>
                ) : (
                  <>
                    <MonitorPlay className="w-4 h-4 mr-2" />
                    Minerar Ofertas
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Informações pós-busca */}
        {searched && (
          <div className="flex items-center justify-between text-sm px-2 animate-fade-in">
            <p className="text-muted-foreground">
              {loading ? "Buscando e agrupando resultados..." : `Mostrando ${results.length} fan pages (Analizados: ${metrics.total_analizados})`}
            </p>
          </div>
        )}

        {/* Resultados Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!loading && results.map((result, i) => {
            const isTracked = trackedIds.has(result.page_id);
            return (
              <div key={result.page_id} className="card-premium rounded-2xl p-5 animate-fade-in flex flex-col" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">{result.page_name}</h3>
                    <div className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-xl flex-shrink-0">
                      {result.count}
                      <span className="text-[10px] block text-center uppercase tracking-wider mt-0.5 opacity-80">Ads</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Ad mais antigo</span>
                      <span className="font-medium text-foreground">{formatDaysAgo(result.oldest_ad_date)}</span>
                    </div>
                    {/* Exibe o total ignorado se > 0 */}
                    {result.ignored_count > 0 && (
                      <div className="text-[10px] text-amber-600/70 border-t border-border/40 pt-2 mt-2">
                        {result.ignored_count} anúncio(s) ignorado(s) por indício de whatsapp/ig.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                  <a href={result.library_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full text-xs h-9 rounded-lg gap-2 cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver na Meta
                    </Button>
                  </a>
                  <Button 
                    className="flex-1 text-xs h-9 rounded-lg gap-2 cursor-pointer btn-glow"
                    disabled={isTracked}
                    onClick={() => openTrackModal(result)}
                  >
                    {isTracked ? (
                      "Rastreado"
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Rastrear
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Modal / Dialog de rastreio rapido */}
      <Dialog open={!!selectedPage} onOpenChange={(open) => !open && setSelectedPage(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Iniciar Rastreamento</DialogTitle>
            <DialogDescription>
              Adicione os detalhes da oferta desta página aos seus trackings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTrackSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="track_offer" className="text-sm">Nome da Oferta</Label>
              <Input
                id="track_offer"
                value={trackForm.offer_name}
                onChange={e => setTrackForm({...trackForm, offer_name: e.target.value})}
                className="rounded-xl h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track_niche" className="text-sm">Nicho</Label>
              <Input
                id="track_niche"
                placeholder="Ex: Apostas, Emagrecimento..."
                value={trackForm.niche}
                onChange={e => setTrackForm({...trackForm, niche: e.target.value})}
                className="rounded-xl h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track_url" className="text-sm">URL da Oferta (Vendas)</Label>
              <Input
                id="track_url"
                type="url"
                placeholder="https://sua-pagina.com"
                value={trackForm.offer_url}
                onChange={e => setTrackForm({...trackForm, offer_url: e.target.value})}
                className="rounded-xl h-10"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPage(null)} className="rounded-xl cursor-pointer h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={trackingLoading} className="rounded-xl cursor-pointer btn-glow h-10">
                {trackingLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Rastrear Página
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
