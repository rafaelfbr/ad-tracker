"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function NewTrackerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    library_url: "",
    offer_name: "",
    niche: "",
    offer_url: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validação básica
    if (!form.library_url || !form.offer_name || !form.niche || !form.offer_url) {
      toast.error("Preencha todos os campos")
      return
    }

    // Validar URL da biblioteca do Meta
    if (!form.library_url.includes("facebook.com/ads/library")) {
      toast.error("A URL deve ser da Biblioteca de Anúncios do Meta (facebook.com/ads/library)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Rastreamento criado com sucesso!")
      router.push("/")
    } catch (error) {
      toast.error(`Erro ao criar: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
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
          <h1 className="text-xl font-bold gradient-text">Novo Rastreamento</h1>
        </div>
      </header>

      {/* Formulário */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Card className="glass-card gradient-border animate-fade-in">
          <CardHeader>
            <CardTitle>Cadastrar Rastreamento</CardTitle>
            <CardDescription>
              Informe os dados para monitorar anúncios na Biblioteca do Meta.
              O rastreamento automático ficará ativo por 7 dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL da Biblioteca */}
              <div className="space-y-2">
                <Label htmlFor="library_url">URL da Biblioteca de Anúncios</Label>
                <Input
                  id="library_url"
                  type="url"
                  placeholder="https://www.facebook.com/ads/library/?..."
                  value={form.library_url}
                  onChange={(e) => setForm({ ...form, library_url: e.target.value })}
                  className="bg-background/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL completa da página na Biblioteca de Anúncios do Meta
                </p>
              </div>

              {/* Nome da Oferta */}
              <div className="space-y-2">
                <Label htmlFor="offer_name">Nome da Oferta</Label>
                <Input
                  id="offer_name"
                  type="text"
                  placeholder="Ex: Curso de Marketing Digital"
                  value={form.offer_name}
                  onChange={(e) => setForm({ ...form, offer_name: e.target.value })}
                  className="bg-background/50"
                  required
                />
              </div>

              {/* Nicho */}
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho</Label>
                <Input
                  id="niche"
                  type="text"
                  placeholder="Ex: Marketing Digital, Saúde, Finanças"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  className="bg-background/50"
                  required
                />
              </div>

              {/* URL da Oferta */}
              <div className="space-y-2">
                <Label htmlFor="offer_url">URL da Oferta</Label>
                <Input
                  id="offer_url"
                  type="url"
                  placeholder="https://exemplo.com/oferta"
                  value={form.offer_url}
                  onChange={(e) => setForm({ ...form, offer_url: e.target.value })}
                  className="bg-background/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Link da página de vendas ou landing page
                </p>
              </div>

              {/* Info sobre rastreamento automático */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-primary">Rastreamento Automático</p>
                    <p className="text-muted-foreground mt-1">
                      A coleta será feita automaticamente 3x ao dia (01:00, 10:00, 21:00)
                      durante <strong>7 dias</strong>. Após isso, você poderá coletar manualmente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1 cursor-pointer">
                  {loading ? (
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
                      Criando...
                    </>
                  ) : (
                    "Criar Rastreamento"
                  )}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline" className="cursor-pointer">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
