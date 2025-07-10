import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetChecklistsProps {
  cardId: Id<"todoCards">
}

export const useGetChecklists = ({ cardId }: UseGetChecklistsProps) => {
  const data = useQuery(api.todos.getChecklists, { cardId })
  const isLoading = data === undefined

  return { data, isLoading }
}
