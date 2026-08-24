import { Link } from '@tanstack/react-router'

import { Card } from './ui/Primitives'

export function RouterError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="app-page">
      <Card title="読み込みに失敗しました" eyebrow="エラーが発生しました">
        <p>{error.message}</p>
        <button className="button primary" onClick={reset}>
          もう一度読み込む
        </button>
      </Card>
    </main>
  )
}

export function RouterNotFound() {
  return (
    <main className="app-page">
      <Card title="ページが見つかりません">
        <Link to="/" className="button primary">
          ホームへ戻る
        </Link>
      </Card>
    </main>
  )
}
