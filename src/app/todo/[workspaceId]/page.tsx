"use client"

import type React from "react"

import { Loader, Plus, TriangleAlert } from "lucide-react"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { useGetBoards } from "@/features/todos/api/use-get-boards"
import { useCreateBoard } from "@/features/todos/api/use-create-board"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

const TodoWorkspacePage = () => {
  const workspaceId = useWorkspaceId()
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({ id: workspaceId })
  const { data: boards, isLoading: boardsLoading } = useGetBoards({ workspaceId })
  const { mutate: createBoard, isPending } = useCreateBoard()

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
        <h1 className="text-lg font-semibold">Todo Boards - {workspace.name}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-2" />
              New Board
            </Button>
          </DialogTrigger>
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
                  {isPending ? (
                    <>
                      <Loader className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Board"
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
                <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
                <p className="text-muted-foreground mb-4">Create your first board to start organizing your tasks</p>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Your First Board
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board) => (
                <Link key={board._id} href={`/todo/${workspaceId}/board/${board._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-base">{board.name}</CardTitle>
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

export default TodoWorkspacePage
