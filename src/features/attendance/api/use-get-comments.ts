import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetCommentsProps {
  attendanceId: Id<"attendance"> | string
}

export const useGetComments = ({ attendanceId }: UseGetCommentsProps) => {
  // Only run the query if we have a valid attendanceId
  const data = useQuery(
    api.attendanceComments.getComments,
    attendanceId && attendanceId !== "" ? { attendanceId: attendanceId as Id<"attendance"> } : "skip",
  )
  const isLoading = data === undefined

  return { data: data || [], isLoading }
}
