"use client"

import { useQuery } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectKanbanBoard } from "@/features/projects/components/project-kanban-board"
import { useGetWorkspaceMembers } from "@/features/projects/api/use-get-workspace-members"

export default function ProjectBoardPage({
  params,
}: {
  params: { workspaceId: Id<"workspaces">; boardId: Id<"projectBoards"> }
}) {
  const { workspaceId, boardId } = params
  const board = useQuery(api.projects.getProjectBoard, { boardId })
  const lists = useQuery(api.projects.getProjectLists, { boardId })
  const { data: workspaceMembers, isLoading: membersLoading } = useGetWorkspaceMembers({ workspaceId })
  const [selectedMemberIds, setSelectedMemberIds] = useState<Id<"members">[]>([]) // Change to array

  if (!board || !lists || membersLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleMemberToggle = (memberId: Id<"members">) => {
    setSelectedMemberIds(
      (prev) =>
        prev.includes(memberId)
          ? prev.filter((id) => id !== memberId) // Remove if already selected
          : [...prev, memberId], // Add if not selected
    )
  }

  const handleClearFilter = () => {
    setSelectedMemberIds([])
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{board.name}</h1>
          <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{board.boardCode}</span>
        </div>
        {board.description && <span className="ml-4 text-sm text-muted-foreground">{board.description}</span>}

        {/* User Avatars for Filtering */}
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant={selectedMemberIds.length === 0 ? "secondary" : "ghost"}
            size="sm"
            onClick={handleClearFilter}
            className="rounded-full px-3 py-1 text-xs"
          >
            All Users
            {selectedMemberIds.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1">
                {selectedMemberIds.length}
              </span>
            )}
          </Button>
          {workspaceMembers?.map((member) => {
            const isSelected = selectedMemberIds.includes(member._id)
            return (
              <Button
  key={member._id}
  variant="ghost"
  size="icon"
  className="rounded-full h-8 w-8 transition-all hover:bg-muted"
  onClick={() => handleMemberToggle(member._id)}
  title={`${isSelected ? "Remove filter for" : "Filter tasks assigned to"} ${member.user?.name || "Unknown User"}`}
>
  <Avatar
    className={`h-9 w-9 border-2 ${
      isSelected ? "border-blue-500" : "border-transparent"
    }`}
  >
    <AvatarImage src={member.user?.image || "/placeholder.svg"} />
    <AvatarFallback className="text-xs">
      {member.user?.name?.charAt(0).toUpperCase() || "U"}
    </AvatarFallback>
  </Avatar>
  <span className="sr-only">{member.user?.name || "Unknown User"}</span>
</Button>

            )
          })}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ProjectKanbanBoard boardId={boardId} lists={lists || []} selectedMemberIds={selectedMemberIds} />
      </div>
    </div>
  )
}
