import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { calculateReadiness } from '#/services/readiness.service'
import { appMonthEnd, formatAppDate, formatAppMonth } from '#/utils/date'

import {
  audioMetadataSchema,
  bucketItemSchema,
  createVisitSchema,
  extraResourceDeleteSchema,
  extraResourceMutationSchema,
  extraResourceNameSchema,
  futureDiarySchema,
  idealDayItemSchema,
  idealWeekSchema,
  memorySchema,
  monthlyReviewSchema,
  nextVisitItemSchema,
  parseExtraResourceValues,
  photoMetadataSchema,
  reasonSchema,
  updateVisitSchema,
} from './content-validation'
import { contentRepository } from './content-repository.server'
import { coreRepository, type CoreRepository } from './core-repository.server'
import { idSchema, reorderSchema } from './validation'
import { checkAndUnlockAchievements } from './achievement-check.server'

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
})

const pageLimit = z.number().int().min(1).max(50).default(20)
const visitsPageSchema = z.object({
  limit: pageLimit,
  cursor: z.object({ startDate: z.string(), id: z.string() }).optional(),
})
const memoriesPageSchema = z.object({
  limit: pageLimit,
  cursor: z.object({ date: z.string(), id: z.string() }).optional(),
})
const photosPageSchema = z.object({
  limit: pageLimit,
  cursor: z
    .object({ favorite: z.boolean(), createdAt: z.string(), id: z.string() })
    .optional(),
})

const uploadFormSchema = z.custom<FormData>(
  (value) => value instanceof FormData,
  'Upload must use multipart form data',
)

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName
  return (
    file.type
      .split('/')
      .pop()
      ?.replace(/[^a-z0-9]/g, '') || 'bin'
  )
}

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

async function processMediaCleanup(limit = 50) {
  const repository = contentRepository()
  const jobs = await repository.listPendingMediaCleanup(limit)
  for (const job of jobs) {
    try {
      await env.PHOTOS.delete(job.storageKey)
      await repository.markMediaCleanupComplete(job.storageKey)
    } catch (error) {
      await repository.markMediaCleanupAttempt(
        job.storageKey,
        error instanceof Error
          ? error.message
          : 'R2オブジェクトの削除に失敗しました',
      )
    }
  }
  return { processed: jobs.length }
}

export const getFutureHub = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = contentRepository()
    const [idealDay, idealWeek, diaries, bucket, reasons, extras] =
      await Promise.all([
        repository.listIdealDay(),
        repository.listIdealWeek(),
        repository.listFutureDiaries(),
        repository.listBucketItems(),
        repository.listReasons(),
        repository.listExtras([
          'futureLetters',
          'futureProfiles',
          'futureProjects',
          'lifestyleComparisons',
          'selfMessages',
          'timeCapsules',
        ]),
      ])
    const today = formatAppDate()
    const maskLocked = (
      rows: Array<Record<string, string | number | boolean | null>>,
      dateField: string,
    ) =>
      rows.map((row) =>
        String(row[dateField] ?? '') > today
          ? { ...row, content: '🔒 開封日まで非表示' }
          : row,
      )
    return {
      idealDay,
      idealWeek,
      diaries,
      bucket,
      reasons,
      extras: {
        ...extras,
        futureLetters: maskLocked(extras.futureLetters ?? [], 'openOn'),
        timeCapsules: maskLocked(extras.timeCapsules ?? [], 'revealAt'),
        selfMessages: maskLocked(extras.selfMessages ?? [], 'revealAt'),
      },
    }
  },
)

export const getIdealDay = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listIdealDay(),
)

export const createIdealDayItem = createServerFn({ method: 'POST' })
  .validator(idealDayItemSchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveIdealDayItem(data))

export const updateIdealDayItem = createServerFn({ method: 'POST' })
  .validator(idealDayItemSchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveIdealDayItem(data))

export const deleteIdealDayItem = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteIdealDayItem(data.id))

export const reorderIdealDayItems = createServerFn({ method: 'POST' })
  .validator(reorderSchema)
  .handler(({ data }) => contentRepository().reorderIdealDay(data.ids))

export const getIdealWeek = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listIdealWeek(),
)

export const updateIdealWeek = createServerFn({ method: 'POST' })
  .validator(idealWeekSchema)
  .handler(({ data }) => contentRepository().replaceIdealWeek(data.items))

export const getFutureDiaries = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listFutureDiaries(),
)

export const createFutureDiary = createServerFn({ method: 'POST' })
  .validator(futureDiarySchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveFutureDiary(data))

export const updateFutureDiary = createServerFn({ method: 'POST' })
  .validator(futureDiarySchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveFutureDiary(data))

export const deleteFutureDiary = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteFutureDiary(data.id))

export const getBucketItems = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listBucketItems(),
)

export const createBucketItem = createServerFn({ method: 'POST' })
  .validator(bucketItemSchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveBucketItem(data))

export const updateBucketItem = createServerFn({ method: 'POST' })
  .validator(bucketItemSchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveBucketItem(data))

export const deleteBucketItem = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteBucketItem(data.id))

export const getReasons = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listReasons(),
)

export const createReason = createServerFn({ method: 'POST' })
  .validator(reasonSchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveReason(data))

export const updateReason = createServerFn({ method: 'POST' })
  .validator(reasonSchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveReason(data))

export const deleteReason = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteReason(data.id))

export const getMemoriesHub = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = contentRepository()
    const [visitsList, memoriesList, photosList, nextVisit, audio, extras] =
      await Promise.all([
        repository.listVisits(),
        repository.listMemories(),
        repository.listPhotos(),
        repository.listNextVisitItems(),
        repository.listAudio(),
        repository.listExtras([
          'favoritePlaces',
          'albums',
          'albumPhotos',
          'collectionItems',
          'seasonalExperiences',
          'calendarEvents',
          'bingoItems',
          'islandQuests',
          'photoComparisons',
          'photoComparisonItems',
        ]),
      ])
    return {
      visits: visitsList,
      memories: memoriesList,
      photos: photosList,
      nextVisit,
      audio,
      extras,
    }
  },
)

// Lean memories loader: the archived map, audio, visit planning, albums,
// collections, bingo, quests, calendar, and comparisons are intentionally not
// queried. Existing rows and the full getMemoriesHub implementation remain.
export const getMemoriesCore = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = contentRepository()
    const [visitsPage, memoriesPage, photosPage] = await Promise.all([
      repository.listRecentVisitsPage(),
      repository.listRecentMemoriesPage(),
      repository.listRecentPhotosPage(),
    ])
    return {
      visits: visitsPage.items,
      memories: memoriesPage.items,
      photos: photosPage.items,
      pagination: {
        visits: {
          nextCursor: visitsPage.nextCursor,
          totalCount: visitsPage.totalCount,
        },
        memories: {
          nextCursor: memoriesPage.nextCursor,
          totalCount: memoriesPage.totalCount,
        },
        photos: {
          nextCursor: photosPage.nextCursor,
          totalCount: photosPage.totalCount,
        },
      },
    }
  },
)

export const getVisitsPage = createServerFn({ method: 'GET' })
  .validator(visitsPageSchema)
  .handler(({ data }) =>
    contentRepository().listRecentVisitsPage(data.limit, data.cursor),
  )

export const getMemoriesPage = createServerFn({ method: 'GET' })
  .validator(memoriesPageSchema)
  .handler(({ data }) =>
    contentRepository().listRecentMemoriesPage(data.limit, data.cursor),
  )

export const getPhotosPage = createServerFn({ method: 'GET' })
  .validator(photosPageSchema)
  .handler(({ data }) =>
    contentRepository().listRecentPhotosPage(data.limit, data.cursor),
  )

export const getVisits = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listVisits(),
)

export const createVisit = createServerFn({ method: 'POST' })
  .validator(createVisitSchema)
  .handler(async ({ data }) => {
    const content = contentRepository()
    const visit = await content.saveVisit(data)
    if (visit) {
      await content.saveExtra('albums', {
        title: data.title,
        description: data.description,
        visitId: visit.id,
        coverPhotoId: null,
      })
    }
    await coreRepository().logAction({
      type: 'VISIT',
      title: data.title,
      description: `${data.startDate} → ${data.endDate}`,
      category: 'NAOSHIMA',
      sourceId: visit?.id,
    })
    await checkAndUnlockAchievements()
    return visit
  })

export const createVisitLean = createServerFn({ method: 'POST' })
  .validator(createVisitSchema)
  .handler(async ({ data }) => {
    const visit = await contentRepository().saveVisit(data)
    await coreRepository().logAction({
      type: 'VISIT',
      title: data.title,
      description: `${data.startDate} → ${data.endDate}`,
      category: 'NAOSHIMA',
      sourceId: visit?.id,
    })
    return visit
  })

export const updateVisit = createServerFn({ method: 'POST' })
  .validator(updateVisitSchema)
  .handler(({ data }) => contentRepository().saveVisit(data))

export const deleteVisit = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteVisit(data.id))

export const getMemories = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listMemories(),
)

export const createMemory = createServerFn({ method: 'POST' })
  .validator(memorySchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveMemory(data))

export const updateMemory = createServerFn({ method: 'POST' })
  .validator(memorySchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveMemory(data))

export const deleteMemory = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteMemory(data.id))

export const getPhotos = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listPhotos(),
)

export const createPhoto = createServerFn({ method: 'POST' })
  .validator(uploadFormSchema)
  .handler(async ({ data }) => {
    const file = data.get('file')
    if (!(file instanceof File)) throw new Error('画像ファイルが必要です')
    if (!file.type.startsWith('image/')) throw new Error('画像のみ保存できます')
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      throw new Error('画像は10MB以下にしてください')
    }
    const metadata = photoMetadataSchema.parse({
      caption: data.get('caption') || null,
      takenAt: data.get('takenAt') || null,
    })
    const photoId = crypto.randomUUID()
    const storageKey = `photos/${photoId}.${extensionFor(file)}`
    const thumbnail = data.get('thumbnail')
    const hasThumbnail =
      thumbnail instanceof File &&
      thumbnail.type === 'image/webp' &&
      thumbnail.size > 0 &&
      thumbnail.size <= 2 * 1024 * 1024
    const thumbnailStorageKey = hasThumbnail
      ? `thumbnails/${photoId}.webp`
      : null
    await env.PHOTOS.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    try {
      if (hasThumbnail) {
        await env.PHOTOS.put(thumbnailStorageKey!, thumbnail.stream(), {
          httpMetadata: { contentType: 'image/webp' },
        })
      }
      return await contentRepository().savePhoto({
        storageKey,
        thumbnailStorageKey,
        thumbnailUrl: thumbnailStorageKey
          ? `/media/${thumbnailStorageKey}`
          : null,
        width: positiveInteger(data.get('width')),
        height: positiveInteger(data.get('height')),
        imageUrl: `/media/${storageKey}`,
        caption: metadata.caption,
        takenAt: metadata.takenAt,
      })
    } catch (error) {
      await env.PHOTOS.delete(storageKey)
      if (thumbnailStorageKey) await env.PHOTOS.delete(thumbnailStorageKey)
      throw error
    }
  })

export const deletePhoto = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const repository = contentRepository()
    const photo = await repository.getPhoto(data.id)
    if (!photo) throw new Error('写真が見つかりません')
    await repository.deletePhotoAndQueueCleanup(
      photo.id,
      [photo.storageKey, photo.thumbnailStorageKey].filter(
        (key): key is string => Boolean(key),
      ),
    )
    await processMediaCleanup()
    return { deleted: true }
  })

export const retryMediaCleanup = createServerFn({ method: 'POST' }).handler(
  () => processMediaCleanup(100),
)

export const setFavoritePhoto = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid(), favorite: z.boolean() }))
  .handler(({ data }) =>
    contentRepository().setFavoritePhoto(data.id, data.favorite),
  )

export const getNextVisitItems = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listNextVisitItems(),
)

export const createNextVisitItem = createServerFn({ method: 'POST' })
  .validator(nextVisitItemSchema.omit({ id: true }))
  .handler(({ data }) => contentRepository().saveNextVisitItem(data))

export const updateNextVisitItem = createServerFn({ method: 'POST' })
  .validator(nextVisitItemSchema.required({ id: true }))
  .handler(({ data }) => contentRepository().saveNextVisitItem(data))

export const deleteNextVisitItem = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => contentRepository().deleteNextVisitItem(data.id))

export const getAudioRecords = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listAudio(),
)

export const createAudioRecord = createServerFn({ method: 'POST' })
  .validator(uploadFormSchema)
  .handler(async ({ data }) => {
    const file = data.get('file')
    if (!(file instanceof File)) throw new Error('音声ファイルが必要です')
    if (!file.type.startsWith('audio/')) throw new Error('音声のみ保存できます')
    if (file.size === 0 || file.size > 50 * 1024 * 1024) {
      throw new Error('音声は50MB以下にしてください')
    }
    const metadata = audioMetadataSchema.parse({
      kind: data.get('kind'),
      title: data.get('title'),
      description: data.get('description') || null,
      durationSeconds: data.get('durationSeconds')
        ? Number(data.get('durationSeconds'))
        : null,
      recordedAt: data.get('recordedAt'),
      latitude: data.get('latitude') ? Number(data.get('latitude')) : null,
      longitude: data.get('longitude') ? Number(data.get('longitude')) : null,
    })
    const storageKey = `audio/${crypto.randomUUID()}.${extensionFor(file)}`
    await env.PHOTOS.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    try {
      return await contentRepository().saveAudio({
        ...metadata,
        storageKey,
        audioUrl: `/media/${storageKey}`,
      })
    } catch (error) {
      await env.PHOTOS.delete(storageKey)
      throw error
    }
  })

export const deleteAudioRecord = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const repository = contentRepository()
    const audio = await repository.getAudio(data.id)
    if (!audio) throw new Error('音声が見つかりません')
    await repository.deleteAudioAndQueueCleanup(audio.id, audio.storageKey)
    await processMediaCleanup()
    return { deleted: true }
  })

export const createTimeCapsuleMedia = createServerFn({ method: 'POST' })
  .validator(uploadFormSchema)
  .handler(async ({ data }) => {
    const file = data.get('file')
    if (!(file instanceof File)) throw new Error('写真または音声が必要です')
    const isPhoto = file.type.startsWith('image/')
    const isAudio = file.type.startsWith('audio/')
    if (!isPhoto && !isAudio) throw new Error('写真または音声のみ保存できます')
    const limit = isPhoto ? 10 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size === 0 || file.size > limit) {
      throw new Error(
        isPhoto
          ? '画像は10MB以下にしてください'
          : '音声は50MB以下にしてください',
      )
    }
    const values = parseExtraResourceValues('timeCapsules', {
      title: data.get('title'),
      content: data.get('content') || null,
      revealAt: data.get('revealAt'),
      mediaType: isPhoto ? 'PHOTO' : 'AUDIO',
      storageKey: null,
      mediaUrl: null,
      openedAt: null,
    })
    const storageKey = `capsules/${crypto.randomUUID()}.${extensionFor(file)}`
    await env.PHOTOS.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    try {
      return await contentRepository().saveExtra('timeCapsules', {
        ...values,
        storageKey,
        mediaUrl: `/media/${storageKey}`,
      })
    } catch (error) {
      await env.PHOTOS.delete(storageKey)
      throw error
    }
  })

export const getMonthlyReviews = createServerFn({ method: 'GET' }).handler(() =>
  contentRepository().listReviews(),
)

export const getReviewsHub = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = contentRepository()
    const [reviews, snapshots, extras] = await Promise.all([
      repository.listReviews(),
      repository.listSnapshots(),
      repository.listExtras([
        'migrationJournalEntries',
        'moodLogs',
        'reasonRevisions',
      ]),
    ])
    return { reviews, snapshots, extras }
  },
)

export const getReviewsCore = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = contentRepository()
    const [reviews, snapshots] = await Promise.all([
      repository.listReviews(),
      repository.listSnapshots(),
    ])
    return { reviews, snapshots }
  },
)

export const getMonthlySummary = createServerFn({ method: 'GET' })
  .validator(monthSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const [missions, actions, conditions, finance, totalXp, review] =
      await Promise.all([
        repository.listMissions(),
        repository.listActions(2_000),
        repository.listConditions(),
        repository.getFinanceSettings(),
        repository.totalXp(),
        contentRepository().getReview(data.month),
      ])
    const inMonth = (date: Date | null) =>
      Boolean(date && formatAppDate(date).startsWith(data.month))
    const monthActions = actions.filter((action) => inMonth(action.occurredAt))
    return {
      month: data.month,
      completedMissions:
        monthActions.filter((action) => action.type === 'MISSION_COMPLETED')
          .length ||
        missions.filter(
          (mission) => mission.completed && inMonth(mission.completedAt),
        ).length,
      gainedXp: monthActions
        .filter((action) => action.type === 'MISSION_COMPLETED')
        .reduce((sum, action) => sum + (action.amount ?? 0), 0),
      gainedSkillXp: monthActions
        .filter(
          (action) =>
            action.type === 'SKILL_UP' ||
            (action.type === 'MISSION_COMPLETED' &&
              action.category === 'SKILL'),
        )
        .reduce((sum, action) => sum + Math.max(action.amount ?? 0, 0), 0),
      savedAmount: monthActions
        .filter((action) => action.type === 'SAVING')
        .reduce((sum, action) => sum + (action.amount ?? 0), 0),
      readiness: calculateHistoricalReadiness(conditions, data.month, actions),
      currentSavings: savingsAtMonth(
        finance?.currentSavings ?? 0,
        await repository.listSavings(),
        data.month,
      ),
      totalXp,
      actions: monthActions,
      review,
    }
  })

function calculateHistoricalReadiness(
  conditions: Awaited<ReturnType<CoreRepository['listConditions']>>,
  month: string,
  actions: Awaited<ReturnType<CoreRepository['listActions']>> = [],
) {
  const end = appMonthEnd(month)
  const currentMonth = formatAppMonth()
  if (month === currentMonth) return calculateReadiness(conditions)
  return calculateReadiness(
    conditions.map((condition) => {
      const latestConditionAction = actions
        .filter(
          (action) =>
            action.sourceId === condition.id &&
            (action.type === 'CONDITION_COMPLETED' ||
              action.title.startsWith('条件を未達成へ')) &&
            formatAppDate(action.occurredAt) <= end,
        )
        .at(0)
      const completionDate = condition.completedAt
        ? formatAppDate(condition.completedAt)
        : null
      const completedAtTarget = Boolean(
        latestConditionAction?.type === 'CONDITION_COMPLETED' ||
        (condition.completed && completionDate && completionDate <= end),
      )
      return completedAtTarget
        ? condition
        : {
            ...condition,
            completed: false,
            currentValue: null,
            completedAt: null,
          }
    }),
  )
}

function savingsAtMonth(
  currentSavings: number,
  transactions: Awaited<ReturnType<CoreRepository['listSavings']>>,
  month: string,
) {
  const end = appMonthEnd(month)
  const changesAfterMonth = transactions
    .filter((transaction) => transaction.date > end)
    .reduce(
      (total, transaction) =>
        total +
        (transaction.type === 'DEPOSIT'
          ? transaction.amount
          : -transaction.amount),
      0,
    )
  return Math.max(currentSavings - changesAfterMonth, 0)
}

async function saveReviewAndSnapshot(
  data: Parameters<ReturnType<typeof contentRepository>['saveReview']>[0],
) {
  const content = contentRepository()
  const core = coreRepository()
  const [
    conditions,
    finance,
    totalXp,
    missionsList,
    skillList,
    actions,
    savings,
  ] = await Promise.all([
    core.listConditions(),
    core.getFinanceSettings(),
    core.totalXp(),
    core.listMissions(),
    core.listSkills(),
    core.listActions(2_000),
    core.listSavings(),
  ])
  const monthActions = actions.filter((action) =>
    formatAppDate(action.occurredAt).startsWith(data.month),
  )
  const snapshot = {
    month: data.month,
    readiness: calculateHistoricalReadiness(conditions, data.month, actions)
      .overall,
    savings: savingsAtMonth(finance?.currentSavings ?? 0, savings, data.month),
    totalXp,
    completedMissions:
      monthActions.filter((action) => action.type === 'MISSION_COMPLETED')
        .length ||
      missionsList.filter(
        (mission) =>
          mission.completed &&
          Boolean(
            mission.completedAt &&
            formatAppDate(mission.completedAt).startsWith(data.month),
          ),
      ).length,
    skillLevels: Object.fromEntries(
      skillList.map((skill) => [skill.name, skill.level]),
    ),
  } satisfies Parameters<
    ReturnType<typeof contentRepository>['saveSnapshot']
  >[0]
  const review = await content.saveReviewAndSnapshot(data, snapshot)
  await core.logAction({
    type: 'REVIEW',
    title: `${data.month} 月次レビュー`,
    description: data.closerToNaoshima || data.goodThings || null,
  })
  return review
}

export const createMonthlyReview = createServerFn({ method: 'POST' })
  .validator(monthlyReviewSchema.omit({ id: true }))
  .handler(({ data }) => saveReviewAndSnapshot(data))

export const updateMonthlyReview = createServerFn({ method: 'POST' })
  .validator(monthlyReviewSchema.required({ id: true }))
  .handler(({ data }) => saveReviewAndSnapshot(data))

async function saveReviewAndSnapshotLean(
  data: Parameters<ReturnType<typeof contentRepository>['saveReview']>[0],
) {
  const content = contentRepository()
  const core = coreRepository()
  const [conditions, finance, missionsList, actions, savings] =
    await Promise.all([
      core.listConditions(),
      core.getFinanceSettings(),
      core.listMissions(),
      core.listActions(2_000),
      core.listSavings(),
    ])
  const monthActions = actions.filter((action) =>
    formatAppDate(action.occurredAt).startsWith(data.month),
  )
  const snapshot = {
    month: data.month,
    readiness: calculateHistoricalReadiness(conditions, data.month, actions)
      .overall,
    savings: savingsAtMonth(finance?.currentSavings ?? 0, savings, data.month),
    totalXp: 0,
    completedMissions:
      monthActions.filter((action) => action.type === 'MISSION_COMPLETED')
        .length ||
      missionsList.filter(
        (mission) =>
          mission.completed &&
          Boolean(
            mission.completedAt &&
            formatAppDate(mission.completedAt).startsWith(data.month),
          ),
      ).length,
    skillLevels: {},
  } satisfies Parameters<
    ReturnType<typeof contentRepository>['saveSnapshot']
  >[0]
  return content.saveReviewAndSnapshot(data, snapshot)
}

export const createMonthlyReviewLean = createServerFn({ method: 'POST' })
  .validator(monthlyReviewSchema.omit({ id: true }))
  .handler(({ data }) => saveReviewAndSnapshotLean(data))

export const updateMonthlyReviewLean = createServerFn({ method: 'POST' })
  .validator(monthlyReviewSchema.required({ id: true }))
  .handler(({ data }) => saveReviewAndSnapshotLean(data))

export const getExtraResource = createServerFn({ method: 'GET' })
  .validator(z.object({ resource: extraResourceNameSchema }))
  .handler(({ data }) => contentRepository().listExtra(data.resource))

export const saveExtraResource = createServerFn({ method: 'POST' })
  .validator(extraResourceMutationSchema)
  .handler(({ data }) => {
    const values = parseExtraResourceValues(data.resource, data.values)
    return contentRepository().saveExtra(data.resource, values, data.id)
  })

export const deleteExtraResource = createServerFn({ method: 'POST' })
  .validator(extraResourceDeleteSchema)
  .handler(async ({ data }) => {
    const repository = contentRepository()
    if (data.resource === 'timeCapsules') {
      const capsule = await repository.getExtra(data.resource, data.id)
      if (typeof capsule?.storageKey === 'string') {
        await repository.deleteExtraAndQueueCleanup(
          data.resource,
          data.id,
          capsule.storageKey,
        )
        await processMediaCleanup()
        return { deleted: true }
      }
    }
    return repository.deleteExtra(data.resource, data.id)
  })
