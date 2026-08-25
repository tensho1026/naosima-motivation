import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PiggyBank, Trash2, TrendingUp, WalletCards } from 'lucide-react'
import { differenceInCalendarMonths } from 'date-fns'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  Field,
  LoadingPage,
  Page,
  ProgressBar,
  Stat,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import {
  createSavingTransaction,
  deleteSavingTransaction,
  saveLifeSimulation,
  saveMigrationScenario,
  updateFinanceSettings,
} from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'
import { monthlySavingHistory } from '#/services/finance.service'

export const Route = createFileRoute('/finance')({
  loader: () => getDashboard(),
  component: FinancePage,
  pendingComponent: LoadingPage,
})
const yen = (value: number) => `${Math.round(value).toLocaleString('ja-JP')}円`

function FinancePage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const sliderMin = Math.max(new Date().getFullYear() + 1, 2027)
  const sliderMax = Math.max(sliderMin + 5, 2032)
  const configuredYear = Number(
    data.settings?.migrationTargetDate?.slice(0, 4) ?? sliderMin,
  )
  const [moveYear, setMoveYear] = useState(
    Math.min(Math.max(configuredYear, sliderMin), sliderMax),
  )
  const updateSettings = useServerFn(updateFinanceSettings)
  const addSaving = useServerFn(createSavingTransaction)
  const removeSaving = useServerFn(deleteSavingTransaction)
  const addLife = useServerFn(saveLifeSimulation)
  const addScenario = useServerFn(saveMigrationScenario)
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
  const savingPercent = data.finance
    ? (data.finance.currentSavings / data.finance.targetSavings) * 100
    : 0
  const chartData = monthlySavingHistory(data.savings).map((row) => ({
    date: row.month,
    amount: row.amount,
  }))
  const scenarioChart = data.scenarios.map((scenario) => ({
    name: scenario.name,
    income: scenario.monthlyIncome,
    expenses: scenario.monthlyExpenses,
    saving: scenario.monthlySaving,
  }))
  const sliderTargetDate = `${moveYear}-04-01`
  const sliderMonths = Math.max(
    differenceInCalendarMonths(
      new Date(`${sliderTargetDate}T00:00:00`),
      new Date(),
    ),
    1,
  )
  const sliderRequiredMonthly = Math.ceil(
    Math.max(
      (data.finance?.targetSavings ?? 0) - (data.finance?.currentSavings ?? 0),
      0,
    ) / sliderMonths,
  )
  return (
    <Page
      title="資金"
      eyebrow="未来のためのお金"
      description="移住資金・生活費・達成予測を同じ場所で比較し、最短移住日を現実的に更新します。"
    >
      <section className="stats-grid page-stats">
        <Stat
          label="現在の移住資金"
          value={yen(data.finance?.currentSavings ?? 0)}
          detail={`目標まで ${yen(Math.max((data.finance?.targetSavings ?? 0) - (data.finance?.currentSavings ?? 0), 0))}`}
          tone="green"
        />
        <Stat
          label="達成予測"
          value={data.forecast?.projectedDate ?? '予測待ち'}
          detail={data.pace.status}
          tone="sea"
        />
        <Stat
          label="自由資金"
          value={`${data.workMetrics.runwayMonths?.toFixed(1) ?? '—'}か月`}
          detail="現在の資金で生活可能"
          tone="gold"
        />
        <Stat
          label="直島1日コスト"
          value={
            data.workMetrics.dailyLivingCost
              ? yen(data.workMetrics.dailyLivingCost)
              : '—'
          }
          detail="シミュレーションから算出"
          tone="coral"
        />
      </section>
      <section className="content-grid">
        <Card title="移住資金ゲージ" eyebrow="貯金">
          <ProgressBar
            value={savingPercent}
            label={`${yen(data.finance?.currentSavings ?? 0)} / ${yen(data.finance?.targetSavings ?? 0)}`}
          />
          <form
            className="stack-form finance-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  updateSettings({
                    data: {
                      currentSavings: Number(values.get('currentSavings')),
                      targetSavings: Number(values.get('targetSavings')),
                      monthlySavingTarget: Number(
                        values.get('monthlySavingTarget'),
                      ),
                    },
                  }),
                '資金設定を更新しました',
              )
            }}
          >
            <Field label="現在額">
              <input
                name="currentSavings"
                type="number"
                min="0"
                defaultValue={data.finance?.currentSavings ?? 0}
                required
              />
            </Field>
            <Field label="目標額">
              <input
                name="targetSavings"
                type="number"
                min="1"
                defaultValue={data.finance?.targetSavings ?? 2000000}
                required
              />
            </Field>
            <Field label="毎月の目標">
              <input
                name="monthlySavingTarget"
                type="number"
                min="0"
                defaultValue={data.finance?.monthlySavingTarget ?? 50000}
                required
              />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>設定を更新</SubmitButton>
            </div>
          </form>
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addSaving({
                    data: {
                      amount: Number(values.get('amount')),
                      type: String(values.get('type')) as
                        'DEPOSIT' | 'WITHDRAWAL',
                      note: String(values.get('note') || '') || null,
                      date: String(values.get('date')),
                    },
                  }),
                '貯金記録を追加しました',
                form,
              )
            }}
          >
            <Field label="金額">
              <input name="amount" type="number" min="1" required />
            </Field>
            <Field label="種類">
              <select name="type">
                <option value="DEPOSIT">追加</option>
                <option value="WITHDRAWAL">減額</option>
              </select>
            </Field>
            <Field label="日付">
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field label="メモ">
              <input name="note" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>記録する</SubmitButton>
            </div>
          </form>
          <div className="item-list">
            {data.savings.slice(0, 10).map((row) => (
              <article className="list-row" key={row.id}>
                <div>
                  <strong
                    className={
                      row.type === 'DEPOSIT' ? 'money-plus' : 'money-minus'
                    }
                  >
                    {row.type === 'DEPOSIT' ? '+' : '-'}
                    {yen(row.amount)}
                  </strong>
                  <p>
                    {row.date} · {row.note ?? 'メモなし'}
                  </p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('削除して残高を戻しますか？') &&
                    run(
                      () => removeSaving({ data: { id: row.id } }),
                      '記録を削除しました',
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </Card>
        <Card title="毎月の貯金記録" eyebrow="貯金履歴">
          <div className="chart-md">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => yen(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#328f97"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
      <section className="content-grid">
        <Card title="未来の生活シミュレーター" eyebrow="毎月の暮らし">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              const n = (name: string) => Number(values.get(name))
              run(
                () =>
                  addLife({
                    data: {
                      name: String(values.get('name')),
                      salary: n('salary'),
                      sideIncome: n('sideIncome'),
                      rent: n('rent'),
                      food: n('food'),
                      utilities: n('utilities'),
                      internet: n('internet'),
                      transport: n('transport'),
                      entertainment: n('entertainment'),
                      other: n('other'),
                      plannedSaving: n('plannedSaving'),
                    },
                  }),
                '生活プランを保存しました',
                form,
              )
            }}
          >
            <Field label="プラン名">
              <input name="name" defaultValue="直島生活" required />
            </Field>
            {[
              ['salary', '月収'],
              ['sideIncome', '副収入'],
              ['rent', '家賃'],
              ['food', '食費'],
              ['utilities', '光熱費'],
              ['internet', '通信費'],
              ['transport', 'フェリー・交通'],
              ['entertainment', '娯楽費'],
              ['other', 'その他'],
              ['plannedSaving', '予定貯金'],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <input
                  name={name}
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
              </Field>
            ))}
            <div className="form-actions">
              <SubmitButton pending={pending}>
                シミュレーション保存
              </SubmitButton>
            </div>
          </form>
          {data.lifeSimulations.map((simulation) => (
            <article
              className={`simulation-result ${simulation.result.remaining < 0 ? 'deficit' : ''}`}
              key={simulation.id}
            >
              <WalletCards />
              <div>
                <strong>{simulation.name}</strong>
                <p>
                  収入 {yen(simulation.result.income)} − 支出{' '}
                  {yen(simulation.result.expenses)}
                </p>
                <p>
                  想定貯金 {yen(simulation.result.plannedSaving)} ·{' '}
                  {simulation.result.buffer >= 0 ? '余裕' : '不足'}{' '}
                  {yen(Math.abs(simulation.result.buffer))}
                </p>
              </div>
              <strong>
                {simulation.result.remaining < 0 ? '赤字 ' : '残り '}
                {yen(Math.abs(simulation.result.remaining))}
              </strong>
            </article>
          ))}
        </Card>
        <Card title="移住シナリオ比較" eyebrow="複数案を比較">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              const n = (name: string) => Number(values.get(name))
              run(
                () =>
                  addScenario({
                    data: {
                      name: String(values.get('name')),
                      description:
                        String(values.get('description') || '') || null,
                      monthlyIncome: n('monthlyIncome'),
                      monthlyExpenses: n('monthlyExpenses'),
                      monthlySaving: n('monthlySaving'),
                      currentSavings: data.finance?.currentSavings ?? 0,
                      targetSavings: data.finance?.targetSavings ?? 2000000,
                    },
                  }),
                'シナリオを保存しました',
                form,
              )
            }}
          >
            <Field label="シナリオ">
              <input name="name" placeholder="会社員のまま移住" required />
            </Field>
            <Field label="月収">
              <input name="monthlyIncome" type="number" min="0" required />
            </Field>
            <Field label="生活費">
              <input name="monthlyExpenses" type="number" min="0" required />
            </Field>
            <Field label="毎月貯金">
              <input name="monthlySaving" type="number" min="0" required />
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>比較に追加</SubmitButton>
            </div>
          </form>
          <div className="chart-md">
            <ResponsiveContainer>
              <BarChart data={scenarioChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => yen(Number(value))} />
                <Legend />
                <Bar dataKey="income" name="収入" fill="#4fb8b2" />
                <Bar dataKey="expenses" name="支出" fill="#ef735d" />
                <Bar dataKey="saving" name="貯金" fill="#d49b35" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="scenario-list">
            {data.scenarios.map((scenario) => (
              <article key={scenario.id}>
                <TrendingUp />
                <div>
                  <strong>{scenario.name}</strong>
                  <p>
                    最短 {scenario.forecast.projectedDate ?? '予測不可'} · cash
                    flow {yen(scenario.cashFlow)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </section>
      <section className="content-grid extra-grid">
        <ExtraResourcePanel
          resource="fixedCostReductions"
          title="固定費削減ログ"
          description={`年間 ${yen(data.workMetrics.fixedCostAnnualReduction)} 削減`}
          rows={data.extras.fixedCostReductions ?? []}
          fields={[
            { name: 'title', label: '削減したもの', required: true },
            {
              name: 'monthlyAmount',
              label: '月額',
              type: 'number',
              min: 1,
              required: true,
            },
            {
              name: 'effectiveDate',
              label: '開始日',
              type: 'date',
              required: true,
            },
            { name: 'note', label: 'メモ', type: 'textarea' },
          ]}
        />
        <Card
          title="もしもの試算 / 移住日スライダー"
          eyebrow="日付を動かして試算"
        >
          <div className="what-if-large">
            <PiggyBank />
            <label htmlFor="move-year">
              仮の移住年 <strong>{moveYear}年</strong>
            </label>
            <input
              id="move-year"
              type="range"
              min={sliderMin}
              max={sliderMax}
              step="1"
              value={moveYear}
              onChange={(event) => setMoveYear(Number(event.target.value))}
            />
            <strong>
              {sliderTargetDate}まで毎月 {yen(sliderRequiredMonthly)}
            </strong>
            <p>
              残り{sliderMonths}
              か月で資金目標を達成する試算です。保存済みの目標日は変更しません。
            </p>
          </div>
        </Card>
      </section>
    </Page>
  )
}
