"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Loader2,
  BarChart3,
  Calendar,
  ExternalLink,
  Clock,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { Tracker, ScrapeResult } from "@/lib/database.types"

interface TrackerDetail extends Tracker {
  results: ScrapeResult[]
}

export default function TrackerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [tracker, setTracker] = useState<TrackerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)

  useEffect(() => {
    fetchTracker()
  }, [id])

  async function fetchTracker() {
    try {
      const res = await fetch(`/api/trackers/${id}`)
      if (!res.ok) throw new Error("Tracker não encontrado")
      const data = await res.json()
      setTracker(data)
    } catch (error) {
      toast.error("Erro ao carregar rastreamento")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleScrape() {
    setScraping(true)
    try {
      const res = await fetch(`/api/trackers/${id}/scrape`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Coleta concluída: ${data.ad_count} anúncios`)
      fetchTracker()
    } catch (error) {
      toast.error(`Erro na coleta: ${(error as Error).message}`)
    } finally {
      setScraping(false)
    }
  }

  async function handleReactivate() {
    try {
      const res = await fetch(`/api/trackers/${id}/reactivate`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Erro ao reativar")
      toast.success("Rastreamento reativado por mais 7 dias!")
      fetchTracker()
    } catch (error) {
      toast.error("Erro ao reativar rastreamento")
      console.error(error)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Dados para o gráfico
  const chartData =
    tracker?.results.map((r) => ({
      date: formatShortDate(r.scraped_at),
      anuncios: r.ad_count,
      source: r.source,
    })) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle">
        <header className="header-premium sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (!tracker) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="card-premium rounded-2xl p-10 text-center">
          <p className="text-muted-foreground mb-4">Rastreamento não encontrado</p>
          <Link href="/">
            <Button className="cursor-pointer rounded-xl">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <header className="header-premium sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground tracking-tight truncate">
              {tracker.offer_name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrape}
              disabled={scraping}
              className="cursor-pointer rounded-lg text-xs h-8 gap-1.5"
            >
              {scraping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Coletando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coletar Agora
                </>
              )}
            </Button>
            {tracker.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReactivate}
                className="cursor-pointer rounded-lg text-xs h-8 gap-1.5"
                style={{ color: "oklch(0.45 0.18 160)", borderColor: "oklch(0.6 0.15 160 / 0.3)" }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Reativar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in">
          <div className="stat-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="stat-icon-blue w-7 h-7 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Status</span>
            </div>
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                tracker.status === "active"
                  ? "badge-active status-dot-active"
                  : "badge-paused status-dot-paused"
              }`}
            >
              {tracker.status === "active" ? "Ativo" : "Pausado"}
            </span>
          </div>

          <div className="stat-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="stat-icon-emerald w-7 h-7 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Oferta</span>
            </div>
            <a
              href={tracker.offer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate block"
            >
              {tracker.offer_url.length > 30
                ? tracker.offer_url.substring(0, 30) + "..."
                : tracker.offer_url}
            </a>
          </div>

          <div className="stat-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="stat-icon-amber w-7 h-7 rounded-lg flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Criado em</span>
            </div>
            <p className="text-xs font-medium text-foreground">{formatDate(tracker.created_at)}</p>
          </div>

          <div className="stat-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="stat-icon-blue w-7 h-7 rounded-lg flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Rastreia até</span>
            </div>
            <p className="text-xs font-medium text-foreground">{formatDate(tracker.auto_track_until)}</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="card-premium rounded-2xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Evolução de Anúncios</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quantidade de anúncios ativos ao longo do tempo
            </p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma coleta registrada</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique em &quot;Coletar Agora&quot; ou aguarde a coleta automática
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAnuncios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.5 0.18 260)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="oklch(0.5 0.18 260)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.92 0.005 270)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.6 0.02 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.6 0.02 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.005 270)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px oklch(0 0 0 / 0.08)",
                    color: "oklch(0.15 0.01 270)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "oklch(0.5 0.02 270)", fontWeight: 500 }}
                />
                <Area
                  type="monotone"
                  dataKey="anuncios"
                  stroke="oklch(0.5 0.18 260)"
                  strokeWidth={2.5}
                  fill="url(#colorAnuncios)"
                  dot={{
                    fill: "oklch(0.5 0.18 260)",
                    strokeWidth: 2,
                    stroke: "#fff",
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabela de resultados */}
        <div className="card-premium rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="p-6 pb-4">
            <h2 className="text-base font-semibold text-foreground">Histórico de Coletas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tracker.results.length} coleta(s) registrada(s)
            </p>
          </div>
          {tracker.results.length === 0 ? (
            <div className="px-6 pb-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma coleta registrada ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border/60">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Anúncios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fonte
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...tracker.results].reverse().map((result, i) => (
                    <tr
                      key={result.id}
                      className={`border-t border-border/40 hover:bg-muted/30 transition-colors ${
                        i % 2 === 0 ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-6 py-3 text-foreground">
                        {formatDate(result.scraped_at)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-base count-display">
                          {result.ad_count}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                            result.source === "auto"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          {result.source === "auto" ? "Automático" : "Manual"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
