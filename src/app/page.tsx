"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Plus,
  RefreshCw,
  History,
  Trash2,
  Loader2,
  BarChart3,
  TrendingUp,
  Pause,
  FileText,
  ExternalLink,
} from "lucide-react"
import type { TrackerWithLastResult } from "@/lib/database.types"

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<TrackerWithLastResult[]>([])
  const [loading, setLoading] = useState(true)
  const [scrapingIds, setScrapingIds] = useState<Set<string>>(new Set())

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

  async function handleScrape(trackerId: string) {
    setScrapingIds((prev) => new Set(prev).add(trackerId))
    try {
      const res = await fetch(`/api/trackers/${trackerId}/scrape`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Coleta concluída: ${data.ad_count} anúncios`)
      fetchTrackers()
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

  const totalTrackers = trackers.length
  const activeTrackers = trackers.filter((t) => t.status === "active").length
  const pausedTrackers = trackers.filter((t) => t.status === "paused").length

  return (
    <div className="min-h-screen bg-subtle">
      {/* Page header */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral dos rastreamentos</p>
          </div>
          <Link href="/new">
            <Button className="gap-2 cursor-pointer btn-glow rounded-xl h-10 px-4">
              <Plus className="w-4 h-4" />
              Novo Rastreamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="px-6 lg:px-8 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card rounded-xl p-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <div className="text-3xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-9 w-12" /> : totalTrackers}
                </div>
              </div>
              <div className="stat-icon-blue w-11 h-11 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="stat-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.08s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <div className="text-3xl font-bold mt-1" style={{ color: "oklch(0.45 0.18 160)" }}>
                  {loading ? <Skeleton className="h-9 w-12" /> : activeTrackers}
                </div>
              </div>
              <div className="stat-icon-emerald w-11 h-11 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="stat-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "0.16s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pausados</p>
                <div className="text-3xl font-bold mt-1" style={{ color: "oklch(0.55 0.15 80)" }}>
                  {loading ? <Skeleton className="h-9 w-12" /> : pausedTrackers}
                </div>
              </div>
              <div className="stat-icon-amber w-11 h-11 rounded-xl flex items-center justify-center">
                <Pause className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de trackers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-foreground">Rastreamentos</h2>
            <span className="text-xs text-muted-foreground">
              {!loading && `${trackers.length} cadastrado(s)`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-premium rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : trackers.length === 0 ? (
            <div className="empty-state p-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium mb-1">
                Nenhum rastreamento cadastrado
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Comece monitorando os anúncios dos concorrentes
              </p>
              <Link href="/new">
                <Button className="gap-2 cursor-pointer btn-glow rounded-xl">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Rastreamento
                </Button>
              </Link>
            </div>
          ) : (
            trackers.map((tracker, index) => (
              <div
                key={tracker.id}
                className="tracker-card rounded-xl p-5 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground truncate">{tracker.offer_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          tracker.status === "active"
                            ? "badge-active status-dot-active"
                            : "badge-paused status-dot-paused"
                        }`}
                      >
                        {tracker.status === "active" ? "Ativo" : "Pausado"}
                      </span>
                      <span className="badge-niche text-xs px-2.5 py-1 rounded-full">
                        {tracker.niche}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <a
                        href={tracker.offer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline truncate max-w-xs"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {tracker.offer_url.length > 40
                          ? tracker.offer_url.substring(0, 40) + "..."
                          : tracker.offer_url}
                      </a>
                      <span>Coleta: {formatDate(tracker.last_scraped_at)}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-extrabold count-display">
                      {tracker.last_ad_count ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                      anúncios
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScrape(tracker.id)}
                    disabled={scrapingIds.has(tracker.id)}
                    className="cursor-pointer rounded-lg text-xs h-8 gap-1.5"
                  >
                    {scrapingIds.has(tracker.id) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Coletando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Coletar
                      </>
                    )}
                  </Button>
                  {tracker.status === "paused" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(tracker.id)}
                      className="cursor-pointer rounded-lg text-xs h-8 gap-1.5"
                      style={{ color: "oklch(0.45 0.18 160)", borderColor: "oklch(0.6 0.15 160 / 0.3)" }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Reativar
                    </Button>
                  )}
                  <Link href={`/tracker/${tracker.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer rounded-lg text-xs h-8 gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      Histórico
                    </Button>
                  </Link>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tracker.id)}
                    className="cursor-pointer rounded-lg text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
