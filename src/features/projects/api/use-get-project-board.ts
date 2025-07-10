import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetProjectBoardProps {
  boardId: Id<"projectBoards">
}

export const useGetProjectBoard = ({ boardId }: UseGetProjectBoardProps) => {
  const data = useQuery(api.projects.getProjectBoard, { boardId })
  const isLoading = data === undefined

  return { data, isLoading }
}
