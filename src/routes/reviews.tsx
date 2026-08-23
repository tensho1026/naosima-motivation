import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { BookHeart, CalendarCheck, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ExtraResourcePanel } from '#/components/ui/ExtraResourcePanel'
import {
  Card,
  EmptyState,
  Field,
  LoadingPage,
  Page,
  Stat,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import {
  createMonthlyReview,
  getReviewsHub,
  updateMonthlyReview,
} from '#/server/content.functions'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/reviews')({
  loader: async () => {
    const [dashboard, reviews] = await Promise.all([
      getDashboard(),
      getReviewsHub(),
    ])
    return { dashboard, ...reviews }
  },
  component: ReviewsPage,
  pendingComponent: LoadingPage,
})
const currentMonth = () => new Date().toISOString().slice(0, 7)

function ReviewsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const [month, setMonth] = useState(currentMonth())
  const createReview = useServerFn(createMonthlyReview)
  const updateReview = useServerFn(updateMonthlyReview)
  const existing = data.reviews.find((review) => review.month === month)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const payload = {
      month: String(values.get('month')),
      goodThings: String(values.get('goodThings') || ''),
      nextMonth: String(values.get('nextMonth') || ''),
      closerToNaoshima: String(values.get('closerToNaoshima') || ''),
      notes: String(values.get('notes') || ''),
    }
    setPending(true)
    try {
      if (existing)
        await updateReview({ data: { id: existing.id, ...payload } })
      else await createReview({ data: payload })
      notify('月次レビューとスナップショットを保存しました')
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '保存に失敗しました',
        'error',
      )
    } finally {
      setPending(false)
    }
  }
  const previous = data.snapshots.at(-2)
  const latest = data.snapshots.at(-1)
  return (
    <Page
      title="Reviews"
      eyebrow="LOOK BACK, MOVE FORWARD"
      description="月末の言葉と数値を同時に固定し、過去の自分との比較とJourney Replayに使います。"
    >
      <section className="stats-grid page-stats">
        <Stat
          label="今月の準備度"
          value={`${Math.round(data.dashboard.readiness.overall)}%`}
          detail={
            previous
              ? `前回 ${Math.round(previous.readiness)}%`
              : '最初のSnapshotを残そう'
          }
          tone="sea"
        />
        <Stat
          label="現在の貯金"
          value={`${(data.dashboard.finance?.currentSavings ?? 0).toLocaleString()}円`}
          detail={
            previous
              ? `前回 ${(previous.savings ?? 0).toLocaleString()}円`
              : 'Before / After'
          }
          tone="green"
        />
        <Stat
          label="総XP"
          value={data.dashboard.totalXp}
          detail={previous ? `前回 ${previous.totalXp}` : 'Life XP'}
          tone="gold"
        />
        <Stat
          label="レビュー"
          value={`${data.reviews.length}か月`}
          detail="積み重ねた振り返り"
          tone="coral"
        />
      </section>
      <section className="content-grid">
        <Card title="月次レビュー" eyebrow="MONTHLY REVIEW">
          <form
            className="review-form"
            onSubmit={submit}
            key={`${month}-${existing?.id ?? 'new'}`}
          >
            <Field label="対象月">
              <input
                name="month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                required
              />
            </Field>
            <Field label="今月やってよかったこと">
              <textarea
                name="goodThings"
                rows={4}
                defaultValue={existing?.goodThings ?? ''}
              />
            </Field>
            <Field label="直島に近づいたこと">
              <textarea
                name="closerToNaoshima"
                rows={4}
                defaultValue={existing?.closerToNaoshima ?? ''}
              />
            </Field>
            <Field label="来月やること">
              <textarea
                name="nextMonth"
                rows={4}
                defaultValue={existing?.nextMonth ?? ''}
              />
            </Field>
            <Field label="自由メモ">
              <textarea
                name="notes"
                rows={3}
                defaultValue={existing?.notes ?? ''}
              />
            </Field>
            <SubmitButton pending={pending}>
              {existing ? 'レビューを更新' : 'レビューを保存'}
            </SubmitButton>
          </form>
        </Card>
        <Card title="Before / After" eyebrow="MONTHLY SNAPSHOT">
          {latest && previous ? (
            <div className="before-after">
              <div>
                <span>{previous.month}</span>
                <strong>{Math.round(previous.readiness)}%</strong>
                <p>
                  {previous.savings.toLocaleString()}円 · {previous.totalXp} XP
                </p>
              </div>
              <TrendingUp />
              <div>
                <span>{latest.month}</span>
                <strong>{Math.round(latest.readiness)}%</strong>
                <p>
                  {latest.savings.toLocaleString()}円 · {latest.totalXp} XP
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="比較には2回分のレビューが必要です"
              description="レビュー保存時にその月の状態をD1へ固定します。"
            />
          )}
        </Card>
      </section>
      <section className="content-grid">
        <Card
          title="移住Score History / Journey Replay"
          eyebrow="LONG-TERM GROWTH"
          className="wide"
        >
          <div className="chart-md">
            <ResponsiveContainer>
              <LineChart data={data.snapshots}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="readiness"
                  name="準備度"
                  stroke="#328f97"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="completedMissions"
                  name="完了Mission"
                  stroke="#d49b35"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="replay-strip">
            {data.snapshots.map((snapshot) => (
              <article key={snapshot.id}>
                <span>{snapshot.month}</span>
                <strong>{Math.round(snapshot.readiness)}%</strong>
                <small>{snapshot.totalXp} XP</small>
              </article>
            ))}
          </div>
        </Card>
        <Card title="レビュー履歴" eyebrow="PAST MONTHS">
          {data.reviews.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="review-list">
              {data.reviews.map((review) => (
                <article key={review.id}>
                  <CalendarCheck />
                  <div>
                    <strong>{review.month}</strong>
                    <p>
                      {review.closerToNaoshima ||
                        review.goodThings ||
                        '記録済み'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>
      <section className="content-grid extra-grid">
        <ExtraResourcePanel
          resource="migrationJournalEntries"
          title="移住日記"
          description="直島移住に関することだけを残す日記。"
          rows={data.extras.migrationJournalEntries ?? []}
          fields={[
            { name: 'date', label: '日付', type: 'date', required: true },
            { name: 'title', label: 'タイトル', required: true },
            {
              name: 'content',
              label: '本文',
              type: 'textarea',
              required: true,
            },
          ]}
        />
        <ExtraResourcePanel
          resource="moodLogs"
          title="気持ちログ"
          description="今日どれくらい直島に住みたいか、1〜5。"
          rows={data.extras.moodLogs ?? []}
          fields={[
            { name: 'date', label: '日付', type: 'date', required: true },
            {
              name: 'desireLevel',
              label: '住みたい度',
              type: 'number',
              min: 1,
              max: 5,
              required: true,
            },
            { name: 'note', label: '気持ち', type: 'textarea' },
          ]}
        />
        <ExtraResourcePanel
          resource="reasonRevisions"
          title="移住理由の変化履歴"
          rows={data.extras.reasonRevisions ?? []}
          fields={[
            {
              name: 'recordedAt',
              label: '記録日',
              type: 'date',
              required: true,
            },
            {
              name: 'content',
              label: 'その時の理由',
              type: 'textarea',
              required: true,
            },
          ]}
        />
        <Card title="迷ったとき" eyebrow="REMEMBER WHY">
          <div className="doubt-card">
            <BookHeart />
            <blockquote>
              {data.dashboard.reasons[0]?.content ??
                '直島で暮らしたいと思った、その原点へ戻る。'}
            </blockquote>
            <p>
              {data.dashboard.visitStats.visits}回訪れ、{data.dashboard.totalXp}{' '}
              XPを積み、準備度は{Math.round(data.dashboard.readiness.overall)}
              %まで来ました。
            </p>
          </div>
        </Card>
      </section>
    </Page>
  )
}
