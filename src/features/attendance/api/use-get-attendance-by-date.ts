import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetAttendanceByDateProps {
  workspaceId: Id<"workspaces">
  date: number
  filter?: "present" | "absent" | "all"
}

export const useGetAttendanceByDate = ({ workspaceId, date, filter }: UseGetAttendanceByDateProps) => {
  const data = useQuery(api.attendance.getAttendanceByDate, { workspaceId, date, filter })
  const isLoading = data === undefined

  return { data, isLoading }
}
