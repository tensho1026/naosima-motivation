import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  averageRecentMonthlySaving,
  calculateScenario,
  calculateSavingForecast as calculateSavingForecastValue,
} from '#/services/finance.service'
import { calculateJourney } from '#/services/journey.service'
import { calculateReadiness } from '#/services/readiness.service'
import { checkAndUnlockAchievements } from './achievement-check.server'
import { coreRepository } from './core-repository.server'
import {
  addSkillXpSchema,
  careerConditionSchema,
  conditionInputSchema,
  createMissionSchema,
  financeSettingsSchema,
  idSchema,
  incomeSourceSchema,
  lifeSimulationSchema,
  reorderSchema,
  roadmapInputSchema,
  scenarioSchema,
  settingsSchema,
  sideIncomeGoalSchema,
  skillInputSchema,
  updateMissionSchema,
  savingInputSchema,
} from './validation'

export const getSettings = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().getSettings(),
)

export const updateSettings = createServerFn({ method: 'POST' })
  .validator(settingsSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveSettings(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const getConditions = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listConditions(),
)

export const createCondition = createServerFn({ method: 'POST' })
  .validator(conditionInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveCondition(data))

export const updateCondition = createServerFn({ method: 'POST' })
  .validator(conditionInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveCondition(data))

export const completeCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const condition = await repository.toggleCondition(data.id)
    await checkAndUnlockAchievements(repository)
    return condition
  })

export const deleteCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCondition(data.id))

export const getRoadmap = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listRoadmap(),
)

export const createRoadmapItem = createServerFn({ method: 'POST' })
  .validator(roadmapInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveRoadmapItem(data))

export const updateRoadmapItem = createServerFn({ method: 'POST' })
  .validator(roadmapInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveRoadmapItem(data))

export const deleteRoadmapItem = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteRoadmapItem(data.id))

export const reorderRoadmapItems = createServerFn({ method: 'POST' })
  .validator(reorderSchema)
  .handler(({ data }) => coreRepository().reorderRoadmap(data.ids))

export const getJourney = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = coreRepository()
    const [settings, totalXp, conditions, roadmap] = await Promise.all([
      repository.getSettings(),
      repository.totalXp(),
      repository.listConditions(),
      repository.listRoadmap(),
    ])
    return {
      settings,
      totalXp,
      journey: calculateJourney(
        totalXp,
        settings?.virtualJourneyDistance ?? 1000,
      ),
      readiness: calculateReadiness(conditions),
      conditions,
      roadmap,
    }
  },
)

export const getMissions = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listMissions(),
)

export const createMission = createServerFn({ method: 'POST' })
  .validator(createMissionSchema)
  .handler(({ data }) => coreRepository().saveMission(data))

export const updateMission = createServerFn({ method: 'POST' })
  .validator(updateMissionSchema)
  .handler(({ data }) => coreRepository().saveMission(data))

export const deleteMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteMission(data.id))

export const completeMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const mission = await repository.completeMission(data.id)
    await checkAndUnlockAchievements(repository)
    return mission
  })

export const uncompleteMission = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().uncompleteMission(data.id))

export const getFinance = createServerFn({ method: 'GET' }).handler(
  async () => {
    const repository = coreRepository()
    const [settings, transactions, simulations, scenarios] = await Promise.all([
      repository.getFinanceSettings(),
      repository.listSavings(),
      repository.listLifeSimulations(),
      repository.listScenarios(),
    ])
    const average = averageRecentMonthlySaving(transactions)
    return {
      settings,
      transactions,
      simulations,
      scenarios: scenarios.map((scenario) => calculateScenario(scenario)),
      forecast: settings
        ? calculateSavingForecastValue({
            currentSavings: settings.currentSavings,
            targetSavings: settings.targetSavings,
            averageMonthlySaving: average,
            fallbackMonthlySaving: settings.monthlySavingTarget,
          })
        : null,
    }
  },
)

export const updateFinanceSettings = createServerFn({ method: 'POST' })
  .validator(financeSettingsSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveFinanceSettings(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const getSavingTransactions = createServerFn({ method: 'GET' }).handler(
  () => coreRepository().listSavings(),
)

export const createSavingTransaction = createServerFn({ method: 'POST' })
  .validator(savingInputSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.createSaving(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const deleteSavingTransaction = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteSaving(data.id))

export const calculateSavingForecast = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      currentSavings: z.number().nonnegative(),
      targetSavings: z.number().positive(),
      averageMonthlySaving: z.number().optional(),
      fallbackMonthlySaving: z.number().nonnegative(),
      from: z.coerce.date().optional(),
    }),
  )
  .handler(({ data }) => calculateSavingForecastValue(data))

export const saveLifeSimulation = createServerFn({ method: 'POST' })
  .validator(lifeSimulationSchema)
  .handler(({ data }) => coreRepository().saveLifeSimulation(data))

export const getLifeSimulation = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listLifeSimulations(),
)

export const saveMigrationScenario = createServerFn({ method: 'POST' })
  .validator(scenarioSchema)
  .handler(({ data }) => coreRepository().saveScenario(data))

export const getCareerConditions = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).conditions,
)

export const createCareerCondition = createServerFn({ method: 'POST' })
  .validator(careerConditionSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveCareerCondition(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const updateCareerCondition = createServerFn({ method: 'POST' })
  .validator(careerConditionSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveCareerCondition(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const deleteCareerCondition = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) =>
    coreRepository().deleteCareerItem('condition', data.id),
  )

export const getIncomeSources = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).sources,
)

export const createIncomeSource = createServerFn({ method: 'POST' })
  .validator(incomeSourceSchema.omit({ id: true }))
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveIncomeSource(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const updateIncomeSource = createServerFn({ method: 'POST' })
  .validator(incomeSourceSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.saveIncomeSource(data)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const deleteIncomeSource = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCareerItem('income', data.id))

export const getSideIncomeGoals = createServerFn({ method: 'GET' }).handler(
  async () => (await coreRepository().listCareer()).goals,
)

export const createSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(sideIncomeGoalSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveSideIncomeGoal(data))

export const updateSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(sideIncomeGoalSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveSideIncomeGoal(data))

export const deleteSideIncomeGoal = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteCareerItem('goal', data.id))

export const getSkills = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listSkills(),
)

export const createSkill = createServerFn({ method: 'POST' })
  .validator(skillInputSchema.omit({ id: true }))
  .handler(({ data }) => coreRepository().saveSkill(data))

export const updateSkill = createServerFn({ method: 'POST' })
  .validator(skillInputSchema.required({ id: true }))
  .handler(({ data }) => coreRepository().saveSkill(data))

export const deleteSkill = createServerFn({ method: 'POST' })
  .validator(idSchema)
  .handler(({ data }) => coreRepository().deleteSkill(data.id))

export const addSkillXp = createServerFn({ method: 'POST' })
  .validator(addSkillXpSchema)
  .handler(async ({ data }) => {
    const repository = coreRepository()
    const result = await repository.addSkillXp(data.id, data.amount)
    await checkAndUnlockAchievements(repository)
    return result
  })

export const getAchievements = createServerFn({ method: 'GET' }).handler(() =>
  coreRepository().listAchievements(),
)

export const checkAchievements = createServerFn({ method: 'POST' }).handler(
  () => checkAndUnlockAchievements(coreRepository()),
)
