"use client"

import type React from "react"
import { useState } from "react"
import { FolderKanban, Archive, Folder, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WorkspaceSection } from "@/app/workspace/[workspaceId]/workspace-section"
import { useGetProjectBoards } from "@/features/projects/api/use-get-project-boards"
import { useCreateProjectBoard } from "@/features/projects/api/use-create-project-board"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { toast } from "sonner"
import Link from "next/link"

export const WorkspaceSidebarContent = () => {
  const workspaceId = useWorkspaceId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const { data: boards, isLoading: boardsLoading } = useGetProjectBoards({
    workspaceId,
    includeArchived: showArchived,
  })
  const { mutate: createBoard, isPending } = useCreateProjectBoard()

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
          toast.success("Project board created successfully!")
          setOpen(false)
          setName("")
          setDescription("")
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create project board")
        },
      },
    )
  }

  return (
    <>
      <div className="mt-3 flex flex-col px-2">
        <Link href={`/projects/${workspaceId}`}>
          <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] w-full">
            <FolderKanban className="mr-1 size-3.5 shrink-0" />
            <span className="truncate text-sm">All Project Boards</span>
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

      {/* Active Project Boards */}
      <WorkspaceSection label="Project Boards" hint="New Board" onNew={() => setOpen(true)}>
        {boardsLoading ? (
          <div className="px-[18px] py-2">
            <span className="text-xs text-[#f9EDFFCC]/60">Loading...</span>
          </div>
        ) : activeBoards.length === 0 ? (
          <div className="px-[18px] py-2">
            <span className="text-xs text-[#f9EDFFCC]/60">No project boards yet</span>
          </div>
        ) : (
          activeBoards.map((board) => (
            <Link key={board._id} href={`/projects/${workspaceId}/board/${board._id}`}>
              <Button
                variant="transparent"
                className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC] w-full group"
              >
                <Folder className="mr-1 size-3.5 shrink-0" />
                <span className="truncate text-sm flex-1 text-left">{board.name}</span>
                <span className="text-xs text-[#f9EDFFCC]/60 ml-1">{board.boardCode}</span>
                {board.isStarred && <Star className="size-3 text-yellow-400" />}
              </Button>
            </Link>
          ))
        )}
      </WorkspaceSection>

      {/* Archived Project Boards */}
      {showArchived && archivedBoards.length > 0 && (
        <WorkspaceSection label="Archived Project Boards" hint="" onNew={() => {}}>
          {archivedBoards.map((board) => (
            <Link key={board._id} href={`/projects/${workspaceId}/board/${board._id}`}>
              <Button variant="transparent" className="h-7 justify-start px-[18px] text-sm text-[#f9EDFFCC]/60 w-full">
                <Archive className="mr-1 size-3.5 shrink-0" />
                <span className="truncate text-sm">{board.name}</span>
                <span className="text-xs text-[#f9EDFFCC]/40 ml-1">{board.boardCode}</span>
              </Button>
            </Link>
          ))}
        </WorkspaceSection>
      )}

      {/* Create Project Board Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name..."
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description..."
                disabled={isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? "Creating..." : "Create Project Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
