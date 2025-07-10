import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetPendingAttendanceProps {
  workspaceId: Id<"workspaces">
}

export const useGetPendingAttendance = ({ workspaceId }: UseGetPendingAttendanceProps) => {
  const data = useQuery(api.attendance.getPendingAttendance, { workspaceId })
  const isLoading = data === undefined

  return { data, isLoading }
}
