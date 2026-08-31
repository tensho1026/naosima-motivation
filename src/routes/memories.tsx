import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CalendarDays, Heart, ImagePlus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  Badge,
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
  createMemory,
  createPhoto,
  createVisitLean,
  deleteMemory,
  deletePhoto,
  deleteVisit,
  getMemoriesCore,
  setFavoritePhoto,
} from '#/server/content.functions'

export const Route = createFileRoute('/memories')({
  loader: () => getMemoriesCore(),
  component: LeanMemoriesPage,
  pendingComponent: LoadingPage,
})

function LeanMemoriesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const addVisit = useServerFn(createVisitLean)
  const removeVisit = useServerFn(deleteVisit)
  const addMemory = useServerFn(createMemory)
  const removeMemory = useServerFn(deleteMemory)
  const uploadPhoto = useServerFn(createPhoto)
  const removePhoto = useServerFn(deletePhoto)
  const favoritePhoto = useServerFn(setFavoritePhoto)
  const [pending, setPending] = useState(false)

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

  const totalDays = data.visits.reduce((sum, visit) => {
    const start = new Date(`${visit.startDate}T00:00:00`).getTime()
    const end = new Date(`${visit.endDate}T00:00:00`).getTime()
    return sum + Math.max(Math.round((end - start) / 86_400_000) + 1, 1)
  }, 0)

  return (
    <Page
      title="思い出"
      eyebrow="直島の記録"
      description="訪問、写真、短い思い出だけを残します。"
    >
      <section className="stats-grid page-stats">
        <Stat label="訪問" value={`${data.visits.length}回`} tone="sea" />
        <Stat label="滞在" value={`${totalDays}日`} tone="green" />
        <Stat label="写真" value={`${data.photos.length}枚`} tone="gold" />
        <Stat label="思い出" value={`${data.memories.length}件`} tone="coral" />
      </section>

      <section className="content-grid">
        <Card title="訪問記録" eyebrow="直島滞在">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              void run(
                () =>
                  addVisit({
                    data: {
                      title: String(values.get('title')),
                      startDate: String(values.get('startDate')),
                      endDate: String(values.get('endDate')),
                      description:
                        String(values.get('description') || '') || null,
                      rating: values.get('rating')
                        ? Number(values.get('rating'))
                        : null,
                      places: String(values.get('places') || '')
                        .split(',')
                        .map((place) => place.trim())
                        .filter(Boolean),
                    },
                  }),
                '訪問を記録しました',
                form,
              )
            }}
          >
            <Field label="タイトル">
              <input name="title" placeholder="例: 2026年 夏" required />
            </Field>
            <Field label="開始日">
              <input name="startDate" type="date" required />
            </Field>
            <Field label="終了日">
              <input name="endDate" type="date" required />
            </Field>
            <Field label="満足度 1〜5">
              <input name="rating" type="number" min="1" max="5" />
            </Field>
            <Field label="場所（カンマ区切り）">
              <input name="places" placeholder="宮浦港, 本村" />
            </Field>
            <Field label="感想">
              <textarea name="description" />
            </Field>
            <SubmitButton pending={pending}>訪問を追加</SubmitButton>
          </form>

          {data.visits.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="visit-list">
              {data.visits.map((visit) => (
                <article key={visit.id}>
                  <CalendarDays />
                  <div>
                    <h3>{visit.title}</h3>
                    <p>
                      {visit.startDate} → {visit.endDate}
                    </p>
                    <span>{visit.description}</span>
                  </div>
                  <Badge tone="gold">
                    {visit.rating ? '★'.repeat(visit.rating) : '未評価'}
                  </Badge>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('訪問記録を削除しますか？') &&
                      void run(
                        () => removeVisit({ data: { id: visit.id } }),
                        '訪問を削除しました',
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

        <Card title="短い思い出" eyebrow="記録">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              void run(
                () =>
                  addMemory({
                    data: {
                      title: String(values.get('title')),
                      description:
                        String(values.get('description') || '') || null,
                      date: String(values.get('date')),
                      latitude: null,
                      longitude: null,
                      photoId: String(values.get('photoId') || '') || null,
                      visitId: String(values.get('visitId') || '') || null,
                    },
                  }),
                '思い出を保存しました',
                form,
              )
            }}
          >
            <Field label="タイトル">
              <input name="title" required />
            </Field>
            <Field label="日付">
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
            <Field label="訪問">
              <select name="visitId">
                <option value="">なし</option>
                {data.visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="写真">
              <select name="photoId">
                <option value="">なし</option>
                {data.photos.map((photo) => (
                  <option key={photo.id} value={photo.id}>
                    {photo.caption ?? photo.takenAt ?? photo.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="内容">
              <textarea name="description" />
            </Field>
            <SubmitButton pending={pending}>思い出を追加</SubmitButton>
          </form>

          <div className="item-list">
            {data.memories.map((memory) => (
              <article className="list-row" key={memory.id}>
                <div>
                  <strong>{memory.title}</strong>
                  <p>
                    {memory.date} · {memory.description ?? ''}
                  </p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('思い出を削除しますか？') &&
                    void run(
                      () => removeMemory({ data: { id: memory.id } }),
                      '思い出を削除しました',
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

      <Card title="写真" eyebrow="R2アルバム">
        <form
          className="stack-form"
          encType="multipart/form-data"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            void run(
              () => uploadPhoto({ data: new FormData(form) }),
              '写真を保存しました',
              form,
            )
          }}
        >
          <Field label="写真（10MB以下）">
            <input name="file" type="file" accept="image/*" required />
          </Field>
          <Field label="撮影日">
            <input name="takenAt" type="date" />
          </Field>
          <Field label="キャプション">
            <input name="caption" />
          </Field>
          <SubmitButton pending={pending}>
            <ImagePlus size={16} /> 写真をアップロード
          </SubmitButton>
        </form>

        {data.photos.length === 0 ? (
          <EmptyState title="写真はまだありません" />
        ) : (
          <div className="photo-grid">
            {data.photos.map((photo) => (
              <figure key={photo.id}>
                <img
                  src={photo.imageUrl}
                  alt={photo.caption ?? '直島の写真'}
                  loading="lazy"
                />
                <figcaption>
                  <div>
                    <strong>{photo.caption ?? 'Untitled'}</strong>
                    <small>{photo.takenAt ?? ''}</small>
                  </div>
                  <button
                    className={`icon-button ${photo.favorite ? 'favorite' : ''}`}
                    aria-label="お気に入り"
                    onClick={() =>
                      void run(
                        () =>
                          favoritePhoto({
                            data: { id: photo.id, favorite: !photo.favorite },
                          }),
                        photo.favorite
                          ? 'お気に入りを解除しました'
                          : 'お気に入りにしました',
                      )
                    }
                  >
                    <Heart
                      size={15}
                      fill={photo.favorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('写真を削除しますか？') &&
                      void run(
                        () => removePhoto({ data: { id: photo.id } }),
                        '写真を削除しました',
                      )
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Card>
    </Page>
  )
}

/* FEATURE_ARCHIVE_BEGIN: original memories hub
 *
 * Restore this block for maps/favorite places, audio, next-visit planning,
 * albums, collection/season/calendar, bingo, quests, and photo comparisons.
 *
import { useServerFn } from '@tanstack/react-start'
import { ClientOnly, createFileRoute, useRouter } from '@tanstack/react-router'
import { differenceInCalendarDays } from 'date-fns'
import {
  CalendarDays,
  Heart,
  ImagePlus,
  MapPinned,
  Mic2,
  Play,
  Star,
  Trash2,
} from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'

import { ExtraResourcePanel } from '#/components/ui/ExtraResourcePanel'
import {
  Badge,
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
  createAudioRecord,
  createMemory,
  createNextVisitItem,
  createPhoto,
  createVisit,
  deleteAudioRecord,
  deleteMemory,
  deleteNextVisitItem,
  deletePhoto,
  deleteVisit,
  getMemoriesHub,
  setFavoritePhoto,
  updateNextVisitItem,
} from '#/server/content.functions'
import { audioKindLabel } from '#/utils/display'

const IslandMap = lazy(() => import('#/components/memories/IslandMap.client'))
export const Route = createFileRoute('/memories')({
  loader: () => getMemoriesHub(),
  component: MemoriesPage,
  pendingComponent: LoadingPage,
})
const today = () => new Date().toISOString().slice(0, 10)

function MemoriesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const addVisit = useServerFn(createVisit)
  const removeVisit = useServerFn(deleteVisit)
  const addMemory = useServerFn(createMemory)
  const removeMemory = useServerFn(deleteMemory)
  const uploadPhoto = useServerFn(createPhoto)
  const removePhoto = useServerFn(deletePhoto)
  const favoritePhoto = useServerFn(setFavoritePhoto)
  const addNext = useServerFn(createNextVisitItem)
  const removeNext = useServerFn(deleteNextVisitItem)
  const updateNext = useServerFn(updateNextVisitItem)
  const uploadAudio = useServerFn(createAudioRecord)
  const removeAudio = useServerFn(deleteAudioRecord)
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
  const totalDays = data.visits.reduce(
    (sum, visit) =>
      sum +
      Math.max(
        Math.round(
          (new Date(visit.endDate).getTime() -
            new Date(visit.startDate).getTime()) /
            86400000,
        ) + 1,
        1,
      ),
    0,
  )
  const points = useMemo(
    () => [
      ...(data.extras.favoritePlaces ?? [])
        .map((row) => ({
          id: String(row.id),
          name: String(row.name),
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          kind: String(row.kind),
          description: row.description ? String(row.description) : null,
          visitCount: data.visits.filter((visit) =>
            visit.places.includes(String(row.name)),
          ).length,
        }))
        .filter(
          (point) =>
            Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
        ),
      ...data.memories
        .filter((memory) => memory.latitude != null && memory.longitude != null)
        .map((memory) => ({
          id: memory.id,
          name: memory.title,
          latitude: memory.latitude as number,
          longitude: memory.longitude as number,
          kind: 'MEMORY',
          description: memory.description,
          date: memory.date,
          imageUrl:
            data.photos.find((photo) => photo.id === memory.photoId)
              ?.imageUrl ?? null,
          visitCount: memory.visitId ? 1 : 0,
        })),
    ],
    [data.extras.favoritePlaces, data.memories, data.photos, data.visits],
  )
  const visitCountdown = (data.extras.calendarEvents ?? [])
    .filter((row) => row.kind === 'NEXT_VISIT' && String(row.date) >= today())
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0]
  const daysUntilVisit = visitCountdown
    ? Math.max(
        differenceInCalendarDays(
          new Date(`${String(visitCountdown.date)}T00:00:00`),
          new Date(),
        ),
        0,
      )
    : null
  const latestVisitEnd = data.visits
    .map((visit) => visit.endDate)
    .sort()
    .at(-1)
  const daysSinceLastVisit = latestVisitEnd
    ? Math.max(
        differenceInCalendarDays(
          new Date(),
          new Date(`${latestVisitEnd}T00:00:00`),
        ),
        0,
      )
    : null
  const randomQuest = (data.extras.islandQuests ?? []).filter(
    (row) => Number(row.randomEligible) === 1 && Number(row.completed) === 0,
  )[new Date().getDate() % Math.max((data.extras.islandQuests ?? []).length, 1)]
  return (
    <Page
      title="思い出"
      eyebrow="自分だけの直島記録"
      description="写真・訪問・場所・音をCloudflare R2とD1へ残し、島で過ごした時間を育てます。"
    >
      <section className="stats-grid page-stats">
        <Stat
          label="訪問回数"
          value={`${data.visits.length}回`}
          detail={
            visitCountdown
              ? `次回まであと${daysUntilVisit}日 · ${String(visitCountdown.date)}`
              : '次回予定は未登録'
          }
          tone="sea"
        />
        <Stat
          label="累計滞在"
          value={`${totalDays}日`}
          detail={`${totalDays * 24}時間 · 最後から${daysSinceLastVisit ?? '—'}日`}
          tone="green"
        />
        <Stat
          label="写真"
          value={`${data.photos.length}枚`}
          detail={`お気に入り ${data.photos.filter((photo) => photo.favorite).length}`}
          tone="gold"
        />
        <Stat
          label="音の記録"
          value={`${data.audio.length}件`}
          detail="声・環境音"
          tone="coral"
        />
      </section>
      <section className="content-grid">
        <Card title="直島滞在ログ" eyebrow="訪問記録">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addVisit({
                    data: {
                      title: String(values.get('title')),
                      startDate: String(values.get('startDate')),
                      endDate: String(values.get('endDate')),
                      description:
                        String(values.get('description') || '') || null,
                      rating: values.get('rating')
                        ? Number(values.get('rating'))
                        : null,
                      places: String(values.get('places') || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                  }),
                '訪問を記録しました',
                form,
              )
            }}
          >
            <Field label="訪問タイトル">
              <input name="title" placeholder="例: 2026年 夏" required />
            </Field>
            <Field label="開始日">
              <input name="startDate" type="date" required />
            </Field>
            <Field label="終了日">
              <input name="endDate" type="date" required />
            </Field>
            <Field label="満足度 1〜5">
              <input name="rating" type="number" min="1" max="5" />
            </Field>
            <Field label="行った場所（カンマ区切り）">
              <input name="places" placeholder="宮浦港, 本村" />
            </Field>
            <Field label="感想">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>訪問を追加</SubmitButton>
            </div>
          </form>
          {data.visits.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="visit-list">
              {data.visits.map((visit) => (
                <article key={visit.id}>
                  <CalendarDays />
                  <div>
                    <h3>{visit.title}</h3>
                    <p>
                      {visit.startDate} → {visit.endDate} ·{' '}
                      {visit.places.join(' / ') || '場所未登録'}
                    </p>
                    <span>{visit.description}</span>
                  </div>
                  <Badge tone="gold">
                    {visit.rating ? `${'★'.repeat(visit.rating)}` : '未評価'}
                  </Badge>
                  <button
                    className="icon-button danger"
                    onClick={() =>
                      window.confirm('訪問記録を削除しますか？') &&
                      run(
                        () => removeVisit({ data: { id: visit.id } }),
                        '訪問を削除しました',
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
        <Card title="場所ごとの思い出" eyebrow="思い出マップ">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addMemory({
                    data: {
                      title: String(values.get('title')),
                      description:
                        String(values.get('description') || '') || null,
                      date: String(values.get('date')),
                      latitude: values.get('latitude')
                        ? Number(values.get('latitude'))
                        : null,
                      longitude: values.get('longitude')
                        ? Number(values.get('longitude'))
                        : null,
                      photoId: String(values.get('photoId') || '') || null,
                      visitId: String(values.get('visitId') || '') || null,
                    },
                  }),
                '思い出を保存しました',
                form,
              )
            }}
          >
            <Field label="思い出">
              <input name="title" required />
            </Field>
            <Field label="日付">
              <input name="date" type="date" defaultValue={today()} required />
            </Field>
            <Field label="緯度">
              <input name="latitude" type="number" step="any" />
            </Field>
            <Field label="経度">
              <input name="longitude" type="number" step="any" />
            </Field>
            <Field label="写真">
              <select name="photoId">
                <option value="">なし</option>
                {data.photos.map((photo) => (
                  <option key={photo.id} value={photo.id}>
                    {photo.caption ?? photo.takenAt ?? photo.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="訪問">
              <select name="visitId">
                <option value="">なし</option>
                {data.visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="メモ">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>思い出を追加</SubmitButton>
            </div>
          </form>
          <ClientOnly
            fallback={
              <div className="map-placeholder">
                <MapPinned />
                地図を読み込み中…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="map-placeholder">地図を読み込み中…</div>
              }
            >
              <IslandMap points={points} />
            </Suspense>
          </ClientOnly>
          <div className="item-list memory-list">
            {data.memories.map((memory) => (
              <article className="list-row" key={memory.id}>
                <div>
                  <strong>{memory.title}</strong>
                  <p>
                    {memory.date} ·{' '}
                    {memory.latitude != null
                      ? `${memory.latitude.toFixed(4)}, ${memory.longitude?.toFixed(4)}`
                      : '位置未登録'}
                  </p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('この思い出を削除しますか？') &&
                    run(
                      () => removeMemory({ data: { id: memory.id } }),
                      '思い出を削除しました',
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
        <Card title="直島アルバム" eyebrow="R2の写真">
          <form
            className="stack-form"
            encType="multipart/form-data"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              run(
                () => uploadPhoto({ data: new FormData(form) }),
                '写真をR2へ保存しました',
                form,
              )
            }}
          >
            <Field label="写真（10MB以下）">
              <input name="file" type="file" accept="image/*" required />
            </Field>
            <Field label="撮影日">
              <input name="takenAt" type="date" />
            </Field>
            <Field label="キャプション">
              <input name="caption" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>
                <ImagePlus size={16} />
                写真をアップロード
              </SubmitButton>
            </div>
          </form>
          {data.photos.length === 0 ? (
            <EmptyState title="写真はまだありません" />
          ) : (
            <div className="photo-grid">
              {data.photos.map((photo) => (
                <figure key={photo.id}>
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption ?? '直島の写真'}
                    loading="lazy"
                  />
                  <figcaption>
                    <div>
                      <strong>{photo.caption ?? 'Untitled'}</strong>
                      <small>{photo.takenAt ?? ''}</small>
                    </div>
                    <button
                      className={`icon-button ${photo.favorite ? 'favorite' : ''}`}
                      aria-label="お気に入り"
                      onClick={() =>
                        run(
                          () =>
                            favoritePhoto({
                              data: { id: photo.id, favorite: !photo.favorite },
                            }),
                          photo.favorite
                            ? 'お気に入りを解除しました'
                            : 'お気に入りにしました',
                        )
                      }
                    >
                      <Heart
                        size={15}
                        fill={photo.favorite ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        window.confirm(
                          'R2とD1の両方から写真を削除しますか？',
                        ) &&
                        run(
                          () => removePhoto({ data: { id: photo.id } }),
                          '写真を削除しました',
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Card>
        <Card title="音声メモ / 環境音" eyebrow="R2の音声">
          <form
            className="stack-form"
            encType="multipart/form-data"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              run(
                () => uploadAudio({ data: new FormData(form) }),
                '音声をR2へ保存しました',
                form,
              )
            }}
          >
            <Field label="音声（50MB以下）">
              <input name="file" type="file" accept="audio/*" required />
            </Field>
            <Field label="種類">
              <select name="kind">
                <option value="VOICE_MEMO">音声メモ</option>
                <option value="AMBIENCE">環境音</option>
              </select>
            </Field>
            <Field label="タイトル">
              <input name="title" required />
            </Field>
            <Field label="録音日時">
              <input name="recordedAt" type="datetime-local" required />
            </Field>
            <Field label="長さ（秒）">
              <input name="durationSeconds" type="number" min="0" />
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>
                <Mic2 size={16} />
                音声を保存
              </SubmitButton>
            </div>
          </form>
          <div className="audio-list">
            {data.audio.map((audio) => (
              <article key={audio.id}>
                <span>
                  <Play />
                </span>
                <div>
                  <Badge>{audioKindLabel(audio.kind)}</Badge>
                  <strong>{audio.title}</strong>
                  <audio controls preload="metadata" src={audio.audioUrl} />
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('音声を削除しますか？') &&
                    run(
                      () => removeAudio({ data: { id: audio.id } }),
                      '音声を削除しました',
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
        <Card title="次回訪問計画" eyebrow="次の訪問">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  addNext({
                    data: {
                      title: String(values.get('title')),
                      description:
                        String(values.get('description') || '') || null,
                      completed: false,
                      priority: Number(values.get('priority')),
                    },
                  }),
                '次回訪問リストに追加しました',
                form,
              )
            }}
          >
            <Field label="次にすること">
              <input name="title" required />
            </Field>
            <Field label="優先度">
              <input
                name="priority"
                type="number"
                min="1"
                max="5"
                defaultValue="3"
              />
            </Field>
            <Field label="説明">
              <textarea name="description" />
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>追加</SubmitButton>
            </div>
          </form>
          <div className="item-list">
            {data.nextVisit.map((item) => (
              <article className="list-row" key={item.id}>
                <button
                  className={`condition-check ${item.completed ? 'done' : ''}`}
                  aria-label="達成状態を切り替え"
                  onClick={() =>
                    run(
                      () =>
                        updateNext({
                          data: {
                            id: item.id,
                            title: item.title,
                            description: item.description,
                            completed: !item.completed,
                            priority: item.priority,
                          },
                        }),
                      '次回訪問リストを更新しました',
                    )
                  }
                >
                  {item.completed ? <Star size={12} /> : null}
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <p>
                    Priority {item.priority} · {item.description}
                  </p>
                </div>
                <button
                  className="icon-button danger"
                  onClick={() =>
                    window.confirm('次回訪問リストから削除しますか？') &&
                    run(
                      () => removeNext({ data: { id: item.id } }),
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
        <Card title="今日のランダム散歩" eyebrow="島での小さな冒険">
          <div className="random-quest">
            <MapPinned />
            <span>今日のクエスト</span>
            <strong>
              {String(randomQuest?.title ?? 'クエストを追加すると表示されます')}
            </strong>
            <p>{String(randomQuest?.description ?? '')}</p>
          </div>
        </Card>
      </section>
      <section className="content-grid extra-grid">
        <ExtraResourcePanel
          resource="favoritePlaces"
          title="島マップ / お気に入り地点"
          rows={data.extras.favoritePlaces ?? []}
          fields={[
            { name: 'name', label: '場所', required: true },
            {
              name: 'kind',
              label: '種類',
              type: 'select',
              required: true,
              options: [
                'AREA',
                'MUSEUM',
                'CAFE',
                'SHOP',
                'PORT',
                'SCENERY',
                'OTHER',
              ].map((value) => ({ label: value, value })),
            },
            { name: 'latitude', label: '緯度', type: 'number', required: true },
            {
              name: 'longitude',
              label: '経度',
              type: 'number',
              required: true,
            },
            { name: 'description', label: '思い出', type: 'textarea' },
            { name: 'favorite', label: 'お気に入り', type: 'checkbox' },
            { name: 'visited', label: '訪問済み', type: 'checkbox' },
            { name: 'rank', label: '自分ランキング', type: 'number', min: 1 },
          ]}
        />
        <ExtraResourcePanel
          resource="albums"
          title="訪問ごとのアルバム"
          rows={data.extras.albums ?? []}
          fields={[
            { name: 'title', label: 'アルバム名', required: true },
            { name: 'description', label: '説明', type: 'textarea' },
            { name: 'visitId', label: '訪問ID' },
            { name: 'coverPhotoId', label: '表紙写真ID' },
          ]}
        />
        <ExtraResourcePanel
          resource="albumPhotos"
          title="アルバムへ写真を追加"
          description="アルバムと写真を選び、訪問ごとの並びを作ります。"
          rows={data.extras.albumPhotos ?? []}
          fields={[
            { name: 'albumId', label: 'アルバムID', required: true },
            { name: 'photoId', label: '写真ID', required: true },
            {
              name: 'sortOrder',
              label: '並び順',
              type: 'number',
              defaultValue: 0,
            },
          ]}
        />
        <ExtraResourcePanel
          resource="collectionItems"
          title="自分だけの直島図鑑"
          rows={data.extras.collectionItems ?? []}
          fields={[
            { name: 'title', label: '発見', required: true },
            {
              name: 'kind',
              label: '種類',
              type: 'select',
              required: true,
              options: [
                'SHOP',
                'SCENERY',
                'BEACH',
                'CAT',
                'ARCHITECTURE',
                'ART',
                'OTHER',
              ].map((value) => ({ label: value, value })),
            },
            { name: 'description', label: '説明', type: 'textarea' },
            { name: 'discoveredAt', label: '発見日', type: 'date' },
          ]}
        />
        <ExtraResourcePanel
          resource="seasonalExperiences"
          title="季節コレクション"
          rows={data.extras.seasonalExperiences ?? []}
          fields={[
            {
              name: 'season',
              label: '季節',
              type: 'select',
              required: true,
              options: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].map(
                (value) => ({ label: value, value }),
              ),
            },
            { name: 'title', label: '体験', required: true },
            { name: 'description', label: '説明', type: 'textarea' },
            { name: 'experienced', label: '体験済み', type: 'checkbox' },
            { name: 'experiencedAt', label: '体験日', type: 'date' },
          ]}
        />
        <ExtraResourcePanel
          resource="calendarEvents"
          title="直島生活カレンダー"
          rows={data.extras.calendarEvents ?? []}
          fields={[
            { name: 'title', label: '予定', required: true },
            { name: 'date', label: '日付', type: 'date', required: true },
            {
              name: 'kind',
              label: '種類',
              type: 'select',
              required: true,
              options: [
                'VISIT',
                'NEXT_VISIT',
                'ISLAND_EVENT',
                'MILESTONE',
                'OTHER',
              ].map((value) => ({ label: value, value })),
            },
            { name: 'description', label: '説明', type: 'textarea' },
          ]}
        />
        <ExtraResourcePanel
          resource="bingoItems"
          title="直島ビンゴ"
          rows={data.extras.bingoItems ?? []}
          fields={[
            { name: 'title', label: 'マス', required: true },
            { name: 'completed', label: '達成', type: 'checkbox' },
            {
              name: 'sortOrder',
              label: '順番',
              type: 'number',
              defaultValue: 0,
            },
          ]}
        />
        <ExtraResourcePanel
          resource="islandQuests"
          title="直島クエスト"
          rows={data.extras.islandQuests ?? []}
          fields={[
            { name: 'title', label: 'クエスト', required: true },
            { name: 'description', label: '説明', type: 'textarea' },
            {
              name: 'randomEligible',
              label: 'ランダム候補',
              type: 'checkbox',
              defaultValue: true,
            },
            { name: 'completed', label: '達成', type: 'checkbox' },
          ]}
        />
        <ExtraResourcePanel
          resource="photoComparisons"
          title="写真比較"
          description="同じ場所を年ごとに並べる比較セット。"
          rows={data.extras.photoComparisons ?? []}
          fields={[
            { name: 'title', label: '比較名', required: true },
            { name: 'description', label: '説明', type: 'textarea' },
            { name: 'placeId', label: '場所ID' },
          ]}
        />
        <ExtraResourcePanel
          resource="photoComparisonItems"
          title="写真比較へ年別写真を追加"
          rows={data.extras.photoComparisonItems ?? []}
          fields={[
            { name: 'comparisonId', label: '比較セットID', required: true },
            { name: 'photoId', label: '写真ID', required: true },
            {
              name: 'year',
              label: '撮影年',
              type: 'number',
              min: 1900,
              max: 2200,
              required: true,
            },
            {
              name: 'sortOrder',
              label: '並び順',
              type: 'number',
              defaultValue: 0,
            },
          ]}
        />
      </section>
      <Card title="訪問アルバムを見る" eyebrow="訪問の思い出">
        {(data.extras.albums ?? []).length === 0 ? (
          <EmptyState title="アルバムはまだありません" />
        ) : (
          <div className="album-viewer">
            {(data.extras.albums ?? []).map((album) => {
              const photoIds = (data.extras.albumPhotos ?? [])
                .filter((item) => String(item.albumId) === String(album.id))
                .sort(
                  (left, right) =>
                    Number(left.sortOrder) - Number(right.sortOrder),
                )
                .map((item) => String(item.photoId))
              const albumImages = photoIds
                .map((id) => data.photos.find((photo) => photo.id === id))
                .filter((photo) => photo != null)
              return (
                <article key={String(album.id)}>
                  <div>
                    <strong>{String(album.title)}</strong>
                    <p>{String(album.description ?? '訪問の写真')}</p>
                  </div>
                  {albumImages.length === 0 ? (
                    <small>写真の識別子を追加すると、ここに並びます。</small>
                  ) : (
                    <div className="album-strip">
                      {albumImages.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.imageUrl}
                          alt={photo.caption ?? String(album.title)}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </Card>
      <Card title="同じ場所の変化" eyebrow="2026 → 2027 → 2028">
        {(data.extras.photoComparisons ?? []).length === 0 ? (
          <EmptyState
            title="写真比較はまだありません"
            description="比較セットと年別写真を登録すると、ここに横並びで表示します。"
          />
        ) : (
          <div className="comparison-gallery">
            {(data.extras.photoComparisons ?? []).map((comparison) => {
              const items = (data.extras.photoComparisonItems ?? [])
                .filter(
                  (item) => String(item.comparisonId) === String(comparison.id),
                )
                .sort((left, right) => Number(left.year) - Number(right.year))
              return (
                <article key={String(comparison.id)}>
                  <h3>{String(comparison.title)}</h3>
                  <div>
                    {items.map((item) => {
                      const photo = data.photos.find(
                        (candidate) => candidate.id === String(item.photoId),
                      )
                      return photo ? (
                        <figure key={String(item.id)}>
                          <img
                            src={photo.imageUrl}
                            alt={`${String(comparison.title)} ${String(item.year)}`}
                            loading="lazy"
                          />
                          <figcaption>{String(item.year)}</figcaption>
                        </figure>
                      ) : null
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>
    </Page>
  )
}
FEATURE_ARCHIVE_END */
