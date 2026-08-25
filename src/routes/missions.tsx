import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, RotateCcw, Star, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'

import {
  Badge,
  Card,
  EmptyState,
  Field,
  LoadingPage,
  Page,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import {
  completeMission,
  createMission,
  deleteMission,
  uncompleteMission,
} from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'
import { categoryLabel } from '#/utils/display'

export const Route = createFileRoute('/missions')({
  loader: () => getDashboard(),
  component: MissionsPage,
  pendingComponent: LoadingPage,
})

const categories = [
  'MONEY',
  'WORK',
  'SKILL',
  'LIFESTYLE',
  'NAOSHIMA',
  'CONNECTION',
] as const
const types = ['DAILY', 'MONTHLY', 'YEARLY'] as const

function MissionsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const add = useServerFn(createMission)
  const finish = useServerFn(completeMission)
  const undo = useServerFn(uncompleteMission)
  const remove = useServerFn(deleteMission)
  const [tab, setTab] = useState<(typeof types)[number]>('DAILY')
  const [pending, setPending] = useState(false)
  async function mutate(action: () => Promise<unknown>, message: string) {
    try {
      await action()
      notify(message)
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '処理に失敗しました',
        'error',
      )
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const type = String(form.get('type')) as (typeof types)[number]
    setPending(true)
    try {
      await add({
        data: {
          title: String(form.get('title')),
          description: String(form.get('description') || '') || null,
          type,
          category: String(form.get('category')) as (typeof categories)[number],
          xp: Number(form.get('xp')),
          impactScore: Number(form.get('impactScore')),
          estimatedMinutes: Number(form.get('estimatedMinutes')),
          minimumTitle: String(form.get('minimumTitle') || '') || null,
          minimumMinutes: form.get('minimumMinutes')
            ? Number(form.get('minimumMinutes'))
            : null,
          weeklyPriority: form.get('weeklyPriority') === 'on',
          skillId: String(form.get('skillId') || '') || null,
          scheduledDate:
            type === 'DAILY' ? String(form.get('scheduledDate')) : null,
          month: type === 'MONTHLY' ? Number(form.get('month')) : null,
          year: type === 'YEARLY' ? Number(form.get('year')) : null,
        },
      })
      event.currentTarget.reset()
      notify('行動を作成しました')
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
  const missions = data.missions.filter((mission) => mission.type === tab)
  return (
    <Page
      title="行動"
      eyebrow="今日が未来をつくる"
      description="行動を完了すると経験値とスキル経験値、行動履歴へ同時に反映されます。"
    >
      <section className="stats-grid page-stats">
        <div className="stat stat-sea">
          <span>今週の行動</span>
          <strong>{data.noZeroWeek.actionCount}</strong>
          <small>
            行動ゼロの週を作らない: {data.noZeroWeek.achieved ? '達成' : '未達'}
          </small>
        </div>
        <div className="stat stat-gold">
          <span>連続行動</span>
          <strong>{data.streak}日</strong>
          <small>プレッシャーは小さく、記録は長く</small>
        </div>
        <div className="stat stat-green">
          <span>完了した行動</span>
          <strong>
            {data.missions.filter((item) => item.completed).length}
          </strong>
          <small>総XP {data.totalXp}</small>
        </div>
        <div className="stat stat-coral">
          <span>今週の最優先</span>
          <strong>{data.todayStep?.impactScore ?? '—'}</strong>
          <small>{data.todayStep?.title ?? '未設定'}</small>
        </div>
      </section>
      <section className="content-grid mission-layout">
        <Card title="行動を作る" eyebrow="新しい一歩">
          <form className="stack-form" onSubmit={submit}>
            <Field label="行動名">
              <input name="title" required maxLength={120} />
            </Field>
            <Field label="種類">
              <select name="type" defaultValue="DAILY">
                {types.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="カテゴリ">
              <select name="category">
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="予定日（毎日）">
              <input
                name="scheduledDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <Field label="月（毎月）">
              <input
                name="month"
                type="number"
                min="1"
                max="12"
                defaultValue={new Date().getMonth() + 1}
              />
            </Field>
            <Field label="年（毎年）">
              <input
                name="year"
                type="number"
                min="2000"
                max="2200"
                defaultValue={new Date().getFullYear()}
              />
            </Field>
            <Field label="XP">
              <input
                name="xp"
                type="number"
                min="0"
                max="10000"
                defaultValue="10"
                required
              />
            </Field>
            <Field label="影響度 1〜5">
              <input
                name="impactScore"
                type="number"
                min="1"
                max="5"
                defaultValue="3"
                required
              />
            </Field>
            <Field label="所要時間（分）">
              <input
                name="estimatedMinutes"
                type="number"
                min="1"
                max="1440"
                defaultValue="30"
                required
              />
            </Field>
            <Field label="紐づくスキル">
              <select name="skillId">
                <option value="">なし</option>
                {data.skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="最低限の行動">
              <input name="minimumTitle" placeholder="5分だけやる内容" />
            </Field>
            <Field label="最小時間">
              <input
                name="minimumMinutes"
                type="number"
                min="1"
                max="60"
                defaultValue="5"
              />
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <label className="check-field">
              <input name="weeklyPriority" type="checkbox" />
              今週の最優先1つ
            </label>
            <div className="form-actions">
              <SubmitButton pending={pending}>行動を追加</SubmitButton>
            </div>
          </form>
        </Card>
        <Card title="行動一覧" eyebrow="毎日・毎月・毎年">
          <div className="tabs">
            {types.map((value) => (
              <button
                key={value}
                className={tab === value ? 'active' : ''}
                onClick={() => setTab(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {missions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mission-list">
              {missions.map((mission) => (
                <article
                  key={mission.id}
                  className={`mission-row ${mission.completed ? 'completed' : ''}`}
                >
                  <button
                    className="mission-check"
                    onClick={() =>
                      mutate(
                        () =>
                          mission.completed
                            ? undo({ data: { id: mission.id } })
                            : finish({ data: { id: mission.id } }),
                        mission.completed
                          ? '行動を未完了に戻しました'
                          : `+${mission.xp} XP`,
                      )
                    }
                  >
                    {mission.completed ? (
                      <RotateCcw size={15} />
                    ) : (
                      <Check size={15} />
                    )}
                  </button>
                  <div className="mission-copy">
                    <div>
                      <Badge>{categoryLabel(mission.category)}</Badge>
                      {mission.weeklyPriority ? (
                        <Badge tone="gold">
                          <Star size={11} /> PRIORITY
                        </Badge>
                      ) : null}
                    </div>
                    <h3>{mission.title}</h3>
                    <p>
                      {mission.estimatedMinutes}分 · XP +{mission.xp} · Impact{' '}
                      {mission.impactScore}/5
                    </p>
                    {mission.minimumTitle ? (
                      <small>
                        最小: {mission.minimumTitle}（
                        {mission.minimumMinutes ?? 5}分）
                      </small>
                    ) : null}
                  </div>
                  <div
                    className="impact-dots"
                    aria-label={`影響度 ${mission.impactScore}`}
                  >
                    {Array.from({ length: 5 }, (_, index) => (
                      <Zap
                        key={index}
                        size={12}
                        className={index < mission.impactScore ? 'on' : ''}
                      />
                    ))}
                  </div>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('行動を削除しますか？') &&
                      mutate(
                        () => remove({ data: { id: mission.id } }),
                        '行動を削除しました',
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>
      <Card
        title="年間アクティビティ"
        eyebrow="行動ヒートマップ"
        className="activity-panel"
      >
        <div className="heatmap">
          {data.heatmap.map((day) => (
            <span
              key={day.date}
              title={`${day.date}: ${day.count}`}
              data-level={Math.min(day.count, 4)}
            />
          ))}
        </div>
      </Card>
    </Page>
  )
}
