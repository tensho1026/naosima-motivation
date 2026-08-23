import { useServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Award, LockKeyhole, Medal, Sparkles, Trophy } from 'lucide-react'

import {
  Badge,
  Card,
  LoadingPage,
  Page,
  ProgressBar,
  Stat,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import { checkAchievements } from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/achievements')({
  loader: () => getDashboard(),
  component: AchievementsPage,
  pendingComponent: LoadingPage,
})

function AchievementsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const check = useServerFn(checkAchievements)
  const unlocked = new Map(
    data.achievements.unlocked.map((row) => [row.achievementId, row]),
  )
  const independentIncome = data.career.sources
    .filter((source) => source.active && source.type !== 'SALARY')
    .reduce((sum, source) => sum + source.monthlyAmount, 0)
  const currentByKind: Record<string, number> = {
    MISSION_COUNT: data.missions.filter((item) => item.completed).length,
    TOTAL_XP: data.totalXp,
    SAVINGS: data.finance?.currentSavings ?? 0,
    JOURNEY: data.journey.progressKm,
    READINESS: data.readiness.overall,
    VISIT_COUNT: data.visits.length,
    ACTIVITY_DAYS: new Set(
      data.actions.map((action) =>
        action.occurredAt.toISOString().slice(0, 10),
      ),
    ).size,
    SIDE_INCOME: independentIncome,
    REMOTE_WORK: data.career.conditions.some(
      (condition) =>
        condition.completed &&
        /remote|リモート|場所/.test(condition.title.toLocaleLowerCase('ja')),
    )
      ? 1
      : 0,
  }
  async function refresh() {
    try {
      const newItems = await check()
      notify(
        newItems.length
          ? `${newItems.length}個のAchievementを解除しました`
          : '新しい解除条件はまだありません',
      )
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '確認に失敗しました',
        'error',
      )
    }
  }
  return (
    <Page
      title="Achievements"
      eyebrow="PROOF OF THE JOURNEY"
      description="大きな一歩を称号として残し、直島へ近づいた証拠を集めます。"
      actions={
        <button className="button primary" onClick={refresh}>
          <Sparkles size={16} />
          解除条件をチェック
        </button>
      }
    >
      <section className="stats-grid page-stats">
        <Stat
          label="解除済み"
          value={`${unlocked.size} / ${data.achievements.definitions.length}`}
          detail="Journey badges"
          tone="gold"
        />
        <Stat
          label="Mission達成"
          value={data.missions.filter((item) => item.completed).length}
          detail="FIRST STEPへ"
          tone="sea"
        />
        <Stat
          label="総XP"
          value={data.totalXp}
          detail={`Lv.${data.xpLevel.level}`}
          tone="green"
        />
        <Stat
          label="準備度"
          value={`${Math.round(data.readiness.overall)}%`}
          detail={data.readyStatus.replaceAll('_', ' ')}
          tone="coral"
        />
      </section>
      <Card title="Badge Collection" eyebrow="YOUR ACHIEVEMENTS">
        <div className="achievement-grid">
          {data.achievements.definitions.map((achievement) => {
            const earned = unlocked.get(achievement.id)
            const current = currentByKind[achievement.kind] ?? 0
            return (
              <article
                key={achievement.id}
                className={earned ? 'achievement earned' : 'achievement locked'}
              >
                <div className="badge-medal">
                  {earned ? <Trophy /> : <LockKeyhole />}
                </div>
                <Badge tone={earned ? 'gold' : 'sea'}>{achievement.code}</Badge>
                <h2>{achievement.title}</h2>
                <p>{achievement.description}</p>
                <ProgressBar
                  compact
                  value={(current / achievement.threshold) * 100}
                />
                <small>
                  {Math.min(Math.round(current), achievement.threshold)} /{' '}
                  {achievement.threshold}
                </small>
                {earned ? (
                  <span className="earned-date">
                    <Medal size={13} />
                    {earned.unlockedAt.toLocaleDateString('ja-JP')} 解除
                  </span>
                ) : null}
              </article>
            )
          })}
        </div>
      </Card>
      <section className="content-grid achievement-notes">
        <Card title="次の称号" eyebrow="NEXT BADGE">
          <div className="next-badge">
            <Award />
            <div>
              <strong>
                {data.achievements.definitions.find(
                  (item) => !unlocked.has(item.id),
                )?.title ?? 'すべて解除済み'}
              </strong>
              <p>Mission・貯金・Journey・準備度の実績から自動判定されます。</p>
            </div>
          </div>
        </Card>
        <Card title="積み重ねは消えない" eyebrow="JOURNEY PROOF">
          <blockquote>
            「これだけ本気で準備してきた」を、数字と記録の両方で未来の自分へ残す。
          </blockquote>
        </Card>
      </section>
    </Page>
  )
}
