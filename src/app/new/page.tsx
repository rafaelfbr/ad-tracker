"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Info,
  Link as LinkIcon,
  Tag,
  Layers,
  Globe,
} from "lucide-react"

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

    if (!form.library_url || !form.offer_name || !form.niche || !form.offer_url) {
      toast.error("Preencha todos os campos")
      return
    }

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
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <header className="header-premium sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Novo Rastreamento</h1>
        </div>
      </header>

      {/* Formulário */}
      <main className="max-w-xl mx-auto px-6 py-10">
        <div className="card-premium rounded-2xl p-8 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Cadastrar Rastreamento</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informe os dados para monitorar anúncios na Biblioteca do Meta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* URL da Biblioteca */}
            <div className="space-y-2">
              <Label htmlFor="library_url" className="flex items-center gap-1.5 text-sm font-medium">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                URL da Biblioteca de Anúncios
              </Label>
              <Input
                id="library_url"
                type="url"
                placeholder="https://www.facebook.com/ads/library/?..."
                value={form.library_url}
                onChange={(e) => setForm({ ...form, library_url: e.target.value })}
                className="rounded-xl h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL completa da página na Biblioteca de Anúncios do Meta
              </p>
            </div>

            {/* Nome da Oferta */}
            <div className="space-y-2">
              <Label htmlFor="offer_name" className="flex items-center gap-1.5 text-sm font-medium">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Nome da Oferta
              </Label>
              <Input
                id="offer_name"
                type="text"
                placeholder="Ex: Curso de Marketing Digital"
                value={form.offer_name}
                onChange={(e) => setForm({ ...form, offer_name: e.target.value })}
                className="rounded-xl h-11"
                required
              />
            </div>

            {/* Nicho */}
            <div className="space-y-2">
              <Label htmlFor="niche" className="flex items-center gap-1.5 text-sm font-medium">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                Nicho
              </Label>
              <Input
                id="niche"
                type="text"
                placeholder="Ex: Marketing Digital, Saúde, Finanças"
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                className="rounded-xl h-11"
                required
              />
            </div>

            {/* URL da Oferta */}
            <div className="space-y-2">
              <Label htmlFor="offer_url" className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                URL da Oferta
              </Label>
              <Input
                id="offer_url"
                type="url"
                placeholder="https://exemplo.com/oferta"
                value={form.offer_url}
                onChange={(e) => setForm({ ...form, offer_url: e.target.value })}
                className="rounded-xl h-11"
                required
              />
              <p className="text-xs text-muted-foreground">
                Link da página de vendas ou landing page
              </p>
            </div>

            {/* Info box */}
            <div className="info-box p-4 flex gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Rastreamento Automático</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  A coleta será feita automaticamente 3x ao dia (01:00, 10:00, 21:00)
                  durante <strong>7 dias</strong>. Após isso, você poderá coletar manualmente.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 cursor-pointer btn-glow rounded-xl h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Rastreamento"
                )}
              </Button>
              <Link href="/">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer rounded-xl h-11"
                >
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
