import { Check, ListTodo, Plus } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { EmptyState } from '#/components/ui/Primitives'

const STORAGE_KEY = 'naoshima-bound:todos'

const priorities = ['HIGH', 'MEDIUM', 'LOW'] as const
type Priority = (typeof priorities)[number]

type Todo = {
  id: string
  title: string
  priority: Priority
}

const priorityLabels: Record<Priority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
}

function isPriority(value: unknown): value is Priority {
  return priorities.some((priority) => priority === value)
}

function readTodos() {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? '[]',
    )
    if (!Array.isArray(value)) return []

    return value.filter(
      (item): item is Todo =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'string' &&
        'title' in item &&
        typeof item.title === 'string' &&
        'priority' in item &&
        isPriority(item.priority),
    )
  } catch {
    return []
  }
}

function writeTodos(todos: Todo[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function subscribeToClient() {
  return () => undefined
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function TodoList() {
  const loaded = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  )
  const [todos, setTodos] = useState<Todo[]>(() =>
    typeof window === 'undefined' ? [] : readTodos(),
  )

  useEffect(() => {
    if (loaded) writeTodos(todos)
  }, [loaded, todos])

  function addTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title') ?? '').trim()
    const priority = data.get('priority')

    if (!title || !isPriority(priority)) return

    setTodos((current) => [...current, { id: makeId(), title, priority }])
    form.reset()
  }

  function completeTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  return (
    <section className="todo-shell" aria-label="Todoリスト">
      <form className="todo-form" onSubmit={addTodo}>
        <label className="todo-title-field">
          <span>やること</span>
          <input
            name="title"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="次にやることを入力"
          />
        </label>
        <label className="todo-priority-field">
          <span>優先度</span>
          <select name="priority" defaultValue="MEDIUM">
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary todo-add-button" type="submit">
          <Plus size={17} />
          追加
        </button>
      </form>

      <div className="todo-summary" aria-live="polite">
        <span>
          <ListTodo size={16} />
          残り {todos.length} 件
        </span>
        <small>チェックするとリストから消えます</small>
      </div>

      {loaded && todos.length === 0 ? (
        <EmptyState
          title="Todoはありません"
          description="やることを1つ追加して、今日の一歩を軽く始めましょう。"
        />
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className="todo-item">
              <button
                className="todo-check"
                type="button"
                onClick={() => completeTodo(todo.id)}
                aria-label={`「${todo.title}」を完了して削除`}
              >
                <Check size={16} />
              </button>
              <span className="todo-item-title">{todo.title}</span>
              <span
                className={`priority-label priority-${todo.priority.toLowerCase()}`}
              >
                優先度 {priorityLabels[todo.priority]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
