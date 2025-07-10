import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetCommentsProps {
  cardId: Id<"todoCards">
}

export const useGetComments = ({ cardId }: UseGetCommentsProps) => {
  const data = useQuery(api.todos.getComments, { cardId })
  const isLoading = data === undefined

  return { data, isLoading }
}
