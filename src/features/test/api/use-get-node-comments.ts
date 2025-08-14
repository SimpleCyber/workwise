import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetNodeCommentsProps {
  nodeId: string;
  workspaceId: Id<"workspaces">;
}

export const useGetNodeComments = ({
  nodeId,
  workspaceId,
}: UseGetNodeCommentsProps) => {
  const data = useQuery(api.advancetree.getNodeComments, {
    nodeId,
  });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
