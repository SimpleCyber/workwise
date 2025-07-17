"use client"

import { Loader2, TriangleAlert } from "lucide-react"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useGetTreeData } from "@/features/tree/api/use-get-tree-data"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { TreeVisualization } from "@/features/tree/components/tree-visualization"

export default function TreeWorkspacePage({
  params,
}: {
  params: { workspaceId: Id<"workspaces"> }
}) {
  const { workspaceId } = params

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({
    id: workspaceId,
  })

  const { data: treeData, isLoading: treeLoading } = useGetTreeData({
    workspaceId,
  })

  if (workspaceLoading || treeLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace || !treeData) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Data not found.</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <h1 className="text-lg font-semibold">All Data - {workspace.name}</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <TreeVisualization data={treeData} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
