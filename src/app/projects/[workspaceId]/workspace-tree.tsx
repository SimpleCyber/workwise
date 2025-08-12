"use client";

import { useGetTreeData } from "@/features/tree/api/use-get-tree-data";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { WorkspaceOnlyVisualization } from "@/features/tree/workspace-tree";

export const WorkspaceOnlyTree = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetTreeData({ workspaceId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading workspace tree...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <WorkspaceOnlyVisualization data={data} workspaceId={workspaceId} />
    </div>
  );
};
