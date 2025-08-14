import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetTreeNodesProps {
  workspaceId: Id<"workspaces">;
}

export const useGetTreeNodes = ({ workspaceId }: UseGetTreeNodesProps) => {
  const data = useQuery(api.advancetree.getTreeNodes, { workspaceId });
  const isLoading = data === undefined;

  return { data, isLoading };
};
