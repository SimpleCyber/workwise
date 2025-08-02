import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetTreeDataProps {
  workspaceId: Id<"workspaces">
}

export const useGetTreeData = ({ workspaceId }: UseGetTreeDataProps) => {
  const data = useQuery(api.tree.getTreeData, { workspaceId })
  const isLoading = data === undefined

  return { data, isLoading }
}
