"use client"

import type React from "react"
import { Loader, Plus, TriangleAlert } from "lucide-react"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { useGetProjectBoards } from "@/features/projects/api/use-get-project-boards"
import { useCreateProjectBoard } from "@/features/projects/api/use-create-project-board"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

const ProjectsWorkspacePage = () => {
  const workspaceId = useWorkspaceId()
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({ id: workspaceId })
  const { data: boards, isLoading: boardsLoading } = useGetProjectBoards({ workspaceId })
  const { mutate: createBoard, isPending } = useCreateProjectBoard()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

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

  if (workspaceLoading || boardsLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Workspace not found.</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center justify-between border-b bg-white px-4">
        <h1 className="text-lg font-semibold">Project Boards - {workspace.name}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              New Project Board
            </Button>
          </DialogTrigger>
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
                  {isPending ? (
                    <>
                      <Loader className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project Board"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          {!boards || boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No project boards yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project board to start managing team tasks
                </p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Your First Project Board
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board) => (
                <Link key={board._id} href={`/projects/${workspaceId}/board/${board._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{board.name}</CardTitle>
                        <Badge variant="outline" className="text-xs font-mono">
                          {board.boardCode}
                        </Badge>
                      </div>
                      {board.description && (
                        <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created {formatDistanceToNow(board.createdAt, { addSuffix: true })}</span>
                        {board.isStarred && <span className="text-yellow-500">⭐</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectsWorkspacePage
