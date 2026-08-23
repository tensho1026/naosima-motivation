import { useServerFn } from '@tanstack/react-start'
import { useRouter } from '@tanstack/react-router'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import type { ExtraResourceName } from '#/server/content-validation'
import type { ResourceRow } from '#/server/content-repository.server'
import {
  deleteExtraResource,
  saveExtraResource,
} from '#/server/content.functions'

import { useToast } from './Toast'
import { Card, EmptyState, Field, SubmitButton } from './Primitives'

export type ResourceField = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select'
  required?: boolean
  defaultValue?: string | number | boolean
  options?: { label: string; value: string }[]
  min?: number
  max?: number
}

function displayValue(row: ResourceRow, fields: ResourceField[]) {
  const preferred = fields.find((field) =>
    ['title', 'name', 'label', 'content'].includes(field.name),
  )
  return preferred ? String(row[preferred.name] ?? '記録') : '記録'
}

export function ExtraResourcePanel({
  resource,
  title,
  description,
  rows,
  fields,
}: {
  resource: ExtraResourceName
  title: string
  description?: string
  rows: ResourceRow[]
  fields: ResourceField[]
}) {
  const router = useRouter()
  const { notify } = useToast()
  const save = useServerFn(saveExtraResource)
  const remove = useServerFn(deleteExtraResource)
  const [editing, setEditing] = useState<ResourceRow | null>(null)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values: Record<string, unknown> = {}
    for (const field of fields) {
      const raw = form.get(field.name)
      if (field.type === 'checkbox') values[field.name] = raw === 'on'
      else if (field.type === 'number') {
        values[field.name] = raw === '' || raw == null ? null : Number(raw)
      } else values[field.name] = raw === '' ? null : raw
    }
    setPending(true)
    try {
      await save({
        data: {
          resource,
          id: typeof editing?.id === 'string' ? editing.id : undefined,
          values,
        },
      })
      notify(editing ? '記録を更新しました' : '記録を追加しました')
      setEditing(null)
      setOpen(false)
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

  async function deleteRow(row: ResourceRow) {
    if (typeof row.id !== 'string') return
    if (!window.confirm('この記録を削除しますか？')) return
    try {
      await remove({ data: { resource, id: row.id } })
      notify('記録を削除しました')
      await router.invalidate({ sync: true })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '削除に失敗しました',
        'error',
      )
    }
  }

  return (
    <Card
      title={title}
      action={
        <button
          className="button ghost small"
          onClick={() => {
            setEditing(null)
            setOpen((value) => !value)
          }}
        >
          {open ? <X size={15} /> : <Plus size={15} />}
          {open ? '閉じる' : '追加'}
        </button>
      }
    >
      {description ? <p className="panel-description">{description}</p> : null}
      {open || editing ? (
        <form
          className="resource-form"
          onSubmit={submit}
          key={String(editing?.id ?? 'new')}
        >
          {fields.map((field) => {
            const value = editing?.[field.name] ?? field.defaultValue ?? ''
            if (field.type === 'checkbox') {
              return (
                <label className="check-field" key={field.name}>
                  <input
                    name={field.name}
                    type="checkbox"
                    defaultChecked={Boolean(value)}
                  />
                  <span>{field.label}</span>
                </label>
              )
            }
            return (
              <Field label={field.label} key={field.name}>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    defaultValue={String(value ?? '')}
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    name={field.name}
                    required={field.required}
                    defaultValue={String(value ?? '')}
                  >
                    <option value="">選択してください</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.name}
                    type={field.type ?? 'text'}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.type === 'number' ? 'any' : undefined}
                    defaultValue={String(value ?? '')}
                  />
                )}
              </Field>
            )
          })}
          <div className="form-actions">
            <SubmitButton pending={pending} />
            {editing ? (
              <button
                type="button"
                className="button ghost"
                onClick={() => {
                  setEditing(null)
                  setOpen(false)
                }}
              >
                キャンセル
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="resource-list">
          {rows.map((row, index) => (
            <article key={String(row.id ?? index)} className="resource-row">
              <div>
                <strong>{displayValue(row, fields)}</strong>
                <p>
                  {fields
                    .filter(
                      (field) =>
                        !['title', 'name', 'label', 'content'].includes(
                          field.name,
                        ),
                    )
                    .slice(0, 3)
                    .map(
                      (field) =>
                        `${field.label}: ${String(row[field.name] ?? '—')}`,
                    )
                    .join(' · ')}
                </p>
              </div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label="編集"
                  onClick={() => {
                    setEditing(row)
                    setOpen(true)
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label="削除"
                  onClick={() => deleteRow(row)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  )
}
