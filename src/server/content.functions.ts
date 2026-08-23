import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { calculateReadiness } from '#/services/readiness.service'

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
import { coreRepository } from './core-repository.server'
import { idSchema, reorderSchema } from './validation'
import { checkAndUnlockAchievements } from './achievement-check.server'

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
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
    const today = new Date().toISOString().slice(0, 10)
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
    const storageKey = `photos/${crypto.randomUUID()}.${extensionFor(file)}`
    await env.PHOTOS.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    try {
      return await contentRepository().savePhoto({
        storageKey,
        imageUrl: `/media/${storageKey}`,
        caption: metadata.caption,
        takenAt: metadata.takenAt,
      })
    } catch (error) {
      await env.PHOTOS.delete(storageKey)
      throw error
    }
  })

export const deletePhoto = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const repository = contentRepository()
    const photo = await repository.getPhoto(data.id)
    if (!photo) throw new Error('写真が見つかりません')
    await env.PHOTOS.delete(photo.storageKey)
    await repository.deletePhotoMetadata(photo.id)
    return { deleted: true }
  })

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
    await env.PHOTOS.delete(audio.storageKey)
    await repository.deleteAudioMetadata(audio.id)
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

export const getMonthlySummary = createServerFn({ method: 'GET' })
  .validator(monthSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const [missions, actions, conditions, finance, totalXp, review] =
      await Promise.all([
        repository.listMissions(),
        repository.listActions(500),
        repository.listConditions(),
        repository.getFinanceSettings(),
        repository.totalXp(),
        contentRepository().getReview(data.month),
      ])
    const inMonth = (date: Date | null) =>
      Boolean(date && date.toISOString().startsWith(data.month))
    const monthActions = actions.filter((action) => inMonth(action.occurredAt))
    return {
      month: data.month,
      completedMissions: missions.filter(
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
      readiness: calculateReadiness(conditions),
      currentSavings: finance?.currentSavings ?? 0,
      totalXp,
      actions: monthActions,
      review,
    }
  })

async function saveReviewAndSnapshot(
  data: Parameters<ReturnType<typeof contentRepository>['saveReview']>[0],
) {
  const content = contentRepository()
  const core = coreRepository()
  const [review, conditions, finance, totalXp, missionsList, skillList] =
    await Promise.all([
      content.saveReview(data),
      core.listConditions(),
      core.getFinanceSettings(),
      core.totalXp(),
      core.listMissions(),
      core.listSkills(),
    ])
  await content.saveSnapshot({
    month: data.month,
    readiness: calculateReadiness(conditions).overall,
    savings: finance?.currentSavings ?? 0,
    totalXp,
    completedMissions: missionsList.filter((mission) => mission.completed)
      .length,
    skillLevels: Object.fromEntries(
      skillList.map((skill) => [skill.name, skill.level]),
    ),
  })
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
        await env.PHOTOS.delete(capsule.storageKey)
      }
    }
    return repository.deleteExtra(data.resource, data.id)
  })
