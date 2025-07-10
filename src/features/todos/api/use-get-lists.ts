import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetListsProps {
  boardId: Id<"todoBoards">
}

export const useGetLists = ({ boardId }: UseGetListsProps) => {
  const data = useQuery(api.todos.getLists, { boardId })
  const isLoading = data === undefined

  return { data, isLoading }
}
