import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetWorkspaceMembersProps {
  workspaceId: Id<"workspaces">;
}

export const useGetWorkspaceMembers = ({
  workspaceId,
}: UseGetWorkspaceMembersProps) => {
  const data = useQuery(api.advancetree.getAvailableMembers, { workspaceId });
  const isLoading = data === undefined;

  return { data, isLoading };
};
