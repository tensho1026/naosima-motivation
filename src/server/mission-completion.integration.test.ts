// @vitest-environment node

import { readFileSync } from 'node:fs'
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from 'node:sqlite'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '#/test/cloudflare-workers.mock'

import { CoreRepository } from './core-repository.server'

type BoundValue = SQLInputValue | ArrayBuffer

function sqliteParams(values: BoundValue[]) {
  return values.map((value) =>
    value instanceof ArrayBuffer ? new Uint8Array(value) : value,
  )
}

class TestD1Statement {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly params: BoundValue[] = [],
  ) {}

  bind(...params: BoundValue[]) {
    return new TestD1Statement(this.database, this.query, params)
  }

  private statement(): StatementSync {
    return this.database.prepare(this.query)
  }

  async all() {
    const results = this.statement().all(
      ...sqliteParams(this.params),
    ) as Record<string, unknown>[]
    return { results, success: true, meta: {} }
  }

  async raw() {
    const { results } = await this.all()
    return results.map((row) => Object.values(row))
  }

  async run() {
    const result = this.statement().run(...sqliteParams(this.params))
    return {
      results: [],
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: result.lastInsertRowid,
      },
    }
  }
}

class TestD1Database {
  constructor(private readonly database: DatabaseSync) {}

  prepare(query: string) {
    return new TestD1Statement(this.database, query)
  }

  async batch(statements: TestD1Statement[]) {
    this.database.exec('begin')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.all())
      this.database.exec('commit')
      return results
    } catch (error) {
      this.database.exec('rollback')
      throw error
    }
  }
}

describe('Mission completion integration', () => {
  let database: DatabaseSync

  beforeEach(() => {
    database = new DatabaseSync(':memory:')
    for (const migration of [
      'drizzle/migrations/0000_sharp_rick_jones.sql',
      'drizzle/migrations/0001_same_jackal.sql',
    ]) {
      database.exec(
        readFileSync(new URL(`../../${migration}`, import.meta.url), 'utf8'),
      )
    }
    database.exec(`
      insert into skills (
        id, name, category, level, target_level, xp, status, created_at, updated_at
      ) values (
        '20000000-0000-4000-8000-000000000001', 'Go', 'Backend', 2, 4, 180,
        'LEARNING', unixepoch(), unixepoch()
      );
      insert into migration_conditions (
        id, title, category, completed, required, weight, target_value,
        current_value, unit, created_at, updated_at
      ) values (
        '10000000-0000-4000-8000-000000000001', 'Go Level 4', 'SKILL', 0, 1,
        4, 4, 2, 'Level', unixepoch(), unixepoch()
      );
      insert into missions (
        id, title, type, category, xp, impact_score, estimated_minutes,
        weekly_priority, skill_id, scheduled_date, completed, created_at, updated_at
      ) values (
        '30000000-0000-4000-8000-000000000001', 'Goを30分勉強', 'DAILY',
        'SKILL', 10, 3, 30, 1, '20000000-0000-4000-8000-000000000001',
        date('now'), 0, unixepoch(), unixepoch()
      );
    `)
    env.DB = new TestD1Database(database)
  })

  afterEach(() => database.close())

  it('completes the mission atomically without granting duplicate XP', async () => {
    const repository = new CoreRepository()

    await repository.completeMission('30000000-0000-4000-8000-000000000001')
    await repository.completeMission('30000000-0000-4000-8000-000000000001')

    expect(
      database.prepare('select completed from missions limit 1').get()
        ?.completed,
    ).toBe(1)
    expect(
      database
        .prepare(
          `select amount from xp_transactions
           where source_type = 'MISSION' and reversed_at is null`,
        )
        .get()?.amount,
    ).toBe(10)
    expect(
      database
        .prepare(
          `select count(*) as count from action_logs
           where type = 'MISSION_COMPLETED'`,
        )
        .get()?.count,
    ).toBe(1)
    expect(database.prepare('select xp from skills limit 1').get()?.xp).toBe(
      190,
    )
    expect(
      database.prepare('select count(*) as count from xp_transactions').get()
        ?.count,
    ).toBe(1)
  })
})
