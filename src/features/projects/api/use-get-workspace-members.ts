import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

interface UseGetWorkspaceMembersProps {
  workspaceId?: Id<"workspaces">
}

export const useGetWorkspaceMembers = ({ workspaceId }: UseGetWorkspaceMembersProps) => {
  const data = useQuery(api.projects.getWorkspaceMembers, workspaceId ? { workspaceId } : "skip")
  const isLoading = data === undefined && !!workspaceId

  return { data: data || [], isLoading }
}
