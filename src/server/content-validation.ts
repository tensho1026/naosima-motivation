import { z } from 'zod'

import { categorySchema, dateString } from './validation'

const optionalId = z.string().uuid().optional()
const optionalText = z.string().trim().max(4_000).nullable().optional()

export const idealDayItemSchema = z.object({
  id: optionalId,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  title: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0).max(10_000),
})

export const idealWeekItemSchema = z.object({
  id: optionalId,
  weekday: z.number().int().min(0).max(6),
  title: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0).max(10_000),
})

export const idealWeekSchema = z.object({
  items: z.array(idealWeekItemSchema).max(100),
})

export const futureDiarySchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(120),
  futureDate: dateString,
  content: z.string().trim().min(1).max(20_000),
})

export const bucketItemSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(120),
  kind: z.enum(['BUCKET', 'DREAM', 'PROJECT']).default('BUCKET'),
  description: optionalText,
  completed: z.boolean().default(false),
})

export const reasonSchema = z.object({
  id: optionalId,
  content: z.string().trim().min(1).max(4_000),
})

export const visitSchema = z
  .object({
    id: optionalId,
    startDate: dateString,
    endDate: dateString,
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    rating: z.number().int().min(1).max(5).nullable().optional(),
    places: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: 'End date must not be before start date',
    path: ['endDate'],
  })

export const memorySchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(120),
  description: optionalText,
  date: dateString,
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  photoId: z.string().uuid().nullable().optional(),
  visitId: z.string().uuid().nullable().optional(),
})

export const nextVisitItemSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(120),
  description: optionalText,
  completed: z.boolean().default(false),
  priority: z.number().int().min(1).max(5).default(3),
})

export const monthlyReviewSchema = z.object({
  id: optionalId,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  goodThings: z.string().trim().max(10_000).default(''),
  nextMonth: z.string().trim().max(10_000).default(''),
  closerToNaoshima: z.string().trim().max(10_000).default(''),
  notes: z.string().trim().max(10_000).default(''),
})

export const photoMetadataSchema = z.object({
  caption: z.string().trim().max(1_000).nullable().optional(),
  takenAt: dateString.nullable().optional(),
})

export const audioMetadataSchema = z.object({
  kind: z.enum(['VOICE_MEMO', 'AMBIENCE']),
  title: z.string().trim().min(1).max(120),
  description: optionalText,
  durationSeconds: z.number().int().min(0).max(86_400).nullable().optional(),
  recordedAt: z.coerce.date(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
})

export const extraResourceNames = [
  'favoritePlaces',
  'albums',
  'collectionItems',
  'seasonalExperiences',
  'calendarEvents',
  'bingoItems',
  'islandQuests',
  'migrationJournalEntries',
  'moodLogs',
  'reasonRevisions',
  'timeInvestmentLogs',
  'moneyInvestmentLogs',
  'milestoneEvents',
  'selfMessages',
  'futureLetters',
  'futureProfiles',
  'futureProjects',
  'originStories',
  'seasonGoals',
  'focusSettings',
  'anniversaries',
  'decisionLogs',
  'antiGoals',
  'lifestyleComparisons',
  'fixedCostReductions',
  'timeCapsules',
  'photoComparisons',
] as const

export type ExtraResourceName = (typeof extraResourceNames)[number]

export const extraResourceNameSchema = z.enum(extraResourceNames)
export const extraResourceMutationSchema = z.object({
  resource: extraResourceNameSchema,
  id: optionalId,
  values: z.record(z.string(), z.unknown()),
})
export const extraResourceDeleteSchema = z.object({
  resource: extraResourceNameSchema,
  id: z.string().uuid(),
})

const resourceSchemas: Record<ExtraResourceName, z.ZodType> = {
  favoritePlaces: z.object({
    name: z.string().trim().min(1).max(120),
    kind: z.enum([
      'AREA',
      'MUSEUM',
      'CAFE',
      'SHOP',
      'PORT',
      'SCENERY',
      'OTHER',
    ]),
    description: optionalText,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    favorite: z.boolean().default(false),
    visited: z.boolean().default(false),
    rank: z.number().int().positive().nullable().optional(),
  }),
  albums: z.object({
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    visitId: z.string().uuid().nullable().optional(),
    coverPhotoId: z.string().uuid().nullable().optional(),
  }),
  collectionItems: z.object({
    title: z.string().trim().min(1).max(120),
    kind: z.enum([
      'SHOP',
      'SCENERY',
      'BEACH',
      'CAT',
      'ARCHITECTURE',
      'ART',
      'OTHER',
    ]),
    description: optionalText,
    photoId: z.string().uuid().nullable().optional(),
    placeId: z.string().uuid().nullable().optional(),
    discoveredAt: dateString.nullable().optional(),
  }),
  seasonalExperiences: z.object({
    season: z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']),
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    experienced: z.boolean().default(false),
    experiencedAt: dateString.nullable().optional(),
    photoId: z.string().uuid().nullable().optional(),
  }),
  calendarEvents: z.object({
    title: z.string().trim().min(1).max(120),
    date: dateString,
    kind: z.enum(['VISIT', 'NEXT_VISIT', 'ISLAND_EVENT', 'MILESTONE', 'OTHER']),
    description: optionalText,
  }),
  bingoItems: z.object({
    title: z.string().trim().min(1).max(120),
    completed: z.boolean().default(false),
    completedAt: z.coerce.date().nullable().optional(),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  }),
  islandQuests: z.object({
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    randomEligible: z.boolean().default(true),
    completed: z.boolean().default(false),
    completedAt: z.coerce.date().nullable().optional(),
  }),
  migrationJournalEntries: z.object({
    date: dateString,
    title: z.string().trim().min(1).max(120),
    content: z.string().trim().min(1).max(20_000),
  }),
  moodLogs: z.object({
    date: dateString,
    desireLevel: z.number().int().min(1).max(5),
    note: optionalText,
  }),
  reasonRevisions: z.object({
    reasonId: z.string().uuid().nullable().optional(),
    content: z.string().trim().min(1).max(4_000),
    recordedAt: dateString,
  }),
  timeInvestmentLogs: z.object({
    category: categorySchema,
    minutes: z.number().int().positive().max(100_000),
    note: optionalText,
    date: dateString,
  }),
  moneyInvestmentLogs: z.object({
    category: categorySchema,
    amount: z.number().int().positive().max(1_000_000_000),
    note: z.string().trim().min(1).max(1_000),
    date: dateString,
  }),
  milestoneEvents: z.object({
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    date: dateString,
    category: categorySchema.nullable().optional(),
    automatic: z.boolean().default(false),
  }),
  selfMessages: z.object({
    type: z.enum(['PAST_ME', 'FUTURE_ME']),
    content: z.string().trim().min(1).max(4_000),
    revealAt: dateString.nullable().optional(),
  }),
  futureLetters: z.object({
    title: z.string().trim().min(1).max(120),
    content: z.string().trim().min(1).max(20_000),
    openOn: dateString,
    openedAt: z.coerce.date().nullable().optional(),
  }),
  futureProfiles: z.object({
    targetYear: z.number().int().min(2000).max(2200),
    residence: z.string().trim().min(1).max(120),
    workStyle: z.string().trim().min(1).max(120),
    workDaysPerWeek: z.number().min(0).max(7),
    monthlyIncome: z.number().int().min(0).max(100_000_000),
    hobbies: z.array(z.string().trim().min(1).max(80)).max(100),
  }),
  futureProjects: z.object({
    title: z.string().trim().min(1).max(120),
    description: optionalText,
    completed: z.boolean().default(false),
  }),
  originStories: z.object({
    firstVisitDate: dateString.nullable().optional(),
    decidedAt: dateString.nullable().optional(),
    title: z.string().trim().min(1).max(120),
    story: z.string().trim().min(1).max(20_000),
    photoId: z.string().uuid().nullable().optional(),
  }),
  seasonGoals: z.object({
    title: z.string().trim().min(1).max(120),
    category: categorySchema,
    startDate: dateString,
    endDate: dateString,
    completed: z.boolean().default(false),
  }),
  focusSettings: z.object({
    category: categorySchema,
    note: optionalText,
    startDate: dateString,
    endDate: dateString,
  }),
  anniversaries: z.object({
    title: z.string().trim().min(1).max(120),
    date: dateString,
    description: optionalText,
  }),
  decisionLogs: z.object({
    title: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(10_000),
    decidedAt: dateString,
  }),
  antiGoals: z.object({
    title: z.string().trim().min(1).max(120),
    reason: optionalText,
    active: z.boolean().default(true),
  }),
  lifestyleComparisons: z.object({
    label: z.string().trim().min(1).max(120),
    currentValue: z.string().trim().min(1).max(120),
    naoshimaValue: z.string().trim().min(1).max(120),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  }),
  fixedCostReductions: z.object({
    title: z.string().trim().min(1).max(120),
    monthlyAmount: z.number().int().positive().max(100_000_000),
    effectiveDate: dateString,
    note: optionalText,
  }),
  timeCapsules: z.object({
    title: z.string().trim().min(1).max(120),
    content: optionalText,
    revealAt: dateString,
    mediaType: z.enum(['NONE', 'PHOTO', 'AUDIO']).default('NONE'),
    storageKey: z.string().trim().max(500).nullable().optional(),
    mediaUrl: z.string().trim().max(1_000).nullable().optional(),
    openedAt: z.coerce.date().nullable().optional(),
  }),
  photoComparisons: z.object({
    title: z.string().trim().min(1).max(120),
    placeId: z.string().uuid().nullable().optional(),
    description: optionalText,
  }),
}

export function parseExtraResourceValues(
  resource: ExtraResourceName,
  values: Record<string, unknown>,
) {
  return resourceSchemas[resource].parse(values) as Record<string, unknown>
}
