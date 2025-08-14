import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface UseGetNodeTasksProps {
  nodeId: string;
  workspaceId: Id<"workspaces">;
}

export const useGetNodeTasks = ({
  nodeId,
  workspaceId,
}: UseGetNodeTasksProps) => {
  const data = useQuery(api.advancetree.getNodeTasks, {
    nodeId,
  });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
