"use client"

import { Loader, TriangleAlert } from "lucide-react"
import { useGetBoard } from "@/features/todos/api/use-get-board"
import { useGetLists } from "@/features/todos/api/use-get-lists"
import { KanbanBoard } from "@/features/todos/components/kanban-board"
import type { Id } from "../../../../../../convex/_generated/dataModel"

interface BoardPageProps {
  params: {
    workspaceId: string
    boardId: string
  }
}

const BoardPage = ({ params }: BoardPageProps) => {
  const boardId = params.boardId as Id<"todoBoards">
  const { data: board, isLoading: boardLoading } = useGetBoard({ boardId })
  const { data: lists, isLoading: listsLoading } = useGetLists({ boardId })

  if (boardLoading || listsLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Board not found.</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <h1 className="text-lg font-semibold">{board.name}</h1>
        {board.description && <span className="ml-4 text-sm text-muted-foreground">{board.description}</span>}
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard boardId={boardId} lists={lists || []} />
      </div>
    </div>
  )
}

export default BoardPage
