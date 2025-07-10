"use client"

import { Loader, TriangleAlert } from "lucide-react"
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info"
import { useCurrentMember } from "@/features/members/api/use-current-member"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { CheckInOut } from "@/features/attendance/components/check-in-out"
import { CleanAdminDashboard } from "@/features/attendance/components/admin-dashboard"

const AttendanceWorkspacePage = () => {
  const workspaceId = useWorkspaceId()
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceInfo({ id: workspaceId })
  const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId })

  if (workspaceLoading || memberLoading) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workspace || !member) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Workspace not found.</span>
      </div>
    )
  }

  // Show admin dashboard by default for admins
  if (member.role === "admin") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[49px] items-center border-b bg-white px-4">
          <h1 className="text-lg font-semibold">Admin Dashboard - {workspace.name}</h1>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <CleanAdminDashboard workspaceId={workspaceId} />
        </div>
      </div>
    )
  }

  // Show check-in/out for regular users
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[49px] items-center border-b bg-white px-4">
        <h1 className="text-lg font-semibold">Attendance - {workspace.name}</h1>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <CheckInOut workspaceId={workspaceId} />
      </div>
    </div>
  )
}

export default AttendanceWorkspacePage
