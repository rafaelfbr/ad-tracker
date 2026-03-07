"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { TrackerWithLastResult } from "@/lib/database.types"

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<TrackerWithLastResult[]>([])
  const [loading, setLoading] = useState(true)
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set())

  // Buscar trackers ao montar o componente
  useEffect(() => {
    fetchTrackers()
  }, [])

  async function fetchTrackers() {
    try {
      const res = await fetch("/api/trackers")
      if (!res.ok) throw new Error("Erro ao buscar trackers")
      const data = await res.json()
      setTrackers(data)
    } catch (error) {
      toast.error("Erro ao carregar rastreamentos")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Scraping manual
  async function handleScrape(trackerId: string) {
    setScrapingIds((prev) => new Set(prev).add(trackerId))
    try {
      const res = await fetch(`/api/trackers/${trackerId}/scrape`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Coleta concluída: ${data.ad_count} anúncios`)
      fetchTrackers() // Atualizar lista
    } catch (error) {
      toast.error(`Erro na coleta: ${(error as Error).message}`)
    } finally {
      setScrapingIds((prev) => {
        const next = new Set(prev)
        next.delete(trackerId)
        return next
      })
    }
  }

  // Reativar tracker
  async function handleReactivate(trackerId: string) {
    try {
      const res = await fetch(`/api/trackers/${trackerId}/reactivate`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Erro ao reativar")
      toast.success("Rastreamento reativado por mais 7 dias!")
      fetchTrackers()
    } catch (error) {
      toast.error("Erro ao reativar rastreamento")
      console.error(error)
    }
  }

  // Excluir tracker
  async function handleDelete(trackerId: string) {
    if (!confirm("Tem certeza que deseja excluir este rastreamento e todo o histórico?")) return
    try {
      const res = await fetch(`/api/trackers/${trackerId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Rastreamento excluído")
      fetchTrackers()
    } catch (error) {
      toast.error("Erro ao excluir rastreamento")
      console.error(error)
    }
  }

  // Formatar data para pt-BR
  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-text">Ad Tracker</h1>
          </div>
          <Link href="/new">
            <Button className="gap-2 cursor-pointer">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Novo Rastreamento
            </Button>
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card gradient-border animate-fade-in">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total de Rastreamentos</p>
              <p className="text-3xl font-bold mt-1">{loading ? "—" : trackers.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card gradient-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-3xl font-bold mt-1 text-emerald-400">
                {loading ? "—" : trackers.filter((t) => t.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card gradient-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pausados</p>
              <p className="text-3xl font-bold mt-1 text-amber-400">
                {loading ? "—" : trackers.filter((t) => t.status === "paused").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de trackers */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Rastreamentos</h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : trackers.length === 0 ? (
            <Card className="glass-card border-dashed">
              <CardContent className="pt-6 text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-4">
                  Nenhum rastreamento cadastrado ainda.
                </p>
                <Link href="/new">
                  <Button>Criar Primeiro Rastreamento</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            trackers.map((tracker, index) => (
              <Card
                key={tracker.id}
                className="glass-card gradient-border animate-fade-in hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{tracker.offer_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={tracker.status === "active" ? "default" : "secondary"}
                          className={
                            tracker.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }
                        >
                          {tracker.status === "active" ? "● Ativo" : "● Pausado"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tracker.niche}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold gradient-text">
                        {tracker.last_ad_count ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">anúncios</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Oferta:{" "}
                        <a
                          href={tracker.offer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {tracker.offer_url.length > 50
                            ? tracker.offer_url.substring(0, 50) + "..."
                            : tracker.offer_url}
                        </a>
                      </p>
                      <p>Última coleta: {formatDate(tracker.last_scraped_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScrape(tracker.id)}
                        disabled={scrapingIds.has(tracker.id)}
                        className="cursor-pointer"
                      >
                        {scrapingIds.has(tracker.id) ? (
                          <>
                            <svg
                              className="w-3 h-3 mr-1 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Coletando...
                          </>
                        ) : (
                          "Coletar Agora"
                        )}
                      </Button>
                      {tracker.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(tracker.id)}
                          className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          Reativar
                        </Button>
                      )}
                      <Link href={`/tracker/${tracker.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer">
                          Ver Histórico
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tracker.id)}
                        className="text-destructive hover:text-destructive cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
