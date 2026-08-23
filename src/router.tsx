import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { RouterError, RouterNotFound } from './components/RouterFallbacks'
import { LoadingPage } from './components/ui/Primitives'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: LoadingPage,
    defaultErrorComponent: RouterError,
    defaultNotFoundComponent: RouterNotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
