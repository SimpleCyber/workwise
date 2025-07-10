import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetTodayAttendanceProps {
  workspaceId: Id<"workspaces">
}

export const useGetTodayAttendance = ({ workspaceId }: UseGetTodayAttendanceProps) => {
  const data = useQuery(api.attendance.getTodayAttendance, { workspaceId })
  const isLoading = data === undefined

  return { data, isLoading }
}
