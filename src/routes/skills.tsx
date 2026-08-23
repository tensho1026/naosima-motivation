import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { GitBranch, LockKeyhole, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  Badge,
  Card,
  Field,
  LoadingPage,
  Page,
  ProgressBar,
  Stat,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import { addSkillXp, createSkill, deleteSkill } from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/skills')({
  loader: () => getDashboard(),
  component: SkillsPage,
  pendingComponent: LoadingPage,
})

function SkillsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const [pending, setPending] = useState(false)
  const add = useServerFn(createSkill)
  const gain = useServerFn(addSkillXp)
  const remove = useServerFn(deleteSkill)
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
  const average = data.skills.length
    ? data.skills.reduce(
        (sum, skill) =>
          sum + (skill.level / Math.max(skill.targetLevel, 1)) * 100,
        0,
      ) / data.skills.length
    : 0
  return (
    <Page
      title="Skills"
      eyebrow="SKILLS FOR ISLAND LIFE"
      description="直島で働くために必要なスキルだけを木として育て、MissionのXPと接続します。"
    >
      <section className="stats-grid page-stats">
        <Stat
          label="登録Skill"
          value={data.skills.length}
          detail="必要なものに集中"
          tone="sea"
        />
        <Stat
          label="平均進捗"
          value={`${Math.round(average)}%`}
          detail="目標Levelとの比較"
          tone="green"
        />
        <Stat
          label="Skill Mission"
          value={
            data.missions.filter((mission) => mission.category === 'SKILL')
              .length
          }
          detail="完了でSkill XPへ"
          tone="gold"
        />
        <Stat
          label="総Life XP"
          value={data.totalXp}
          detail={`Migration Lv.${data.xpLevel.level}`}
          tone="coral"
        />
      </section>
      <section className="content-grid skills-layout">
        <Card title="Skillを登録" eyebrow="NEW SKILL">
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault()
              const form = event.currentTarget
              const values = new FormData(form)
              run(
                () =>
                  add({
                    data: {
                      name: String(values.get('name')),
                      category: String(values.get('category')),
                      level: Number(values.get('level')),
                      targetLevel: Number(values.get('targetLevel')),
                      xp: 0,
                      parentSkillId:
                        String(values.get('parentSkillId') || '') || null,
                      status: String(values.get('status')) as
                        'LOCKED' | 'LEARNING' | 'ACHIEVED',
                    },
                  }),
                'Skillを追加しました',
                form,
              )
            }}
          >
            <Field label="Skill名">
              <input name="name" placeholder="Go" required />
            </Field>
            <Field label="カテゴリ">
              <input name="category" placeholder="Backend" required />
            </Field>
            <Field label="現在Level">
              <input
                name="level"
                type="number"
                min="0"
                max="5"
                defaultValue="0"
                required
              />
            </Field>
            <Field label="目標Level">
              <input
                name="targetLevel"
                type="number"
                min="0"
                max="5"
                defaultValue="4"
                required
              />
            </Field>
            <Field label="親Skill">
              <select name="parentSkillId">
                <option value="">なし</option>
                {data.skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="状態">
              <select name="status">
                <option value="LEARNING">LEARNING</option>
                <option value="LOCKED">LOCKED</option>
                <option value="ACHIEVED">ACHIEVED</option>
              </select>
            </Field>
            <div className="form-actions">
              <SubmitButton pending={pending}>Skill追加</SubmitButton>
            </div>
          </form>
        </Card>
        <Card title="Skill Tree" eyebrow="DEPENDENCIES">
          <div className="skill-tree">
            {data.skills.map((skill) => {
              const parent = data.skills.find(
                (item) => item.id === skill.parentSkillId,
              )
              return (
                <article
                  key={skill.id}
                  className={`skill-node skill-${skill.status.toLowerCase()}`}
                >
                  <div className="skill-icon">
                    {skill.status === 'LOCKED' ? <LockKeyhole /> : <Sparkles />}
                  </div>
                  <div>
                    <div>
                      <Badge>{skill.category}</Badge>
                      {parent ? (
                        <span className="parent-skill">
                          <GitBranch size={12} />
                          {parent.name}
                        </span>
                      ) : null}
                    </div>
                    <h3>{skill.name}</h3>
                    <p>
                      Lv.{skill.level} → Lv.{skill.targetLevel} · {skill.xp} XP
                    </p>
                    <ProgressBar
                      compact
                      value={
                        (skill.level / Math.max(skill.targetLevel, 1)) * 100
                      }
                    />
                  </div>
                  <div className="skill-actions">
                    <button
                      className="button ghost small"
                      onClick={() =>
                        run(
                          () => gain({ data: { id: skill.id, amount: 20 } }),
                          `${skill.name} +20 XP`,
                        )
                      }
                    >
                      <Plus size={14} />
                      20 XP
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        window.confirm(
                          'Skillを削除しますか？ Missionとの紐付けは解除されます。',
                        ) &&
                        run(
                          () => remove({ data: { id: skill.id } }),
                          'Skillを削除しました',
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </Card>
      </section>
      <Card title="Skillに紐づくMission" eyebrow="ACTION → GROWTH">
        <div className="skill-mission-grid">
          {data.skills.map((skill) => (
            <div key={skill.id}>
              <strong>{skill.name}</strong>
              {data.missions
                .filter((mission) => mission.skillId === skill.id)
                .map((mission) => (
                  <p key={mission.id}>
                    {mission.completed ? '✓' : '○'} {mission.title} · +
                    {mission.xp} XP
                  </p>
                ))}
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}
