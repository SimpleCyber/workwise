import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetBoardsProps {
  workspaceId: Id<"workspaces">
}

export const useGetBoards = ({ workspaceId }: UseGetBoardsProps) => {
  const data = useQuery(api.todos.getBoards, { workspaceId })
  const isLoading = data === undefined

  return { data, isLoading }
}
