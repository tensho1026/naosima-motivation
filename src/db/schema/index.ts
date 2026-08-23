import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}

export const progressCategoryValues = [
  'MONEY',
  'WORK',
  'SKILL',
  'LIFESTYLE',
  'NAOSHIMA',
  'CONNECTION',
] as const
const missionTypeValues = ['DAILY', 'MONTHLY', 'YEARLY'] as const
const roadmapStatusValues = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const
const savingTypeValues = ['DEPOSIT', 'WITHDRAWAL'] as const
const incomeTypeValues = [
  'SALARY',
  'FREELANCE',
  'SIDE_JOB',
  'PRODUCT',
  'OTHER',
] as const
const skillStatusValues = ['LOCKED', 'LEARNING', 'ACHIEVED'] as const
const actionTypeValues = [
  'MISSION_COMPLETED',
  'MISSION_UNCOMPLETED',
  'XP_GAINED',
  'SAVING',
  'CONDITION_COMPLETED',
  'SKILL_UP',
  'ACHIEVEMENT',
  'VISIT',
  'REVIEW',
  'OTHER',
] as const
const messageTypeValues = ['PAST_ME', 'FUTURE_ME'] as const

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
const category = (name = 'category') =>
  text(name, { enum: progressCategoryValues })
const timestamp = (name: string) => integer(name, { mode: 'timestamp' })

export const appSettings = sqliteTable('app_settings', {
  id: id(),
  migrationTargetDate: text('migration_target_date'),
  journeyStartedAt: text('journey_started_at').notNull(),
  birthDate: text('birth_date'),
  virtualJourneyDistance: integer('virtual_journey_distance')
    .notNull()
    .default(1000),
  ...timestamps,
})

export const migrationConditions = sqliteTable(
  'migration_conditions',
  {
    id: id(),
    title: text('title').notNull(),
    description: text('description'),
    category: category('category').notNull(),
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    required: integer('required', { mode: 'boolean' }).notNull().default(true),
    weight: integer('weight').notNull().default(1),
    targetValue: real('target_value'),
    currentValue: real('current_value'),
    unit: text('unit'),
    completedAt: timestamp('completed_at'),
    ...timestamps,
  },
  (table) => [index('idx_conditions_category').on(table.category)],
)

export const roadmapItems = sqliteTable('roadmap_items', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: text('target_date').notNull(),
  status: text('status', { enum: roadmapStatusValues })
    .notNull()
    .default('NOT_STARTED'),
  category: category('category').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const skills = sqliteTable('skills', {
  id: id(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  level: integer('level').notNull().default(0),
  targetLevel: integer('target_level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  parentSkillId: text('parent_skill_id'),
  status: text('status', { enum: skillStatusValues })
    .notNull()
    .default('LEARNING'),
  ...timestamps,
})

export const skillDependencies = sqliteTable(
  'skill_dependencies',
  {
    id: id(),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    dependsOnSkillId: text('depends_on_skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('skill_dependency_unique').on(
      table.skillId,
      table.dependsOnSkillId,
    ),
  ],
)

export const missions = sqliteTable(
  'missions',
  {
    id: id(),
    title: text('title').notNull(),
    description: text('description'),
    type: text('type', { enum: missionTypeValues }).notNull(),
    category: category('category').notNull(),
    xp: integer('xp').notNull().default(0),
    impactScore: integer('impact_score').notNull().default(3),
    estimatedMinutes: integer('estimated_minutes').notNull().default(30),
    minimumTitle: text('minimum_title'),
    minimumMinutes: integer('minimum_minutes'),
    weeklyPriority: integer('weekly_priority', { mode: 'boolean' })
      .notNull()
      .default(false),
    skillId: text('skill_id').references(() => skills.id, {
      onDelete: 'set null',
    }),
    scheduledDate: text('scheduled_date'),
    month: integer('month'),
    year: integer('year'),
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    completedAt: timestamp('completed_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_missions_schedule').on(
      table.type,
      table.scheduledDate,
      table.completed,
    ),
  ],
)

export const xpTransactions = sqliteTable(
  'xp_transactions',
  {
    id: id(),
    amount: integer('amount').notNull(),
    category: category('category').notNull(),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id'),
    description: text('description').notNull(),
    reversedAt: timestamp('reversed_at'),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('xp_source_unique').on(table.sourceType, table.sourceId),
  ],
)

export const savingTransactions = sqliteTable(
  'saving_transactions',
  {
    id: id(),
    amount: integer('amount').notNull(),
    type: text('type', { enum: savingTypeValues }).notNull(),
    note: text('note'),
    date: text('date').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('idx_savings_date').on(table.date)],
)

export const financeSettings = sqliteTable('finance_settings', {
  id: id(),
  currentSavings: integer('current_savings').notNull().default(0),
  targetSavings: integer('target_savings').notNull().default(2_000_000),
  monthlySavingTarget: integer('monthly_saving_target')
    .notNull()
    .default(50_000),
  ...timestamps,
})

export const lifeSimulations = sqliteTable('life_simulations', {
  id: id(),
  name: text('name').notNull().default('基本プラン'),
  salary: integer('salary').notNull().default(0),
  sideIncome: integer('side_income').notNull().default(0),
  rent: integer('rent').notNull().default(0),
  food: integer('food').notNull().default(0),
  utilities: integer('utilities').notNull().default(0),
  internet: integer('internet').notNull().default(0),
  transport: integer('transport').notNull().default(0),
  entertainment: integer('entertainment').notNull().default(0),
  other: integer('other').notNull().default(0),
  plannedSaving: integer('planned_saving').notNull().default(0),
  ...timestamps,
})

export const migrationScenarios = sqliteTable('migration_scenarios', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  monthlyIncome: integer('monthly_income').notNull(),
  monthlyExpenses: integer('monthly_expenses').notNull(),
  monthlySaving: integer('monthly_saving').notNull(),
  currentSavings: integer('current_savings').notNull(),
  targetSavings: integer('target_savings').notNull(),
  ...timestamps,
})

export const careerConditions = sqliteTable('career_conditions', {
  id: id(),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  targetValue: real('target_value'),
  currentValue: real('current_value'),
  unit: text('unit'),
  ...timestamps,
})

export const incomeSources = sqliteTable('income_sources', {
  id: id(),
  name: text('name').notNull(),
  type: text('type', { enum: incomeTypeValues }).notNull(),
  monthlyAmount: integer('monthly_amount').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

export const sideIncomeGoals = sqliteTable('side_income_goals', {
  id: id(),
  level: integer('level').notNull(),
  monthlyAmount: integer('monthly_amount').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const idealDayItems = sqliteTable('ideal_day_items', {
  id: id(),
  time: text('time').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const idealWeekItems = sqliteTable('ideal_week_items', {
  id: id(),
  weekday: integer('weekday').notNull(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const futureDiaries = sqliteTable('future_diaries', {
  id: id(),
  title: text('title').notNull(),
  futureDate: text('future_date').notNull(),
  content: text('content').notNull(),
  ...timestamps,
})

export const bucketItems = sqliteTable('bucket_items', {
  id: id(),
  title: text('title').notNull(),
  kind: text('kind', { enum: ['BUCKET', 'DREAM', 'PROJECT'] })
    .notNull()
    .default('BUCKET'),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const naoshimaReasons = sqliteTable('naoshima_reasons', {
  id: id(),
  content: text('content').notNull(),
  ...timestamps,
})

export const photos = sqliteTable(
  'photos',
  {
    id: id(),
    storageKey: text('storage_key').notNull().unique(),
    imageUrl: text('image_url').notNull(),
    caption: text('caption'),
    takenAt: text('taken_at'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('idx_photos_favorite_taken').on(table.favorite, table.takenAt),
  ],
)

export const visits = sqliteTable(
  'visits',
  {
    id: id(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    rating: integer('rating'),
    ...timestamps,
  },
  (table) => [index('idx_visits_dates').on(table.startDate, table.endDate)],
)

export const visitPlaces = sqliteTable(
  'visit_places',
  {
    id: id(),
    visitId: text('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),
    placeName: text('place_name').notNull(),
  },
  (table) => [
    uniqueIndex('visit_place_unique').on(table.visitId, table.placeName),
  ],
)

export const memories = sqliteTable('memories', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  photoId: text('photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  visitId: text('visit_id').references(() => visits.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
})

export const favoritePlaces = sqliteTable('favorite_places', {
  id: id(),
  name: text('name').notNull(),
  kind: text('kind', {
    enum: ['AREA', 'MUSEUM', 'CAFE', 'SHOP', 'PORT', 'SCENERY', 'OTHER'],
  }).notNull(),
  description: text('description'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  visited: integer('visited', { mode: 'boolean' }).notNull().default(false),
  rank: integer('rank'),
  ...timestamps,
})

export const albums = sqliteTable('albums', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  visitId: text('visit_id').references(() => visits.id, {
    onDelete: 'set null',
  }),
  coverPhotoId: text('cover_photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
})

export const albumPhotos = sqliteTable(
  'album_photos',
  {
    id: id(),
    albumId: text('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    uniqueIndex('album_photo_unique').on(table.albumId, table.photoId),
  ],
)

export const collectionItems = sqliteTable('collection_items', {
  id: id(),
  title: text('title').notNull(),
  kind: text('kind', {
    enum: ['SHOP', 'SCENERY', 'BEACH', 'CAT', 'ARCHITECTURE', 'ART', 'OTHER'],
  }).notNull(),
  description: text('description'),
  photoId: text('photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  placeId: text('place_id').references(() => favoritePlaces.id, {
    onDelete: 'set null',
  }),
  discoveredAt: text('discovered_at'),
  ...timestamps,
})

export const seasonalExperiences = sqliteTable('seasonal_experiences', {
  id: id(),
  season: text('season', {
    enum: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  experienced: integer('experienced', { mode: 'boolean' })
    .notNull()
    .default(false),
  experiencedAt: text('experienced_at'),
  photoId: text('photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
})

export const calendarEvents = sqliteTable('calendar_events', {
  id: id(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  kind: text('kind', {
    enum: ['VISIT', 'NEXT_VISIT', 'ISLAND_EVENT', 'MILESTONE', 'OTHER'],
  }).notNull(),
  description: text('description'),
  ...timestamps,
})

export const bingoItems = sqliteTable('bingo_items', {
  id: id(),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const islandQuests = sqliteTable('island_quests', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  randomEligible: integer('random_eligible', { mode: 'boolean' })
    .notNull()
    .default(true),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: timestamp('completed_at'),
  ...timestamps,
})

export const nextVisitItems = sqliteTable('next_visit_items', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  priority: integer('priority').notNull().default(3),
  ...timestamps,
})

export const achievementDefinitions = sqliteTable('achievement_definitions', {
  id: id(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  kind: text('kind').notNull(),
  threshold: real('threshold').notNull(),
  icon: text('icon').notNull().default('Trophy'),
})

export const userAchievements = sqliteTable(
  'user_achievements',
  {
    id: id(),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievementDefinitions.id, { onDelete: 'cascade' }),
    unlockedAt: timestamp('unlocked_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('user_achievement_unique').on(table.achievementId)],
)

export const actionLogs = sqliteTable(
  'action_logs',
  {
    id: id(),
    type: text('type', { enum: actionTypeValues }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: category('category'),
    amount: real('amount'),
    sourceId: text('source_id'),
    occurredAt: timestamp('occurred_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('idx_action_logs_occurred').on(table.occurredAt)],
)

export const monthlyReviews = sqliteTable(
  'monthly_reviews',
  {
    id: id(),
    month: text('month').notNull(),
    goodThings: text('good_things').notNull().default(''),
    nextMonth: text('next_month').notNull().default(''),
    closerToNaoshima: text('closer_to_naoshima').notNull().default(''),
    notes: text('notes').notNull().default(''),
    ...timestamps,
  },
  (table) => [uniqueIndex('monthly_review_month_unique').on(table.month)],
)

export const migrationJournalEntries = sqliteTable(
  'migration_journal_entries',
  {
    id: id(),
    date: text('date').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    ...timestamps,
  },
)

export const moodLogs = sqliteTable(
  'mood_logs',
  {
    id: id(),
    date: text('date').notNull(),
    desireLevel: integer('desire_level').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('mood_log_date_unique').on(table.date)],
)

export const reasonRevisions = sqliteTable('reason_revisions', {
  id: id(),
  reasonId: text('reason_id').references(() => naoshimaReasons.id, {
    onDelete: 'set null',
  }),
  content: text('content').notNull(),
  recordedAt: text('recorded_at').notNull(),
  ...timestamps,
})

export const timeInvestmentLogs = sqliteTable('time_investment_logs', {
  id: id(),
  category: category('category').notNull(),
  minutes: integer('minutes').notNull(),
  note: text('note'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
})

export const moneyInvestmentLogs = sqliteTable('money_investment_logs', {
  id: id(),
  category: category('category').notNull(),
  amount: integer('amount').notNull(),
  note: text('note').notNull(),
  date: text('date').notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
})

export const milestoneEvents = sqliteTable('milestone_events', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  category: category('category'),
  automatic: integer('automatic', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const monthlySnapshots = sqliteTable(
  'monthly_snapshots',
  {
    id: id(),
    month: text('month').notNull(),
    readiness: real('readiness').notNull(),
    savings: integer('savings').notNull(),
    totalXp: integer('total_xp').notNull(),
    completedMissions: integer('completed_missions').notNull(),
    skillLevels: text('skill_levels', { mode: 'json' })
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    createdAt: timestamp('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('monthly_snapshot_month_unique').on(table.month)],
)

export const selfMessages = sqliteTable('self_messages', {
  id: id(),
  type: text('type', { enum: messageTypeValues }).notNull(),
  content: text('content').notNull(),
  revealAt: text('reveal_at'),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
})

export const futureLetters = sqliteTable('future_letters', {
  id: id(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  openOn: text('open_on').notNull(),
  openedAt: timestamp('opened_at'),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
})

export const futureProfiles = sqliteTable('future_profiles', {
  id: id(),
  targetYear: integer('target_year').notNull(),
  residence: text('residence').notNull(),
  workStyle: text('work_style').notNull(),
  workDaysPerWeek: real('work_days_per_week').notNull(),
  monthlyIncome: integer('monthly_income').notNull(),
  hobbies: text('hobbies', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  ...timestamps,
})

export const futureProjects = sqliteTable('future_projects', {
  id: id(),
  title: text('title').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const originStories = sqliteTable('origin_stories', {
  id: id(),
  firstVisitDate: text('first_visit_date'),
  decidedAt: text('decided_at'),
  title: text('title').notNull(),
  story: text('story').notNull(),
  photoId: text('photo_id').references(() => photos.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
})

export const seasonGoals = sqliteTable('season_goals', {
  id: id(),
  title: text('title').notNull(),
  category: category('category').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const focusSettings = sqliteTable('focus_settings', {
  id: id(),
  category: category('category').notNull(),
  note: text('note'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  ...timestamps,
})

export const anniversaries = sqliteTable('anniversaries', {
  id: id(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  ...timestamps,
})

export const decisionLogs = sqliteTable('decision_logs', {
  id: id(),
  title: text('title').notNull(),
  reason: text('reason').notNull(),
  decidedAt: text('decided_at').notNull(),
  ...timestamps,
})

export const antiGoals = sqliteTable('anti_goals', {
  id: id(),
  title: text('title').notNull(),
  reason: text('reason'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

export const lifestyleComparisons = sqliteTable('lifestyle_comparisons', {
  id: id(),
  label: text('label').notNull(),
  currentValue: text('current_value').notNull(),
  naoshimaValue: text('naoshima_value').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

export const fixedCostReductions = sqliteTable('fixed_cost_reductions', {
  id: id(),
  title: text('title').notNull(),
  monthlyAmount: integer('monthly_amount').notNull(),
  effectiveDate: text('effective_date').notNull(),
  note: text('note'),
  ...timestamps,
})

export const audioRecords = sqliteTable('audio_records', {
  id: id(),
  storageKey: text('storage_key').notNull().unique(),
  audioUrl: text('audio_url').notNull(),
  kind: text('kind', { enum: ['VOICE_MEMO', 'AMBIENCE'] }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  durationSeconds: integer('duration_seconds'),
  recordedAt: timestamp('recorded_at').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  createdAt: timestamp('created_at')
    .notNull()
    .$defaultFn(() => new Date()),
})

export const timeCapsules = sqliteTable('time_capsules', {
  id: id(),
  title: text('title').notNull(),
  content: text('content'),
  revealAt: text('reveal_at').notNull(),
  mediaType: text('media_type', { enum: ['NONE', 'PHOTO', 'AUDIO'] })
    .notNull()
    .default('NONE'),
  storageKey: text('storage_key'),
  mediaUrl: text('media_url'),
  openedAt: timestamp('opened_at'),
  ...timestamps,
})

export const photoComparisons = sqliteTable('photo_comparisons', {
  id: id(),
  title: text('title').notNull(),
  placeId: text('place_id').references(() => favoritePlaces.id, {
    onDelete: 'set null',
  }),
  description: text('description'),
  ...timestamps,
})

export const photoComparisonItems = sqliteTable(
  'photo_comparison_items',
  {
    id: id(),
    comparisonId: text('comparison_id')
      .notNull()
      .references(() => photoComparisons.id, { onDelete: 'cascade' }),
    photoId: text('photo_id')
      .notNull()
      .references(() => photos.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [
    uniqueIndex('photo_comparison_item_unique').on(
      table.comparisonId,
      table.photoId,
    ),
  ],
)
