"use client"

import { Loader, TriangleAlert } from "lucide-react"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useWorkspaceId } from "@/hooks/use-workspace-id"

const BoardWorkspacePage = () => {
  const workspaceId = useWorkspaceId()
  const { data: workspace, isLoading } = useGetWorkspaceInfo({ id: workspaceId })

  if (isLoading) {
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
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <h1 className="text-lg font-semibold">Kanban Board - {workspace.name}</h1>
      </div>
      <div className="flex-1 p-6">
        <div className="h-full">
          <h2 className="mb-4 text-2xl font-bold">Kanban Board</h2>
          <p className="mb-6 text-muted-foreground">Visualize and manage your workflow with Kanban boards.</p>

          <div className="flex h-[calc(100%-120px)] gap-6 overflow-x-auto">
            <div className="min-w-[300px] rounded-lg bg-gray-100 p-4">
              <h3 className="mb-4 font-semibold">To Do</h3>
              <div className="space-y-3">
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-sm font-medium">Task 1</p>
                  <p className="text-xs text-muted-foreground">Description here</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-sm font-medium">Task 2</p>
                  <p className="text-xs text-muted-foreground">Description here</p>
                </div>
              </div>
            </div>

            <div className="min-w-[300px] rounded-lg bg-blue-100 p-4">
              <h3 className="mb-4 font-semibold">In Progress</h3>
              <div className="space-y-3">
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-sm font-medium">Task 3</p>
                  <p className="text-xs text-muted-foreground">Currently working on</p>
                </div>
              </div>
            </div>

            <div className="min-w-[300px] rounded-lg bg-green-100 p-4">
              <h3 className="mb-4 font-semibold">Done</h3>
              <div className="space-y-3">
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-sm font-medium">Task 4</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardWorkspacePage
