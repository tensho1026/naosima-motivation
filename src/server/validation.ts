import { z } from 'zod'

import { missionTypes, progressCategories } from '#/types/domain'

export const idSchema = z.object({ id: z.string().uuid() })
export const dateString = z.string().date()
export const categorySchema = z.enum(progressCategories)

export const settingsSchema = z.object({
  migrationTargetDate: dateString,
  journeyStartedAt: dateString,
  birthDate: dateString.nullable().optional(),
  virtualJourneyDistance: z.number().int().min(100).max(100_000),
})

export const conditionInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).nullable().optional(),
  category: categorySchema,
  required: z.boolean().default(true),
  weight: z.number().int().min(1).max(100),
  targetValue: z.number().finite().nullable().optional(),
  currentValue: z.number().finite().nullable().optional(),
  unit: z.string().trim().max(24).nullable().optional(),
})

export const roadmapInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2_000).nullable().optional(),
  targetDate: dateString,
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  category: categorySchema,
  sortOrder: z.number().int().min(0).max(10_000),
})

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
})

export const missionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2_000).nullable().optional(),
    type: z.enum(missionTypes),
    category: categorySchema,
    xp: z.number().int().min(0).max(10_000),
    impactScore: z.number().int().min(1).max(5),
    estimatedMinutes: z.number().int().min(1).max(1_440),
    minimumTitle: z.string().trim().min(1).max(120).nullable().optional(),
    minimumMinutes: z.number().int().min(1).max(60).nullable().optional(),
    weeklyPriority: z.boolean().default(false),
    skillId: z.string().uuid().nullable().optional(),
    scheduledDate: dateString.nullable().optional(),
    month: z.number().int().min(1).max(12).nullable().optional(),
    year: z.number().int().min(2000).max(2200).nullable().optional(),
  })
  .refine(
    (value) => value.type !== 'DAILY' || value.scheduledDate != null,
    'Daily missions require a scheduled date',
  )

export const financeSettingsSchema = z.object({
  currentSavings: z.number().int().min(0).max(1_000_000_000),
  targetSavings: z.number().int().min(1).max(1_000_000_000),
  monthlySavingTarget: z.number().int().min(0).max(100_000_000),
})

export const savingInputSchema = z.object({
  amount: z.number().int().positive().max(100_000_000),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  note: z.string().trim().max(240).nullable().optional(),
  date: dateString,
})

export const lifeSimulationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  salary: z.number().int().min(0).max(100_000_000),
  sideIncome: z.number().int().min(0).max(100_000_000),
  rent: z.number().int().min(0).max(100_000_000),
  food: z.number().int().min(0).max(100_000_000),
  utilities: z.number().int().min(0).max(100_000_000),
  internet: z.number().int().min(0).max(100_000_000),
  transport: z.number().int().min(0).max(100_000_000),
  entertainment: z.number().int().min(0).max(100_000_000),
  other: z.number().int().min(0).max(100_000_000),
  plannedSaving: z.number().int().min(0).max(100_000_000),
})

export const scenarioSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2_000).nullable().optional(),
  monthlyIncome: z.number().int().min(0).max(100_000_000),
  monthlyExpenses: z.number().int().min(0).max(100_000_000),
  monthlySaving: z.number().int().min(0).max(100_000_000),
  currentSavings: z.number().int().min(0).max(1_000_000_000),
  targetSavings: z.number().int().min(1).max(1_000_000_000),
})

export const careerConditionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  completed: z.boolean().default(false),
  targetValue: z.number().finite().nullable().optional(),
  currentValue: z.number().finite().nullable().optional(),
  unit: z.string().trim().max(24).nullable().optional(),
})

export const incomeSourceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  type: z.enum(['SALARY', 'FREELANCE', 'SIDE_JOB', 'PRODUCT', 'OTHER']),
  monthlyAmount: z.number().int().min(0).max(100_000_000),
  active: z.boolean().default(true),
})

export const sideIncomeGoalSchema = z.object({
  id: z.string().uuid().optional(),
  level: z.number().int().min(1).max(100),
  monthlyAmount: z.number().int().min(0).max(100_000_000),
  completed: z.boolean().default(false),
})

export const skillInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(80),
  level: z.number().int().min(0).max(5),
  targetLevel: z.number().int().min(0).max(5),
  xp: z.number().int().min(0).max(10_000_000),
  parentSkillId: z.string().uuid().nullable().optional(),
  status: z.enum(['LOCKED', 'LEARNING', 'ACHIEVED']),
})

export const addSkillXpSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().positive().max(10_000),
})
