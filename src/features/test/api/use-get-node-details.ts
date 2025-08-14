import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetNodeDetailsProps {
  nodeId: string;
  workspaceId: Id<"workspaces">;
}

export const useGetNodeDetails = ({
  nodeId,
  workspaceId,
}: UseGetNodeDetailsProps) => {
  const data = useQuery(api.advancetree.getNodeDetails, {
    nodeId,
    workspaceId,
  });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
