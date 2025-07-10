"use client"

import { Loader, TriangleAlert } from "lucide-react"
import { useGetProjectBoard } from "@/features/projects/api/use-get-project-board"
import { useGetProjectLists } from "@/features/projects/api/use-get-project-lists"
import { ProjectKanbanBoard } from "@/features/projects/components/project-kanban-board"
import type { Id } from "../../../../../../convex/_generated/dataModel"

interface ProjectBoardPageProps {
  params: {
    workspaceId: string
    boardId: string
  }
}

const ProjectBoardPage = ({ params }: ProjectBoardPageProps) => {
  const boardId = params.boardId as Id<"projectBoards">
  const { data: board, isLoading: boardLoading } = useGetProjectBoard({ boardId })
  const { data: lists, isLoading: listsLoading } = useGetProjectLists({ boardId })

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
        <span className="text-sm text-muted-foreground">Project board not found.</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{board.name}</h1>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{board.boardCode}</span>
        </div>
        {board.description && <span className="ml-4 text-sm text-muted-foreground">{board.description}</span>}
      </div>
      <div className="flex-1 overflow-hidden">
        <ProjectKanbanBoard boardId={boardId} lists={lists || []} />
      </div>
    </div>
  )
}

export default ProjectBoardPage
