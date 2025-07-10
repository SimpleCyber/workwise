import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetRecentCardsProps {
  workspaceId: Id<"workspaces">
  limit?: number
}

export const useGetRecentCards = ({ workspaceId, limit }: UseGetRecentCardsProps) => {
  const data = useQuery(api.todos.getRecentCards, { workspaceId, limit })
  const isLoading = data === undefined

  return { data, isLoading }
}
