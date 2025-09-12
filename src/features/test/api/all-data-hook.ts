import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// hook now accepts a workspaceId
export const useGetWorkspaceProjects = (workspaceId: Id<"workspaces">) => {
  const data = useQuery(api.advancetree.getWorkspaceProjectsWithTasks, {
    workspaceId,
  });

  return {
    data: data ?? [],
    isLoading: data === undefined,
  };
};
