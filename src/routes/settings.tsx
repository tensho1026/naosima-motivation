import { useServerFn } from '@tanstack/react-start'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Cloud, Download, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import {
  Card,
  Field,
  LoadingPage,
  Page,
  SubmitButton,
} from '#/components/ui/Primitives'
import { useToast } from '#/components/ui/Toast'
import { updateSettings } from '#/server/core.functions'
import { getDashboard } from '#/server/dashboard.functions'

export const Route = createFileRoute('/settings')({
  loader: () => getDashboard(),
  component: SettingsPage,
  pendingComponent: LoadingPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const { notify } = useToast()
  const save = useServerFn(updateSettings)
  const [pending, setPending] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setPending(true)
    try {
      await save({
        data: {
          migrationTargetDate: String(values.get('migrationTargetDate')),
          journeyStartedAt: String(values.get('journeyStartedAt')),
          birthDate: String(values.get('birthDate') || '') || null,
          virtualJourneyDistance: Number(values.get('virtualJourneyDistance')),
        },
      })
      notify('設定を更新しました')
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '保存に失敗しました',
        'error',
      )
    } finally {
      setPending(false)
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `naoshima-bound-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    notify('JSONを書き出しました')
  }
  return (
    <Page
      title="設定"
      eyebrow="自分だけの移住計画"
      description="移住日と仮想距離の基準値を設定します。環境変数やCloudflare IDはコードへ保存しません。"
    >
      <section className="content-grid settings-grid">
        <Card title="移住計画の基本設定" eyebrow="基本設定">
          <form className="settings-form" onSubmit={submit}>
            <Field label="移住目標日">
              <input
                name="migrationTargetDate"
                type="date"
                defaultValue={data.settings?.migrationTargetDate ?? ''}
                required
              />
            </Field>
            <Field label="準備を始めた日">
              <input
                name="journeyStartedAt"
                type="date"
                defaultValue={data.settings?.journeyStartedAt ?? ''}
                required
              />
            </Field>
            <Field label="生年月日（直島率の計算）">
              <input
                name="birthDate"
                type="date"
                defaultValue={data.settings?.birthDate ?? ''}
              />
            </Field>
            <Field label="仮想移動距離（km）">
              <input
                name="virtualJourneyDistance"
                type="number"
                min="100"
                max="100000"
                defaultValue={data.settings?.virtualJourneyDistance ?? ''}
                required
              />
            </Field>
            <SubmitButton pending={pending}>設定を保存</SubmitButton>
          </form>
        </Card>
        <Card title="Cloudflareストレージ" eyebrow="D1とR2">
          <div className="cloud-stack">
            <div>
              <Cloud />
              <span>
                <strong>Cloudflare D1</strong>
                <small>行動・経験値・資金・日記・メタデータ</small>
              </span>
              <b>接続済み</b>
            </div>
            <div>
              <Cloud />
              <span>
                <strong>Cloudflare R2</strong>
                <small>写真・音声のバイナリ</small>
              </span>
              <b>接続済み</b>
            </div>
            <p>
              <ShieldCheck size={15} />
              アップロードファイルはpublicやローカルFSへ永続保存されません。
            </p>
          </div>
        </Card>
        <Card title="データを書き出す" eyebrow="個人バックアップ">
          <p className="panel-description">
            現在表示できる構造化データをJSONとしてローカルへ保存します。R2の写真・音声本体は含みません。
          </p>
          <button className="button ghost" onClick={exportData}>
            <Download size={16} />
            JSONをダウンロード
          </button>
        </Card>
        <Card title="ホーム画面 / ロック画面" eyebrow="PWAウィジェット">
          <p className="panel-description">
            インストール可能なPWAと、カウントダウンを大きく表示するコンパクト画面を用意しています。
          </p>
          <Link to="/widget" className="button primary">
            <MonitorSmartphone size={16} />
            ウィジェット表示を開く
          </Link>
        </Card>
      </section>
    </Page>
  )
}
