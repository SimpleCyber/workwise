import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetProjectBoardsProps {
  workspaceId: Id<"workspaces">
  includeArchived?: boolean
}

export const useGetProjectBoards = ({ workspaceId, includeArchived }: UseGetProjectBoardsProps) => {
  const data = useQuery(api.projects.getProjectBoards, { workspaceId, includeArchived })
  const isLoading = data === undefined

  return { data, isLoading }
}
