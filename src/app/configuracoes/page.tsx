"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, KeyRound, ShieldAlert } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metaToken, setMetaToken] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings?key=META_ACCESS_TOKEN", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        setMetaToken(data.value || "")
      }
    } catch (error) {
      console.error("Erro ao carregar token:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "META_ACCESS_TOKEN", value: metaToken }),
      })

      if (!res.ok) throw new Error("Erro da API")
      toast.success("Configuração salva com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar token")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-subtle">
      {/* Page header */}
      <div className="px-6 lg:px-8 pt-6 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie os tokens e chaves de acesso</p>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-2xl px-6 lg:px-8 py-8">
        <div className="card-premium rounded-2xl p-8 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Meta Ad Library API
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure seu Access Token para habilitar o módulo de Mineração de Ofertas.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="metaToken" className="text-sm font-medium">
                Access Token
              </Label>
              <Input
                id="metaToken"
                type="password"
                placeholder="EAAGm0PX..."
                value={metaToken}
                onChange={(e) => setMetaToken(e.target.value)}
                className="rounded-xl h-11 font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                O token será salvo criptografado de forma segura no banco de dados.
              </p>
            </div>

            <div className="info-box p-4 flex gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Segurança Oobrigatória</p>
                <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                  Não compartilhe este Token com ninguém. Ele dá acesso à sua conta de Desenvolvedor no Facebook.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={loading || saving}
                className="cursor-pointer btn-glow rounded-xl px-6 h-10"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
