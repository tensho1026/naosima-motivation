import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ExtraResourcePanel } from '#/components/ui/ExtraResourcePanel'
import {
  Badge,
  Card,
  EmptyState,
  Field,
  LoadingPage,
  Page,
  ProgressBar,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import {
  completeCondition,
  createCondition,
  createRoadmapItem,
  deleteCondition,
  deleteRoadmapItem,
} from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/journey')({
  loader: () => getDashboard(),
  component: JourneyPage,
  pendingComponent: LoadingPage,
})

const categoryOptions = [
  'MONEY',
  'WORK',
  'SKILL',
  'LIFESTYLE',
  'NAOSHIMA',
  'CONNECTION',
] as const

function JourneyPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const addCondition = useServerFn(createCondition)
  const toggleCondition = useServerFn(completeCondition)
  const removeCondition = useServerFn(deleteCondition)
  const addRoadmap = useServerFn(createRoadmapItem)
  const removeRoadmap = useServerFn(deleteRoadmapItem)
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

  async function submitCondition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      await addCondition({
        data: {
          title: String(form.get('title')),
          description: String(form.get('description') || '') || null,
          category: String(
            form.get('category'),
          ) as (typeof categoryOptions)[number],
          required: form.get('required') === 'on',
          weight: Number(form.get('weight')),
          targetValue: form.get('targetValue')
            ? Number(form.get('targetValue'))
            : null,
          currentValue: form.get('currentValue')
            ? Number(form.get('currentValue'))
            : null,
          unit: String(form.get('unit') || '') || null,
        },
      })
      event.currentTarget.reset()
      notify('移住条件を追加しました')
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

  async function submitRoadmap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      await addRoadmap({
        data: {
          title: String(form.get('title')),
          description: String(form.get('description') || '') || null,
          targetDate: String(form.get('targetDate')),
          status: 'NOT_STARTED',
          category: String(
            form.get('category'),
          ) as (typeof categoryOptions)[number],
          sortOrder: data.roadmap.length,
        },
      })
      event.currentTarget.reset()
      notify('ロードマップに追加しました')
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

  const extras = data.extras
  return (
    <Page
      title="Journey"
      eyebrow="PATH TO NAOSHIMA"
      description="必要条件と人生の節目をつなぎ、現在地から移住までのルートを見通します。"
    >
      <section className="stats-grid page-stats">
        <div className="stat stat-sea">
          <span>仮想距離</span>
          <strong>
            {Math.round(data.journey.progressKm)} / {data.journey.totalDistance}{' '}
            km
          </strong>
          <ProgressBar value={data.journey.progressPercent} />
        </div>
        <div className="stat stat-green">
          <span>Ready判定</span>
          <strong>{data.readyStatus.replaceAll('_', ' ')}</strong>
          <small>必須条件だけで判定</small>
        </div>
        <div className="stat stat-gold">
          <span>積み上げた日数</span>
          <strong>{data.journeyDays}日</strong>
          <small>Journey started</small>
        </div>
        <div className="stat stat-coral">
          <span>累計投資</span>
          <strong>
            {Math.round(data.investments.timeInvestmentMinutes / 60)}h
          </strong>
          <small>{data.investments.moneyInvestment.toLocaleString()}円</small>
        </div>
      </section>

      <section className="content-grid journey-core">
        <Card title="移住条件" eyebrow="READINESS CONDITIONS">
          <form className="stack-form" onSubmit={submitCondition}>
            <Field label="条件">
              <input
                name="title"
                required
                maxLength={120}
                placeholder="例: フルリモート勤務"
              />
            </Field>
            <Field label="カテゴリ">
              <select name="category">
                {categoryOptions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="説明">
              <textarea name="description" rows={2} />
            </Field>
            <Field label="重み">
              <input
                name="weight"
                type="number"
                min="1"
                max="100"
                defaultValue="1"
                required
              />
            </Field>
            <Field label="現在値">
              <input name="currentValue" type="number" step="any" />
            </Field>
            <Field label="目標値">
              <input name="targetValue" type="number" step="any" />
            </Field>
            <Field label="単位">
              <input name="unit" placeholder="円 / Level / 日" />
            </Field>
            <label className="check-field">
              <input name="required" type="checkbox" defaultChecked />
              必須条件
            </label>
            <div className="form-actions">
              <SubmitButton pending={pending}>条件を追加</SubmitButton>
            </div>
          </form>
          <div className="item-list">
            {data.conditions.map((condition) => (
              <article className="list-row" key={condition.id}>
                <button
                  className={`condition-check ${condition.completed ? 'done' : ''}`}
                  onClick={() =>
                    mutate(
                      () => toggleCondition({ data: { id: condition.id } }),
                      '条件を更新しました',
                    )
                  }
                  aria-label="達成状態を切り替え"
                >
                  {condition.completed ? <Check size={15} /> : null}
                </button>
                <div>
                  <strong>{condition.title}</strong>
                  <p>
                    {condition.category} · weight {condition.weight}
                    {condition.targetValue
                      ? ` · ${condition.currentValue ?? 0}/${condition.targetValue}${condition.unit ?? ''}`
                      : ''}
                  </p>
                </div>
                <Badge tone={condition.required ? 'coral' : 'sea'}>
                  {condition.required ? '必須' : '任意'}
                </Badge>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('削除しますか？') &&
                    mutate(
                      () => removeCondition({ data: { id: condition.id } }),
                      '条件を削除しました',
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </Card>

        <Card title="移住ロードマップ" eyebrow="RPG ROADMAP">
          <form className="stack-form" onSubmit={submitRoadmap}>
            <Field label="節目">
              <input name="title" required />
            </Field>
            <Field label="目標日">
              <input name="targetDate" type="date" required />
            </Field>
            <Field label="カテゴリ">
              <select name="category">
                {categoryOptions.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>節目を追加</SubmitButton>
            </div>
          </form>
          {data.roadmap.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="roadmap-list">
              {data.roadmap.map((item, index) => (
                <article key={item.id} className="roadmap-node">
                  <span>{index + 1}</span>
                  <div>
                    <Badge tone={item.status === 'COMPLETED' ? 'green' : 'sea'}>
                      {item.status}
                    </Badge>
                    <h3>{item.title}</h3>
                    <p>
                      {item.targetDate} · {item.category}
                    </p>
                  </div>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('削除しますか？') &&
                      mutate(
                        () => removeRoadmap({ data: { id: item.id } }),
                        '節目を削除しました',
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

      <section className="content-grid extra-grid">
        <ExtraResourcePanel
          resource="milestoneEvents"
          title="Milestone Timeline"
          description="達成した大きなイベントだけを一本の履歴に。"
          rows={extras.milestoneEvents ?? []}
          fields={[
            { name: 'title', label: 'マイルストーン', required: true },
            { name: 'date', label: '日付', type: 'date', required: true },
            {
              name: 'category',
              label: 'カテゴリ',
              type: 'select',
              options: categoryOptions.map((value) => ({
                label: value,
                value,
              })),
            },
            { name: 'description', label: '説明', type: 'textarea' },
            { name: 'automatic', label: '自動記録', type: 'checkbox' },
          ]}
        />
        <ExtraResourcePanel
          resource="originStories"
          title="原点"
          description="初めて直島に行った日と、移住を決めた理由。"
          rows={extras.originStories ?? []}
          fields={[
            { name: 'title', label: 'タイトル', required: true },
            { name: 'firstVisitDate', label: '初訪問日', type: 'date' },
            { name: 'decidedAt', label: '決意した日', type: 'date' },
            {
              name: 'story',
              label: '原点の物語',
              type: 'textarea',
              required: true,
            },
          ]}
        />
        <ExtraResourcePanel
          resource="seasonGoals"
          title="Season Goal"
          description="3か月単位の重点テーマ。"
          rows={extras.seasonGoals ?? []}
          fields={[
            { name: 'title', label: 'テーマ', required: true },
            {
              name: 'category',
              label: 'カテゴリ',
              type: 'select',
              required: true,
              options: categoryOptions.map((value) => ({
                label: value,
                value,
              })),
            },
            {
              name: 'startDate',
              label: '開始日',
              type: 'date',
              required: true,
            },
            { name: 'endDate', label: '終了日', type: 'date', required: true },
            { name: 'completed', label: '達成済み', type: 'checkbox' },
          ]}
        />
        <ExtraResourcePanel
          resource="focusSettings"
          title="Focus Mode"
          description="今の重点カテゴリをDashboardでも強調。"
          rows={extras.focusSettings ?? []}
          fields={[
            {
              name: 'category',
              label: '重点カテゴリ',
              type: 'select',
              required: true,
              options: categoryOptions.map((value) => ({
                label: value,
                value,
              })),
            },
            { name: 'note', label: '意図', type: 'textarea' },
            {
              name: 'startDate',
              label: '開始日',
              type: 'date',
              required: true,
            },
            { name: 'endDate', label: '終了日', type: 'date', required: true },
          ]}
        />
        <ExtraResourcePanel
          resource="anniversaries"
          title="移住記念日"
          rows={extras.anniversaries ?? []}
          fields={[
            { name: 'title', label: '記念日', required: true },
            { name: 'date', label: '日付', type: 'date', required: true },
            { name: 'description', label: '説明', type: 'textarea' },
          ]}
        />
        <ExtraResourcePanel
          resource="decisionLogs"
          title="Decision Log"
          description="方針がブレたときに戻れる、大きな決断の記録。"
          rows={extras.decisionLogs ?? []}
          fields={[
            { name: 'title', label: '決断', required: true },
            {
              name: 'decidedAt',
              label: '決断日',
              type: 'date',
              required: true,
            },
            { name: 'reason', label: '理由', type: 'textarea', required: true },
          ]}
        />
        <ExtraResourcePanel
          resource="antiGoals"
          title="捨てる目標"
          description="移住のために、あえてやらないこと。"
          rows={extras.antiGoals ?? []}
          fields={[
            { name: 'title', label: 'やらないこと', required: true },
            { name: 'reason', label: '理由', type: 'textarea' },
            {
              name: 'active',
              label: '有効',
              type: 'checkbox',
              defaultValue: true,
            },
          ]}
        />
        <ExtraResourcePanel
          resource="timeInvestmentLogs"
          title="時間投資ログ"
          rows={extras.timeInvestmentLogs ?? []}
          fields={[
            {
              name: 'category',
              label: 'カテゴリ',
              type: 'select',
              required: true,
              options: categoryOptions.map((value) => ({
                label: value,
                value,
              })),
            },
            {
              name: 'minutes',
              label: '時間（分）',
              type: 'number',
              min: 1,
              required: true,
            },
            { name: 'date', label: '日付', type: 'date', required: true },
            { name: 'note', label: '内容', type: 'textarea' },
          ]}
        />
        <ExtraResourcePanel
          resource="moneyInvestmentLogs"
          title="移住への累計投資"
          description="旅行・勉強・機材など、貯金とは別の本気度。"
          rows={extras.moneyInvestmentLogs ?? []}
          fields={[
            {
              name: 'category',
              label: 'カテゴリ',
              type: 'select',
              required: true,
              options: categoryOptions.map((value) => ({
                label: value,
                value,
              })),
            },
            {
              name: 'amount',
              label: '金額',
              type: 'number',
              min: 1,
              required: true,
            },
            { name: 'date', label: '日付', type: 'date', required: true },
            { name: 'note', label: '内容', type: 'textarea', required: true },
          ]}
        />
      </section>
    </Page>
  )
}
