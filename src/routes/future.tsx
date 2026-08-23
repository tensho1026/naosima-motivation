import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Trash2,
  X,
} from 'lucide-react'
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
  createBucketItem,
  createFutureDiary,
  createIdealDayItem,
  createReason,
  createTimeCapsuleMedia,
  deleteBucketItem,
  deleteFutureDiary,
  deleteIdealDayItem,
  deleteReason,
  getFutureHub,
  reorderIdealDayItems,
  updateBucketItem,
  updateIdealWeek,
} from '#/server/content.functions'

export const Route = createFileRoute('/future')({
  loader: () => getFutureHub(),
  component: FuturePage,
  pendingComponent: LoadingPage,
})
const weekdays = ['月', '火', '水', '木', '金', '土', '日']

function FuturePage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const addDay = useServerFn(createIdealDayItem)
  const removeDay = useServerFn(deleteIdealDayItem)
  const reorderDay = useServerFn(reorderIdealDayItems)
  const replaceWeek = useServerFn(updateIdealWeek)
  const addDiary = useServerFn(createFutureDiary)
  const removeDiary = useServerFn(deleteFutureDiary)
  const addBucket = useServerFn(createBucketItem)
  const updateBucket = useServerFn(updateBucketItem)
  const removeBucket = useServerFn(deleteBucketItem)
  const addReason = useServerFn(createReason)
  const removeReason = useServerFn(deleteReason)
  const uploadCapsule = useServerFn(createTimeCapsuleMedia)
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
  async function moveIdealDay(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= data.idealDay.length) return
    const ids = data.idealDay.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    await run(() => reorderDay({ data: { ids } }), '理想の1日を並び替えました')
  }
  async function removeIdealWeekItem(id: string) {
    if (!window.confirm('未来の一週間から削除しますか？')) return
    const items = data.idealWeek
      .filter((item) => item.id !== id)
      .map(({ id, weekday, title, sortOrder }) => ({
        id,
        weekday,
        title,
        sortOrder,
      }))
    await run(
      () => replaceWeek({ data: { items } }),
      '未来の一週間を更新しました',
    )
  }
  const completedDreams = data.bucket.filter((item) => item.completed).length
  return (
    <Page
      title="Future"
      eyebrow="LIVE IT BEFORE YOU MOVE"
      description="移住後の一日・一週間・プロフィール・手紙を先に描き、現在との差を行動へ戻します。"
    >
      <section className="stats-grid page-stats">
        <div className="stat stat-sea">
          <span>理想の1日</span>
          <strong>{data.idealDay.length} scenes</strong>
          <small>朝から夜まで具体化</small>
        </div>
        <div className="stat stat-green">
          <span>Dreams</span>
          <strong>
            {completedDreams} / {data.bucket.length}
          </strong>
          <ProgressBar
            value={
              data.bucket.length
                ? (completedDreams / data.bucket.length) * 100
                : 0
            }
          />
        </div>
        <div className="stat stat-gold">
          <span>Future Diary</span>
          <strong>{data.diaries.length}</strong>
          <small>未来の日付から書く</small>
        </div>
        <div className="stat stat-coral">
          <span>Why Naoshima</span>
          <strong>{data.reasons.length}</strong>
          <small>迷ったときに戻る場所</small>
        </div>
      </section>
      <section className="content-grid">
        <Card title="理想の1日" eyebrow="IDEAL DAY">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addDay({
                    data: {
                      time: String(values.get('time')),
                      title: String(values.get('title')),
                      sortOrder: data.idealDay.length,
                    },
                  }),
                '理想の1日に追加しました',
                form,
              )
            }}
          >
            <Field label="時刻">
              <input name="time" type="time" required />
            </Field>
            <Field label="過ごし方">
              <input name="title" placeholder="海沿いを散歩" required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>追加</SubmitButton>
            </div>
          </form>
          <div className="day-timeline">
            {data.idealDay.map((item, index) => (
              <article key={item.id}>
                <time>{item.time}</time>
                <span />
                <strong>{item.title}</strong>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label="上へ移動"
                    disabled={index === 0}
                    onClick={() => moveIdealDay(index, -1)}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="下へ移動"
                    disabled={index === data.idealDay.length - 1}
                    onClick={() => moveIdealDay(index, 1)}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('理想の1日の項目を削除しますか？') &&
                      run(
                        () => removeDay({ data: { id: item.id } }),
                        '項目を削除しました',
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Card>
        <Card title="未来の一週間" eyebrow="IDEAL WEEK">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              const weekday = Number(values.get('weekday'))
              const title = String(values.get('title'))
              const items = [
                ...data.idealWeek.map(({ id, weekday, title, sortOrder }) => ({
                  id,
                  weekday,
                  title,
                  sortOrder,
                })),
                {
                  weekday,
                  title,
                  sortOrder: data.idealWeek.filter(
                    (item) => item.weekday === weekday,
                  ).length,
                },
              ]
              run(
                () => replaceWeek({ data: { items } }),
                '未来の一週間を更新しました',
                form,
              )
            }}
          >
            <Field label="曜日">
              <select name="weekday">
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>
                    {day}曜日
                  </option>
                ))}
              </select>
            </Field>
            <Field label="予定">
              <input name="title" placeholder="午前だけ仕事" required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>予定を追加</SubmitButton>
            </div>
          </form>
          <div className="week-board">
            {weekdays.map((day, index) => (
              <div key={day}>
                <strong>{day}</strong>
                {data.idealWeek
                  .filter((item) => item.weekday === index)
                  .map((item) => (
                    <span key={item.id}>
                      {item.title}
                      <button
                        className="week-remove"
                        aria-label={`${item.title}を削除`}
                        onClick={() => removeIdealWeekItem(item.id)}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
              </div>
            ))}
          </div>
        </Card>
      </section>
      <section className="content-grid">
        <Card title="Future Diary" eyebrow="A DAY IN THE FUTURE">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addDiary({
                    data: {
                      title: String(values.get('title')),
                      futureDate: String(values.get('futureDate')),
                      content: String(values.get('content')),
                    },
                  }),
                '未来の日記を保存しました',
                form,
              )
            }}
          >
            <Field label="タイトル">
              <input name="title" required />
            </Field>
            <Field label="未来の日付">
              <input name="futureDate" type="date" required />
            </Field>
            <Field label="その日の出来事">
              <textarea name="content" rows={5} required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>日記を保存</SubmitButton>
            </div>
          </form>
          {data.diaries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="diary-list">
              {data.diaries.map((diary) => (
                <article key={diary.id}>
                  <BookOpen />
                  <div>
                    <time>{diary.futureDate}</time>
                    <h3>{diary.title}</h3>
                    <p>{diary.content}</p>
                  </div>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('Future Diaryを削除しますか？') &&
                      run(
                        () => removeDiary({ data: { id: diary.id } }),
                        '日記を削除しました',
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
        <Card
          title="直島で叶えたいこと"
          eyebrow="BUCKET · 100 DREAMS · PROJECTS"
        >
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addBucket({
                    data: {
                      title: String(values.get('title')),
                      kind: String(values.get('kind')) as
                        'BUCKET' | 'DREAM' | 'PROJECT',
                      description:
                        String(values.get('description') || '') || null,
                      completed: false,
                    },
                  }),
                '未来リストに追加しました',
                form,
              )
            }}
          >
            <Field label="やりたいこと">
              <input name="title" required />
            </Field>
            <Field label="種類">
              <select name="kind">
                <option value="BUCKET">直島Bucket</option>
                <option value="DREAM">100 Dreams</option>
                <option value="PROJECT">Project</option>
              </select>
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>追加</SubmitButton>
            </div>
          </form>
          <div className="item-list">
            {data.bucket.map((item) => (
              <article className="list-row" key={item.id}>
                <button
                  className={`condition-check ${item.completed ? 'done' : ''}`}
                  onClick={() =>
                    run(
                      () =>
                        updateBucket({
                          data: {
                            id: item.id,
                            title: item.title,
                            kind: item.kind,
                            description: item.description,
                            completed: !item.completed,
                          },
                        }),
                      '達成状態を更新しました',
                    )
                  }
                >
                  {item.completed ? <Check size={14} /> : null}
                </button>
                <div>
                  <Badge>{item.kind}</Badge>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('未来リストから削除しますか？') &&
                    run(
                      () => removeBucket({ data: { id: item.id } }),
                      '削除しました',
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </Card>
      </section>
      <section className="content-grid">
        <Card title="Why Naoshima" eyebrow="YOUR REASONS">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addReason({
                    data: { content: String(values.get('content')) },
                  }),
                '理由を残しました',
                form,
              )
            }}
          >
            <Field label="なぜ直島に住みたい？">
              <textarea name="content" rows={4} required />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>理由を追加</SubmitButton>
            </div>
          </form>
          <div className="reason-wall">
            {data.reasons.map((reason, index) => (
              <blockquote key={reason.id}>
                <span>#{String(index + 1).padStart(2, '0')}</span>
                <p>{reason.content}</p>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('この移住理由を削除しますか？') &&
                    run(
                      () => removeReason({ data: { id: reason.id } }),
                      '理由を削除しました',
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </blockquote>
            ))}
          </div>
        </Card>
        <ExtraResourcePanel
          resource="lifestyleComparisons"
          title="現在 vs 直島生活"
          rows={data.extras.lifestyleComparisons ?? []}
          fields={[
            { name: 'label', label: '比較項目', required: true },
            { name: 'currentValue', label: '現在', required: true },
            { name: 'naoshimaValue', label: '直島', required: true },
            {
              name: 'sortOrder',
              label: '並び順',
              type: 'number',
              defaultValue: 0,
            },
          ]}
        />
      </section>
      <section className="content-grid extra-grid">
        <ExtraResourcePanel
          resource="futureProfiles"
          title="未来プロフィール"
          description="2030年の自分を先に保存。"
          rows={data.extras.futureProfiles ?? []}
          fields={[
            { name: 'targetYear', label: '年', type: 'number', required: true },
            {
              name: 'residence',
              label: '居住地',
              required: true,
              defaultValue: '直島',
            },
            { name: 'workStyle', label: '働き方', required: true },
            {
              name: 'workDaysPerWeek',
              label: '週の稼働日数',
              type: 'number',
              min: 0,
              max: 7,
              required: true,
            },
            {
              name: 'monthlyIncome',
              label: '月収',
              type: 'number',
              min: 0,
              required: true,
            },
            { name: 'hobbies', label: '趣味（JSON配列）', defaultValue: '[]' },
          ]}
        />
        <ExtraResourcePanel
          resource="futureProjects"
          title="直島でやりたいProject"
          rows={data.extras.futureProjects ?? []}
          fields={[
            { name: 'title', label: 'Project', required: true },
            { name: 'description', label: '内容', type: 'textarea' },
            { name: 'completed', label: '実現済み', type: 'checkbox' },
          ]}
        />
        <ExtraResourcePanel
          resource="selfMessages"
          title="Past Me / Future Me"
          description="未来へ残す短いメッセージ。"
          rows={data.extras.selfMessages ?? []}
          fields={[
            {
              name: 'type',
              label: '種類',
              type: 'select',
              required: true,
              options: [
                { label: '今から未来へ', value: 'PAST_ME' },
                { label: '移住後の自分から今へ', value: 'FUTURE_ME' },
              ],
            },
            {
              name: 'content',
              label: 'メッセージ',
              type: 'textarea',
              required: true,
            },
            { name: 'revealAt', label: '表示日', type: 'date' },
          ]}
        />
        <ExtraResourcePanel
          resource="futureLetters"
          title="未来の自分への手紙"
          description="指定した日までは本文を閉じておく手紙。"
          rows={data.extras.futureLetters ?? []}
          fields={[
            { name: 'title', label: '手紙の題名', required: true },
            {
              name: 'content',
              label: '本文',
              type: 'textarea',
              required: true,
            },
            { name: 'openOn', label: '開封日', type: 'date', required: true },
          ]}
        />
        <ExtraResourcePanel
          resource="timeCapsules"
          title="タイムカプセル"
          description="文章とメディア参照を、指定年まで閉じる。"
          rows={data.extras.timeCapsules ?? []}
          fields={[
            { name: 'title', label: 'タイトル', required: true },
            { name: 'content', label: '本文', type: 'textarea' },
            { name: 'revealAt', label: '開封日', type: 'date', required: true },
            {
              name: 'mediaType',
              label: 'メディア',
              type: 'select',
              defaultValue: 'NONE',
              options: [
                { label: 'なし', value: 'NONE' },
                { label: '写真', value: 'PHOTO' },
                { label: '音声', value: 'AUDIO' },
              ],
            },
          ]}
        />
        <Card title="写真・音声タイムカプセル" eyebrow="LOCKED R2 MEDIA">
          <p className="panel-description">
            ファイル本体はR2へ置き、開封日まではメディアルートも404を返します。
          </p>
          <form
            className="stack-form"
            encType="multipart/form-data"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              run(
                () => uploadCapsule({ data: new FormData(form) }),
                'タイムカプセルを封印しました',
                form,
              )
            }}
          >
            <Field label="タイトル">
              <input name="title" required />
            </Field>
            <Field label="開封日">
              <input name="revealAt" type="date" required />
            </Field>
            <Field label="写真または音声">
              <input
                name="file"
                type="file"
                accept="image/*,audio/*"
                required
              />
            </Field>
            <Field label="未来への本文">
              <textarea name="content" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>R2へ封印</SubmitButton>
            </div>
          </form>
        </Card>
      </section>
      <Card
        title="未来のホーム画面"
        eyebrow="2030 DASHBOARD"
        className="future-home"
      >
        <div className="future-preview">
          <Clock3 />
          <div>
            <span>2030年の自分</span>
            <h2>
              {String(data.extras.futureProfiles?.[0]?.residence ?? '直島')}
              で暮らす
            </h2>
            <p>
              {String(
                data.extras.futureProfiles?.[0]?.workStyle ??
                  '場所に縛られない働き方',
              )}{' '}
              · 週
              {String(data.extras.futureProfiles?.[0]?.workDaysPerWeek ?? '4')}
              日
            </p>
          </div>
        </div>
      </Card>
    </Page>
  )
}
