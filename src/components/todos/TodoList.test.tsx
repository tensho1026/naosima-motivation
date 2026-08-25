import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { TodoList } from './TodoList'

const STORAGE_KEY = 'naoshima-bound:todos'

describe('TodoList', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds a todo with a priority and persists it', async () => {
    render(<TodoList />)

    fireEvent.change(screen.getByLabelText('やること'), {
      target: { value: '引っ越し業者を調べる' },
    })
    fireEvent.change(screen.getByLabelText('優先度'), {
      target: { value: 'HIGH' },
    })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByText('引っ越し業者を調べる')).toBeInTheDocument()
    expect(screen.getByText('優先度 高')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
        '引っ越し業者を調べる',
      )
    })
  })

  it('removes a todo when it is checked', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'todo-1', title: '住民票の手続きを確認', priority: 'MEDIUM' },
      ]),
    )
    render(<TodoList />)

    const completeButton = await screen.findByRole('button', {
      name: '「住民票の手続きを確認」を完了して削除',
    })
    fireEvent.click(completeButton)

    expect(screen.queryByText('住民票の手続きを確認')).not.toBeInTheDocument()
    expect(screen.getByText('Todoはありません')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
    })
  })
})
