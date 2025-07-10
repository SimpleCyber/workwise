"use client"

import { Loader, TriangleAlert } from "lucide-react"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { CheckInOut } from "@/features/attendance/components/check-in-out"

const CheckInPage = () => {
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
        <h1 className="text-lg font-semibold">Check In/Out - {workspace.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <CheckInOut workspaceId={workspaceId} />
      </div>
    </div>
  )
}

export default CheckInPage
