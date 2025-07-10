import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetCardsProps {
  listId: Id<"todoLists">
}

export const useGetCards = ({ listId }: UseGetCardsProps) => {
  const data = useQuery(api.todos.getCards, { listId })
  const isLoading = data === undefined

  return { data, isLoading }
}
