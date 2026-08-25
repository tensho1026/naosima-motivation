import { createFileRoute } from '@tanstack/react-router'

import { TodoList } from '#/components/todos/TodoList'
import { Card, Page } from '#/components/ui/Primitives'

export const Route = createFileRoute('/todos')({
  component: TodosPage,
})

function TodosPage() {
  return (
    <Page
      title="Todo"
      eyebrow="今日やること"
      description="いま気になることを置いて、終わったらチェック。シンプルに今日の行動だけを管理します。"
    >
      <Card className="todo-card">
        <TodoList />
      </Card>
    </Page>
  )
}
