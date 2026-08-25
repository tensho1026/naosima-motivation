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
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Badge,
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
import { categoryLabel, readyStatusLabel } from '#/utils/display'

export const Route = createFileRoute('/')({
  loader: () => getDashboard(),
  component: DashboardPage,
  pendingComponent: LoadingPage,
  errorComponent: ({ error }) => (
    <main className="app-page">
      <Card title="ホームを読み込めませんでした">
        <p>{error.message}</p>
        <p>Cloudflare D1のマイグレーションと接続設定を確認してください。</p>
      </Card>
    </main>
  ),
})

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
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0)
  const heroPhotos = useMemo(
    () => [
      ...data.photos.filter((photo) => photo.favorite),
      ...data.photos.filter((photo) => !photo.favorite),
    ],
    [data.photos],
  )
  const heroPhoto = heroPhotos[heroPhotoIndex % Math.max(heroPhotos.length, 1)]
  useEffect(() => {
    if (heroPhotos.length < 2) return
    const timer = window.setInterval(
      () => setHeroPhotoIndex((index) => (index + 1) % heroPhotos.length),
      8_000,
    )
    return () => window.clearInterval(timer)
  }, [heroPhotos.length])
  const radar = Object.entries(data.readiness.categories).map(
    ([key, value]) => ({
      category: categoryLabel(key),
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
  const recentAchievements = useMemo(
    () =>
      [...data.achievements.unlocked]
        .sort(
          (left, right) =>
            right.unlockedAt.getTime() - left.unlockedAt.getTime(),
        )
        .slice(0, 3)
        .map((unlocked) => ({
          ...unlocked,
          definition: data.achievements.definitions.find(
            (definition) => definition.id === unlocked.achievementId,
          ),
        })),
    [data.achievements],
  )

  if (!data.settings) {
    return (
      <main className="app-page">
        <Card title="最初に移住計画を設定しましょう" eyebrow="はじめの設定">
          <p>
            本番データベースにはサンプルデータを投入しません。移住目標日、準備を始める日、仮想移動距離を自分で設定するとホームが表示されます。
          </p>
          <Link to="/settings" className="button primary">
            設定を始める <ArrowRight size={14} />
          </Link>
        </Card>
      </main>
    )
  }

  async function finishMission(mission: {
    id: string
    title: string
    xp: number
  }) {
    try {
      await complete({ data: { id: mission.id } })
      notify(`「${mission.title}」を達成。+${mission.xp} XP`)
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '完了に失敗しました',
        'error',
      )
    }
  }

  async function finishTodayStep() {
    if (data.todayStep) await finishMission(data.todayStep)
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
      <section
        className={`dashboard-hero ${heroPhoto ? 'has-photo' : ''}`}
        style={
          heroPhoto
            ? {
                backgroundImage: `linear-gradient(100deg, rgba(12, 35, 39, .93) 0%, rgba(12, 35, 39, .72) 58%, rgba(12, 35, 39, .42) 100%), url("${heroPhoto.imageUrl.replaceAll('"', '%22')}")`,
              }
            : undefined
        }
      >
        <div>
          <p className="eyebrow">旅は続く</p>
          <h1>
            {data.countdown.reached ? (
              '移住目標日を迎えました'
            ) : (
              <>
                直島まで、あと{' '}
                <strong>{data.countdown.days.toLocaleString('ja-JP')}</strong>{' '}
                日
              </>
            )}
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
            {readyStatusLabel(data.readyStatus)}
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
          label="人生経験値"
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
          label="行動ゼロの週を作らない"
          value={data.noZeroWeek.achieved ? '達成中' : 'あと一歩'}
          detail={`今週 ${data.noZeroWeek.actionCount}件 · ${data.streak}日連続`}
          tone="coral"
        />
      </section>

      <section className="dashboard-grid">
        <Card
          title="今日の一歩"
          eyebrow="今日の一歩"
          className="wide today-card"
        >
          {data.todayStep ? (
            <div className="today-step">
              <div className="impact-orb">{data.todayStep.impactScore}</div>
              <div>
                <span>{categoryLabel(data.todayStep.category)} · 影響度</span>
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
            <p>今日の行動はすべて完了しました。よく進みました。</p>
          )}
        </Card>

        <Card title="直島生活まで、あと" eyebrow="残っていること">
          {data.gaps.length > 0 ? (
            <div className="gap-list">
              {data.gaps.slice(0, 4).map((gap) => (
                <div key={gap.label}>
                  <span>{gap.label}</span>
                  <strong>{gap.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>必須条件はすべて整いました。</p>
          )}
        </Card>

        <Card title="今週の活動" eyebrow="週間の人生経験値">
          <div className="chart-sm weekly-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyActivity}>
                <CartesianGrid vertical={false} opacity={0.16} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip formatter={(value) => `${Number(value)} XP`} />
                <Bar
                  dataKey="xp"
                  name="人生経験値"
                  fill="#4fb8b2"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p>
            今週 +{data.weeklyActivity.reduce((sum, day) => sum + day.xp, 0)}{' '}
            XP。 今週も直島に近づきました。
          </p>
        </Card>

        <Card title="島時間" eyebrow="いまの直島">
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

        <Card title="準備バランス" eyebrow="準備度レーダー">
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

        <Card
          title="6つの移住条件"
          eyebrow="不足していること"
          className="wide"
          action={
            data.activeFocus ? (
              <Badge tone="gold">
                集中: {categoryLabel(String(data.activeFocus.category))}
              </Badge>
            ) : null
          }
        >
          {Object.entries(data.readiness.categories).map(([key, value]) => (
            <div
              key={key}
              className={
                String(data.activeFocus?.category ?? '') === key
                  ? 'focused-progress'
                  : undefined
              }
            >
              <ProgressBar label={categoryLabel(key)} value={value} />
            </div>
          ))}
          <Link to="/journey" className="text-link">
            条件を詳しく見る <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="逆算カレンダー" eyebrow="目標から逆算">
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

        <Card title="資金ペース" eyebrow="達成予測">
          <div className="forecast-date">
            <CalendarClock />
            <strong>{data.forecast?.projectedDate ?? '予測待ち'}</strong>
            <span>達成予測</span>
          </div>
          <p className="pace-label">{data.pace.status}</p>
          <label className="what-if">
            もし毎月さらに <strong>{yen(extraSaving)}</strong> 貯めたら
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

        <Card title="働く自由度" eyebrow="仕事の自由度">
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
          eyebrow="無理なく続けた記録"
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
              累計 {data.actions.length}件
            </span>
            <span>濃いほど一歩を重ねた日</span>
          </div>
        </Card>

        <Card title="直島にいた時間" eyebrow="島で過ごした時間">
          <div className="island-time">
            <strong>{data.visitStats.totalHours.toLocaleString()}</strong>
            <span>時間</span>
          </div>
          <p>
            {data.visitStats.visits}回訪問 · {data.visitStats.totalDays}日滞在 ·
            最長{data.visitStats.longestStayDays}日
          </p>
          <Link to="/memories" className="text-link">
            思い出を開く <ArrowRight size={14} />
          </Link>
        </Card>

        <Card title="行動履歴" eyebrow="最近の一歩">
          {data.actions.length === 0 ? (
            <p>最初の一歩を完了すると、ここに積み重ねが残ります。</p>
          ) : (
            <ol className="action-history">
              {data.actions.slice(0, 8).map((action) => (
                <li key={action.id}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{action.title}</strong>
                    <small>
                      {new Date(action.occurredAt).toLocaleDateString('ja-JP')}
                      {action.amount != null
                        ? ` · ${action.amount > 0 ? '+' : ''}${action.amount}`
                        : ''}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="最近の称号" eyebrow="前進した証し">
          {recentAchievements.length === 0 ? (
            <p>最初の行動を完了すると、ここに称号が残ります。</p>
          ) : (
            <div className="recent-achievements">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id}>
                  <Sparkles />
                  <span>
                    <strong>{achievement.definition?.title ?? '称号'}</strong>
                    <small>
                      {achievement.unlockedAt.toLocaleDateString('ja-JP')}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="ランダム直島" eyebrow="写真・思い出・場所・理由">
          {data.randomNaoshima?.kind === 'PHOTO' &&
          'imageUrl' in data.randomNaoshima.value ? (
            <img
              className="random-photo"
              src={String(data.randomNaoshima.value.imageUrl)}
              alt={String(data.randomNaoshima.value.caption ?? '直島の写真')}
            />
          ) : data.randomNaoshima?.kind === 'MEMORY' ? (
            <div className="quote-card">
              <Waves />
              <strong>{data.randomNaoshima.value.title}</strong>
              <p>{data.randomNaoshima.value.description}</p>
            </div>
          ) : data.randomNaoshima?.kind === 'PLACE' ? (
            <div className="quote-card">
              <MapPin />
              <strong>{String(data.randomNaoshima.value.name)}</strong>
              <p>
                {String(
                  data.randomNaoshima.value.description ?? 'お気に入りの場所',
                )}
              </p>
            </div>
          ) : data.randomNaoshima?.kind === 'MESSAGE' ? (
            <div className="quote-card">
              <Sparkles />
              <strong>{String(data.randomNaoshima.value.type)}</strong>
              <p>{String(data.randomNaoshima.value.content)}</p>
            </div>
          ) : data.randomNaoshima?.kind === 'CARD' ? (
            <div className="quote-card">
              <Sparkles />
              <strong>{data.randomNaoshima.value.title}</strong>
              <p>{data.randomNaoshima.value.content}</p>
            </div>
          ) : (
            <div className="quote-card">
              <Waves />
              <p>
                {data.randomNaoshima?.kind === 'REASON'
                  ? data.randomNaoshima.value.content
                  : (data.reasons[0]?.content ??
                    '仕事が終わったあとに、海を歩ける生活へ。')}
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
          aria-label="やる気が出ないときの応援"
        >
          <section className="emergency-modal">
            <button
              className="modal-close"
              aria-label="閉じる"
              onClick={() => setEmergency(false)}
            >
              <X />
            </button>
            <p className="eyebrow">やる気が出ないとき</p>
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
            {data.extras.originStories?.[0] ? (
              <p className="emergency-origin">
                <strong>
                  {String(data.extras.originStories[0].title ?? '原点')}
                </strong>
                {String(data.extras.originStories[0].story ?? '')}
              </p>
            ) : null}
            {data.actions.at(-1) ? (
              <p className="emergency-first-step">
                最初の記録: {data.actions.at(-1)?.title}
              </p>
            ) : null}
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
                件の行動
              </span>
            </div>
            {data.minimumMission ? (
              <button
                className="button primary"
                onClick={() => {
                  setEmergency(false)
                  const mission = data.minimumMission
                  if (mission) finishMission(mission)
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
