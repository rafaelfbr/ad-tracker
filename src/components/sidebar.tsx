"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  Eye,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu,
  X,
} from "lucide-react"

// Itens de navegação
const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Botão mobile para abrir sidebar */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-white border-r border-border/60
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          boxShadow: "1px 0 8px oklch(0 0 0 / 0.03)",
        }}
      >
        {/* Logo / Brand */}
        <div className={`flex items-center h-16 border-b border-border/50 px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 btn-glow">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
              Ad Tracker
            </span>
          )}

          {/* Botão fechar mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${collapsed ? "justify-center px-0" : ""}
                  ${
                    isActive
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer com UserButton e toggle */}
        <div className={`border-t border-border/50 p-3 space-y-2`}>
          {/* Botão collapse (apenas desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              hidden lg:flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground
              hover:bg-muted/60 hover:text-foreground transition-all duration-200 w-full cursor-pointer
              ${collapsed ? "justify-center px-0" : ""}
            `}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? (
              <ChevronRight className="w-[18px] h-[18px]" />
            ) : (
              <>
                <ChevronLeft className="w-[18px] h-[18px]" />
                <span>Recolher</span>
              </>
            )}
          </button>

          {/* Perfil do usuário */}
          <div className={`flex items-center gap-3 rounded-xl px-3 py-2 ${collapsed ? "justify-center px-0" : ""}`}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            {!collapsed && (
              <span className="text-xs text-muted-foreground font-medium">Minha Conta</span>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
