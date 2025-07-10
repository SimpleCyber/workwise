import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetUserAttendanceProps {
  workspaceId: Id<"workspaces">
  month: number
  year: number
}

export const useGetUserAttendance = ({ workspaceId, month, year }: UseGetUserAttendanceProps) => {
  const data = useQuery(api.attendance.getUserAttendance, { workspaceId, month, year })
  const isLoading = data === undefined

  return { data, isLoading }
}
