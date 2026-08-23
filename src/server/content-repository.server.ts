import { env } from 'cloudflare:workers'
import { asc, desc, eq, inArray } from 'drizzle-orm'

import { getDatabase } from '#/db/index.server'
import {
  audioRecords,
  bucketItems,
  futureDiaries,
  idealDayItems,
  idealWeekItems,
  memories,
  monthlyReviews,
  monthlySnapshots,
  naoshimaReasons,
  nextVisitItems,
  photos,
  visitPlaces,
  visits,
} from '#/db/schema'

import type { ExtraResourceName } from './content-validation'

type VisitInput = typeof visits.$inferInsert & { places?: string[] }
export type ResourceRow = Record<string, string | number | boolean | null>

const resourceConfig: Record<
  ExtraResourceName,
  {
    table: string
    order: string
    hasUpdatedAt: boolean
    hasCreatedAt?: boolean
  }
> = {
  favoritePlaces: {
    table: 'favorite_places',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  albums: { table: 'albums', order: 'updated_at', hasUpdatedAt: true },
  albumPhotos: {
    table: 'album_photos',
    order: 'sort_order',
    hasUpdatedAt: false,
    hasCreatedAt: false,
  },
  collectionItems: {
    table: 'collection_items',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  seasonalExperiences: {
    table: 'seasonal_experiences',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  calendarEvents: {
    table: 'calendar_events',
    order: 'date',
    hasUpdatedAt: true,
  },
  bingoItems: {
    table: 'bingo_items',
    order: 'sort_order',
    hasUpdatedAt: true,
  },
  islandQuests: {
    table: 'island_quests',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  migrationJournalEntries: {
    table: 'migration_journal_entries',
    order: 'date',
    hasUpdatedAt: true,
  },
  moodLogs: { table: 'mood_logs', order: 'date', hasUpdatedAt: false },
  reasonRevisions: {
    table: 'reason_revisions',
    order: 'recorded_at',
    hasUpdatedAt: true,
  },
  timeInvestmentLogs: {
    table: 'time_investment_logs',
    order: 'date',
    hasUpdatedAt: false,
  },
  moneyInvestmentLogs: {
    table: 'money_investment_logs',
    order: 'date',
    hasUpdatedAt: false,
  },
  milestoneEvents: {
    table: 'milestone_events',
    order: 'date',
    hasUpdatedAt: true,
  },
  selfMessages: {
    table: 'self_messages',
    order: 'created_at',
    hasUpdatedAt: false,
  },
  futureLetters: {
    table: 'future_letters',
    order: 'open_on',
    hasUpdatedAt: false,
  },
  futureProfiles: {
    table: 'future_profiles',
    order: 'target_year',
    hasUpdatedAt: true,
  },
  futureProjects: {
    table: 'future_projects',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  originStories: {
    table: 'origin_stories',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  seasonGoals: {
    table: 'season_goals',
    order: 'start_date',
    hasUpdatedAt: true,
  },
  focusSettings: {
    table: 'focus_settings',
    order: 'start_date',
    hasUpdatedAt: true,
  },
  anniversaries: {
    table: 'anniversaries',
    order: 'date',
    hasUpdatedAt: true,
  },
  decisionLogs: {
    table: 'decision_logs',
    order: 'decided_at',
    hasUpdatedAt: true,
  },
  antiGoals: {
    table: 'anti_goals',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  lifestyleComparisons: {
    table: 'lifestyle_comparisons',
    order: 'sort_order',
    hasUpdatedAt: true,
  },
  fixedCostReductions: {
    table: 'fixed_cost_reductions',
    order: 'effective_date',
    hasUpdatedAt: true,
  },
  timeCapsules: {
    table: 'time_capsules',
    order: 'reveal_at',
    hasUpdatedAt: true,
  },
  photoComparisons: {
    table: 'photo_comparisons',
    order: 'updated_at',
    hasUpdatedAt: true,
  },
  photoComparisonItems: {
    table: 'photo_comparison_items',
    order: 'sort_order',
    hasUpdatedAt: false,
    hasCreatedAt: false,
  },
}

function camelToSnake(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamel(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function toSqlValue(value: unknown) {
  if (value instanceof Date) return Math.floor(value.getTime() / 1_000)
  if (typeof value === 'boolean') return value ? 1 : 0
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value)
  }
  return value
}

function deserializeRow(row: Record<string, unknown>): ResourceRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      snakeToCamel(key),
      value as string | number | boolean | null,
    ]),
  ) as ResourceRow
}

export class ContentRepository {
  private readonly db = getDatabase()

  listIdealDay() {
    return this.db
      .select()
      .from(idealDayItems)
      .orderBy(asc(idealDayItems.sortOrder), asc(idealDayItems.time))
      .all()
  }

  saveIdealDayItem(input: typeof idealDayItems.$inferInsert) {
    if (input.id) {
      return this.db
        .update(idealDayItems)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(idealDayItems.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(idealDayItems).values(input).returning().get()
  }

  deleteIdealDayItem(id: string) {
    return this.db
      .delete(idealDayItems)
      .where(eq(idealDayItems.id, id))
      .returning()
      .get()
  }

  async reorderIdealDay(ids: string[]) {
    await Promise.all(
      ids.map((itemId, index) =>
        this.db
          .update(idealDayItems)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(idealDayItems.id, itemId)),
      ),
    )
    return this.listIdealDay()
  }

  listIdealWeek() {
    return this.db
      .select()
      .from(idealWeekItems)
      .orderBy(asc(idealWeekItems.weekday), asc(idealWeekItems.sortOrder))
      .all()
  }

  async replaceIdealWeek(items: (typeof idealWeekItems.$inferInsert)[]) {
    await this.db.delete(idealWeekItems).run()
    if (items.length > 0) {
      await this.db.insert(idealWeekItems).values(items).run()
    }
    return this.listIdealWeek()
  }

  listFutureDiaries() {
    return this.db
      .select()
      .from(futureDiaries)
      .orderBy(asc(futureDiaries.futureDate))
      .all()
  }

  saveFutureDiary(input: typeof futureDiaries.$inferInsert) {
    if (input.id) {
      return this.db
        .update(futureDiaries)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(futureDiaries.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(futureDiaries).values(input).returning().get()
  }

  deleteFutureDiary(id: string) {
    return this.db
      .delete(futureDiaries)
      .where(eq(futureDiaries.id, id))
      .returning()
      .get()
  }

  listBucketItems() {
    return this.db
      .select()
      .from(bucketItems)
      .orderBy(asc(bucketItems.completed), asc(bucketItems.createdAt))
      .all()
  }

  saveBucketItem(input: typeof bucketItems.$inferInsert) {
    if (input.id) {
      return this.db
        .update(bucketItems)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(bucketItems.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(bucketItems).values(input).returning().get()
  }

  deleteBucketItem(id: string) {
    return this.db
      .delete(bucketItems)
      .where(eq(bucketItems.id, id))
      .returning()
      .get()
  }

  listReasons() {
    return this.db
      .select()
      .from(naoshimaReasons)
      .orderBy(desc(naoshimaReasons.createdAt))
      .all()
  }

  saveReason(input: typeof naoshimaReasons.$inferInsert) {
    if (input.id) {
      return this.db
        .update(naoshimaReasons)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(naoshimaReasons.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(naoshimaReasons).values(input).returning().get()
  }

  deleteReason(id: string) {
    return this.db
      .delete(naoshimaReasons)
      .where(eq(naoshimaReasons.id, id))
      .returning()
      .get()
  }

  async listVisits() {
    const visitRows = await this.db
      .select()
      .from(visits)
      .orderBy(desc(visits.startDate))
      .all()
    const places = await this.db.select().from(visitPlaces).all()
    return visitRows.map((visit) => ({
      ...visit,
      places: places
        .filter((place) => place.visitId === visit.id)
        .map((place) => place.placeName),
    }))
  }

  async saveVisit({ places = [], ...input }: VisitInput) {
    const visitId = input.id ?? crypto.randomUUID()
    const write = input.id
      ? this.db
          .update(visits)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(visits.id, visitId))
      : this.db.insert(visits).values({ ...input, id: visitId })
    await write.run()
    await this.db
      .delete(visitPlaces)
      .where(eq(visitPlaces.visitId, visitId))
      .run()
    if (places.length > 0) {
      await this.db
        .insert(visitPlaces)
        .values(
          [...new Set(places)].map((placeName) => ({ visitId, placeName })),
        )
        .run()
    }
    return (await this.listVisits()).find((visit) => visit.id === visitId)
  }

  deleteVisit(id: string) {
    return this.db.delete(visits).where(eq(visits.id, id)).returning().get()
  }

  listMemories() {
    return this.db.select().from(memories).orderBy(desc(memories.date)).all()
  }

  saveMemory(input: typeof memories.$inferInsert) {
    if (input.id) {
      return this.db
        .update(memories)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(memories.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(memories).values(input).returning().get()
  }

  deleteMemory(id: string) {
    return this.db.delete(memories).where(eq(memories.id, id)).returning().get()
  }

  listPhotos() {
    return this.db
      .select()
      .from(photos)
      .orderBy(desc(photos.favorite), desc(photos.takenAt))
      .all()
  }

  getPhoto(id: string) {
    return this.db.select().from(photos).where(eq(photos.id, id)).get()
  }

  getPhotoByStorageKey(storageKey: string) {
    return this.db
      .select()
      .from(photos)
      .where(eq(photos.storageKey, storageKey))
      .get()
  }

  savePhoto(input: typeof photos.$inferInsert) {
    return this.db.insert(photos).values(input).returning().get()
  }

  deletePhotoMetadata(id: string) {
    return this.db.delete(photos).where(eq(photos.id, id)).returning().get()
  }

  setFavoritePhoto(id: string, favorite: boolean) {
    return this.db
      .update(photos)
      .set({ favorite })
      .where(eq(photos.id, id))
      .returning()
      .get()
  }

  listNextVisitItems() {
    return this.db
      .select()
      .from(nextVisitItems)
      .orderBy(asc(nextVisitItems.completed), desc(nextVisitItems.priority))
      .all()
  }

  saveNextVisitItem(input: typeof nextVisitItems.$inferInsert) {
    if (input.id) {
      return this.db
        .update(nextVisitItems)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(nextVisitItems.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(nextVisitItems).values(input).returning().get()
  }

  deleteNextVisitItem(id: string) {
    return this.db
      .delete(nextVisitItems)
      .where(eq(nextVisitItems.id, id))
      .returning()
      .get()
  }

  listReviews() {
    return this.db
      .select()
      .from(monthlyReviews)
      .orderBy(desc(monthlyReviews.month))
      .all()
  }

  saveReview(input: typeof monthlyReviews.$inferInsert) {
    if (input.id) {
      return this.db
        .update(monthlyReviews)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(monthlyReviews.id, input.id))
        .returning()
        .get()
    }
    return this.db
      .insert(monthlyReviews)
      .values(input)
      .onConflictDoUpdate({
        target: monthlyReviews.month,
        set: { ...input, updatedAt: new Date() },
      })
      .returning()
      .get()
  }

  getReview(month: string) {
    return this.db
      .select()
      .from(monthlyReviews)
      .where(eq(monthlyReviews.month, month))
      .get()
  }

  listSnapshots() {
    return this.db
      .select()
      .from(monthlySnapshots)
      .orderBy(asc(monthlySnapshots.month))
      .all()
  }

  saveSnapshot(input: typeof monthlySnapshots.$inferInsert) {
    return this.db
      .insert(monthlySnapshots)
      .values(input)
      .onConflictDoUpdate({
        target: monthlySnapshots.month,
        set: input,
      })
      .returning()
      .get()
  }

  listAudio() {
    return this.db
      .select()
      .from(audioRecords)
      .orderBy(desc(audioRecords.recordedAt))
      .all()
  }

  getAudio(id: string) {
    return this.db
      .select()
      .from(audioRecords)
      .where(eq(audioRecords.id, id))
      .get()
  }

  getAudioByStorageKey(storageKey: string) {
    return this.db
      .select()
      .from(audioRecords)
      .where(eq(audioRecords.storageKey, storageKey))
      .get()
  }

  saveAudio(input: typeof audioRecords.$inferInsert) {
    return this.db.insert(audioRecords).values(input).returning().get()
  }

  deleteAudioMetadata(id: string) {
    return this.db
      .delete(audioRecords)
      .where(eq(audioRecords.id, id))
      .returning()
      .get()
  }

  async listExtra(resource: ExtraResourceName) {
    const config = resourceConfig[resource]
    const result = await env.DB.prepare(
      `SELECT * FROM ${config.table} ORDER BY ${config.order} DESC LIMIT 500`,
    ).all<Record<string, unknown>>()
    return result.results.map(deserializeRow)
  }

  async getExtra(resource: ExtraResourceName, id: string) {
    const config = resourceConfig[resource]
    const row = await env.DB.prepare(
      `SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`,
    )
      .bind(id)
      .first<Record<string, unknown>>()
    return row ? deserializeRow(row) : null
  }

  async saveExtra(
    resource: ExtraResourceName,
    values: Record<string, unknown>,
    existingId?: string,
  ) {
    const config = resourceConfig[resource]
    const normalized = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        camelToSnake(key),
        toSqlValue(value),
      ]),
    )
    const now = Math.floor(Date.now() / 1_000)
    if (existingId) {
      if (config.hasUpdatedAt) normalized.updated_at = now
      const entries = Object.entries(normalized)
      const assignments = entries.map(([column]) => `${column} = ?`).join(', ')
      await env.DB.prepare(
        `UPDATE ${config.table} SET ${assignments} WHERE id = ?`,
      )
        .bind(...entries.map(([, value]) => value), existingId)
        .run()
      return { id: existingId }
    }
    const newId = crypto.randomUUID()
    normalized.id = newId
    if (config.hasCreatedAt !== false) normalized.created_at = now
    if (config.hasUpdatedAt) normalized.updated_at = now
    const entries = Object.entries(normalized)
    const placeholders = entries.map(() => '?').join(', ')
    await env.DB.prepare(
      `INSERT INTO ${config.table} (${entries.map(([key]) => key).join(', ')}) VALUES (${placeholders})`,
    )
      .bind(...entries.map(([, value]) => value))
      .run()
    return { id: newId }
  }

  async deleteExtra(resource: ExtraResourceName, id: string) {
    const { table } = resourceConfig[resource]
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
    return { deleted: true }
  }

  async listExtras(
    resources: ExtraResourceName[],
  ): Promise<Partial<Record<ExtraResourceName, ResourceRow[]>>> {
    const results = await Promise.all(
      resources.map(async (resource) => [
        resource,
        await this.listExtra(resource),
      ]),
    )
    return Object.fromEntries(results) as Partial<
      Record<ExtraResourceName, ResourceRow[]>
    >
  }

  async getPhotoMetadataByIds(ids: string[]) {
    if (ids.length === 0) return []
    return this.db.select().from(photos).where(inArray(photos.id, ids)).all()
  }
}

export function contentRepository() {
  return new ContentRepository()
}
