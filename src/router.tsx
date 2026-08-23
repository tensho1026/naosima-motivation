import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { Card, LoadingPage } from './components/ui/Primitives'
import { routeTree } from './routeTree.gen'

function RouterError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="app-page">
      <Card title="読み込みに失敗しました" eyebrow="SOMETHING WENT WRONG">
        <p>{error.message}</p>
        <button className="button primary" onClick={reset}>
          もう一度読み込む
        </button>
      </Card>
    </main>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: LoadingPage,
    defaultErrorComponent: RouterError,
    defaultNotFoundComponent: () => (
      <main className="app-page">
        <Card title="ページが見つかりません">
          <a href="/">Dashboardへ戻る</a>
        </Card>
      </main>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
