"use client"

import type React from "react"

import { useState } from "react"
import { CheckSquare, Archive, Folder, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section"
import { useGetBoards } from "@/features/todos/api/use-get-boards"
import { useCreateBoard } from "@/features/todos/api/use-create-board"
import { useGetRecentCards } from "@/features/todos/api/use-get-recent-cards"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { toast } from "sonner"
import Link from "next/link"

export const WorkspaceSidebarContent = () => {
  const workspaceId = useWorkspaceId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const { data: boards, isLoading: boardsLoading } = useGetBoards({
    workspaceId,
    includeArchived: showArchived,
  })
  const { data: recentCards } = useGetRecentCards({ workspaceId, limit: 5 })
  const { mutate: createBoard, isPending } = useCreateBoard()

  const activeBoards = boards?.filter((board) => !board.isArchived) || []
  const archivedBoards = boards?.filter((board) => board.isArchived) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createBoard(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Board created successfully!")
          setOpen(false)
          setName("")
          setDescription("")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create board")
        },
      },
    )
  }

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <Link href={`/todo/${workspaceId}`}>
          <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] w-full">
            <CheckSquare className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">All Boards</span>
          </Button>
        </Link>
        <Button
          variant="transparent"
          className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="mr-1 size-3.5 shrink-0" />
          <span className="truncate text-sm">{showArchived ? "Hide Archived" : "Show Archived"}</span>
        </Button>
      </div>

      {/* Recent Cards */}
      {recentCards && recentCards.length > 0 && (
        <WorkspaceSection label="Recent Cards" hint="View All" onNew={() => {}}>
          {recentCards.slice(0, 3).map((card) => (
            <Link key={card._id} href={`/todo/${workspaceId}/board/${card.boardId}`}>
              <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] w-full">
                <span className="truncate text-sm">{card.title}</span>
              </Button>
            </Link>
          ))}
        </WorkspaceSection>
      )}

      {/* Active Boards */}
      <WorkspaceSection label="Boards" hint="New Board" onNew={() => setOpen(true)}>
        {boardsLoading ? (
          <div className="px-[18px] py-2">
            <span className="text-xs text-[#f9EDFFCC]/60">Loading...</span>
          </div>
        ) : activeBoards.length === 0 ? (
          <div className="px-[18px] py-2">
            <span className="text-xs text-[#f9EDFFCC]/60">No boards yet</span>
          </div>
        ) : (
          activeBoards.map((board) => (
            <Link key={board._id} href={`/todo/${workspaceId}/board/${board._id}`}>
              <Button
                variant="transparent"
                className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] w-full group"
              >
                <Folder className="mr-1 size-3.5 shrink-0" />
                <span className="truncate text-sm flex-1 text-left">{board.name}</span>
                {board.isStarred && <Star className="size-3 text-yellow-400" />}
              </Button>
            </Link>
          ))
        )}
      </WorkspaceSection>

      {/* Archived Boards */}
      {showArchived && archivedBoards.length > 0 && (
        <WorkspaceSection label="Archived Boards" hint="" onNew={() => {}}>
          {archivedBoards.map((board) => (
            <Link key={board._id} href={`/todo/${workspaceId}/board/${board._id}`}>
              <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]/60 w-full">
                <Archive className="mr-1 size-3.5 shrink-0" />
                <span className="truncate text-sm">{board.name}</span>
              </Button>
            </Link>
          ))}
        </WorkspaceSection>
      )}

      {/* Create Board Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter board name..."
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter board description..."
                disabled={isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? "Creating..." : "Create Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
