import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetBoardProps {
  boardId: Id<"todoBoards">
}

export const useGetBoard = ({ boardId }: UseGetBoardProps) => {
  const data = useQuery(api.todos.getBoard, { boardId })
  const isLoading = data === undefined

  return { data, isLoading }
}
