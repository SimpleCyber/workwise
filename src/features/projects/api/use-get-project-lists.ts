import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetProjectListsProps {
  boardId: Id<"projectBoards">
  includeArchived?: boolean
}

export const useGetProjectLists = ({ boardId, includeArchived }: UseGetProjectListsProps) => {
  const data = useQuery(api.projects.getProjectLists, { boardId, includeArchived })
  const isLoading = data === undefined

  return { data, isLoading }
}
