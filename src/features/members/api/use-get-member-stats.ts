import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"

interface UseGetMemberStatsProps {
  workspaceId: Id<"workspaces">
}

export const useGetMemberStats = ({ workspaceId }: UseGetMemberStatsProps) => {
  const data = useQuery(api.members.getStats, { workspaceId })
  const isLoading = data === undefined

  return { data, isLoading }
}
