import { useServerFn } from '@tanstack/react-start'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Flame,
  Footprints,
  HeartPulse,
  MapPin,
  MoonStar,
  Sparkles,
  SunMedium,
  Waves,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import {
  Card,
  LoadingPage,
  ProgressBar,
  Stat,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import { completeMission } from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'
import { calculateSavingForecast } from '#/services/finance.service'
import { haversineDistanceKm } from '#/services/journey.service'

export const Route = createFileRoute('/')({
  loader: () => getDashboard(),
  component: DashboardPage,
  pendingComponent: LoadingPage,
  errorComponent: ({ error }) => (
    <main className="app-page">
      <Card title="Dashboardを読み込めませんでした">
        <p>{error.message}</p>
        <p>Cloudflare D1のmigrationとseedが適用済みか確認してください。</p>
      </Card>
    </main>
  ),
})

const categoryLabels: Record<string, string> = {
  MONEY: 'Money',
  WORK: 'Work',
  SKILL: 'Skills',
  LIFESTYLE: 'Lifestyle',
  NAOSHIMA: 'Naoshima',
  CONNECTION: 'Connection',
}

function yen(value: number) {
  return `${Math.round(value).toLocaleString('ja-JP')}円`
}

function DashboardPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const complete = useServerFn(completeMission)
  const [emergency, setEmergency] = useState(false)
  const [extraSaving, setExtraSaving] = useState(20_000)
  const [distance, setDistance] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const radar = Object.entries(data.readiness.categories).map(
    ([key, value]) => ({
      category: categoryLabels[key] ?? key,
      value,
    }),
  )
  const whatIf = useMemo(() => {
    if (!data.finance) return null
    return calculateSavingForecast({
      currentSavings: data.finance.currentSavings,
      targetSavings: data.finance.targetSavings,
      fallbackMonthlySaving: data.finance.monthlySavingTarget + extraSaving,
    })
  }, [data.finance, extraSaving])

  async function finishTodayStep() {
    if (!data.todayStep) return
    try {
      await complete({ data: { id: data.todayStep.id } })
      notify(`「${data.todayStep.title}」を達成。+${data.todayStep.xp} XP`)
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '完了に失敗しました',
        'error',
      )
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      notify('この端末では現在地を取得できません', 'error')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDistance(
          haversineDistanceKm({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        )
        setLocating(false)
      },
      () => {
        notify('現在地の利用が許可されませんでした', 'error')
        setLocating(false)
      },
    )
  }

  return (
    <main className="app-page dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">THE JOURNEY CONTINUES</p>
          <h1>
            直島まで、あと{' '}
            <strong>{data.countdown.days.toLocaleString('ja-JP')}</strong> 日
          </h1>
          <p>
            積み重ねた {data.journeyDays} 日。あと {data.summersUntil}{' '}
            回の夏が来たら、島で暮らす。
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              onClick={finishTodayStep}
              disabled={!data.todayStep}
            >
              <Footprints size={17} />
              今日の一歩を完了
            </button>
            <button className="button ghost" onClick={() => setEmergency(true)}>
              <HeartPulse size={17} />
              やる気がない
            </button>
          </div>
        </div>
        <div className="hero-readiness">
          <span>総合移住準備度</span>
          <strong>
            {Math.round(data.readiness.overall)}
            <small>%</small>
          </strong>
          <span
            className={`ready-status status-${data.readyStatus.toLowerCase().replaceAll('_', '-')}`}
          >
            {data.readyStatus.replaceAll('_', ' ')}
          </span>
        </div>
      </section>

      <section className="stats-grid dashboard-stats">
        <Stat
          label="移住資金"
          value={yen(data.finance?.currentSavings ?? 0)}
          detail={`目標 ${yen(data.finance?.targetSavings ?? 0)}`}
          tone="green"
        />
        <Stat
          label="Life XP"
          value={`${data.totalXp.toLocaleString()} XP`}
          detail={`Lv.${data.xpLevel.level} ${data.xpLevel.title}`}
          tone="gold"
        />
        <Stat
          label="仮想ジャーニー"
          value={`${Math.round(data.journey.progressKm)} km`}
          detail={`残り ${Math.round(data.journey.remainingKm)} km`}
          tone="sea"
        />
        <Stat
          label="No Zero Week"
          value={data.noZeroWeek.achieved ? '達成中' : 'あと一歩'}
          detail={`今週 ${data.noZeroWeek.actionCount} actions · ${data.streak}日 streak`}
          tone="coral"
        />
      </section>

      <section className="dashboard-grid">
        <Card
          title="今日の一歩"
          eyebrow="ONE STEP TODAY"
          className="wide today-card"
        >
          {data.todayStep ? (
            <div className="today-step">
              <div className="impact-orb">{data.todayStep.impactScore}</div>
              <div>
                <span>{data.todayStep.category} · IMPACT</span>
                <h3>{data.todayStep.title}</h3>
                <p>
                  {data.todayStep.description ??
                    'この一歩が直島との距離を縮めます。'}
                </p>
              </div>
              <button className="button primary" onClick={finishTodayStep}>
                <CheckCircle2 size={17} />
                完了
              </button>
            </div>
          ) : (
            <p>今日のMissionはすべて完了しました。よく進みました。</p>
          )}
        </Card>

        <Card title="島時間" eyebrow="NAOSHIMA NOW">
          <div className="sun-times">
            <div>
              <SunMedium />
              <span>日の出</span>
              <strong>{data.sun.sunrise}</strong>
            </div>
            <div>
              <MoonStar />
              <span>日の入り</span>
              <strong>{data.sun.sunset}</strong>
            </div>
          </div>
          <button
            className="button ghost distance-button"
            onClick={locate}
            disabled={locating}
          >
            <MapPin size={16} />
            {distance == null
              ? locating
                ? '計測中…'
                : '現在地からの距離を測る'
              : `直島まで約 ${Math.round(distance)} km`}
          </button>
        </Card>

        <Card title="準備バランス" eyebrow="READINESS RADAR">
          <div className="chart-sm">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="68%">
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: 'currentColor' }}
                />
                <Radar
                  dataKey="value"
                  stroke="#328f97"
                  fill="#4fb8b2"
                  fillOpacity={0.38}
                />
                <Tooltip
                  formatter={(value) => `${Math.round(Number(value))}%`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="6つの移住条件" eyebrow="WHAT IS MISSING" className="wide">
          {Object.entries(data.readiness.categories).map(([key, value]) => (
            <ProgressBar
              key={key}
              label={categoryLabels[key] ?? key}
              value={value}
            />
          ))}
          <Link to="/journey" className="text-link">
            条件を詳しく見る <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="逆算カレンダー" eyebrow="BACKCASTING">
          <ol className="backcast-list">
            <li>
              <span>今年</span>
              {data.reverseCalendar.year}
            </li>
            <li>
              <span>今月</span>
              {data.reverseCalendar.month}
            </li>
            <li>
              <span>今週</span>
              {data.reverseCalendar.week}
            </li>
          </ol>
        </Card>

        <Card title="資金ペース" eyebrow="FORECAST">
          <div className="forecast-date">
            <CalendarClock />
            <strong>{data.forecast?.projectedDate ?? '予測待ち'}</strong>
            <span>達成予測</span>
          </div>
          <p className="pace-label">{data.pace.status}</p>
          <label className="what-if">
            What if: 毎月さらに <strong>{yen(extraSaving)}</strong>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={extraSaving}
              onChange={(event) => setExtraSaving(Number(event.target.value))}
            />
          </label>
          <p>
            すると <strong>{whatIf?.projectedDate ?? '—'}</strong> ごろ達成
          </p>
        </Card>

        <Card title="働く自由度" eyebrow="WORK FREEDOM">
          <div
            className="score-ring"
            style={
              {
                '--score': `${data.workMetrics.freedomScore}%`,
              } as React.CSSProperties
            }
          >
            <strong>{Math.round(data.workMetrics.freedomScore)}</strong>
            <small>/ 100</small>
          </div>
          <ProgressBar
            compact
            label="個人収入比率"
            value={data.workMetrics.independentIncomeRatio}
          />
          <p>
            資金ランウェイ {data.workMetrics.runwayMonths?.toFixed(1) ?? '—'}
            か月
          </p>
        </Card>

        <Card
          title="年間アクティビティ"
          eyebrow="NO PRESSURE HEATMAP"
          className="wide"
        >
          <div className="heatmap" aria-label="年間行動ヒートマップ">
            {data.heatmap.map((day) => (
              <span
                key={day.date}
                title={`${day.date}: ${day.count}`}
                data-level={Math.min(day.count, 4)}
              />
            ))}
          </div>
          <div className="heatmap-caption">
            <span>
              <Flame size={14} />
              累計 {data.actions.length} actions
            </span>
            <span>濃いほど一歩を重ねた日</span>
          </div>
        </Card>

        <Card title="直島にいた時間" eyebrow="ISLAND TIME">
          <div className="island-time">
            <strong>{data.visitStats.totalHours.toLocaleString()}</strong>
            <span>hours</span>
          </div>
          <p>
            {data.visitStats.visits}回訪問 · {data.visitStats.totalDays}日滞在 ·
            最長{data.visitStats.longestStayDays}日
          </p>
          <Link to="/memories" className="text-link">
            思い出を開く <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="直島からの一枚" eyebrow="RANDOM NAOSHIMA">
          {data.randomNaoshima?.kind === 'PHOTO' &&
          'imageUrl' in data.randomNaoshima.value ? (
            <img
              className="random-photo"
              src={String(data.randomNaoshima.value.imageUrl)}
              alt={String(data.randomNaoshima.value.caption ?? '直島の写真')}
            />
          ) : (
            <div className="quote-card">
              <Waves />
              <p>
                {data.reasons[0]?.content ??
                  '仕事が終わったあとに、海を歩ける生活へ。'}
              </p>
            </div>
          )}
        </Card>
      </section>

      {emergency ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Motivation Emergency"
        >
          <section className="emergency-modal">
            <button
              className="modal-close"
              aria-label="閉じる"
              onClick={() => setEmergency(false)}
            >
              <X />
            </button>
            <p className="eyebrow">MOTIVATION EMERGENCY</p>
            <h2>今日は、5分だけでいい。</h2>
            {data.photos.find((photo) => photo.favorite) ? (
              <img
                src={data.photos.find((photo) => photo.favorite)?.imageUrl}
                alt="お気に入りの直島"
              />
            ) : null}
            <blockquote>
              {data.reasons[0]?.content ??
                '直島で暮らしたいと思った、その原点を忘れない。'}
            </blockquote>
            <div className="emergency-stats">
              <span>
                <Sparkles />
                {data.totalXp} XP
              </span>
              <span>
                <CheckCircle2 />
                {
                  data.missions.filter((mission) => mission.completed).length
                }{' '}
                Missions
              </span>
            </div>
            {data.minimumMission ? (
              <button
                className="button primary"
                onClick={() => {
                  setEmergency(false)
                  finishTodayStep()
                }}
              >
                <Footprints />
                {data.minimumMission.minimumTitle ?? data.minimumMission.title}
                （{data.minimumMission.minimumMinutes ?? 5}分）
              </button>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  )
}
