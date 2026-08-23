import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Footprints, Waves } from 'lucide-react'

import { LoadingPage, ProgressBar } from '#/components/ui/Primitives'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/widget')({
  loader: () => getDashboard(),
  component: WidgetPage,
  pendingComponent: LoadingPage,
})

function WidgetPage() {
  const data = Route.useLoaderData()
  return (
    <main className="widget-page">
      <Link to="/" className="widget-back">
        <ArrowLeft />
        Dashboard
      </Link>
      <section className="widget-card">
        <Waves className="widget-wave" />
        <p>NAOSHIMA BOUND</p>
        <h1>
          あと <strong>{data.countdown.days.toLocaleString()}</strong> 日
        </h1>
        <ProgressBar
          value={data.readiness.overall}
          label={`今月の準備度 ${Math.round(data.readiness.overall)}%`}
        />
        <div className="widget-step">
          <Footprints />
          <span>今日の一歩</span>
          <strong>{data.todayStep?.title ?? '今日のMissionは完了'}</strong>
        </div>
        <blockquote>
          {data.reasons[0]?.content ?? '今日の一歩を、島で暮らす未来へ。'}
        </blockquote>
      </section>
    </main>
  )
}
