"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
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

  // Preparar dados para o gráfico
  const chartData =
    tracker?.results.map((r) => ({
      date: formatShortDate(r.scraped_at),
      anuncios: r.ad_count,
      source: r.source,
    })) || []

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-border/50 glass-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    )
  }

  if (!tracker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground mb-4">Rastreamento não encontrado</p>
          <Link href="/">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold gradient-text">{tracker.offer_name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Info do tracker */}
        <Card className="glass-card gradient-border animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{tracker.offer_name}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <span className="flex items-center gap-2">
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
                    <Badge variant="outline">{tracker.niche}</Badge>
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleScrape}
                  disabled={scraping}
                  className="cursor-pointer"
                >
                  {scraping ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-2 animate-spin"
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
                    onClick={handleReactivate}
                    className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    Reativar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">URL da Oferta</p>
                <a
                  href={tracker.offer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {tracker.offer_url}
                </a>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p>{formatDate(tracker.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rastreamento até</p>
                <p>{formatDate(tracker.auto_track_until)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico */}
        <Card className="glass-card gradient-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle>Evolução de Anúncios</CardTitle>
            <CardDescription>
              Quantidade de anúncios ativos ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  <p>Nenhuma coleta registrada ainda</p>
                  <p className="text-xs mt-1">
                    Clique em &quot;Coletar Agora&quot; ou aguarde a coleta automática
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAnuncios" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(0.7 0.15 250)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.7 0.15 250)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.28 0.02 260 / 0.5)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="oklch(0.6 0.03 260)"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="oklch(0.6 0.03 260)"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.015 260)",
                      border: "1px solid oklch(0.28 0.02 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.01 260)",
                    }}
                    labelStyle={{ color: "oklch(0.6 0.03 260)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="anuncios"
                    stroke="oklch(0.7 0.15 250)"
                    strokeWidth={2}
                    fill="url(#colorAnuncios)"
                    dot={{
                      fill: "oklch(0.7 0.15 250)",
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabela de resultados */}
        <Card className="glass-card gradient-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle>Histórico de Coletas</CardTitle>
            <CardDescription>
              {tracker.results.length} coleta(s) registrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tracker.results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma coleta registrada ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Anúncios</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...tracker.results].reverse().map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{formatDate(result.scraped_at)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-lg gradient-text">
                          {result.ad_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            result.source === "auto"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-violet-500/10 text-violet-400 border-violet-500/30"
                          }
                        >
                          {result.source === "auto" ? "Automático" : "Manual"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
