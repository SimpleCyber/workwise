import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetProjectTasksProps {
  listId: Id<"projectLists">
  includeArchived?: boolean
}

export const useGetProjectTasks = ({ listId, includeArchived }: UseGetProjectTasksProps) => {
  const data = useQuery(api.projects.getProjectTasks, { listId, includeArchived })
  const isLoading = data === undefined

  return { data, isLoading }
}
