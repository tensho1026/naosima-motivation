import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm'

import { getDatabase } from '#/db/index.server'
import {
  achievementDefinitions,
  actionLogs,
  appSettings,
  careerConditions,
  financeSettings,
  incomeSources,
  lifeSimulations,
  migrationConditions,
  migrationScenarios,
  missions,
  roadmapItems,
  savingTransactions,
  sideIncomeGoals,
  skills,
  userAchievements,
  xpTransactions,
} from '#/db/schema'
import { requiredXp } from '#/services/xp.service'

type ConditionInput = typeof migrationConditions.$inferInsert
type MissionInput = typeof missions.$inferInsert
type RoadmapInput = typeof roadmapItems.$inferInsert
type SkillInput = typeof skills.$inferInsert

function levelForXp(xp: number, targetLevel: number) {
  let level = 0
  for (let candidate = 1; candidate <= targetLevel; candidate += 1) {
    if (xp < requiredXp(candidate)) break
    level = candidate
  }
  return level
}

function statusForLevel(
  level: number,
  targetLevel: number,
  currentStatus: 'LOCKED' | 'LEARNING' | 'ACHIEVED',
) {
  if (targetLevel > 0 && level >= targetLevel) return 'ACHIEVED' as const
  return currentStatus === 'LOCKED'
    ? ('LOCKED' as const)
    : ('LEARNING' as const)
}

export class CoreRepository {
  private readonly db = getDatabase()

  getSettings() {
    return this.db.select().from(appSettings).limit(1).get()
  }

  async saveSettings(input: Omit<typeof appSettings.$inferInsert, 'id'>) {
    const current = await this.getSettings()
    if (current) {
      return this.db
        .update(appSettings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(appSettings.id, current.id))
        .returning()
        .get()
    }
    return this.db.insert(appSettings).values(input).returning().get()
  }

  listConditions() {
    return this.db
      .select()
      .from(migrationConditions)
      .orderBy(
        asc(migrationConditions.category),
        asc(migrationConditions.createdAt),
      )
      .all()
  }

  saveCondition(input: ConditionInput) {
    if (input.id) {
      return this.db
        .update(migrationConditions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(migrationConditions.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(migrationConditions).values(input).returning().get()
  }

  deleteCondition(id: string) {
    return this.db
      .delete(migrationConditions)
      .where(eq(migrationConditions.id, id))
      .returning()
      .get()
  }

  async toggleCondition(id: string) {
    const condition = await this.db
      .select()
      .from(migrationConditions)
      .where(eq(migrationConditions.id, id))
      .get()
    if (!condition) throw new Error('Condition not found')
    const completed = !condition.completed
    const now = new Date()
    const update = this.db
      .update(migrationConditions)
      .set({ completed, completedAt: completed ? now : null, updatedAt: now })
      .where(eq(migrationConditions.id, id))
    const action = this.db.insert(actionLogs).values({
      type: completed ? 'CONDITION_COMPLETED' : 'OTHER',
      title: completed
        ? `条件達成: ${condition.title}`
        : `条件を未達成へ: ${condition.title}`,
      category: condition.category,
      sourceId: condition.id,
      occurredAt: now,
    })
    await this.db.batch([update, action])
    return { ...condition, completed, completedAt: completed ? now : null }
  }

  listRoadmap() {
    return this.db
      .select()
      .from(roadmapItems)
      .orderBy(asc(roadmapItems.sortOrder))
      .all()
  }

  saveRoadmapItem(input: RoadmapInput) {
    if (input.id) {
      return this.db
        .update(roadmapItems)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(roadmapItems.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(roadmapItems).values(input).returning().get()
  }

  deleteRoadmapItem(id: string) {
    return this.db
      .delete(roadmapItems)
      .where(eq(roadmapItems.id, id))
      .returning()
      .get()
  }

  async reorderRoadmap(ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.db
          .update(roadmapItems)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(eq(roadmapItems.id, id))
          .run(),
      ),
    )
    return this.listRoadmap()
  }

  listMissions() {
    return this.db
      .select()
      .from(missions)
      .orderBy(asc(missions.completed), asc(missions.createdAt))
      .all()
  }

  saveMission(input: MissionInput) {
    if (input.id) {
      return this.db
        .update(missions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(missions.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(missions).values(input).returning().get()
  }

  deleteMission(id: string) {
    return this.db.delete(missions).where(eq(missions.id, id)).returning().get()
  }

  /**
   * Lean mission completion used while XP, Skill XP, and achievements are
   * disabled. The original completeMission/uncompleteMission methods remain
   * below for one-step restoration of the gamification bundle.
   */
  async setMissionCompleted(id: string, completed: boolean) {
    const mission = await this.db
      .select()
      .from(missions)
      .where(eq(missions.id, id))
      .get()
    if (!mission) throw new Error('Mission not found')
    if (mission.completed === completed) return mission

    const now = new Date()
    await this.db.batch([
      this.db
        .update(missions)
        .set({
          completed,
          completedAt: completed ? now : null,
          updatedAt: now,
        })
        .where(eq(missions.id, id)),
      this.db.insert(actionLogs).values({
        type: completed ? 'MISSION_COMPLETED' : 'MISSION_UNCOMPLETED',
        title: mission.title,
        description: completed ? '行動を完了' : '行動を未完了へ戻した',
        category: mission.category,
        sourceId: mission.id,
        occurredAt: now,
      }),
    ])

    return {
      ...mission,
      completed,
      completedAt: completed ? now : null,
      updatedAt: now,
    }
  }

  // FEATURE_ARCHIVE: XP・Skill XP・称号を復活するときは、この旧メソッドを
  // core.functions.ts の Mission mutations から再び呼び出します。
  async completeMission(id: string) {
    const mission = await this.db
      .select()
      .from(missions)
      .where(eq(missions.id, id))
      .get()
    if (!mission) throw new Error('Mission not found')
    if (mission.completed) return mission
    const previousXp = await this.db
      .select()
      .from(xpTransactions)
      .where(
        and(
          eq(xpTransactions.sourceType, 'MISSION'),
          eq(xpTransactions.sourceId, mission.id),
        ),
      )
      .get()
    const now = new Date()
    const linkedSkill = mission.skillId
      ? await this.db
          .select()
          .from(skills)
          .where(eq(skills.id, mission.skillId))
          .get()
      : null
    const missionUpdate = this.db
      .update(missions)
      .set({ completed: true, completedAt: now, updatedAt: now })
      .where(and(eq(missions.id, mission.id), eq(missions.completed, false)))
    const xpWrite = previousXp
      ? this.db
          .update(xpTransactions)
          .set({ amount: mission.xp, reversedAt: null })
          .where(eq(xpTransactions.id, previousXp.id))
      : this.db.insert(xpTransactions).values({
          amount: mission.xp,
          category: mission.category,
          sourceType: 'MISSION',
          sourceId: mission.id,
          description: mission.title,
          createdAt: now,
        })
    const action = this.db.insert(actionLogs).values({
      type: 'MISSION_COMPLETED',
      title: mission.title,
      description: `+${mission.xp} XP`,
      category: mission.category,
      amount: mission.xp,
      sourceId: mission.id,
      occurredAt: now,
    })
    if (mission.skillId && linkedSkill) {
      const nextSkillXp = linkedSkill.xp + mission.xp
      const nextSkillLevel = levelForXp(nextSkillXp, linkedSkill.targetLevel)
      const skillUpdate = this.db
        .update(skills)
        .set({
          xp: nextSkillXp,
          level: nextSkillLevel,
          status: statusForLevel(
            nextSkillLevel,
            linkedSkill.targetLevel,
            linkedSkill.status,
          ),
          updatedAt: now,
        })
        .where(eq(skills.id, mission.skillId))
      const matchingConditions = await this.db
        .select({
          id: migrationConditions.id,
          title: migrationConditions.title,
        })
        .from(migrationConditions)
        .where(eq(migrationConditions.category, 'SKILL'))
        .all()
      const matchingIds = matchingConditions
        .filter((condition) =>
          condition.title
            .toLocaleLowerCase('ja')
            .includes(linkedSkill.name.toLocaleLowerCase('ja')),
        )
        .map((condition) => condition.id)
      if (matchingIds.length > 0) {
        const conditionUpdate = this.db
          .update(migrationConditions)
          .set({
            currentValue: nextSkillLevel,
            completed: sql<boolean>`${nextSkillLevel} >= ${migrationConditions.targetValue}`,
            completedAt: sql`case when ${nextSkillLevel} >= ${migrationConditions.targetValue} then coalesce(${migrationConditions.completedAt}, unixepoch()) else null end`,
            updatedAt: now,
          })
          .where(inArray(migrationConditions.id, matchingIds))
        await this.db.batch([
          missionUpdate,
          xpWrite,
          action,
          skillUpdate,
          conditionUpdate,
        ])
      } else {
        await this.db.batch([missionUpdate, xpWrite, action, skillUpdate])
      }
    } else {
      await this.db.batch([missionUpdate, xpWrite, action])
    }
    return { ...mission, completed: true, completedAt: now }
  }

  async uncompleteMission(id: string) {
    const mission = await this.db
      .select()
      .from(missions)
      .where(eq(missions.id, id))
      .get()
    if (!mission) throw new Error('Mission not found')
    if (!mission.completed) return mission
    const now = new Date()
    const linkedSkill = mission.skillId
      ? await this.db
          .select()
          .from(skills)
          .where(eq(skills.id, mission.skillId))
          .get()
      : null
    const missionUpdate = this.db
      .update(missions)
      .set({ completed: false, completedAt: null, updatedAt: now })
      .where(eq(missions.id, id))
    const xpRollback = this.db
      .update(xpTransactions)
      .set({ reversedAt: now })
      .where(
        and(
          eq(xpTransactions.sourceType, 'MISSION'),
          eq(xpTransactions.sourceId, id),
          isNull(xpTransactions.reversedAt),
        ),
      )
    const action = this.db.insert(actionLogs).values({
      type: 'MISSION_UNCOMPLETED',
      title: mission.title,
      description: `-${mission.xp} XP`,
      category: mission.category,
      amount: -mission.xp,
      sourceId: mission.id,
      occurredAt: now,
    })
    if (mission.skillId && linkedSkill) {
      const nextSkillXp = Math.max(linkedSkill.xp - mission.xp, 0)
      const nextSkillLevel = levelForXp(nextSkillXp, linkedSkill.targetLevel)
      const skillUpdate = this.db
        .update(skills)
        .set({
          xp: nextSkillXp,
          level: nextSkillLevel,
          status: statusForLevel(
            nextSkillLevel,
            linkedSkill.targetLevel,
            linkedSkill.status,
          ),
          updatedAt: now,
        })
        .where(eq(skills.id, mission.skillId))
      const matchingConditions = await this.db
        .select({
          id: migrationConditions.id,
          title: migrationConditions.title,
        })
        .from(migrationConditions)
        .where(eq(migrationConditions.category, 'SKILL'))
        .all()
      const matchingIds = matchingConditions
        .filter((condition) =>
          condition.title
            .toLocaleLowerCase('ja')
            .includes(linkedSkill.name.toLocaleLowerCase('ja')),
        )
        .map((condition) => condition.id)
      if (matchingIds.length > 0) {
        const conditionUpdate = this.db
          .update(migrationConditions)
          .set({
            currentValue: nextSkillLevel,
            completed: sql<boolean>`${nextSkillLevel} >= ${migrationConditions.targetValue}`,
            completedAt: sql`case when ${nextSkillLevel} >= ${migrationConditions.targetValue} then coalesce(${migrationConditions.completedAt}, unixepoch()) else null end`,
            updatedAt: now,
          })
          .where(inArray(migrationConditions.id, matchingIds))
        await this.db.batch([
          missionUpdate,
          xpRollback,
          action,
          skillUpdate,
          conditionUpdate,
        ])
      } else {
        await this.db.batch([missionUpdate, xpRollback, action, skillUpdate])
      }
    } else {
      await this.db.batch([missionUpdate, xpRollback, action])
    }
    return { ...mission, completed: false, completedAt: null }
  }

  getFinanceSettings() {
    return this.db.select().from(financeSettings).limit(1).get()
  }

  async saveFinanceSettings(
    input: Omit<typeof financeSettings.$inferInsert, 'id'>,
  ) {
    const current = await this.getFinanceSettings()
    const now = new Date()
    const conditionUpdate = this.db
      .update(migrationConditions)
      .set({
        currentValue: input.currentSavings,
        completed: sql<boolean>`${input.currentSavings} >= ${migrationConditions.targetValue}`,
        completedAt: sql`case when ${input.currentSavings} >= ${migrationConditions.targetValue} then coalesce(${migrationConditions.completedAt}, unixepoch()) else null end`,
        updatedAt: now,
      })
      .where(
        and(
          eq(migrationConditions.category, 'MONEY'),
          eq(migrationConditions.unit, '円'),
          isNotNull(migrationConditions.targetValue),
        ),
      )
    if (current) {
      await this.db.batch([
        this.db
          .update(financeSettings)
          .set({ ...input, updatedAt: now })
          .where(eq(financeSettings.id, current.id)),
        conditionUpdate,
      ])
    } else {
      await this.db.batch([
        this.db.insert(financeSettings).values(input),
        conditionUpdate,
      ])
    }
    return this.getFinanceSettings()
  }

  listSavings() {
    return this.db
      .select()
      .from(savingTransactions)
      .orderBy(desc(savingTransactions.date))
      .all()
  }

  // Bounded read for the lean home/finance loaders. listSavings() remains for
  // the archived charts and full-history restoration path.
  listRecentSavings(limit = 100) {
    return this.db
      .select()
      .from(savingTransactions)
      .orderBy(desc(savingTransactions.date))
      .limit(limit)
      .all()
  }

  async createSaving(input: typeof savingTransactions.$inferInsert) {
    const settings = await this.getFinanceSettings()
    if (!settings) throw new Error('Finance settings not found')
    const delta = input.type === 'DEPOSIT' ? input.amount : -input.amount
    const nextSavings = Math.max(settings.currentSavings + delta, 0)
    const transactionId = input.id ?? crypto.randomUUID()
    const insert = this.db
      .insert(savingTransactions)
      .values({ ...input, id: transactionId })
    const update = this.db
      .update(financeSettings)
      .set({ currentSavings: nextSavings, updatedAt: new Date() })
      .where(eq(financeSettings.id, settings.id))
    const action = this.db.insert(actionLogs).values({
      type: 'SAVING',
      title:
        input.note ||
        (input.type === 'DEPOSIT' ? '移住資金を追加' : '移住資金から減額'),
      amount: delta,
      category: 'MONEY',
      sourceId: transactionId,
      occurredAt: new Date(),
    })
    const conditionUpdate = this.db
      .update(migrationConditions)
      .set({
        currentValue: nextSavings,
        completed: sql`${nextSavings} >= ${migrationConditions.targetValue}`,
        completedAt: sql`case when ${nextSavings} >= ${migrationConditions.targetValue} then unixepoch() else null end`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(migrationConditions.category, 'MONEY'),
          eq(migrationConditions.unit, '円'),
          isNotNull(migrationConditions.targetValue),
        ),
      )
    await this.db.batch([insert, update, action, conditionUpdate])
    return { currentSavings: nextSavings }
  }

  async deleteSaving(id: string) {
    const transaction = await this.db
      .select()
      .from(savingTransactions)
      .where(eq(savingTransactions.id, id))
      .get()
    if (!transaction) throw new Error('Saving transaction not found')
    const settings = await this.getFinanceSettings()
    if (!settings) throw new Error('Finance settings not found')
    const reversal =
      transaction.type === 'DEPOSIT' ? -transaction.amount : transaction.amount
    const now = new Date()
    const nextSavings = Math.max(settings.currentSavings + reversal, 0)
    await this.db.batch([
      this.db.delete(savingTransactions).where(eq(savingTransactions.id, id)),
      this.db
        .update(financeSettings)
        .set({
          currentSavings: nextSavings,
          updatedAt: now,
        })
        .where(eq(financeSettings.id, settings.id)),
      this.db
        .update(migrationConditions)
        .set({
          currentValue: nextSavings,
          completed: sql<boolean>`${nextSavings} >= ${migrationConditions.targetValue}`,
          completedAt: sql`case when ${nextSavings} >= ${migrationConditions.targetValue} then coalesce(${migrationConditions.completedAt}, unixepoch()) else null end`,
          updatedAt: now,
        })
        .where(
          and(
            eq(migrationConditions.category, 'MONEY'),
            eq(migrationConditions.unit, '円'),
            isNotNull(migrationConditions.targetValue),
          ),
        ),
      this.db.insert(actionLogs).values({
        type: 'SAVING',
        title: `資金記録を削除: ${transaction.note ?? transaction.date}`,
        amount: reversal,
        category: 'MONEY',
        sourceId: transaction.id,
        occurredAt: now,
      }),
    ])
    return { deleted: true }
  }

  listLifeSimulations() {
    return this.db
      .select()
      .from(lifeSimulations)
      .orderBy(asc(lifeSimulations.createdAt))
      .all()
  }

  saveLifeSimulation(input: typeof lifeSimulations.$inferInsert) {
    if (input.id) {
      return this.db
        .update(lifeSimulations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(lifeSimulations.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(lifeSimulations).values(input).returning().get()
  }

  listScenarios() {
    return this.db
      .select()
      .from(migrationScenarios)
      .orderBy(asc(migrationScenarios.createdAt))
      .all()
  }

  saveScenario(input: typeof migrationScenarios.$inferInsert) {
    if (input.id) {
      return this.db
        .update(migrationScenarios)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(migrationScenarios.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(migrationScenarios).values(input).returning().get()
  }

  listSkills() {
    return this.db
      .select()
      .from(skills)
      .orderBy(asc(skills.category), asc(skills.name))
      .all()
  }

  saveSkill(input: SkillInput) {
    if (input.id) {
      return this.db
        .update(skills)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(skills.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(skills).values(input).returning().get()
  }

  deleteSkill(id: string) {
    return this.db.delete(skills).where(eq(skills.id, id)).returning().get()
  }

  async addSkillXp(id: string, amount: number) {
    const skill = await this.db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .get()
    if (!skill) throw new Error('Skill not found')
    const now = new Date()
    const nextXp = skill.xp + amount
    const nextLevel = levelForXp(nextXp, skill.targetLevel)
    const matchingConditions = await this.db
      .select({ id: migrationConditions.id, title: migrationConditions.title })
      .from(migrationConditions)
      .where(eq(migrationConditions.category, 'SKILL'))
      .all()
    const matchingIds = matchingConditions
      .filter((condition) =>
        condition.title
          .toLocaleLowerCase('ja')
          .includes(skill.name.toLocaleLowerCase('ja')),
      )
      .map((condition) => condition.id)
    const skillUpdate = this.db
      .update(skills)
      .set({
        xp: nextXp,
        level: nextLevel,
        status: statusForLevel(nextLevel, skill.targetLevel, skill.status),
        updatedAt: now,
      })
      .where(eq(skills.id, id))
    const action = this.db.insert(actionLogs).values({
      type: 'SKILL_UP',
      title: `${skill.name} +${amount} XP`,
      category: 'SKILL',
      amount,
      sourceId: skill.id,
      occurredAt: now,
    })
    if (matchingIds.length > 0) {
      const conditionUpdate = this.db
        .update(migrationConditions)
        .set({
          currentValue: nextLevel,
          completed: sql<boolean>`${nextLevel} >= ${migrationConditions.targetValue}`,
          completedAt: sql`case when ${nextLevel} >= ${migrationConditions.targetValue} then coalesce(${migrationConditions.completedAt}, unixepoch()) else null end`,
          updatedAt: now,
        })
        .where(inArray(migrationConditions.id, matchingIds))
      await this.db.batch([skillUpdate, action, conditionUpdate])
    } else {
      await this.db.batch([skillUpdate, action])
    }
    return this.db.select().from(skills).where(eq(skills.id, id)).get()
  }

  listCareer() {
    return Promise.all([
      this.db
        .select()
        .from(careerConditions)
        .orderBy(asc(careerConditions.createdAt))
        .all(),
      this.db
        .select()
        .from(incomeSources)
        .orderBy(desc(incomeSources.monthlyAmount))
        .all(),
      this.db
        .select()
        .from(sideIncomeGoals)
        .orderBy(asc(sideIncomeGoals.level))
        .all(),
    ]).then(([conditions, sources, goals]) => ({ conditions, sources, goals }))
  }

  saveCareerCondition(input: typeof careerConditions.$inferInsert) {
    if (input.id) {
      return this.db
        .update(careerConditions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(careerConditions.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(careerConditions).values(input).returning().get()
  }

  saveIncomeSource(input: typeof incomeSources.$inferInsert) {
    if (input.id) {
      return this.db
        .update(incomeSources)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(incomeSources.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(incomeSources).values(input).returning().get()
  }

  saveSideIncomeGoal(input: typeof sideIncomeGoals.$inferInsert) {
    if (input.id) {
      return this.db
        .update(sideIncomeGoals)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(sideIncomeGoals.id, input.id))
        .returning()
        .get()
    }
    return this.db.insert(sideIncomeGoals).values(input).returning().get()
  }

  async deleteCareerItem(kind: 'condition' | 'income' | 'goal', id: string) {
    if (kind === 'condition') {
      await this.db.delete(careerConditions).where(eq(careerConditions.id, id))
    } else if (kind === 'income') {
      await this.db.delete(incomeSources).where(eq(incomeSources.id, id))
    } else {
      await this.db.delete(sideIncomeGoals).where(eq(sideIncomeGoals.id, id))
    }
    return { deleted: true }
  }

  listActions(limit = 50) {
    return this.db
      .select()
      .from(actionLogs)
      .orderBy(desc(actionLogs.occurredAt))
      .limit(limit)
      .all()
  }

  logAction(input: typeof actionLogs.$inferInsert) {
    return this.db.insert(actionLogs).values(input).returning().get()
  }

  listAchievements() {
    return Promise.all([
      this.db.select().from(achievementDefinitions).all(),
      this.db.select().from(userAchievements).all(),
    ]).then(([definitions, unlocked]) => ({ definitions, unlocked }))
  }

  async unlockAchievementIds(ids: string[]) {
    if (ids.length === 0) return []
    const unlocked = []
    for (const achievementId of ids) {
      const row = await this.db
        .insert(userAchievements)
        .values({ achievementId })
        .onConflictDoNothing()
        .returning()
        .get()
      if (row) unlocked.push(row)
    }
    return unlocked
  }

  async logAchievements(
    definitions: Array<{ id: string; title: string; description: string }>,
  ) {
    for (const definition of definitions) {
      await this.db.insert(actionLogs).values({
        type: 'ACHIEVEMENT',
        title: `Achievement: ${definition.title}`,
        description: definition.description,
        sourceId: definition.id,
      })
    }
  }

  async totalXp() {
    const result = await this.db
      .select({
        total: sql<number>`coalesce(sum(${xpTransactions.amount}), 0)`,
      })
      .from(xpTransactions)
      .where(isNull(xpTransactions.reversedAt))
      .get()
    return result?.total ?? 0
  }
}

export function coreRepository() {
  return new CoreRepository()
}
