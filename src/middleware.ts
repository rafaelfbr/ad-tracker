import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas públicas (login)
const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Proteger todas as rotas exceto as públicas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Ignorar internos do Next.js e arquivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre executar para rotas de API
    '/(api|trpc)(.*)',
  ],
}
