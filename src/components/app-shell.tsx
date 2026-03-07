"use client"

import Sidebar from "@/components/sidebar"
import { usePathname } from "next/navigation"

// Páginas que NÃO mostram sidebar (ex: login)
const noSidebarRoutes = ["/sign-in"]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !noSidebarRoutes.some((route) => pathname.startsWith(route))

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Conteúdo principal com margem para sidebar */}
      <div className="flex-1 lg:ml-[240px] transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
