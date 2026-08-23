import { LoaderCircle, Plus } from 'lucide-react'

export function Page({
  title,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string
  eyebrow?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="app-page">
      <header className="page-heading">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </header>
      {children}
    </main>
  )
}

export function Card({
  title,
  eyebrow,
  action,
  className = '',
  children,
}: {
  title?: string
  eyebrow?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`panel ${className}`}>
      {title || action ? (
        <header className="panel-heading">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  detail,
  tone = 'sea',
}: {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  tone?: 'sea' | 'green' | 'gold' | 'coral'
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}

export function ProgressBar({
  value,
  label,
  compact = false,
}: {
  value: number
  label?: string
  compact?: boolean
}) {
  const normalized = Math.min(Math.max(value, 0), 100)
  return (
    <div className={compact ? 'progress compact' : 'progress'}>
      {label ? (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{Math.round(normalized)}%</strong>
        </div>
      ) : null}
      <div className="progress-track">
        <span style={{ width: `${normalized}%` }} />
      </div>
    </div>
  )
}

export function Badge({
  children,
  tone = 'sea',
}: {
  children: React.ReactNode
  tone?: string
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function EmptyState({
  title = 'まだ記録がありません',
  description = '最初の1件を追加すると、ここに積み重ねが表示されます。',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="empty-state">
      <span className="empty-plus">
        <Plus size={20} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function SubmitButton({
  pending,
  children = '保存する',
}: {
  pending?: boolean
  children?: React.ReactNode
}) {
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={17} /> : null}
      {pending ? '保存中…' : children}
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function LoadingPage() {
  return (
    <main className="app-page" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="dashboard-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton skeleton-card" />
        ))}
      </div>
    </main>
  )
}
