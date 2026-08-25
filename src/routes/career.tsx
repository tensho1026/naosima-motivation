import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Check, Network, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import {
  Badge,
  Card,
  EmptyState,
  Field,
  LoadingPage,
  Page,
  ProgressBar,
  Stat,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import {
  createCareerCondition,
  createIncomeSource,
  createSideIncomeGoal,
  deleteCareerCondition,
  deleteIncomeSource,
  deleteSideIncomeGoal,
  updateCareerCondition,
} from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'
import { incomeTypeLabel } from '#/utils/display'

export const Route = createFileRoute('/career')({
  loader: () => getDashboard(),
  component: CareerPage,
  pendingComponent: LoadingPage,
})
const sourceTypes = [
  'SALARY',
  'FREELANCE',
  'SIDE_JOB',
  'PRODUCT',
  'OTHER',
] as const
const colors = ['#328f97', '#d49b35', '#ef735d', '#2f6a4a', '#8ea9aa']
const yen = (value: number) => `${value.toLocaleString('ja-JP')}円`

function CareerPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const addCondition = useServerFn(createCareerCondition)
  const updateCondition = useServerFn(updateCareerCondition)
  const removeCondition = useServerFn(deleteCareerCondition)
  const addSource = useServerFn(createIncomeSource)
  const removeSource = useServerFn(deleteIncomeSource)
  const addGoal = useServerFn(createSideIncomeGoal)
  const removeGoal = useServerFn(deleteSideIncomeGoal)
  async function run(
    action: () => Promise<unknown>,
    message: string,
    form?: HTMLFormElement,
  ) {
    setPending(true)
    try {
      await action()
      form?.reset()
      notify(message)
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '処理に失敗しました',
        'error',
      )
    } finally {
      setPending(false)
    }
  }
  const pie = data.career.sources
    .filter((item) => item.active && item.monthlyAmount > 0)
    .map((item) => ({ name: item.name, value: item.monthlyAmount }))
  return (
    <Page
      title="仕事"
      eyebrow="島から働く"
      description="どこでも働ける状態を、仕事条件・収入源・副収入への挑戦で具体化します。"
    >
      <section className="stats-grid page-stats">
        <Stat
          label="自由度スコア"
          value={`${Math.round(data.workMetrics.freedomScore)} / 100`}
          detail="場所に縛られない度"
          tone="sea"
        />
        <Stat
          label="会社依存度"
          value={`${Math.round(data.workMetrics.companyDependency)}%`}
          detail="給与以外を増やして下げる"
          tone="coral"
        />
        <Stat
          label="個人収入比率"
          value={`${Math.round(data.workMetrics.independentIncomeRatio)}%`}
          detail={yen(data.workMetrics.independentIncome)}
          tone="gold"
        />
        <Stat
          label="月間総収入"
          value={yen(data.workMetrics.totalIncome)}
          detail="有効な収入源の合計"
          tone="green"
        />
      </section>
      <section className="content-grid">
        <Card title="仕事条件" eyebrow="働き方の条件">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addCondition({
                    data: {
                      title: String(values.get('title')),
                      completed: false,
                      targetValue: values.get('targetValue')
                        ? Number(values.get('targetValue'))
                        : null,
                      currentValue: values.get('currentValue')
                        ? Number(values.get('currentValue'))
                        : null,
                      unit: String(values.get('unit') || '') || null,
                    },
                  }),
                '仕事条件を追加しました',
                form,
              )
            }}
          >
            <Field label="条件">
              <input name="title" placeholder="フルリモート勤務" required />
            </Field>
            <Field label="現在値">
              <input name="currentValue" type="number" step="any" />
            </Field>
            <Field label="目標値">
              <input name="targetValue" type="number" step="any" />
            </Field>
            <Field label="単位">
              <input name="unit" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>条件を追加</SubmitButton>
            </div>
          </form>
          <div className="item-list">
            {data.career.conditions.map((condition) => (
              <article className="list-row" key={condition.id}>
                <button
                  className={`condition-check ${condition.completed ? 'done' : ''}`}
                  onClick={() =>
                    run(
                      () =>
                        updateCondition({
                          data: {
                            id: condition.id,
                            title: condition.title,
                            completed: !condition.completed,
                            targetValue: condition.targetValue,
                            currentValue: condition.currentValue,
                            unit: condition.unit,
                          },
                        }),
                      '達成状態を更新しました',
                    )
                  }
                >
                  {condition.completed ? <Check size={15} /> : null}
                </button>
                <div>
                  <strong>{condition.title}</strong>
                  <p>
                    {condition.targetValue
                      ? `${condition.currentValue ?? 0} / ${condition.targetValue} ${condition.unit ?? ''}`
                      : 'チェック式'}
                  </p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('削除しますか？') &&
                    run(
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
        <Card title="収入源マップ" eyebrow="収入の内訳">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addSource({
                    data: {
                      name: String(values.get('name')),
                      type: String(
                        values.get('type'),
                      ) as (typeof sourceTypes)[number],
                      monthlyAmount: Number(values.get('monthlyAmount')),
                      active: true,
                    },
                  }),
                '収入源を追加しました',
                form,
              )
            }}
          >
            <Field label="収入源">
              <input name="name" placeholder="給与 / 副業" required />
            </Field>
            <Field label="種類">
              <select name="type">
                {sourceTypes.map((value) => (
                  <option key={value} value={value}>
                    {incomeTypeLabel(value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="月額">
              <input name="monthlyAmount" type="number" min="0" required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>収入源を追加</SubmitButton>
            </div>
          </form>
          {pie.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="income-layout">
              <div className="chart-sm">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="48%"
                      outerRadius="75%"
                    >
                      {pie.map((_, index) => (
                        <Cell
                          key={index}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => yen(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="item-list">
                {data.career.sources.map((source) => (
                  <article className="list-row" key={source.id}>
                    <div>
                      <Badge>{incomeTypeLabel(source.type)}</Badge>
                      <strong>{source.name}</strong>
                      <p>{yen(source.monthlyAmount)} / 月</p>
                    </div>
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        window.confirm('削除しますか？') &&
                        run(
                          () => removeSource({ data: { id: source.id } }),
                          '収入源を削除しました',
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
      <section className="content-grid">
        <Card title="副収入チャレンジ" eyebrow="段階的に伸ばす">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addGoal({
                    data: {
                      level: Number(values.get('level')),
                      monthlyAmount: Number(values.get('monthlyAmount')),
                      completed: false,
                    },
                  }),
                '副収入目標を追加しました',
                form,
              )
            }}
          >
            <Field label="段階">
              <input name="level" type="number" min="1" max="100" required />
            </Field>
            <Field label="月額目標">
              <input name="monthlyAmount" type="number" min="0" required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>目標を追加</SubmitButton>
            </div>
          </form>
          <div className="challenge-path">
            {data.career.goals.map((goal) => (
              <article key={goal.id}>
                <span>Lv.{goal.level}</span>
                <div>
                  <strong>{yen(goal.monthlyAmount)} / 月</strong>
                  <ProgressBar
                    compact
                    value={Math.min(
                      (data.workMetrics.independentIncome /
                        Math.max(goal.monthlyAmount, 1)) *
                        100,
                      100,
                    )}
                  />
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('削除しますか？') &&
                    run(
                      () => removeGoal({ data: { id: goal.id } }),
                      '目標を削除しました',
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </Card>
        <Card title="仕事独立度" eyebrow="働き方の自立度">
          <div className="freedom-visual">
            <Network />
            <strong>
              {Math.round(100 - data.workMetrics.companyDependency)}%
            </strong>
            <span>会社以外でも稼げる状態</span>
          </div>
          <ProgressBar
            label="場所自由度"
            value={data.workMetrics.freedomScore}
          />
          <ProgressBar
            label="個人収入比率"
            value={data.workMetrics.independentIncomeRatio}
          />
          <ProgressBar
            label="スキル準備"
            value={data.readiness.categories.SKILL}
          />
          <p className="panel-description">
            リモート勤務・副収入・資金ランウェイ・スキル・固定費を重み付けした、AIを使わない決定論的スコアです。
          </p>
        </Card>
      </section>
    </Page>
  )
}
